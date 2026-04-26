# Codebase Concerns & Tech Debt

## 1. Testing Purity
- **Concern**: Current integration tests (`auth.integration.test.js`) rely heavily on mocking (`jest.mock('pg')`, `jest.mock('ioredis')`). While fast, this risks false positives if SQL syntax or Redis commands are incorrect.
- **Mitigation Needed**: Introduce a "live integration" test suite that runs against temporary Docker instances.

## 2. Event Payload Schemas
- **Concern**: `eventBus.service.js` accepts generic JSON payloads. There is no strict schema enforcement for what a `profile.created` payload must look like before it enters the Redis Stream. If a publisher changes the payload structure, downstream consumers (`graphSync`, `searchSync`) will fail at runtime.
- **Mitigation Needed**: Implement a shared Event Schema Registry or define Joi validations for event payloads before `XADD`.

## 3. Worker Crash Recovery (PEL Reclaimer)
- **Concern**: Workers process the PEL (Pending Entries List) *on startup* to catch missed messages. However, if a message repeatedly causes a hard crash (Poison Pill), it will be re-processed infinitely on every boot, preventing the worker from advancing.
- **Mitigation Needed**: Implement a Dead Letter Queue (DLQ) or a max-retry limit (e.g., check delivery count) to discard or park poison messages.

## 4. Frontend Status
- **Concern**: The frontend Next.js app is largely a scaffold. Deep integration with the robust backend APIs, JWT refresh token interceptors, and WebSocket feeds is pending.

## 5. Environment Variables
- **Concern**: As the system grows across 4+ databases and an ML service, the `.env` file is becoming complex.
- **Mitigation Needed**: Implement strict startup validation of environment variables using `Joi` or `envalid` to prevent the app from booting if misconfigured.
