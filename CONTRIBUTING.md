# Contributing to SmartResearch

## Development Workflow
We use the **GSD (Get-Shit-Done)** framework for all development.

### 1. Planning
Every feature must start with a `PLAN.md` in `.planning/phases/`.
- Use `/gsd-plan-phase` to generate your plan.

### 2. Security
All API routes must be gated by `Authorization` checks.
- Do not trust client-side metadata (e.g., TrustRank).
- Use `crypto.randomUUID()` for IDs.

### 3. Testing
- **Unit/Integration:** Run `npm test`.
- **E2E:** Playwright tests are mandatory for core flows (`tests/e2e/`).

### 4. Documentation
Documentation is updated via `/gsd-docs-update`. Ensure you run this after significant changes to API or Architecture.

## Code Style
- Follow the provided Prettier/ESLint configs.
- Maintain strict TypeScript types.
- Document all new services in the `API.md`.
