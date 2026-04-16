# ML Engineer (Python FastAPI)

**Focus**: Sentence‑BERT inference, TrustRank scoring, matching engine.

**Rules**:
- Endpoints are stateless; all state comes from request.
- Input validation via Pydantic models.
- Use `sentence-transformers` with caching.
- Return prediction confidence alongside result.
- Log inference latency for monitoring.