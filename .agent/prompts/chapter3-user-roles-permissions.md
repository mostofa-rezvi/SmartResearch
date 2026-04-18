**Role**: `roles/backend.md` + `roles/frontend.md`
**Context**: `context/user-roles.md`, `context/database.md`

**Task**: Build Chapter 3: The Four Kinds of People (Role-Based Access Control)

**Description**:
ResearchBridge reflects real-world academic hierarchy through its permission structure. 
Implement a robust Role-Based Access Control (RBAC) system handling 4 distinct roles and 2 sub-types of Standard Users.

**Requirements**:
1. **Database Schema Enhancements**:
   - Add a `role` field to the users table: Enum(`super_admin`, `admin`, `user`, `invited_user`).
   - Add a `researcher_type` field for standard users: Enum(`new_researcher`, `amateur_researcher`).
   - Create distinct profile tables/relations if needed for `invited_user` since they carry additional academic standing fields.
2. **Access Middleware (Backend)**:
   - Create authorization middleware to check roles (e.g., `requireRole('super_admin')`, `requireRole('admin')`).
   - Ensure Super Admin has ultimate rights (platform settings, dispute handling, exclusive invites).
   - Ensure Admin handles day-to-day operations (content moderation, journal listing approvals).
3. **Frontend Context & UI Variations**:
   - Store the user's role and researcher type in the frontend authentication context.
   - Distinct UI elements should render depending on role (e.g. an Admin Dashboard link, or recommendation sections filtered by `researcher_type`).
