# Workflow: Debug ResearchBridge Bug

1. **Impact Assessment**:
   - Does the bug leak PII or bypass the **OTP/Onboarding Gate**?
   - Does it affect the **Trust Score** or **Personalized Search** accuracy?
2. **Investigation**:
   - **Locate**: Identify the entry point (Next.js route -> Express Controller -> Service).
   - **Trace**: Check Kafka logs to see if events triggered correctly across services.
   - **Simulate**: Check Neo4j Cypher logs if it involves recommendation logic.
3. **Resolution**:
   - Provide a persistent fix that maintains DDD integrity.
   - Update any affected unit tests.
4. **Post-Mortem**:
   - Log the root cause and decision in `memory/known-issues.md`.