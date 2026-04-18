**Role**: `roles/backend.md` + `roles/db.md`
**Context**: `context/modules.md`, `core/standards.md`

**Task**: Generate a New Domain-Driven Service.

**Description**:
Create a new backend module that follows the ResearchBridge standards (Thin Controller, Fat Service, Joi Validation).

**Checklist**:
1. **Types**: Define shared TypeScript interfaces.
2. **Service**: Implement core logic (e.g., scoring an answer, calculating a citation impact).
3. **Controller**: Wrap the service with Express middleware (Auth, RoleCheck, OTP-Check).
4. **Events**: Ensure the service emits Kafka events for downstream processing by ML or Notification services.