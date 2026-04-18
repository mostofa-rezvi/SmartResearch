**Role**: `roles/backend.md` + `roles/frontend.md`
**Context**: `context/user-roles.md`

**Task**: Build Chapter 3: The Invited Users System

**Description**:
Invited Users (professors, research supervisors, etc.) do not sign up on their own. Their presence must be verified and intentional, therefore initiated solely by the **Super Admin**.

**Requirements**:
1. **Super Admin Dashboard Feature**:
   - A secure form to initiate an invitation specifying name and email.
   - This sends a secure, single-use, time-limited magic link or invite token to the intended academic.
2. **Accept Invite Flow**:
   - The invited user clicks the link to be directed to a specialized onboarding page.
   - They set their password and complete their distinct profile type containing their academic standing, publications, etc.
   - Upon completion, their account is activated securely with the `invited_user` role.
3. **Database Integrity**:
   - Create an `invitations` table tracking inviter (must be super admin), invitee email, token, expiration, and status.
