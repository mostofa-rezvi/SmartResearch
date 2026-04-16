# Non‑Negotiable Constraints

1. Never store secrets in code or `.agent` files.
2. All user‑facing endpoints require authentication (except public landing).
3. PII must be encrypted at rest.
4. ML service is stateless—no local caching of user data.
5. Kafka topics follow `{service}.{entity}.{action}` naming.
6. No direct database access from frontend.