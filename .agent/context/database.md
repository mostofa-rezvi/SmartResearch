# Database Schemas & Relationships

## PostgreSQL (Core)
- `users`: id, email, password_hash, role (Enum), researcher_type (Enum), onboarding_completed (Boolean), trust_score
- `user_profiles_standard`: user_id, bio, current_focus, cv_link
- `user_profiles_professional`: user_id, affiliation, department, rank, expertise, supervised_students_count, projects_summary, publications_text, editorial_roles, conferences
- `user_keywords`: user_id, keyword_id (References domain keywords)
- `user_onboarding_answers`: user_id, question_key, free_text_answer
- `invitations`: id, inviter_id (super_admin), email, token, expires_at, status
- `projects`: id, owner_id, title, created_at
- `questions`: id, author_id, group_id (optional), title, body, created_at, score
- `answers`: id, question_id, author_id, body, created_at, score, is_accepted
- `thoughts`: id, author_id, group_id (optional), content, created_at
- `groups`: id, creator_id, name, description, privacy (public/private)
- `group_members`: group_id, user_id, role (admin/member)
- `votes`: user_id, target_type (question/answer), target_id, value (+1/-1)
- `saved_papers`: user_id, paper_id (Elasticsearch ID), saved_at
- `author_follows`: user_id, author_id (Researcher ID), followed_at
- `journals`: id, name, issn, publisher_id, quality_tier (Enum: Q1, Q2, Q3), geography (Region/Country), description
- `journal_categories`: journal_id, category_id
- `categories`: id, parent_id (for hierarchy), name
- `publishers`: id, name, type (Enum: university, association, government, independent), location

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