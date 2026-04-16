# Authentication Flow

1. Client POST `/auth/login` → returns `access_token` (JWT, 15m) + `refresh_token` (httpOnly cookie).
2. Subsequent requests include `Authorization: Bearer <access_token>`.
3. When access expires, client calls `/auth/refresh` with cookie.
4. OAuth2 providers: Google, GitHub – handled via Passport.js.