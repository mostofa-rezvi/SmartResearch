# API Route Summary

| Method | Endpoint               | Module      |
|--------|------------------------|-------------|
| POST   | /api/auth/register      | auth        |
| POST   | /api/auth/login         | auth        |
| POST   | /api/auth/verify-otp    | auth        |
| POST   | /api/onboarding         | users       |
| GET    | /api/users/me           | users       |
| POST   | /api/questions          | community   |
| GET    | /api/questions          | community   |
| POST   | /api/thoughts           | community   |
| GET    | /api/journals           | library     |
| GET    | /api/search             | library     |
| POST   | /api/library/save       | library     |
| POST   | /api/authors/follow     | users       |
| GET    | /api/categories         | library     |
| POST   | /api/invitations        | admin       |