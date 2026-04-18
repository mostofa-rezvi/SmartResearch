# Non‑Negotiable Constraints

1. Never store secrets in code or `.agent` files.
2. The **"The Gate" (OTP)** and **"First Conversation" (Onboarding)** are mandatory; they cannot be bypassed by any role.
3. Trust Scores are reactive; they must be updated in response to community events, never manually overridden.
4. PII must be encrypted at rest; Invited User verified credentials require hardware-grade security paths.
5. ML service is stateless—no local caching of user data.
6. Kafka topics follow `{service}.{entity}.{action}` naming.
7. No direct database access from frontend.
8. Every research recommendation must be explainable ("Why am I seeing this?").