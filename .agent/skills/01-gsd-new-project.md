# /gsd-new-project

**Category:** 1. Project Initialization & Planning  
**Phase:** Day 0 — Pre-Development

## Description

Initialize project with deep context gathering and PROJECT.md.

## When to Use

- **Day 0** — Before any code is written
- Sets up `.planning/` directory
- Captures tech stack decisions (Redis not Kafka)
- Defines project scope, constraints, and success criteria

## ResearchBridge Context

```
ResearchBridge — Smart Research Collaboration Platform.
Mono-repo: Next.js frontend, Node/Express API, Python FastAPI ML service.
Databases: PostgreSQL (source of truth), Redis (cache + message broker
via Pub/Sub and Streams), Neo4j (trust graph), Elasticsearch (semantic search).
Target: 3-week production build.
```

## Command

```
/gsd-new-project
```
