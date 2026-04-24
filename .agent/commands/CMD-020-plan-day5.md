# CMD-020: Plan Day 5

**Phase:** Week 1 / Day 5 — Elasticsearch Setup & Indexing
**Skill:** `/gsd-plan-phase`

## Command

```bash
/gsd-plan-phase
```

## Tasks
 ES index mappings with dense_vector, index pipeline
  (profile save → Redis Stream → consumer → ES), BM25 search
  endpoint, health-check endpoints for all services.


## Tech Stack Tasks (Day 5: Elasticsearch setup & indexing)

- [ ] ES index mappings: users, papers, projects with dense_vector field *(Tags: db)*
- [ ] Index pipeline: on profile save → push to ES via Redis Streams consumer *(Tags: be, db)*
- [ ] Basic keyword search endpoint (BM25) *(Tags: be)*
- [ ] Health-check endpoints across all services *(Tags: ops)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
