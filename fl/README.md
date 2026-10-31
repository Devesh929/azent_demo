# Federated learning demo

Requires Python 3.10+ and numpy.

```bash
python fl/run_demo.py                 # 8 scripted rounds, report in fl/runs/<id>/report.md
python fl/run_demo.py --secure-agg    # simulated pairwise-masked aggregation
python fl/run_demo.py --dp-sigma 0.5  # local Gaussian noise with declared zCDP accounting
python fl/run_demo.py --ingest        # post round metadata and the candidate model to the portal
```

`--ingest` reads `NEXT_PUBLIC_SITE_URL` and `FL_INGEST_TOKEN` from `../.env.local`. See `docs/federated-learning.md` for the design, threat model and limits.
