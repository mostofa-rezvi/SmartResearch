# CMD-001: Initialize GSD Project

**Phase:** 0 — Project Bootstrap (Pre-Day 1)
**Skill:** `/gsd-new-project`

## Command

```bash
/gsd-new-project
```

## Context
 "ResearchBridge — Smart Research Collaboration Platform.
  Mono-repo: Next.js frontend, Node/Express API, Python FastAPI ML service.
  Databases: PostgreSQL (source of truth), Redis (cache + message broker
  via Pub/Sub and Streams — replacing Kafka), Neo4j (trust graph),
  Elasticsearch (semantic search). Target: 3-week production build."


## Tech Stack Tasks (Day 1: Project scaffold & infra)

- [ ] Mono-repo setup: Next.js, Node/Express, Python FastAPI *(Tags: ops)*
- [ ] Docker Compose: all services wired (Postgres, Redis, Neo4j, ES) *(Tags: ops, db)*
- [ ] Environment config, secrets management (.env + Vault pattern) *(Tags: ops)*
- [ ] GitHub Actions CI pipeline skeleton *(Tags: ops)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
