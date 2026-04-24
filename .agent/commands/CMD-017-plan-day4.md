# CMD-017: Plan Day 4

**Phase:** Week 1 / Day 4 — Neo4j Graph & Redis Streams Bootstrap
**Skill:** `/gsd-plan-phase`

## Command

```bash
/gsd-plan-phase
```

## Tasks
 Neo4j schema (Researcher→Paper→Topic→Institution),
  graph sync on registration, Redis Streams topic setup,
  event producer service using ioredis.


## Tech Stack Tasks (Day 4: Neo4j graph + Redis Streams bootstrap)

- [ ] Neo4j schema: Researcher → Paper → Topic → Institution nodes *(Tags: db)*
- [ ] Node creation on user registration (graph sync) *(Tags: db, be)*
- [ ] Redis Streams topics defined: profile.created, match.request, event.behaviour *(Tags: ops)*
- [ ] Redis Streams producer in Node.js API (ioredis XADD) *(Tags: be)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
