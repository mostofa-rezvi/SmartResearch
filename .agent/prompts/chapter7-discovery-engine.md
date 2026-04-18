**Role**: `roles/frontend.md` + `roles/backend.md` + `roles/ml.md`
**Context**: `context/database.md`, `context/routes.md`

**Task**: Build Chapter 7: The Discovery Engine (Research Search)

**Description**:
ResearchBridge includes a personalized research search experience. It works like a smarter version of Google Scholar, leveraging the user's onboarding profile to prioritize relevant results.

**Requirements**:
1. **Search Interface**:
   - Support natural language queries, authors, titles, keywords, and DOIs.
   - Implement rich result cards showing metadata: abstracts, author info, year, journal name/tier, and citation counts.
2. **Personalized Ranking (ML Integration)**:
   - Use the user's `user_keywords` and research stage (from Chapter 4) to boost relevant search results. 
   - Ensure the personalization is transparent (e.g., "Recommended for your interest in [Topic]").
3. **Interactive Features**:
   - **Save to Profile**: Allow users to bookmark papers for later.
   - **Share to Community**: Integration to directly share a paper into a Question, Thought, or Group discussion.
   - **Follow Authors**: Ability to track specific researchers and receive updates on their new work.
4. **Data Models**:
   - Ensure `saved_papers` and `author_follows` table/relations exist.
   - Integrate with Elasticsearch for the core search performance.
