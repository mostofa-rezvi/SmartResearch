**Role**: `roles/frontend.md` + `roles/backend.md`
**Context**: `context/database.md`

**Task**: Build Chapter 5: The Living Room (Q&A and Open Discussions)

**Description**:
The community is the most dynamic part of ResearchBridge. It centers around Q&A (like Quora/Stack Overflow for academia) and Open Thoughts.

**Requirements**:
1. **Q&A System (Structured Knowledge)**:
   - Allow users to post formatted questions (methodology, literature gaps, statistical concepts, etc.) with relevant tags.
   - Other users can post answers, references, and follow-up discussion.
   - Implement an upvote/ranking system so the best answers rise to the top over time.
2. **Open Thoughts (Micro-Blogging / Reflection)**:
   - Allow users to post distinct "Thoughts" — observations, reflections on papers, half-formed ideas.
   - Thoughts act as conversation starters; other users can comment and debate on them.
3. **Feed Algorithm Update**:
   - The user's feed should intelligently blend Q&A and Thoughts based on their `user_keywords` established during onboarding.
4. **Data Models**:
   - `questions`, `answers`, `thoughts`, `comments`, and `votes`.
