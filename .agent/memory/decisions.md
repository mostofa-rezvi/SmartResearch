# Architectural Decisions (ADR)

## ADR 001: Deliberate Authentication Friction
- **Status**: Accepted
- **Context**: Chapter 1 (Redirect to Login after Verify) and Chapter 2 (Mandatory OTP).
- **Decision**: We will not implement auto-login after email verification or credential entry.
- **Rationale**: To establish a "Credentialed Environment" habit. Users must feel that ResearchBridge is a secure repository for their identity and intellectual property.

## ADR 002: Mandatory Discovery Conversation (Onboarding)
- **Status**: Accepted
- **Context**: Chapter 4 Discovery.
- **Decision**: Prevent all platform access (except Auth) until a user profile and research keywords are established.
- **Rationale**: Solves the cold-start problem and ensures the platform is immediately useful.

## ADR 003: Multi-modal Search Strategy
- **Status**: Accepted
- **Context**: Chapter 7 Discovery Engine.
- **Decision**: Combine Elasticsearch (text/meta) with Python ML models (semantic/vector) and Neo4j (relationship boosting).
- **Rationale**: Provides superior relevance compared to generic Google Scholar indexing.