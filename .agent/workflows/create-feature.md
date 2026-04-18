# Workflow: Create New ResearchBridge Feature

This workflow ensures every feature aligns with the Research Lifecycle (Curiosity to Contribution).

## Step 1: Research & Alignment
- Check `core/mission.md` and the chapter history to ensure the feature fits the vision.
- Identify the target user (Standard User? Invited Professor? Admin?).
- Define the "Trust Score" impact of the feature.

## Step 2: Architecture & Data
- Update `context/database.md` with new schema requirements.
- Update `context/routes.md` with new API endpoints.
- If it lifecycle-critical, update `context/auth-flow.md`.
- Coordinate between PostgreSQL (storage) and Neo4j (relationship) changes.

## Step 3: Implementation Detail
- **Backend Service**: Implement business logic in `services/`.
- **Backend Controller**: Create thin wrapper in `controllers/`.
- **ML Integration**: If search/discovery related, update Python FastAPI services.
- **Frontend Page**: Build responsive Next.js page using Server Components.
- **UI Components**: Follow the "Academic Aesthetic" in the design system.

## Step 4: Verification
- Add integration tests for API reliability.
- Verify security gates (OTP, Onboarding, Role-Check).
- Submit a PR with `memory/roadmap.md` updated.