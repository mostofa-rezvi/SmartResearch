# Security Audit — Phase 15 & System-wide

## Overview
This audit evaluates the production readiness of the SmartResearch platform, focusing on Phase 15 (Infrastructure) and retroactively addressing critical vulnerabilities identified in Phase 14 (Forum/API).

## Threat Model

| Threat | Impact | Mitigation Status | Verification |
|--------|--------|-------------------|--------------|
| **TrustRank Spoofing** | High | 🔴 MISSING | API accepts raw `authorTrustRank` from frontend. |
| **Unauthenticated API Access** | Critical | 🔴 MISSING | API routes are public. |
| **DDoS / Traffic Spike** | Medium | 🟢 PARTIAL | Cloudflare CDN/WAF stubbed; K8s HPA implemented. |
| **Predictable IDs** | Medium | 🔴 MISSING | Using `Math.random()` for thread IDs. |
| **Secret Exposure** | High | 🟡 PARTIAL | K8s manifests reference placeholders; script uses ENV vars. |

## Audit Findings

### 1. Authentication & API Security (Critical)
- **Issue:** All Phase 14 API routes (`/api/forum`, `/api/journals`, `/api/checklist`) lack session-based authentication middleware.
- **Issue:** The forum creation endpoint allows users to define their own `authorTrustRank`, enabling anyone to bypass spam filters or artificially boost their feed ranking.
- **Mitigation Needed:** Implement a global auth wrapper and strict server-side TrustRank lookup from the User database.

### 2. Infrastructure & Secrets (Warning)
- **Issue:** `k8s/base/deployment.yaml` does not yet define resource limits for all containers (only ML service has them).
- **Issue:** `scripts/setup-cloudflare.sh` is a stub. It requires actual API integration to be functional.
- **Issue:** Lack of Pod Security Policies (PSP) or Network Policies to isolate the ML service from the public Internet.

### 3. Data Integrity (Warning)
- **Issue:** Predictable ID generation in `ForumService` increases the risk of ID enumeration attacks.
- **Mitigation Needed:** Switch to `crypto.randomUUID()`.

## Remediation Plan

### Immediate (Blocking)
1. **Apply Auth Middleware:** Guard all `/api/` routes with session verification.
2. **Server-side Validation:** Whitelist `POST` bodies; lookup `trustRank` from the database, do not trust the frontend.
3. **Secure ID Generation:** Replace `Math.random()` with cryptographically secure random values.

### Secondary (Hardening)
1. **K8s Network Policies:** Restrict `ml-service` to only accept traffic from the `backend`.
2. **Cloudflare WAF:** Enable "Under Attack" mode and strict SSL/TLS.
3. **Secret Management:** Move placeholders to a `.env.vault` or K8s Secrets.

## Verification
- [ ] Auth middleware implemented and tested with Playwright.
- [ ] Injection payloads rejected by API.
- [ ] HPA triggers successfully during k6 load tests.
