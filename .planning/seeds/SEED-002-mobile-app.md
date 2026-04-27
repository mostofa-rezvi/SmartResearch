---
id: SEED-002
status: dormant
planted: 2026-04-27
planted_during: v1.2
trigger_when: DAU > 10k
scope: Large
---

# SEED-002: Add Mobile App

## Why This Matters

Researchers need to stay connected to real-time collaboration threads and discovery feeds while away from their desks. A native mobile app will enable push notifications and a more seamless interactive experience.

## When to Surface

**Trigger:** DAU > 10k

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches any of these conditions:
- Expanding social and real-time features
- Targeting high-engagement user retention
- Launching mobile-specific discovery tools

## Scope Estimate

**Large** — Requires a new Flutter or React Native project, mobile-optimized UI/UX design, and specialized push notification service integration.

## Breadcrumbs

Related code and decisions found in the current codebase:
- [frontend/src/app/](file:///d:/github/SmartResearch/frontend/src/app/) (UI patterns to port)
- [backend/src/services/CollaborationService.js](file:///d:/github/SmartResearch/backend/src/services/CollaborationService.js) (Real-time logic)

## Notes
Capture during the v1.2 close-out.
