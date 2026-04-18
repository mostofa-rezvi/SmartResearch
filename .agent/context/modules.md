# Backend Modules (Domain-Driven)

- **auth** (CH 1-2): Registration, OTP Gate, Session security.
- **identity** (CH 3, 8): Role-Based Access, Profiles (Standard vs. Professional), Researcher Hierarchy.
- **onboarding** (CH 4): The "First Conversation" logic, Keyword/Domain extraction.
- **community** (CH 5): The Living Room. Questions, Answers, Thoughts, Groups (Public/Private), Voting.
- **library** (CH 6): The Journal Directory. Q1-Q3 tiers, Category taxonomy, Geographic filtering.
- **discovery** (CH 7): The Engine. Elasticsearch + Vector Search, Personalized ranking, ML Paper matching.
- **notifications**: Email + In-app events via Kafka/Socket.IO.
- **gateway**: Global rate-limiting, security headers, request logging.