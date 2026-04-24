# CMD-033: Test Day 7

**Phase:** Week 2 / Day 7 — CF + CBF Hybrid Matching Engine
**Skill:** `/gsd-add-tests`

## Command

```bash
/gsd-add-tests
```

Coverage: Matching accuracy, cold-start fallback, cache TTL.

--- Day 8: TrustRank & Graph Traversal ---


## Tech Stack Tasks (Day 7: CF + CBF hybrid matching engine)

- [ ] Content-Based Filtering: cosine similarity on BERT vectors *(Tags: ml)*
- [ ] Collaborative Filtering: user–user matrix from behaviour signals *(Tags: ml)*
- [ ] Hybrid scorer: weighted blend CBF + CF (cold-start graceful degradation) *(Tags: ml)*
- [ ] Top-N results cached to Redis per user (TTL 1hr) *(Tags: ml, db)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
