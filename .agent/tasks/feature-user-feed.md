**Use**:
- `roles/backend.md`
- `roles/frontend.md`
- `workflows/create-feature.md`
- `context/database.md`

**Task**: Build a personalised feed that shows recent posts from followed researchers and recommended papers.

**Acceptance Criteria**:
- API endpoint `/api/feed` returns combined items.
- Feed cached in Redis for 5 minutes.
- Frontend updates in real time when new post published.