# CMD-039: Validate Performance

**Phase:** Week 2 / Day 9 — Semantic Search & kNN
**Skill:** `/gsd-verify-work`

## Command

```bash
/gsd-verify-work
```

UAT: Search response < 200ms, filters working, kNN accurate.

--- Day 10: Collaboration Workspace Backend ---


## Tech Stack Tasks (Day 9: Semantic search + kNN)

- [ ] ES kNN search on dense_vector field (people, papers, projects) *(Tags: db, be)*
- [ ] Unified search endpoint: BM25 + kNN hybrid with RRF fusion *(Tags: be)*
- [ ] Search filters: domain, skill, institution, availability *(Tags: be)*
- [ ] Search response < 200ms target — benchmark + tune *(Tags: be, ops)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
