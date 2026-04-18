**Role**: `roles/frontend.md` + `roles/backend.md`
**Context**: `context/auth-flow.md`

**Task**: Build the ResearchBridge Registration Flow.

**Description**:
Implement the registration form and backend endpoint for the Scholar & Research Community Platform. The form must ask for the essentials only, avoiding unnecessary friction.

**Requirements**:
1. Fields to securely collect:
   - Full name
   - Email address
   - Password (with proper hashing on the backend)
   - Current academic or professional status
   - Institution or affiliation
2. Form Validation:
   - Ensure all fields are filled.
   - Validate email format.
   - Enforce password strength securely but without being overwhelmingly restrictive.
3. Backend Action:
   - Save the user details as an unverified account.
   - Trigger the sending of a verification email.
4. User Experience:
   - Clean, focused UI.
   - Clear feedback on successful submission (informing them to check their email).
