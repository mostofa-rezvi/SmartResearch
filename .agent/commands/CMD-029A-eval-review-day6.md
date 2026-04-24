# CMD-029A: ML Eval Review — Day 6

**Phase:** Week 2 / Day 6 — Sentence-BERT Embedding Service
**Skill:** ``/gsd-eval-review``

## Command

```bash
`/gsd-eval-review`
```

## Details

## Scope

- Sentence-BERT embedding quality audit
- Latency benchmarks vs target (<500ms per profile)
- Cache hit rate evaluation
- Vector dimensionality validation (768-dim)


## Tech Stack Tasks (Day 6: Sentence-BERT embedding service)

- [ ] Python FastAPI service: /embed endpoint (sentence-transformers) *(Tags: ml, be)*
- [ ] Profile text → 768-dim dense vector, stored in ES + Redis cache *(Tags: ml, db)*
- [ ] Batch embedding job for existing profiles *(Tags: ml)*
- [ ] Redis Streams consumer: on profile.created → trigger embedding *(Tags: ml, be)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
