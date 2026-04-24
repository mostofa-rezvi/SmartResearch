# /gsd-code-review-fix

**Category:** 4. Quality Assurance & Review  
**Phase:** After code review

## Description

Auto-fix issues found by code review in REVIEW.md. Spawns fixer agent, commits each fix atomically, produces REVIEW-FIX.md summary.

## When to Use

- After `/gsd-code-review` produces REVIEW.md
- Spawns fixer agent for each issue
- Commits each fix atomically for clean git history

## Command

```
/gsd-code-review-fix
```
