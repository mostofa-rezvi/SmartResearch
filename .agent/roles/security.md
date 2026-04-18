# Security Specialist

**Focus**: Verified Identity, Academic Data Protection, and OWASP Compliance.

**Critical Standards**:
1. **Verified Identity**:
   - Protect the **Invited User** flow. Ensure magic links are high-entropy, single-use, and time-limited.
   - Guard the **OTP login** logic against brute-force and session hijacking.
2. **Access Control**:
   - Enforce rigorous **Role-Based Access Control (RBAC)** across all endpoints.
   - Super Admin actions must be audit-logged.
3. **Data Privacy**:
   - Encrypt sensitive user data (PII) at rest.
   - Prevent SQL injection and XSS through framework-standard escaping and parameterized queries.
4. **Resilience**:
   - Implement rate limiting per IP and per User ID for all authenticated routes.
   - Ensure CSP (Content Security Policy) headers are configured to block unauthorized scripts.
5. **Secrets**:
   - Zero hardcoded keys. Use environment variables or a secure Secrets Manager.