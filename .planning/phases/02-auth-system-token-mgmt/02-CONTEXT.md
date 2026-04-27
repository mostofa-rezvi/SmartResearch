# Phase 2 Context: Auth System & Token Management

**Phase:** 02
**Status:** Decided (Auto-mode)
**Focus:** JWT + OAuth 2.0 auth with Redis token management

## Overview

Implement a secure, production-grade authentication system using Node/Express, PostgreSQL, and Redis. The system will support standard email/password registration, social login via Google and GitHub, and robust session management via JWT rotation and blacklisting.

## Architectural Decisions

### 1. Authentication Framework
- **Primary Tool**: `passport` with `passport-local`, `passport-google-oauth20`, and `passport-github2`.
- **Session Strategy**: Stateless JWT. No server-side session cookies.

### 2. JWT Strategy
- **Access Tokens**: Short-lived (15 minutes). Sent in Authorization header (`Bearer <token>`).
- **Refresh Tokens**: Long-lived (7 days). Sent in `httpOnly`, `secure`, `sameSite: lax` cookie.
- **Rotation**: On every refresh token exchange, a new refresh token is issued, and the old one is blacklisted.
- **Blacklist**: Stored in Redis with an expiry matching the token's remaining TTL.

### 3. Password Security
- **Hashing**: `bcryptjs` with 12 salt rounds.
- **Storage**: PostgreSQL `users` table with `password_hash` column.

### 4. Rate Limiting
- **Global API**: `express-rate-limit` (100 req / 15 min).
- **Auth Endpoints**: 5 attempts / 1 min per IP to mitigate brute force.

### 5. Social OAuth Flow
- **Pattern**: 
  1. Frontend redirects to `/api/v1/auth/google`.
  2. Passport handles OAuth callback.
  3. Backend finds/creates user and redirects back to frontend with a `code` or sets the refresh token cookie and redirects with access token in URL fragment (to be improved in later security hardening if needed).

## Codebase Patterns
- **Routes**: Define in `backend/src/routes/auth.routes.js`.
- **Controllers**: Define in `backend/src/controllers/auth.controller.js`.
- **Middleware**: Define in `backend/src/middleware/auth.middleware.js` and `backend/src/middleware/rateLimit.middleware.js`.

## Constraints & Assumptions
- The frontend (`3000`) and backend (`5000`) are on different ports; CORS must be strictly configured to allow credentials.
- Redis is available as `rb-redis:6379`.
- Postgres is available as `rb-postgres:5432`.

---
*Generated autonomously via gsd-discuss-phase --auto.*
