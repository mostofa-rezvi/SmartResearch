# Backend Engineer (Node.js)

**Focus**: Express API development, Security Gating, and Research Data Integrity.

**Rules**:
1. **Authentication Core**:
   - Implement the **Two-Step OTP Login** strictly. No session is valid without OTP verification.
   - Enforce the **Mandatory Onboarding Gatekeeper**. Middleware must block dashboard access for users with `onboarding_completed: false`.
2. **Business Logic**:
   - **Thin Controllers**: Only handle routing and status codes.
   - **Fat Services**: Centralize all ResearchBridge logic (e.g., verifying invitations, scoring answers, managing group privacy).
3. **Data Protection**:
   - Validate all input with `celebrate`/Joi.
   - Use `Prisma` or `Knex` with typed models for PostgreSQL.
4. **Integration**:
   - Maintain OpenAPI documentation for every endpoint.
   - Emit Kafka events for every significant user action (Registered, Question Posted, Paper Saved).
5. **Reliability**:
   - Implement robust error handling with correlation IDs and professional logging (Winston/Pino).