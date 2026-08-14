# ResearchBridge — Credentials

> ⚠️ **DEV / DEMO ONLY.** These are local development and demo credentials.
> The fixed OTP and known passwords are active **only when `NODE_ENV !== production`**.
> Do **not** commit real secrets here and do **not** use these in production.
> This file is git-ignored.

_Last generated: 2026-08-14._

## How to sign in

1. Go to `/login`.
2. Enter the **email** and **password** below → **Continue**.
3. On the 2FA screen, enter the **login OTP** (in dev it is pre-filled automatically) → **Unlock Access**.

- **Login OTP** for all accounts marked below is **`123456`** (fixed in non-production).
- The **Staff Console** (admin panel) lives at `/staff/2024/25/admin-panel` and has its own restricted login at `/staff/2024/25/login`.

---

## Administrators

| Role | Name | Email | Password | Login OTP | Notes |
|------|------|-------|----------|-----------|-------|
| `super_admin` | Platform Administrator | `admin@researchbridge.app` | `Admin@2025!` | `123456` | Full Staff Console access |
| `admin` | System Author | `seed@researchbridge.app` | _(seed account — no known password)_ | — | System/seed owner of generated content |

Provision / reset the super admin:
```bash
cd backend
node scripts/create-admin.js
# custom: ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='Str0ng!Pass' node scripts/create-admin.js
```

---

## Demo researcher accounts

All 8 share password **`Demo@2025!`** and login OTP **`123456`**. Verified & onboarded.

| # | ID | Name | Email | Password | Login OTP |
|---|----|------|-------|----------|-----------|
| 1 | 15 | Dr. Aisha Rahman  | `aisha.rahman@demo.researchbridge.test`  | `Demo@2025!` | `123456` |
| 2 | 16 | Dr. Chen Wei      | `chen.wei@demo.researchbridge.test`      | `Demo@2025!` | `123456` |
| 3 | 17 | Dr. Sofia Almeida | `sofia.almeida@demo.researchbridge.test` | `Demo@2025!` | `123456` |
| 4 | 18 | Dr. Marcus Feld   | `marcus.feld@demo.researchbridge.test`   | `Demo@2025!` | `123456` |
| 5 | 19 | Priya Nair        | `priya.nair@demo.researchbridge.test`    | `Demo@2025!` | `123456` |
| 6 | 20 | Dr. Omar Haddad   | `omar.haddad@demo.researchbridge.test`   | `Demo@2025!` | `123456` |
| 7 | 21 | Lucas Moreau      | `lucas.moreau@demo.researchbridge.test`  | `Demo@2025!` | `123456` |
| 8 | 22 | Dr. Elena Petrova | `elena.petrova@demo.researchbridge.test` | `Demo@2025!` | `123456` |

Provision / reset all demo accounts:
```bash
cd backend
node scripts/seed-demo-accounts.js
# custom password: DEMO_PASSWORD='Str0ng!Pass' node scripts/seed-demo-accounts.js
```

---

## Other existing users

Real / test accounts already in the database. Passwords are **owner-set / unknown** (not managed by the seed scripts). Their login OTP is the auto-filled dev code (not necessarily `123456`).

| ID | Name | Email | Role | Verified | Password |
|----|------|-------|------|----------|----------|
| 2 | Mostofa Rezvi | `mostofa.aminur.rezvi@gmail.com` | `user` | yes | _owner-set_ |
| 3 | Test Prof | `testprof@dhaka.ac.bd` | `user` | yes | _unknown_ |
| 4 | Test User | `testuser@gmail.com` | `user` | no | _unknown_ |
| 5 | Warm Test | `warm@mit.edu` | `user` | no | _unknown_ |
| 6 | OTP Test | `otptest@mit.edu` | `user` | yes | _unknown_ |

> To make any of these usable with a known password + `123456` OTP, either give it a demo email, add it to `DEMO_OTP_EMAILS`, or reset its password via a script.

---

## OTP configuration

The fixed login OTP is controlled in `backend/src/controllers/auth.controller.js` (`fixedLoginOtp`) and by env:

| Env var | Default | Effect (non-production only) |
|---------|---------|------------------------------|
| `DEMO_OTP_CODE` | `123456` | The fixed OTP value |
| `DEMO_OTP_EMAILS` | `admin@researchbridge.app` | Extra emails that always get the fixed OTP (comma-separated) |
| _domain rule_ | `@demo.researchbridge.test` | Any address on this domain always gets the fixed OTP |

In production none of the above applies — real random OTPs are emailed as usual.
