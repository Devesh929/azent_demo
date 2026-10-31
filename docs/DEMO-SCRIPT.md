# Judging demo script (about 12 minutes)

Before you start, run `npm run db:setup`, then `npm run dev`, and `npm run fl:demo` once so the FL page has data. Sign in through **Demo personas** on `/login`.

## 1. Public site (2 min)

1. `/`: scroll the hero. Four client "signal clusters" converge into one governed core. That's the product idea in one motion.
2. Capabilities, then the product rail (scroll-linked), then the **policy simulator** (drag the score slider). It's labelled as a synthetic simulation.
3. The learning story walks through the doc's seasonality scenario, followed by the live "access decisions" log.
4. `/search?q=seasonality` signed out: only public results. Ask AIRA the same question: no portal content is cited.

## 2. Client contributes (2 min): Raj Menon, Harbourline

1. The dashboard shows the active organisation, entitled offerings and contribution counts.
2. **Observations → New**. Type an account number in the description to see the live sensitive-content warning. Save. The page says "Nothing has been shared".
3. Open the draft, then **Propose for the learning community**. Note the four separate permissions, and try submitting without publication consent.
4. Open **Sandbox demos → SME Workbench → Seasonal retailer → Run**. Look at the evidence and the "not a credit decision" caveat, then leave structured feedback.
5. Try `/portal/playground/riva`: 404, because Harbourline isn't entitled.

## 3. Moderator (2 min): Mei Tan

1. **Moderation** shows the queue (no drafts) and the flagged Tidewater item.
2. Open it. Sensitive spans are highlighted, the proposed copy is pre-redacted with region and period coarsened, and the consent on record is shown.
3. Publish Raj's new item, or request clarification. The public reason and the internal note are kept separate.
4. Resolve Sara's report on the festive-inventory item.

## 4. Themes and ideas (2 min): Omar Haddad, then Sara Al-Amin

1. **Themes → Seasonality context** shows 3 organisations, the limitations and the evidence. The RIVA theme shows "Counts suppressed".
2. **Ideas → Seasonality-aware comparison explanation**: change the status, write the client message, save. The append-only history updates.
3. Switch to Sara: she sees the idea's status and the client message only, with no internal notes.

## 5. Withdrawal (1 min): Raj Menon

Open the published observation and choose **Withdraw**. The message shows the propagation time in milliseconds and 0 remaining index rows. Refresh shared learning and search, and ask AIRA: it's gone everywhere.

## 6. Administration and isolation (2 min): Priya Nair, then Hana Iqbal

1. **Administration**: entitlement matrix, employee role grants as separate capabilities, and the audit log.
2. **Support access**: without a grant, Tidewater's private items stay closed. Grant 1 hour with a reason, and it's audited and expiring.
3. **Email outbox**: rows show `queued` or "Accepted by provider", never "delivered".
4. As Hana, **Members & access**: invite a colleague. Only client roles are offered.

## 7. Federated learning (1 min): Noah Okafor

**Federated learning** shows the participants with consent, the rounds and the update-validation table:

- Round 2: dropout, aborted below the minimum cohort.
- Round 3: intruder rejected (bad signature).
- Round 4: compromised update rejected (norm bound).

It also shows the candidate model against the prevalence, local-only and centralised-reference baselines. Approve it with a rationale, then roll it back to show the lineage.

## Closing line

"Access is decided on the server for every request. Shared learning is a separate, reviewed copy. Consent comes in four pieces. Withdrawal takes effect immediately. And nothing retrains itself from a post."
