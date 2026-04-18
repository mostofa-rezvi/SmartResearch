**Role**: `roles/frontend.md` + `roles/backend.md`
**Context**: `context/database.md`

**Task**: Build Chapter 5: Structured Groups

**Description**:
Beyond open posting, ResearchBridge supports structured "Groups" organized around a research topic, methodology, geographic region, or discipline. 

**Requirements**:
1. **Group Creation & Management**:
   - Users can create a Group, specifying its name, description, and academic focus area.
   - The creator acts as the Group Admin, capable of managing members and content.
2. **Public vs. Private Logic**:
   - **Public Groups**: Visible in search, joinable by anyone on the platform. Feed is visible to non-members.
   - **Private Groups**: Invitation-only (e.g. for a research team, closed circle of collaborators). Content is hidden from non-members.
3. **Group Feeds**:
   - Each group acts as a micro-community. It has its own dedicated feed where members can post Questions, Thoughts, and participate in discussions.
4. **Data Models**:
   - `groups`, `group_members` (tracking roles like member/admin), and linking community posts to a specific `group_id`.
