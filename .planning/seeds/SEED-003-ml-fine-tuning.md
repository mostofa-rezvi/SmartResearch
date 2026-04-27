---
id: SEED-003
status: dormant
planted: 2026-04-27
planted_during: v1.2
trigger_when: User data > 100k profiles
scope: Medium
---

# SEED-003: ML Model Fine-Tuning

## Why This Matters

Generic SBERT models (like `all-mpnet-base-v2`) are great for start-up but lack the nuance of specific academic domains. Fine-tuning on platform-specific publication and interaction data will significantly improve matching precision.

## When to Surface

**Trigger:** User data > 100k profiles

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches any of these conditions:
- Upgrading the recommendation engine
- Focusing on search relevance and precision
- Scaling the ML service for high-volume data

## Scope Estimate

**Medium** — Requires setting up a training pipeline, labeling data from user interactions (Neo4j trust signals), and evaluating the new model against the baseline.

## Breadcrumbs

Related code and decisions found in the current codebase:
- [ml-service/ml_model.py](file:///d:/github/SmartResearch/ml-service/ml_model.py)
- [ml-service/recommender/cf_engine.py](file:///d:/github/SmartResearch/ml-service/recommender/cf_engine.py)

## Notes
Capture during the v1.2 close-out.
