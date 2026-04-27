---
id: SEED-001
status: dormant
planted: 2026-04-27
planted_during: v1.2
trigger_when: API surface > 50 endpoints
scope: Large
---

# SEED-001: Add GraphQL API

## Why This Matters

As the project grows, the REST API surface is becoming difficult to maintain and leads to over-fetching of complex researcher profiles. A GraphQL layer will provide a flexible, type-safe query interface for the frontend.

## When to Surface

**Trigger:** API surface > 50 endpoints

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches any of these conditions:
- Refactoring the core backend API
- Implementing complex multi-resource dashboard views
- Scaling the developer ecosystem

## Scope Estimate

**Large** — Requires setting up an Apollo/Yoga server, defining a global schema, and mapping existing services (Postgres, Neo4j) to GraphQL resolvers.

## Breadcrumbs

Related code and decisions found in the current codebase:
- [backend/src/routes/](file:///d:/github/SmartResearch/backend/src/routes/)
- [backend/src/controllers/](file:///d:/github/SmartResearch/backend/src/controllers/)

## Notes
Capture during the v1.2 close-out.
