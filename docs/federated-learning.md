# Federated learning research track (P2)

An explicitly separate, opt-in programme. It is **not** the collective learning hub: observations are never
used as training data here.

## Learning task and compatibility contract

| | |
|---|---|
| Task | Binary classification: 90-day delinquency on synthetic SME facilities |
| Model | Logistic regression, 8 features + bias |
| Features | revenue_volatility, current_ratio, dscr, seasonality_index, months_on_book, utilisation, overdue_30_count, sector_risk |
| Scaling | Fixed published means/stds in `fl/flcore.py`, so no data is shared to compute them |
| Local training | 5 epochs mini-batch SGD per round, lr 0.3, L2 1e-3, starting from the current global model |
| Update | Weight delta, clipped to L2 ≤ 1.0, signed with a per-participant HMAC key |
| Aggregation | FedAvg weighted by local example count (uniform over the masked sum in secure-aggregation mode) |
| Minimum cohort | 3 accepted updates per round; otherwise the round is aborted and the global model is unchanged |

## Isolation

- Each participant runs as a **separate process** (`fl/client.py`) whose working directory is its own home folder.
- It creates its synthetic records there, trains locally, and writes one update file containing the delta, example count, norms and two aggregate statistics.
- The coordinator (`fl/run_demo.py`) never opens a participant folder during training. The portal ingest endpoint uses a **strict** schema, so any payload with extra fields (such as records or raw weights) is rejected.

The local-only and centralised baselines read participant records after training **for evaluation in this simulation only**. That step would not exist in production, and the report labels it.

## Scripted demonstration

| Round | Event | Safeguard shown |
|---|---|---|
| 2 | Saffron drops out | Minimum cohort: round aborted |
| 3 | Unregistered sender submits a poisoned update | Authentication: signature check fails |
| 4 | Tidewater is compromised and sends an inflated, flipped update | Bounded updates: norm check rejects it; cohort rule then aborts |
| others | Normal rounds | FedAvg, holdout evaluation |

A direction (cosine) check also runs, but only on updates more than twice the median norm. Heterogeneous honest clients can legitimately point away from the others, and a pure direction filter would unfairly exclude them.

## Evaluation

The global model is evaluated on a separate synthetic holdout and reported against:

- the prevalence baseline;
- the mean of local-only models;
- a centralised reference (simulation only).

In a reference run, the federated model's holdout AUC was 0.734, against 0.728 for the local-only mean, 0.729 for the centralised reference and 0.500 for prevalence. Distribution skew (default rates of 15–31%, different seasonality) is reported from participant aggregates. Weighting by example count lets the largest participant dominate, and the report explains this.

## Privacy and security, stated honestly

- **Threat model.** Updates can leak information about local data (membership and attribute inference). Malicious participants can poison training. Keeping data local is useful, but it does **not** by itself provide confidentiality, anonymity or regulatory compliance.
- **Controls in this demo.** Authenticated participants (HMAC); minimum cohort; clipped and bounded updates; norm and direction anomaly checks; consent checked again at ingest.
- **Secure aggregation** (`--secure-agg`) is *simulated* with pairwise additive masks that cancel in the sum, so the coordinator sees only the aggregate. It has no dropout recovery: a dropout aborts the round. Production would use a protocol with secret-shared mask recovery (for example Bonawitz et al.). Per-update anomaly checks are weaker in this mode, and the report says so.
- **Differential privacy** (`--dp-sigma`) adds local Gaussian noise with std = σ × clip. Accounting is client-level, add/remove adjacency, zCDP with ρ = R / (2σ²) and ε = ρ + 2√(ρ ln(1/δ)) at δ = 1e-5. With three participants, meaningful ε needs noise that destroys utility (σ = 0.5 gives ε ≈ 35 and AUC ≈ 0.69). This is illustrative and not audited.
- A plain averaging run claims neither secure aggregation nor any formal privacy guarantee.

## Governance, withdrawal and lineage

- **Consent.** Participation needs organisation-level consent (`fl_participants`), managed by the client administrator. It is separate from workspace membership and from publishing consent.
- **Registration.** Every aggregate is registered as a **candidate** with metrics, baselines and run metadata. A human must approve it, and then record a deployment decision. Each step needs a rationale and is audited.
- **Rollback.** Deploying a version marks the previous deployed version `rolled_back` (superseded) and keeps it as the restore target. "Roll back" on the current version records the decision.
- **Withdrawal** stops future participation: later updates from that organisation are rejected at ingest. Models already aggregated keep their lineage record. Retraining without the withdrawn participant is a separate, explicit programme decision. We do not promise automatic "untraining".
