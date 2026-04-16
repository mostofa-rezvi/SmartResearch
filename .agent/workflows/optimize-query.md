# Database Query Optimization

1. **Identify slow query** from logs or monitoring.
2. **Explain plan**: Use `EXPLAIN ANALYSE` for PG / `PROFILE` for Neo4j.
3. **Suggest**: Missing index, query rewrite, or denormalization.
4. **Validate**: Compare execution times before/after.
5. **Document**: Update `memory/decisions.md` with reasoning.