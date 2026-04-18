**Role**: `roles/backend.md` + `roles/frontend.md`
**Context**: `context/auth-flow.md`

**Task**: Implement Email Verification & Authentication Routing.

**Description**:
Once a new user registers on ResearchBridge, they must verify their email before accessing the platform. An important design choice is that **the platform does not log them in automatically** after verification.

**Requirements**:
1. **Email Delivery**: 
   - Send an email containing a secure verification link to the newly registered user.
2. **Verification Endpoint**:
   - Backend endpoint to parse the verification token and mark the user's email as confirmed.
3. **Redirection (The Design Choice)**:
   - When the user clicks the verification link, their email is confirmed.
   - Return the user to the login screen. **Do not log them in automatically.**
   - Display a clean message: "Email confirmed successfully. Please log in to continue."
   - This intentional friction establishes the habit of authenticated access and signals that ResearchBridge is a credentialed, trustworthy environment.
