# Kafka Topics & Events

| Topic                       | Producer      | Consumer(s)          |
|-----------------------------|---------------|----------------------|
| `user.registered`           | auth          | notifications, ml, onboarding |
| `question.posted`           | community     | feed, ml, search              |
| `answer.accepted`           | community     | users, trust_score            |
| `thought.shared`            | community     | feed, analytics               |
| `ml.trust_score.updated`    | ml (FastAPI)  | users, neo4j, feed            |