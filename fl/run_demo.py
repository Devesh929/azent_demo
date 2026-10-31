"""Coordinator + scripted demonstration of the opt-in federated learning programme.

The coordinator:
  * never opens a participant's directory; it launches each participant as a separate
    process that sees only its own home directory and returns a signed update file;
  * authenticates updates (HMAC with per-participant keys from the registry);
  * validates updates (finite, right shape, norm bound, direction check);
  * enforces a minimum cohort per round and aggregates with FedAvg weighted by example count;
  * evaluates on a separate synthetic holdout against simple baselines;
  * registers the result as a CANDIDATE model. Deployment is a human decision in the portal.

Usage:
  python fl/run_demo.py                 # 8 scripted rounds, report in fl/runs/<id>/
  python fl/run_demo.py --secure-agg    # pairwise-masked aggregation (simulated)
  python fl/run_demo.py --dp-sigma 1.0  # local Gaussian noise with declared zCDP accounting
  python fl/run_demo.py --ingest        # also post round metadata to the portal
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import secrets
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import flcore as fc  # noqa: E402

CONSENTED = ["harbourline", "saffron", "tidewater"]  # mirrors fl_participants in the portal
MIN_COHORT = 3
# Scripted events that exercise each safeguard.
SCRIPT = {
    2: {"dropout": ["saffron"]},
    3: {"intruder": True},
    4: {"compromised": ["tidewater"]},
}


def read_env():
    env = {}
    p = HERE.parent / ".env.local"
    if p.exists():
        for line in p.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def run_client(name, home, model_path, rnd, key, out, args, peers="", attack="none"):
    cmd = [sys.executable, str(HERE / "client.py"), "--name", name, "--home", str(home), "--global-model", str(model_path),
           "--round", str(rnd), "--key", key, "--clip", str(args.clip), "--dp-sigma", str(args.dp_sigma), "--out", str(out), "--attack", attack]
    if peers:
        cmd += ["--peers", peers, "--mask-secret", args.mask_secret]
    # cwd = the participant's own directory: a separate process with its own working area.
    subprocess.run(cmd, check=True, cwd=home)


def validate(update, registry, args, reference_dir, median_norm):
    """Returns (accepted, reason, vector)."""
    p, sig = update["payload"], update["signature"]
    key = registry.get(p["participant"])
    if not key or not fc.verify(p, sig, key):
        return False, "Unauthenticated participant (signature check failed)", None
    v = np.array(p["update"], dtype=float)
    if v.shape != (fc.DIM,) or not np.all(np.isfinite(v)):
        return False, "Malformed update", None
    if p["reported_norm"] > args.clip * (1.05 + (3 * args.dp_sigma if args.dp_sigma else 0)):
        return False, f"Update norm {p['reported_norm']:.2f} exceeds bound {args.clip}", None
    # Honest but heterogeneous clients can legitimately point away from the others, so a
    # direction anomaly alone is not enough: it must also be unusually large.
    if not p["masked"] and reference_dir is not None and np.linalg.norm(v) > 2 * median_norm:
        cos = float(v @ reference_dir / (np.linalg.norm(v) * np.linalg.norm(reference_dir) + 1e-12))
        if cos < -0.2:
            return False, f"Direction anomaly (cosine {cos:.2f} to robust median)", None
    return True, None, v


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rounds", type=int, default=8)
    ap.add_argument("--clip", type=float, default=1.0)
    ap.add_argument("--dp-sigma", type=float, default=0.0)
    ap.add_argument("--secure-agg", action="store_true")
    ap.add_argument("--ingest", action="store_true")
    args = ap.parse_args()
    args.mask_secret = secrets.token_hex(16) if args.secure_agg else ""

    run_id = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    root = HERE / "runs" / run_id
    coord = root / "coordinator"
    coord.mkdir(parents=True)
    # Participant registry: authenticated identities and signing keys. Only consented orgs.
    registry = {name: secrets.token_hex(16) for name in CONSENTED}
    homes = {}
    for name in CONSENTED + ["intruder"]:
        homes[name] = root / "participants" / name
        homes[name].mkdir(parents=True)

    # Separate synthetic holdout owned by the coordinator (a public benchmark, not client data).
    Xh, yh = fc.synth("holdout")
    w = np.zeros(fc.DIM)
    version = 0
    rounds_out, ingest_rounds = [], []

    for rnd in range(1, args.rounds + 1):
        events = SCRIPT.get(rnd, {})
        started = dt.datetime.now(dt.timezone.utc).isoformat()
        model_path = coord / f"global_r{rnd}.json"
        fc.save_json(model_path, {"weights": w.tolist(), "version": version})
        cohort = [c for c in CONSENTED if c not in events.get("dropout", [])]
        peers = ",".join(cohort) if args.secure_agg else ""
        print(f"\n— Round {rnd}: inviting {', '.join(CONSENTED)}")

        updates, log = [], []
        for name in CONSENTED:
            if name in events.get("dropout", []):
                log.append({"participant_label": name, "org_slug": name, "num_examples": None, "update_norm": None, "clipped": None, "accepted": False, "reason": "Dropped out (no update before timeout)"})
                print(f"[{name}] round {rnd}: no response (simulated dropout)")
                continue
            out = coord / "inbox" / f"r{rnd}_{name}.json"
            attack = "poison" if name in events.get("compromised", []) else "none"
            run_client(name, homes[name], model_path, rnd, registry[name], out, args, peers, attack)
            updates.append(fc.load_json(out))
        if events.get("intruder"):
            out = coord / "inbox" / f"r{rnd}_intruder.json"
            run_client("tidewater", homes["intruder"], model_path, rnd, "forged-key", out, args, "", "poison")
            u = fc.load_json(out)
            u["payload"]["participant"] = "intruder"
            updates.append(u)

        # Robust reference direction for the anomaly check: coordinate-wise median.
        plain = [np.array(u["payload"]["update"]) for u in updates if not u["payload"]["masked"]]
        ref = np.median(np.stack(plain), axis=0) if len(plain) >= 2 else None
        med_norm = float(np.median([np.linalg.norm(x) for x in plain])) if plain else 0.0

        accepted = []
        for u in updates:
            ok, reason, v = validate(u, registry, args, ref, med_norm)
            p = u["payload"]
            label = p["participant"] if p["participant"] in registry else "unregistered sender"
            log.append({"participant_label": label, "org_slug": p["participant"] if p["participant"] in registry else None,
                        "num_examples": p["num_examples"] if ok else None, "update_norm": round(p["reported_norm"], 4),
                        "clipped": p["clipped"], "accepted": ok, "reason": reason})
            if ok:
                accepted.append((p, v))
            print(f"  validate {label}: {'accepted' if ok else 'REJECTED - ' + reason}")

        status = "completed"
        if len(accepted) < MIN_COHORT:
            status = "aborted"
            print(f"  round aborted: {len(accepted)} valid update(s) < minimum cohort {MIN_COHORT}; global model unchanged")
        elif args.secure_agg and len(accepted) != len(cohort):
            status = "aborted"
            print("  round aborted: masked aggregation needs every masked participant (mask recovery not implemented)")
        else:
            n = np.array([p["num_examples"] for p, _ in accepted], dtype=float)
            if args.secure_agg:
                # Coordinator sees only the sum of masked, pre-weighted updates.
                total = np.sum([v for _, v in accepted], axis=0)
                agg = total / len(accepted)
            else:
                agg = np.sum([v * k for (_, v), k in zip(accepted, n)], axis=0) / n.sum()
            w = w + agg
            version += 1
            print(f"  aggregated {len(accepted)} updates -> global v{version}  holdout AUC {fc.metrics(w, Xh, yh)['auc']:.3f}")

        cfg = {"clip_norm": args.clip, "dp_sigma": args.dp_sigma, "secure_aggregation": "simulated pairwise masks" if args.secure_agg else "off",
               "min_cohort": MIN_COHORT, "weighting": "uniform over masked sum" if args.secure_agg else "FedAvg by example count", "events": events}
        rounds_out.append({"round": rnd, "status": status, "accepted": len(accepted), "log": log, "global_version": version, "holdout": fc.metrics(w, Xh, yh)})
        ingest_rounds.append({"round_no": rnd, "aggregation": "FedAvg" + (" + masked sum" if args.secure_agg else ""), "config": cfg, "status": status,
                              "started_at": started, "completed_at": dt.datetime.now(dt.timezone.utc).isoformat(), "updates": log})

    # ── Evaluation against baselines on the separate holdout ──
    fed = fc.metrics(w, Xh, yh)
    base_rate = float(yh.mean())
    const = {"auc": 0.5, "accuracy": float(max(base_rate, 1 - base_rate)), "log_loss": float(-(base_rate * np.log(base_rate) + (1 - base_rate) * np.log(1 - base_rate)))}
    # Local-only baselines: each participant trains alone, inside its own process boundary in
    # a real deployment; here we reuse the participant's own records for the comparison only.
    local = {}
    for c in CONSENTED:
        d = np.load(homes[c] / "local_records.npz")
        wl = np.zeros(fc.DIM)
        for r in range(args.rounds):
            wl = fc.train_local(wl, d["X"], d["y"], seed=r)
        local[c] = fc.metrics(wl, Xh, yh)
    local_mean = {k: float(np.mean([m[k] for m in local.values()])) for k in fed}
    # Centralised reference: SIMULATION ONLY, to show the federated gap. Not available in the
    # real programme because records are never pooled.
    Xc = np.concatenate([np.load(homes[c] / "local_records.npz")["X"] for c in CONSENTED])
    yc = np.concatenate([np.load(homes[c] / "local_records.npz")["y"] for c in CONSENTED])
    wc = np.zeros(fc.DIM)
    for r in range(args.rounds):
        wc = fc.train_local(wc, Xc, yc, seed=r)
    central = fc.metrics(wc, Xh, yh)

    skew = {c: fc.load_json(sorted((coord / "inbox").glob(f"r*_{c}.json"))[-1])["payload"]["summary"] for c in CONSENTED}
    eps = fc.zcdp_epsilon(args.dp_sigma, sum(1 for r in rounds_out if r["status"] == "completed"))
    model_version = f"fl-{dt.date.today().isoformat()}-v{version}"
    report = {
        "run_id": run_id, "model_version": model_version, "rounds": rounds_out,
        "federated": fed, "baselines": {"prevalence": const, "local_only_mean": local_mean, "centralised_reference_simulation_only": central},
        "local_only_by_participant": local, "participant_summaries": skew,
        "privacy": {"dp_sigma": args.dp_sigma, "epsilon_zcdp_delta_1e-5": eps, "accounting": "client-level Gaussian mechanism, add/remove adjacency, sensitivity = clip norm, zCDP composition" if eps else "DP off",
                    "secure_aggregation": "simulated pairwise additive masks; no dropout recovery" if args.secure_agg else "off"},
        "status": "candidate (awaiting human review)",
    }
    fc.save_json(root / "report.json", report)
    fc.save_json(root / "registry.json", {"candidate": model_version, "weights": w.tolist(), "features": fc.FEATURES, "parent": None})
    write_markdown(root / "report.md", report)
    print(f"\nFederated holdout: AUC {fed['auc']:.3f} | local-only mean {local_mean['auc']:.3f} | prevalence 0.500 | centralised ref (sim only) {central['auc']:.3f}")
    print(f"Report: {root / 'report.md'}")

    if args.ingest:
        env = read_env()
        url = env.get("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").rstrip("/") + "/api/fl/ingest"
        token = env.get("FL_INGEST_TOKEN", "")
        for i, r in enumerate(ingest_rounds):
            last = i == len(ingest_rounds) - 1
            body = {"program_slug": "sme-early-warning", "round": r, "model": {
                "version": model_version, "parent_version": None, "metrics": fed,
                "baseline": {"prevalence": const, "local_only_mean": local_mean, "centralised_reference_sim_only": central},
                "report": {"run_id": run_id, "privacy": report["privacy"], "participant_summaries": skew},
            } if last and r["status"] == "completed" else None}
            req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}, method="POST")
            with urllib.request.urlopen(req, timeout=20) as resp:
                print(f"  ingested round {r['round_no']}: {resp.read().decode()}")


def write_markdown(path: Path, r):
    f = lambda m: f"AUC {m['auc']:.3f} · accuracy {m['accuracy']:.3f} · log loss {m['log_loss']:.3f}"  # noqa: E731
    lines = [f"# Federated learning run {r['run_id']}", "", f"Candidate model: **{r['model_version']}** ({r['status']})", "",
             "## Holdout results", "", f"- Federated: {f(r['federated'])}", f"- Prevalence baseline: {f(r['baselines']['prevalence'])}",
             f"- Local-only (mean of participants): {f(r['baselines']['local_only_mean'])}",
             f"- Centralised reference (simulation only, not available in production): {f(r['baselines']['centralised_reference_simulation_only'])}", "",
             "## Rounds", ""]
    for rd in r["rounds"]:
        lines.append(f"- Round {rd['round']}: **{rd['status']}**, {rd['accepted']} accepted update(s), global v{rd['global_version']}")
        for u in rd["log"]:
            if not u["accepted"]:
                lines.append(f"  - {u['participant_label']}: rejected ({u['reason']})")
    lines += ["", "## Distribution skew (participant-reported aggregates)", ""]
    for c, s in r["participant_summaries"].items():
        lines.append(f"- {c}: default rate {s['default_rate']:.1%}, mean seasonality {s['mean_seasonality']}; local-only holdout AUC {r['local_only_by_participant'][c]['auc']:.3f}")
    lines += ["", "Weighting by example count lets the largest participant dominate; a small participant with a different", "default rate improves the global model less than its share of rare patterns suggests.", "",
              "## Privacy", "", f"- {r['privacy']['accounting']}", f"- epsilon (delta 1e-5): {r['privacy']['epsilon_zcdp_delta_1e-5']}", f"- Secure aggregation: {r['privacy']['secure_aggregation']}", "",
              "A plain averaging run does NOT provide secure aggregation or a formal privacy guarantee."]
    path.write_text("\n".join(lines))


if __name__ == "__main__":
    main()
