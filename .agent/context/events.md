# Kafka Topics & Events

| Topic                       | Producer      | Consumer(s)          |
|-----------------------------|---------------|----------------------|
| `user.registered`           | auth          | notifications, ml    |
| `project.created`           | projects      | search, feed         |
| `post.published`            | posts         | feed, analytics      |
| `ml.trust_score.updated`    | ml (FastAPI)  | users, neo4j         |