**Role**: `roles/frontend.md` + `roles/backend.md`
**Context**: `context/auth-flow.md`, `context/database.md`

**Task**: Build Chapter 4: The First Conversation (Mandatory Onboarding)

**Description**:
To solve the cold-start problem, ResearchBridge must understand the user before it can serve them. 
Implement a mandatory "First Conversation" onboarding flow that extracts the user's research interests.

**Requirements**:
1. **Mandatory Routing (The Gatekeeper)**:
   - Upon first login (or if `onboarding_completed` is false), the frontend must strictly route the user to the onboarding flow. 
   - This cannot be dismissed or skipped. Nullify all dashboard access until complete.
2. **Onboarding UI (The Conversation)**:
   - Build a guided step-by-step form asking open-ended questions (e.g. theoretical vs applied, fields of study, world problems).
   - Present a rich, searchable set of predefined keywords organized by research domain.
   - The user must select the keywords relevant to them.
3. **Backend Logic & Data Storage**:
   - Store the selected keywords, domain preferences, and free-text answers.
   - Mark `onboarding_completed = true` upon successful submission.
4. **Recommendation Engine Groundwork**:
   - The platform must hold back recommendations entirely until this profile is established. After completion, these keywords become the seed data for the Neo4j/Elasticsearch recommendation engine.
