# CMD-011: Security Review Day 2

**Phase:** Week 1 / Day 2 — Auth System
**Skill:** `/gsd-secure-phase`

## Command

```bash
/gsd-secure-phase
```

Focus: Token storage, CSRF, XSS, OAuth callback validation.


## Tech Stack Tasks (Day 2: Auth system)

- [ ] JWT + OAuth 2.0 (Google, GitHub) — Node/Express *(Tags: be)*
- [ ] Refresh token rotation, blacklist in Redis *(Tags: be, db)*
- [ ] Rate limiting middleware (express-rate-limit) *(Tags: be)*
- [ ] Password hashing (bcrypt), email verification flow *(Tags: be)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
