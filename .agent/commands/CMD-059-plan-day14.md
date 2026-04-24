# CMD-059: Plan Day 14

**Phase:** Week 3 / Day 14 — Publication Assistant & Forum
**Skill:** `/gsd-plan-phase`

## Command

```bash
/gsd-plan-phase
```

## Tasks
 DOAJ/Scimago journal recommender, publication checklist,
  forum with TrustRank-weighted feed, spam filter, badges.


## Tech Stack Tasks (Day 14: Publication Assistant + Forum)

- [ ] DOAJ + Scimago API integration: journal recommender by topic/domain *(Tags: be, int)*
- [ ] Publication checklist + paper templates (downloadable) *(Tags: fe, be)*
- [ ] Forum: threaded posts, upvotes, TrustRank-weighted feed *(Tags: fe, be)*
- [ ] Forum moderation: spam filter using TrustRank threshold gating *(Tags: be, ml)*
- [ ] Verified institutional badge display across forum + profiles *(Tags: fe, be)*

## Specifications

- **Framework**: Standardized stack (Next.js/Zustand frontend, Node/Express/PostgreSQL backend, Python FastAPI ML service, Redis Streams).
- **Execution**: Autonomous command execution through GSD framework.
- **Validation**: Strict adherence to UAT and technical criteria.
