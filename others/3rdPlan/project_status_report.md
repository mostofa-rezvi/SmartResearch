# ResearchBridge — Project Status Report
*Cross-referenced against: ResearchBridge Project Proposal (IIT/DU) + SRCP Master's Overview + Live Codebase*  
*Generated: 2026-06-07 (Updated after Gap Closure)*

---

## Executive Summary

**Milestones shipped:** v1.0 → v1.5 (all archived and audited)  
**Recent progress:** Significant gaps in the platform (LLM Integration, Admin Analytics, Connect workflows, GraphQL v2, PDF Parsing) have been closed.
**Current position:** v1.5 "Hardening & Security" + Major Proposal features are completed. The platform is now fully functional end-to-end. We are ready to transition into the v2.0 roadmap.
**Overall assessment:** The core platform is ~90% complete against the full proposal scope. Almost all high-value proposal features are shipped. The remaining gaps are either deep backend infrastructure optimizations (Kafka), secondary nice-to-have workflows (AMAs, Document Versioning), or major v2.0 roadmap items (Mobile App).

---

## ✅ What Is Complete (Recently Added or Pre-existing)

### 1. Infrastructure & Multi-DB Architecture
- PostgreSQL (primary store), Redis (cache + Streams bus), Neo4j (trust graph), Elasticsearch (BM25 + kNN) — all wired, healthchecked.
- MinIO / S3-compatible storage for PDF uploads.
- Background workers: `graphSync.worker`, `searchSync.worker`.

### 2. Authentication & User Management
- Two-step OTP registration, JWT access tokens, institutional email verification (`.edu`, `.ac.bd` trust tier).
- OAuth 2.0 via Passport.js, Role system.

### 3. Collaborator Discovery & Search
- Hybrid search (BM25 + kNN RRF fusion) in Elasticsearch.
- Neo4j PageRank + Co-authorship discovery.
- TrustRank scoring (h-index tiers: Bronze/Silver/Gold).
- **[NEW] Connect Workflow**: Users can seamlessly send and receive connection requests directly from the Recommendation Feed, utilizing PostgreSQL and the live Notification system.

### 4. Collaboration Workspace
- Socket.IO project rooms with JWT-authenticated handshake.
- Yjs CRDT real-time collaborative document editor.
- Live cursor awareness and Kanban board with optimistic updates.

### 5. AI Matching Engine & ML Services
- FastAPI ML microservice with SBERT embeddings.
- Hybrid CF+CB (Content-Based + Collaborative Filtering) for recommendations.
- **[NEW] GraphQL v2 API**: Built with Strawberry (Python) and mounted inside the FastAPI ML service, enabling flexible researcher and paper discovery via GraphiQL.

### 6. Publication Assistant (LLM Layer)
- **[NEW] LLM Integration**: Gemini-powered citation generation (BibTeX, APA, IEEE) and 5-dimension AI writing feedback for uploaded paper drafts.
- **[NEW] Scimago Journal Finder**: Added alongside DOAJ for accurate journal targeting based on quality tiers (Q1-Q4).
- Tabbed interactive UI (Checklist / Citations / Feedback / Journals).

### 7. Notification System
- **[NEW] Persistent Async Queue**: PostgreSQL-backed notifications with live Socket.IO delivery for immediate sync.
- **[NEW] Transactional Emails**: Nodemailer integration (`email.service.js`) for important offline events (mentorships, connections).

### 8. Admin Dashboard & Analytics
- **[NEW] Full Analytics API**: Admin endpoints reporting on platform growth, total users, mentorships, collaboration success rates, and match quality.
- **[NEW] Admin Analytics Dashboard**: Visual dashboard rendering these metrics with top academic domains and KPIs.

### 9. Knowledge Library
- **[NEW] PDF Full-Text Extraction**: Python `pdfplumber` microservice to extract title, abstract, and full text from PDFs up to 50MB.
- **[NEW] Interactive UI**: Extractor widget in the library, saved papers storage, search.

### 10. Mentorship & Community Forum
- Mentorship module with request/accept workflows.
- Forum with Q&A, comments, moderation, groups.

---

## 🟡 Partially Complete (Exists but Incomplete)

### 1. Researcher Credential Dashboard
**What's done:** Profile displays reading history, collaborations, and connections.  
**What's missing:**
- No **append-only audit log** for profile changes (mentioned in proposal).
- No **publication achievements** automated badge tracking (submitted/accepted papers).

### 2. Knowledge Library — Cloud Storage Migration
**What's done:** MinIO is working perfectly for local/development storage.  
**What's missing:**
- The proposal specifies **Cloudflare R2 / DigitalOcean Spaces** for production storage. 

---

## ❌ Missing / Not Implemented (The Remaining Gaps)

### 1. Kafka Event Bus (Deep Infrastructure)
The proposal explicitly features **Apache Kafka** as the async message queue. 
**Status:** We implemented persistent event handling using PostgreSQL + Redis Streams (a pragmatic and functional decision). If true Kafka is required by architectural stakeholders, it must be migrated.

### 2. Document Version History (Workspace)
The proposal states the workspace provides "version history" for collaborative documents.  
**Status:** Yjs CRDT sync stores the current state in PostgreSQL binary, but no version snapshots, diff viewer, or history browser exists for users to revert changes.

### 3. AMA ("Ask Me Anything") with Professors (Forum)
The proposal describes AMAs with professors in the community forum.  
**Status:** No AMA-specific post type, calendar, or scheduling feature exists. 

### 4. Peer Review System (Forum/Projects)
The proposal mentions "review each other's work" in the community forum.  
**Status:** No structured peer review flow (assign reviewer, submit review, track status) exists.

### 5. Behavioral Signal Accumulation for ML
The proposal describes Collaborative Filtering improving as "reads, bookmarks, comments accumulate."  
**Status:** Reading history is logged, but these behavioral signals are not actively fed back into the SBERT/CF scoring model to dynamically adjust embeddings in real-time.

---

## 🚀 v2.0 Roadmap (Not Started)

These are major features explicitly planned for the next major version (v2.0):

1. **Native Mobile App (Phase 22)**: A cross-platform mobile application (React Native / Flutter) for on-the-go notifications, discovery, and reading.
2. **Advanced Analytics Dashboard for Institutions (Phase 24)**: B2B dashboards for university admins to track inter-departmental collaboration.
3. **Multi-language Support (Phase 25)**: i18n for the interface.
4. **API Marketplace (Phase 26)**: Exposing the ML and Graph APIs to third-party developers.
5. **Institutional SSO — SAML/OIDC (Phase 27)**: Single Sign-On for `.edu` domains.
