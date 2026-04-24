# /gsd-execute-phase

**Category:** 3. Execution & Building  
**Phase:** The main build command

## Description

Execute all plans in a phase with wave-based parallelization.

## When to Use

- The main build command after planning is complete
- Runs PLAN.md steps sequentially or in parallel waves
- Spawns parallel subagents for independent tasks
- Commits work atomically per step

## Command

```
/gsd-execute-phase
```
