# ResearchBridge — Model-Specific Command Mapping

**Antigravity Models:** Gemini 3.1 Pro (High) · Gemini 3.1 Pro (Low) · Gemini Flash  
**Total Commands:** 87 (CMD-001 → CMD-077 + 10 gap-fill commands)

---

## Legend

| Tier | Model | Cost | When to Use |
|------|-------|------|-------------|
| 🔴 | Gemini 3.1 Pro **HIGH** | $$$ | Architecture, security, ML design, complex algorithms |
| 🟡 | Gemini 3.1 Pro **LOW** | $$ | Standard plan, execute, review, test commands |
| 🟢 | Gemini **Flash** | $ | Milestones, audits, transitions, docs, housekeeping |

---

## Phase 0 — Project Bootstrap (Pre-Day 1)

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 1 | CMD-001 | `/gsd-new-project` | 🔴 **Pro High** | Sets entire project foundation, captures all architecture decisions |
| 2 | CMD-002 | `/gsd-scan` | 🟢 **Flash** | Quick read-only codebase assessment |
| 3 | CMD-003 | `/gsd-new-milestone` | 🟢 **Flash** | Simple milestone creation, no complex logic |

---

## Week 1 — Infrastructure, Auth & Core Backend

### Day 1 — Project Scaffold & Infrastructure

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 4 | CMD-004 | `/gsd-discuss-phase --auto` | 🟢 **Flash** | Auto-answered discussion, minimal thinking needed |
| 5 | CMD-005 | `/gsd-plan-phase` | 🟡 **Pro Low** | Docker Compose + CI — standard infra planning |
| 6 | CMD-006 | `/gsd-execute-phase` | 🟡 **Pro Low** | Code generation for Docker, env, CI |
| 7 | CMD-007 | `/gsd-code-review` | 🟡 **Pro Low** | Docker security + env exposure review |

### Day 2 — Auth System

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 8 | CMD-008 | `/gsd-discuss-phase --auto` | 🟢 **Flash** | Auto-answered discussion |
| 9 | CMD-009 | `/gsd-plan-phase` | 🔴 **Pro High** | Security-critical: JWT, OAuth, token rotation |
| 10 | CMD-010 | `/gsd-execute-phase` | 🟡 **Pro Low** | Auth implementation from plan |
| 11 | CMD-011 | `/gsd-secure-phase` | 🔴 **Pro High** | Security audit: tokens, CSRF, XSS, OAuth callbacks |
| 12 | CMD-012 | `/gsd-add-tests` | 🟡 **Pro Low** | Test generation for auth flows |

### Day 3 — User Profile & PostgreSQL Schema

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 13 | CMD-013 | `/gsd-plan-phase` | 🟡 **Pro Low** | Standard CRUD + schema planning |
| 14 | CMD-014 | `/gsd-execute-phase` | 🟡 **Pro Low** | Profile CRUD implementation |
| 15 | CMD-015 | `/gsd-code-review` | 🟡 **Pro Low** | Schema + validation review |

### Day 4 — Neo4j Graph & Redis Streams Bootstrap

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 16 | CMD-016 | `/gsd-discuss-phase` | 🔴 **Pro High** | Critical architecture: Kafka→Redis Streams migration |
| 17 | CMD-017 | `/gsd-plan-phase` | 🔴 **Pro High** | Neo4j schema + Redis Streams event bus design |
| 18 | CMD-018 | `/gsd-execute-phase` | 🟡 **Pro Low** | Implementation from plan |
| 19 | CMD-019 | `/gsd-code-review` | 🟡 **Pro Low** | Graph + event producer review |

### Day 5 — Elasticsearch Setup & Indexing

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 20 | CMD-020 | `/gsd-plan-phase` | 🟡 **Pro Low** | ES index mappings + pipeline |
| 21 | CMD-021 | `/gsd-execute-phase` | 🟡 **Pro Low** | ES implementation |
| 22 | CMD-020A | `/gsd-code-review` | 🟡 **Pro Low** | ES indexing + consumer logic review |

### Week 1 — Close

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 23 | CMD-022 | `/gsd-verify-work` | 🟡 **Pro Low** | UAT checklist verification |
| 24 | CMD-022A | `/gsd-audit-uat` | 🟢 **Flash** | Cross-phase UAT item audit |
| 25 | CMD-023 | `/gsd-audit-milestone` | 🟢 **Flash** | Milestone completion checklist |
| 26 | CMD-024 | `/gsd-complete-milestone` | 🟢 **Flash** | Archive + transition housekeeping |
| 27 | CMD-024A | `/gsd-map-codebase` | 🟡 **Pro Low** | Deep codebase scan for Week 2 context |

---

## Week 2 — AI Matching Engine, Search & Collaboration

