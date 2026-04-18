**Role**: `roles/frontend.md` + `roles/backend.md`
**Context**: `context/auth-flow.md`

**Task**: Build Chapter 2: The Gate (Login with OTP).

**Description**:
ResearchBridge handles academic work, research data, collaborative projects, and professional reputations. Security is not optional. Researchers need to trust that their contributions and identities are protected.
To enforce this, implement a two-step login process: **Password + Email OTP**.

**Requirements**:
1. **Initial Login**:
   - The user enters their email and password on the login screen.
   - Upon correct entry, the platform **does not immediately let them in**.
2. **OTP Generation & Email**:
   - The backend generates a secure one-time passcode (OTP) with a short expiration.
   - Send the OTP to their registered email address.
3. **Verification Screen**:
   - Redirect the user to an OTP verification screen.
   - Instruct the user to check their email and enter the code.
4. **Access Granted**:
   - Validate the submitted OTP on the backend.
   - Only upon correctly entering the OTP does ResearchBridge open its doors (issue final access/refresh tokens and route to the main dashboard).
