# /gsd-analyze-dependencies

**Category:** 2. Phase Planning & Discussion  
**Phase:** Before executing phases

## Description

Analyze phase dependencies and suggest `Depends on` entries for ROADMAP.md.

## When to Use

- Before executing phases to understand ordering
- E.g., ES indexing depends on PostgreSQL schema being ready
- ML service depends on Docker + Redis being configured

## Command

```
/gsd-analyze-dependencies
```
