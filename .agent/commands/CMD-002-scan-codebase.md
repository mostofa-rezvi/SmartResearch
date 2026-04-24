# CMD-002: Scan Existing Codebase

**Phase:** 0 — Project Bootstrap (Pre-Day 1)
**Skill:** `/gsd-scan`

## Command

```bash
/gsd-scan
```

## Purpose
 Assess what's already built (auth, controllers, services,
  Docker config) before planning new work.


## Tech Stack Tasks (Day 1: Project scaffold & infra)

- [ ] Mono-repo setup: Next.js, Node/Express, Python FastAPI *(Tags: ops)*
- [ ] Docker Compose: all services wired (Postgres, Redis, Neo4j, ES) *(Tags: ops, db)*
- [ ] Environment config, secrets management (.env + Vault pattern) *(Tags: ops)*
- [ ] GitHub Actions CI pipeline skeleton *(Tags: ops)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
