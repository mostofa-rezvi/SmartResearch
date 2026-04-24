# CMD-030: Discuss Day 7

**Phase:** Week 2 / Day 7 — CF + CBF Hybrid Matching Engine
**Skill:** `/gsd-discuss-phase`

## Command

```bash
/gsd-discuss-phase
```

Phase: "Hybrid recommender: CBF (cosine on BERT vectors) +
  CF (user-user collaborative), cold-start handling, Redis cache."


## Tech Stack Tasks (Day 7: CF + CBF hybrid matching engine)

- [ ] Content-Based Filtering: cosine similarity on BERT vectors *(Tags: ml)*
- [ ] Collaborative Filtering: user–user matrix from behaviour signals *(Tags: ml)*
- [ ] Hybrid scorer: weighted blend CBF + CF (cold-start graceful degradation) *(Tags: ml)*
- [ ] Top-N results cached to Redis per user (TTL 1hr) *(Tags: ml, db)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
