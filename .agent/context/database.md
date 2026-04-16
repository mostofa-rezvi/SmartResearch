# Database Schemas & Relationships

## PostgreSQL (Core)
- `users`: id, email, password_hash, trust_score
- `projects`: id, owner_id, title, created_at
- `posts`: id, author_id, content, project_id

## Neo4j (Graph)
- Nodes: `Researcher`, `Paper`, `Topic`, `Institution`
- Relationships:
  - `[:AUTHORED]`
  - `[:CITES]`
  - `[:HAS_TOPIC]`
  - `[:AFFILIATED_WITH]`

## Redis Keys
- `session:{sessionId}`
- `feed:{userId}`
- `rate:{ip}:{endpoint}`

## Elasticsearch Indices
- `papers` – title, abstract, authors, vector_embedding
- `projects` – name, description, tags