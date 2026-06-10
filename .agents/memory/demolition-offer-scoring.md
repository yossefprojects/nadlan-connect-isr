---
name: Demolition offer comparison scoring
description: How promoter offers in the Tama/Pinui-Binui module are scored and compared, and the normalization rules.
---

# Demolition offer comparison scoring

Promoter offers carry a weighted comparison score (0–100) computed in
`computeOfferScores` (api-server demolition route): 40% financial, 30% quality,
20% timeline & security, 10% references. Scores are computed **relative to the
other offers on the same listing** and only injected in the GET offers list
endpoint (never stored). The list is returned sorted best-score-first.

**Rule — lower-is-better metrics must use min-max normalization, not best/value.**
Timeline fields (constructionDurationMonths, startDelayMonths) use
`(hi - v)/(hi - lo)` so the fastest offer scores 1 and the slowest 0; all-equal
scores 1.
**Why:** a `startDelayMonths` of 0 means "immediate start" — the *best* outcome.
An earlier `best/value` formula returned 0 for any 0 value, wrongly penalizing
the strongest offer. min-max treats 0 as a legitimate best value.
**How to apply:** any future "shorter/lower is better" criterion added to the
score must go through the `lowerBetter(v, lo, hi)` helper, never a ratio-to-best.
