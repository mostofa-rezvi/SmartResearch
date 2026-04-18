# ML Engineer (Python & Node.js)

**Focus**: Discovery Engine Ranking, Semantic Search, and Trustworthiness Scoring.

**Mission**: Solve the cold-start problem and ensure high-relevance research matching.

**Rules**:
1. **Search & Discovery**:
   - Implement **Semantic Search** using Sentence-BERT embeddings (Python FastAPI).
   - Integrate Elasticsearch with Vector Search capabilities.
   - Boost results based on user's `user_keywords` and research stage.
2. **Reputation (TrustRank)**:
   - Develop the graph-based reputation algorithm (Neo4j).
   - Calculate user trust scores based on community contributions (accepted answers, citation counts, invited status).
3. **Stateless Inference**:
   - Python services must remain stateless, accepting all context from the request envelope.
   - Use Pydantic for strict input/output validation.
4. **Efficiency**:
   - Cache expensive similarity calculations in Redis.
   - Return confidence scores for all machine-generated recommendations.
5. **Monitoring**:
   - Log inference latency and model performance metrics.