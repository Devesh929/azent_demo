"""One participant's local environment.

Run as its own process with access ONLY to its own directory. It generates (or would load)
its local synthetic records, trains from the current global model, and writes a single
signed update file containing a clipped weight delta and an example count. Records never
leave this directory.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flcore as fc  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", required=True)
    ap.add_argument("--home", required=True, help="this participant's private directory")
    ap.add_argument("--global-model", required=True)
    ap.add_argument("--round", type=int, required=True)
    ap.add_argument("--key", required=True, help="participant signing key from the registry")
    ap.add_argument("--clip", type=float, default=1.0)
    ap.add_argument("--dp-sigma", type=float, default=0.0)
    ap.add_argument("--peers", default="", help="comma list of peers for secure aggregation masks")
    ap.add_argument("--mask-secret", default="")
    ap.add_argument("--attack", choices=["none", "poison"], default="none", help="simulate a compromised client")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    home = Path(a.home)
    data = home / "local_records.npz"
    if not data.exists():  # first run: create this participant's synthetic records locally
        X, y = fc.synth(a.name)
        np.savez(data, X=X, y=y)
    d = np.load(data)
    X, y = d["X"], d["y"]

    w_global = np.array(fc.load_json(Path(a.global_model))["weights"])
    w_local = fc.train_local(w_global, X, y, seed=a.round * 7 + len(a.name))
    delta = w_local - w_global

    if a.attack == "poison":
        # A compromised client flips the direction and inflates the update, skipping clipping.
        delta = -25.0 * delta
        clipped, raw_norm, was_clipped = delta, float(np.linalg.norm(delta)), False
    else:
        clipped, raw_norm, was_clipped = fc.clip(delta, a.clip)
        if a.dp_sigma > 0:
            clipped = clipped + np.random.default_rng().normal(0, a.dp_sigma * a.clip, clipped.shape)

    sent = clipped.copy()
    if a.peers and a.mask_secret:
        # Pairwise additive masks cancel in the sum, so the coordinator sees only the aggregate.
        for peer in [p for p in a.peers.split(",") if p and p != a.name]:
            m = fc.prg_mask(fc.pair_seed(a.name, peer, a.round, a.mask_secret), fc.DIM)
            sent += m if a.name < peer else -m

    # Aggregate statistics only (no rows), so the report can explain distribution skew.
    summary = {"default_rate": round(float(y.mean()), 4), "mean_seasonality": round(float(X[:, 3].mean()), 3)}
    payload = {
        "participant": a.name, "round": a.round, "num_examples": int(len(y)),
        "update": [float(v) for v in sent], "reported_norm": float(np.linalg.norm(clipped)),
        "pre_clip_norm": raw_norm, "clipped": was_clipped, "masked": bool(a.peers and a.mask_secret), "summary": summary,
    }
    fc.save_json(Path(a.out), {"payload": payload, "signature": fc.sign(payload, a.key)})
    print(f"[{a.name}] round {a.round}: trained on {len(y)} local records, sent update (norm {payload['reported_norm']:.3f})")


if __name__ == "__main__":
    main()