### Day 6 — Sentence-BERT Embedding Service

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 28 | CMD-025 | `/gsd-new-milestone` | 🟢 **Flash** | Simple milestone creation |
| 29 | CMD-026A | `/gsd-ai-integration-phase` | 🔴 **Pro High** | AI design contract: framework selection, eval strategy |
| 30 | CMD-026 | `/gsd-research-phase` | 🔴 **Pro High** | sentence-transformers research, vector architecture |
| 31 | CMD-027 | `/gsd-plan-phase` | 🔴 **Pro High** | ML embedding service design |
| 32 | CMD-028 | `/gsd-execute-phase` | 🟡 **Pro Low** | FastAPI + BERT implementation |
| 33 | CMD-029 | `/gsd-code-review` | 🟡 **Pro Low** | ML code review |
| 34 | CMD-029A | `/gsd-eval-review` | 🔴 **Pro High** | Embedding quality + latency evaluation |

### Day 7 — CF + CBF Hybrid Matching Engine

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 35 | CMD-030 | `/gsd-discuss-phase` | 🔴 **Pro High** | Hybrid recommender architecture |
| 36 | CMD-031 | `/gsd-plan-phase` | 🔴 **Pro High** | CBF + CF algorithm design, cold-start handling |
| 37 | CMD-032 | `/gsd-execute-phase` | 🟡 **Pro Low** | Matching engine implementation |
| 38 | CMD-033 | `/gsd-add-tests` | 🟡 **Pro Low** | Matching accuracy + cold-start tests |

### Day 8 — TrustRank & Graph Traversal

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 39 | CMD-034 | `/gsd-plan-phase` | 🔴 **Pro High** | PageRank-variant algorithm design |
| 40 | CMD-035 | `/gsd-execute-phase` | 🟡 **Pro Low** | TrustRank implementation |
| 41 | CMD-036 | `/gsd-code-review` | 🟡 **Pro Low** | Graph logic review |
| 42 | CMD-036A | `/gsd-eval-review` | 🔴 **Pro High** | TrustRank convergence + accuracy eval |

### Day 9 — Semantic Search & kNN

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 43 | CMD-037 | `/gsd-plan-phase` | 🔴 **Pro High** | kNN + BM25 hybrid with RRF fusion design |
| 44 | CMD-038 | `/gsd-execute-phase` | 🟡 **Pro Low** | Search implementation |
| 45 | CMD-039 | `/gsd-verify-work` | 🟡 **Pro Low** | <200ms performance validation |

### Day 10 — Collaboration Workspace Backend

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 46 | CMD-040 | `/gsd-discuss-phase` | 🔴 **Pro High** | Socket.IO + Yjs CRDT architecture |
| 47 | CMD-041 | `/gsd-plan-phase` | 🟡 **Pro Low** | Workspace CRUD + milestone state machine |
| 48 | CMD-042 | `/gsd-execute-phase` | 🟡 **Pro Low** | Collaboration backend implementation |
| 49 | CMD-042A | `/gsd-code-review` | 🟡 **Pro Low** | Socket.IO security + CRDT review |
| 50 | CMD-042B | `/gsd-add-tests` | 🟡 **Pro Low** | Workspace + real-time tests |

### Week 2 — Close

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 51 | CMD-043 | `/gsd-verify-work` | 🟡 **Pro Low** | Week 2 UAT verification |
| 52 | CMD-043A | `/gsd-audit-uat` | 🟢 **Flash** | Cross-phase UAT audit |
| 53 | CMD-044 | `/gsd-audit-milestone` | 🟢 **Flash** | Milestone completion checklist |
| 54 | CMD-045 | `/gsd-complete-milestone` | 🟢 **Flash** | Archive + transition |

---

## Week 3 — Frontend, Publication Assistant & Production

### Day 11 — Next.js Frontend: Auth & Profile

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 55 | CMD-046 | `/gsd-new-milestone` | 🟢 **Flash** | Simple milestone creation |
| 56 | CMD-047 | `/gsd-ui-phase` | 🟡 **Pro Low** | UI design contract for auth + profile pages |
| 57 | CMD-048 | `/gsd-plan-phase` | 🟡 **Pro Low** | Frontend planning |
| 58 | CMD-049 | `/gsd-execute-phase` | 🟡 **Pro Low** | Next.js auth + profile implementation |
| 59 | CMD-050 | `/gsd-ui-review` | 🟡 **Pro Low** | 6-pillar visual audit |

### Day 12 — Discovery & Matching Dashboard

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 60 | CMD-051 | `/gsd-ui-phase` | 🟡 **Pro Low** | UI design contract for discovery page |
| 61 | CMD-052 | `/gsd-plan-phase` | 🟡 **Pro Low** | Dashboard planning |
| 62 | CMD-053 | `/gsd-execute-phase` | 🟡 **Pro Low** | Discovery UI implementation |
| 63 | CMD-054 | `/gsd-ui-review` | 🟡 **Pro Low** | Visual audit |

### Day 13 — Collaboration Workspace UI

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 64 | CMD-055 | `/gsd-ui-phase` | 🟡 **Pro Low** | UI design contract for workspace |
| 65 | CMD-056 | `/gsd-plan-phase` | 🟡 **Pro Low** | Kanban + editor planning |
| 66 | CMD-057 | `/gsd-execute-phase` | 🟡 **Pro Low** | Collaboration UI implementation |
| 67 | CMD-058 | `/gsd-ui-review` | 🟡 **Pro Low** | Visual audit |

