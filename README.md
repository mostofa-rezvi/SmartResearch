[![Stand With Palestine](https://raw.githubusercontent.com/TheBSD/StandWithPalestine/main/banner-no-action.svg)](https://thebsd.github.io/StandWithPalestine)

# SmartResearch

SmartResearch is an AI-powered social and collaboration platform for the academic community. It bridges the gap between research discovery, peer collaboration, and publication success through a secure, reputation-driven ecosystem.

## 🚀 Key Features

- **AI Discovery Engine:** SBERT-powered research matching and trust graph visualization.
- **Collaborative Workspaces:** Real-time document versioning and research team management.
- **Publication Assistant:** Live DOAJ journal recommendations and comprehensive submission checklists.
- **Community Forum:** Threaded discussions protected by **TrustRank** reputation gating and automated spam filtering.
- **Verified Profiles:** Institutional badge display and social citation integration.
- **Mentorship Module:** Matchmaking for junior and senior researchers, structured learning paths, and progress tracking.
- **AI Assistant (Agentic RAG):** Conversational search grounded in the platform's own corpus (papers, researchers, forum posts) with cited answers; whole-**volume summaries** across your library; and **question-answering over a selected paper**. Retrieval (SBERT + Elasticsearch kNN) always runs; LLM synthesis uses the Hugging Face router and **degrades gracefully to extractive answers** when the LLM is unavailable. See [`spec/AGENTIC-AI-FEATURES.md`](spec/AGENTIC-AI-FEATURES.md).

## 🛠️ Technical Stack

- **Frontend:** Next.js (App Router), Zustand, Tailwind CSS, Radix UI.
- **Backend:** Node.js / Express, PostgreSQL (Primary DB), Redis (Streams/Cache).
- **AI Service:** Python FastAPI, SBERT (Matching), Neo4j (Trust Graph).
- **Ops:** Kubernetes, HPA, Cloudflare CDN/WAF.

## 🏗️ Getting Started

### Prerequisites
- Node.js v18+
- Docker & Kubernetes
- Python 3.9+ (for ML service)

### Installation
```bash
git clone https://github.com/mostofa-rezvi/SmartResearch.git
cd SmartResearch
npm install
```

### Development
```bash
npm run dev
```

### WebSocket Authentication
Real-time features via Socket.IO require JWT authentication during the handshake. Clients must provide their JWT token in the `auth` object:
```javascript
const socket = io("http://your-server-url", {
  auth: {
    token: "your_jwt_token_here"
  }
});
```

### Running Templates
To instantiate standard research templates (e.g., proposals, ethics reviews), run the built-in generator script:
```bash
npm run generate:template -- --name="My Project" --type="proposal"
```

## 🛡️ Admin / Staff Console

A unified staff admin panel governs users, content, credibility, and system pipelines from one place, styled in the same glass-neumorphism system as the app.

**URL:** `<baseurl>/staff/2024/25/admin-panel` — e.g. `http://localhost:3000/staff/2024/25/admin-panel`

The path is intentionally obscure, and access is protected by **role-based access control end to end**:
- The page renders a plain **404** for anyone who is not `admin` / `super_admin` (its existence is never advertised).
- Every backend endpoint it calls independently enforces `requireRole(['admin','super_admin'])`; invitations additionally require `super_admin`.

### Create / promote an administrator
Run the idempotent bootstrap script from `backend/`:
```bash
cd backend
node scripts/create-admin.js
# …or supply your own values:
ADMIN_EMAIL=you@school.edu ADMIN_PASSWORD='Str0ng!Pass' ADMIN_NAME='Jane Admin' node scripts/create-admin.js
```
To promote an existing account instead: `UPDATE users SET role='super_admin' WHERE email='you@school.edu';`

**Default development credentials** (created by the command above — ⚠️ change these before any real deployment):

| Field | Value |
| --- | --- |
| Panel URL | `/staff/2024/25/admin-panel` |
| Email | `admin@researchbridge.app` |
| Password | `Admin@2025!` |
| Role | `super_admin` |

> **Two-factor note.** When `OTP_LOGIN_ENABLED=true` (backend `.env`), sign-in emails a 6-digit one-time code to the admin address. Use a real inbox (set `ADMIN_EMAIL` to one you control), **or** in development the `POST /api/v1/auth/login` response includes a `dev_otp` field so you can complete login without email. Set `OTP_LOGIN_ENABLED=false` and restart the backend to disable 2FA locally.

### What it controls
- **Overview** — live platform KPIs, a weekly growth chart, role distribution, top research domains, and pending-moderation counts.
- **Users & Trust** — search/filter, set trust tier (single or **bulk**), verify/revoke institutional badges, recompute TrustRank; **paginated**.
- **Moderation** — resolve flagged posts (dismiss / delete) and approve/reject pending journals.
- **Content** — review article submissions (approve/reject, single or **bulk**); filter by status.
- **Invitations** *(super-admin only)* — issue secure onboarding invites to scholars.
- **Audit Log** — immutable trail of the last 100 administrative actions; **paginated**.
- **System** — recompute TrustRank and run the Elasticsearch/Neo4j **backfill** pipelines.

The console is a pure client of existing, RBAC-protected endpoints — it introduces no new business logic and does not alter any existing admin flow.

## 📜 Documentation
- [Architecture Guide](ARCHITECTURE.md)
- [API Reference](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing](CONTRIBUTING.md)
- **Compliance & test report**: [others/PROPOSAL-COMPLIANCE-CHECKLIST.md](others/PROPOSAL-COMPLIANCE-CHECKLIST.md)

### Interactive API docs (OpenAPI)
The full OpenAPI 3.0 spec lives at [`backend/openapi.yaml`](backend/openapi.yaml) and is served by the backend:
- **`GET /api-docs`** — interactive Redoc UI
- **`GET /openapi.yaml`** — raw spec (load into Swagger/Postman/Insomnia)
- **`GET /health`** — deep health check (Postgres, Redis, Elasticsearch, Neo4j)
- **`GET /metrics`** — Prometheus metrics

### AI Assistant endpoints (v2.1)
Backend (JWT-gated, proxy to the ML service): `POST /api/v1/assistant/chat`, `GET /api/v1/assistant/sessions`, `GET /api/v1/assistant/sessions/:id/messages`, `DELETE /api/v1/assistant/sessions/:id`, `POST /api/v1/assistant/summarize`, `POST /api/v1/assistant/paper-qa`.
ML service (FastAPI): `POST /rag/chat`, `POST /rag/summarize`, `POST /rag/paper-qa`. Requires a Hugging Face token with available Inference credits for full generative answers (`HF_API_TOKEN`); without it, answers fall back to extractive mode (`degraded:true`). Run the assistant migration once: `backend/migrations/v3_assistant.sql`.

## ☸️ Kubernetes
Self-contained manifests under [`k8s/`](k8s/) (Kustomize):
```bash
# copy k8s/base/secret.example.yaml -> secret.yaml and fill in real values, then:
kubectl apply -k k8s/overlays/prod
```
The base includes app Deployments/Services (frontend, backend, ml-service), in-cluster
**StatefulSets** for PostgreSQL / Redis / Elasticsearch / Neo4j / MinIO (with PVCs), a
ConfigMap, an Ingress, and a production HPA overlay. After the pods are up, run
`POST /api/v1/admin/backfill` once to index existing data into Elasticsearch and seed
the Neo4j graph.

## 🛡️ License
MIT
