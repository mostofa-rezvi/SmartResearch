# CMD-026A: AI Design Contract — Day 6

**Phase:** Week 2 / Day 6 — Sentence-BERT Embedding Service
**Skill:** ``/gsd-ai-integration-phase``

## Command

```bash
`/gsd-ai-integration-phase`
```

## Details

## Scope

- Framework selection: sentence-transformers vs alternatives
- Implementation guidance from official docs
- Evaluation strategy: latency, accuracy, embedding quality
- Produces AI-SPEC.md for the ML service build


## Tech Stack Tasks (Day 6: Sentence-BERT embedding service)

- [ ] Python FastAPI service: /embed endpoint (sentence-transformers) *(Tags: ml, be)*
- [ ] Profile text → 768-dim dense vector, stored in ES + Redis cache *(Tags: ml, db)*
- [ ] Batch embedding job for existing profiles *(Tags: ml)*
- [ ] Redis Streams consumer: on profile.created → trigger embedding *(Tags: ml, be)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
