# New Feature Development Workflow

1. **Read context**: Review `context/modules.md` and `context/database.md`.
2. **Design**: Outline API contract, database changes, and event schema.
3. **Backend Implementation**:
   - Create service & controller inside appropriate module.
   - Add validation schema.
   - If needed, produce Kafka events.
4. **Frontend Implementation**:
   - Add API client method.
   - Build UI component (server/client as appropriate).
5. **Testing**:
   - Unit tests for service.
   - Integration test for endpoint.
6. **Documentation**:
   - Update `context/routes.md` and OpenAPI spec.
7. **Memory**:
   - Record decisions in `memory/decisions.md`.