# CMD-026: Research ML Phase

**Phase:** Week 2 / Day 6 — Sentence-BERT Embedding Service
**Skill:** `/gsd-research-phase`

## Command

```bash
/gsd-research-phase
```

Topic: "sentence-transformers FastAPI service, 768-dim vectors,
  Redis cache for embeddings, Redis Streams consumer trigger."


## Tech Stack Tasks (Day 6: Sentence-BERT embedding service)

- [ ] Python FastAPI service: /embed endpoint (sentence-transformers) *(Tags: ml, be)*
- [ ] Profile text → 768-dim dense vector, stored in ES + Redis cache *(Tags: ml, db)*
- [ ] Batch embedding job for existing profiles *(Tags: ml)*
- [ ] Redis Streams consumer: on profile.created → trigger embedding *(Tags: ml, be)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
