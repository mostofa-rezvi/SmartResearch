---
status: testing
phase: 17-kanban-api-integration
source: [user-prompt]
started: 2026-06-06T14:53:28+06:00
updated: 2026-06-06T14:53:28+06:00
---

## Current Test
number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: pending

### 2. Editor Collaboration Sync
expected: Open editor → see real cursor from two browser tabs syncing.
result: pending

### 3. Kanban Dynamic Data
expected: Open workspace → Kanban shows real project data from DB.
result: pending

### 4. Template Downloads
expected: Click template download → file downloads (not 404).
result: pending

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0

## Gaps

