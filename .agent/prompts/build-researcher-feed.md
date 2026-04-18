**Role**: `roles/frontend.md` + `roles/ml.md`
**Context**: `context/modules.md`, `context/user-roles.md`

**Task**: Build the Personalised Researcher Feed.

**Description**:
The feed is the core of the **Living Room**. It must blend community Q&A with Open Thoughts based on the user's research keywords and academic stage.

**Requirements**:
1. **Intelligence**: Use the `discovery` module to rank items.
2. **Components**:
   - Question Cards (with upvote counts and expert answer highlights).
   - Thought Cards (with academic "Reflection" indicators).
   - Activity snippets from followed Researchers or Groups.
3. **Real-time**: Integrate Socket.IO into a Client Component for live feed updates.