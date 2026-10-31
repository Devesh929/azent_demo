"""Shared, data-free definitions for the federated learning demo.

Everything here is agreed by all participants in advance (the "compatibility contract"):
feature schema, fixed scaling constants, model form and update format. No training records
live in this module.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import math
from pathlib import Path

import numpy as np

FEATURES = [
    "revenue_volatility", "current_ratio", "dscr", "seasonality_index",
    "months_on_book", "utilisation", "overdue_30_count", "sector_risk",
]
# Fixed, published standardisation constants so every client scales identically
# without sharing data to compute them.
MEANS = np.array([0.35, 1.4, 1.35, 0.3, 40.0, 0.55, 0.4, 0.5])
STDS = np.array([0.18, 0.5, 0.45, 0.2, 25.0, 0.22, 0.8, 0.25])
DIM = len(FEATURES) + 1  # + bias


# ─────────────────────────── synthetic data (generated inside each client) ───────────────────────────
PROFILES = {
    # name: (rows, seed, skew description, feature shifts, base default logit shift)
    "harbourline": dict(rows=1400, seed=11, seasonality=0.55, sector=0.45, vol=0.42, shift=0.0),
    "saffron": dict(rows=900, seed=22, seasonality=0.35, sector=0.7, vol=0.38, shift=0.35),
    "tidewater": dict(rows=550, seed=33, seasonality=0.2, sector=0.4, vol=0.28, shift=-0.3),
    "holdout": dict(rows=1500, seed=99, seasonality=0.35, sector=0.5, vol=0.35, shift=0.0),
}


def synth(profile: str):
    p = PROFILES[profile]
    r = np.random.default_rng(p["seed"])
    n = p["rows"]
    seas = np.clip(r.normal(p["seasonality"], 0.15, n), 0, 1)
    vol = np.clip(r.normal(p["vol"], 0.15, n) + 0.25 * seas, 0, 1.5)
    cr = np.clip(r.normal(1.4, 0.45, n), 0.3, 4)
    dscr = np.clip(r.normal(1.35, 0.4, n), 0.4, 3.5)
    mob = np.clip(r.gamma(3, 13, n), 1, 160)
    util = np.clip(r.beta(4, 3, n), 0, 1)
    overdue = r.poisson(0.35, n).astype(float)
    sector = np.clip(r.normal(p["sector"], 0.18, n), 0, 1)
    X = np.column_stack([vol, cr, dscr, seas, mob, util, overdue, sector])
    # Ground truth: seasonality-driven volatility is LESS risky than the same volatility
    # without seasonality, which is exactly the pattern clients reported.
    z = (-2.3 + 2.4 * (vol - 0.6 * seas) - 0.7 * (cr - 1.4) - 1.6 * (dscr - 1.35)
         - 0.012 * (mob - 40) + 1.2 * (util - 0.55) + 0.55 * overdue + 1.1 * (sector - 0.5) + p["shift"])
    y = (r.random(n) < 1 / (1 + np.exp(-z))).astype(float)
    return X, y


def design(X):
    Z = (X - MEANS) / STDS
    return np.column_stack([Z, np.ones(len(Z))])


# ─────────────────────────── model ───────────────────────────
def sigmoid(z):
    return 1 / (1 + np.exp(-np.clip(z, -30, 30)))


def train_local(w, X, y, epochs=5, lr=0.3, l2=1e-3, batch=64, seed=0):
    rng = np.random.default_rng(seed)
    A = design(X)
    w = w.copy()
    for _ in range(epochs):
        idx = rng.permutation(len(A))
        for s in range(0, len(A), batch):
            b = idx[s:s + batch]
            g = A[b].T @ (sigmoid(A[b] @ w) - y[b]) / len(b) + l2 * w
            w -= lr * g
    return w


def metrics(w, X, y):
    p = sigmoid(design(X) @ w)
    eps = 1e-9
    log_loss = float(-np.mean(y * np.log(p + eps) + (1 - y) * np.log(1 - p + eps)))
    acc = float(np.mean((p >= 0.5) == (y == 1)))
    return {"auc": auc(y, p), "accuracy": acc, "log_loss": log_loss}


def auc(y, p):
    order = np.argsort(p)
    ranks = np.empty(len(p))
    ranks[order] = np.arange(1, len(p) + 1)
    pos = y == 1
    n1, n0 = pos.sum(), (~pos).sum()
    if n1 == 0 or n0 == 0:
        return float("nan")
    return float((ranks[pos].sum() - n1 * (n1 + 1) / 2) / (n1 * n0))


# ─────────────────────────── update protocol ───────────────────────────
def clip(delta, c):
    n = float(np.linalg.norm(delta))
    return (delta * (c / n) if n > c else delta), n, n > c


def prg_mask(seed: str, dim: int):
    """Deterministic mask from a pairwise shared seed (stand-in for a key agreement)."""
    h = int.from_bytes(hashlib.sha256(seed.encode()).digest()[:8], "big")
    return np.random.default_rng(h).normal(0, 5.0, dim)


def pair_seed(a: str, b: str, round_no: int, secret: str):
    lo, hi = sorted([a, b])
    return f"{secret}:{round_no}:{lo}:{hi}"


def sign(payload: dict, key: str) -> str:
    body = json.dumps(payload, sort_keys=True).encode()
    return hmac.new(key.encode(), body, hashlib.sha256).hexdigest()


def verify(payload: dict, signature: str, key: str) -> bool:
    return hmac.compare_digest(sign(payload, key), signature)


def zcdp_epsilon(sigma: float, rounds: int, delta: float = 1e-5):
    """Client-level Gaussian mechanism, add/remove adjacency, sensitivity = clip norm,
    noise std = sigma * clip. rho per round = 1/(2 sigma^2); composes additively."""
    if sigma <= 0:
        return None
    rho = rounds / (2 * sigma ** 2)
    return rho + 2 * math.sqrt(rho * math.log(1 / delta))


def save_json(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2))


def load_json(path: Path):
    return json.loads(path.read_text())