### Day 14 — Publication Assistant & Forum

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 68 | CMD-059A | `/gsd-ui-phase` | 🟡 **Pro Low** | UI design contract for forum + pub assistant |
| 69 | CMD-059 | `/gsd-plan-phase` | 🟡 **Pro Low** | Publication + forum planning |
| 70 | CMD-060 | `/gsd-execute-phase` | 🟡 **Pro Low** | Implementation |
| 71 | CMD-061 | `/gsd-code-review` | 🟡 **Pro Low** | Code review |
| 72 | CMD-062 | `/gsd-eval-review` | 🔴 **Pro High** | TrustRank spam filter evaluation |

### Day 15 — Production Hardening & Deployment

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 73 | CMD-063 | `/gsd-plan-phase` | 🟡 **Pro Low** | K8s + monitoring + E2E plan |
| 74 | CMD-064 | `/gsd-execute-phase` | 🟡 **Pro Low** | Production config implementation |
| 75 | CMD-065 | `/gsd-secure-phase` | 🔴 **Pro High** | Full application security audit |
| 76 | CMD-066 | `/gsd-audit-fix` | 🔴 **Pro High** | Autonomous find→fix→test pipeline |
| 77 | CMD-067 | `/gsd-verify-work` | 🟡 **Pro Low** | E2E performance verification |

### Week 3 — Close & Ship

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 78 | CMD-068 | `/gsd-audit-milestone` | 🟢 **Flash** | Final milestone audit |
| 79 | CMD-069 | `/gsd-extract_learnings` | 🟢 **Flash** | Extract decisions + patterns |
| 80 | CMD-070 | `/gsd-docs-update` | 🟡 **Pro Low** | README, API docs, architecture docs |
| 81 | CMD-071 | `/gsd-milestone-summary` | 🟢 **Flash** | Project summary generation |
| 82 | CMD-072 | `/gsd-pr-branch` | 🟢 **Flash** | Clean PR branch creation |
| 83 | CMD-073 | `/gsd-ship` | 🟡 **Pro Low** | PR + review + merge |
| 84 | CMD-074 | `/gsd-session-report` | 🟢 **Flash** | Session summary |

---

## Post-MVP — Backlog & Future Seeds

| # | Command | Skill | Model | Rationale |
|---|---------|-------|-------|-----------|
| 85 | CMD-075 | `/gsd-add-backlog` | 🟢 **Flash** | Simple backlog item capture |
| 86 | CMD-076 | `/gsd-plant-seed` | 🟢 **Flash** | Forward-looking idea capture |
| 87 | CMD-077 | `/gsd-review-backlog` | 🟢 **Flash** | Backlog prioritization |

---

## Cost Summary

| Model | Commands | % of Total | Use For |
|-------|----------|------------|---------|
| 🔴 Pro High | **19** | 22% | Architecture, security, ML, algorithms |
| 🟡 Pro Low | **44** | 51% | Plan, execute, review, test, docs |
| 🟢 Flash | **24** | 27% | Milestones, audits, transitions, backlog |

---

## Quick Reference — Model Switch Points

```
Day 1:  Flash → Pro Low → Pro Low → Pro Low
Day 2:  Flash → 🔴Pro High → Pro Low → 🔴Pro High → Pro Low
Day 3:  Pro Low → Pro Low → Pro Low
Day 4:  🔴Pro High → 🔴Pro High → Pro Low → Pro Low
Day 5:  Pro Low → Pro Low → Pro Low
Day 6:  Flash → 🔴Pro High → 🔴Pro High → 🔴Pro High → Pro Low → Pro Low → 🔴Pro High
Day 7:  🔴Pro High → 🔴Pro High → Pro Low → Pro Low
Day 8:  🔴Pro High → Pro Low → Pro Low → 🔴Pro High
Day 9:  🔴Pro High → Pro Low → Pro Low
Day 10: 🔴Pro High → Pro Low → Pro Low → Pro Low → Pro Low
Day 11: Flash → Pro Low → Pro Low → Pro Low → Pro Low
Day 12: Pro Low → Pro Low → Pro Low → Pro Low
Day 13: Pro Low → Pro Low → Pro Low → Pro Low
Day 14: Pro Low → Pro Low → Pro Low → Pro Low → 🔴Pro High
Day 15: Pro Low → Pro Low → 🔴Pro High → 🔴Pro High → Pro Low
Ship:   Flash → Flash → Pro Low → Flash → Flash → Pro Low → Flash
```

---

*ResearchBridge · Mostofa Aminur Rashid · 2026*


## Key Tips
```
- You don't reference .agent/commands/ files in chat — they're your personal checklist
- The /gsd-* commands are typed directly — they're recognized by the GSD skill system
- Context matters — for discuss-phase and plan-phase, paste the relevant context from your CMD file
- Switch models between commands, not mid-command
- Use --auto flag on discuss-phase to save Flash-tier tokens
- Use --chain flag to auto-run discuss→plan→execute in one shot (Pro Low for this)
- The .agent/skills/ files are agent reference docs — they help the AI understand what each skill does. You don't need to open them during execution.
```