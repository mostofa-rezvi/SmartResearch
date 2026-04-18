**Role**: `roles/frontend.md` + `roles/backend.md`
**Context**: `context/user-roles.md`, `context/database.md`

**Task**: Build Chapter 8: The Face (Academic Identity & User Profiles)

**Description**:
Every ResearchBridge profile is a genuine academic identity. Implement two distinct profile views based on the user's role: one for Standard Users (Academic CV in progress) and one for Invited Users (Credible Professional Representation).

**Requirements**:
1. **Standard User Profile (Academic Journey)**:
   - Display: Research interests, selected keywords, and full history of community contributions (Questions Asked, Answers Given, Thoughts).
   - Display: Joined groups, saved papers, and a dynamic activity timeline.
2. **Invited User Profile (Verified Expert)**:
   - Accommodate detailed academic professional fields: Institutional affiliation, Department, Rank/Title (e.g., Professor), Areas of expertise.
   - Professional sections: Ongoing research projects, Publications list, Editorial roles, Students supervised, Conference participation.
   - Preferences: Explicit "Contact/Collaboration Preferences" section.
3. **Contextual Transparency**:
   - Ensure names are clickable anywhere they appear (Q&A, Groups).
   - Profiles must clearly indicate the user's role and researcher type to establish trust and hierarchy in interactions.
4. **Data Management**:
   - Create a specialized `invited_user_profiles` table or use a polymorphic `meta` field to handle the extensive professional data.
   - Implement backend services to aggregate community activity stats for the "living CV".
