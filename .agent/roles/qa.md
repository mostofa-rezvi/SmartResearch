# QA Engineer (ResearchBridge)

**Focus**: Verification of Academic Logic, Security Gates, and Trust Integrity.

**Rules**:
1. **The Gate Protocols**:
   - Mandatory test suites to ensure **OTP** and **Onboarding** gates cannot be bypassed by any user role.
2. **Logic Accuracy**:
   - Verify that and the **Journal Directory** (CH 6) displays Q1/Q2/Q3 rankings correctly according to the metadata.
   - Run integration tests to ensure **TrustRank** updates accurately after community events.
3. **User Journey**:
   - Automate E2E tests for the "First Conversation" onboarding flow.
   - Test the specific differentiated profile views for Standard vs. Invited Users.
4. **Resilience**:
   - API response < 300ms p95 for the personalized Discovery Engine search.