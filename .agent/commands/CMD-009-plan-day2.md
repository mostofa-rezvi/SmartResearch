# CMD-009: Plan Day 2

**Phase:** Week 1 / Day 2 — Auth System
**Skill:** `/gsd-plan-phase`

## Command

```bash
/gsd-plan-phase
```

## Tasks
 JWT access/refresh tokens, OAuth (Google, GitHub),
  refresh token rotation with Redis blacklist, rate limiting
  via express-rate-limit + rate-limit-redis, bcrypt hashing,
  email verification flow with nodemailer.


## Tech Stack Tasks (Day 2: Auth system)

- [ ] JWT + OAuth 2.0 (Google, GitHub) — Node/Express *(Tags: be)*
- [ ] Refresh token rotation, blacklist in Redis *(Tags: be, db)*
- [ ] Rate limiting middleware (express-rate-limit) *(Tags: be)*
- [ ] Password hashing (bcrypt), email verification flow *(Tags: be)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
