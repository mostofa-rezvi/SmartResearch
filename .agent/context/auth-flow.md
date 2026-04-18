# Authentication Flow: The Door In

## Registration (Chapter 1)
1. **Welcome Page**: Presents an inviting home for researchers at every stage.
2. **Registration Form**: Client POST `/auth/register`
   - **Fields Collected**: Full name, Email address, Password, Academic/professional status, Institution/affiliation.
   - *Frictionless*: No other overwhelming forms.
3. **Email Verification**: User receives verification email with a link.
4. **Confirmation**: User clicks the link, email is confirmed, and the account is created.
5. **Enforced Security Pattern**: The platform **does not** log them in automatically. The user is redirected to the login screen. This establishes a credentialed, trustworthy environment.

## Login Flow: The Gate (Chapter 2)
1. **Initial Login**: Client POST `/auth/login` with email and password.
2. **Two-Step Verification (OTP)**: Upon correct entry, the platform **does not immediately let them in**. Instead:
   - A one-time passcode (OTP) is sent to their registered email.
   - The user is redirected to a verification screen.
3. **Verification Entry**: User enters the OTP code. Client POST `/auth/verify-otp`.
4. **Access Granted**: Only upon correctly entering the OTP does ResearchBridge open its doors. Returns `access_token` (JWT) + `refresh_token` (httpOnly cookie).
5. **Security Posture**: This two-step process exists to protect academic work, data, and professional reputations.

## Mandatory Onboarding: The First Conversation (Chapter 4)
1. **The Gatekeeper**: After the very first login, the user must complete a guided research interest form. This step cannot be skipped or dismissed.
2. **Cold-start Resolution**: The user selects predefined keywords and answers questions about their fields of study, theoretical vs applied preference, and domains of interest.
3. **Recommendation Lock**: Until `onboarding_completed=true`, ResearchBridge holds back all recommendations, ensuring that nothing is shown unless the platform can genuinely justify it based on the user's profile.