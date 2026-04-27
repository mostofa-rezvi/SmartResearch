# CONTEXT — Phase 08: Graph Intelligence & Trust

## Phase Objective
Implement advanced graph algorithms and relationships in Neo4j to quantify academic trust and discover high-potential collaborators.

## Locked Decisions

### 1. PageRank Configuration
- **Algorithm**: `gds.pageRank`
- **Edges**: `SUPPORTS`, `CITES`, `ENDORSES`
- **Schedule**: Run as a daily batch job via the Backend's worker system.
- **Output**: Update the `impactScore` property on `Researcher` nodes.

### 2. Trust Semantics
- **Endorsement**: A direct link between two researchers. Weight: 2.0.
- **Citations**: Automatically derived from paper citations. Weight: 1.0.
- **Badges**: 
    - `verified_institutional`: Given to researchers with an `AFFILIATED_WITH` relationship to a verified `Institution`.
    - `top_contributor`: Given to researchers in the top 5% of PageRank scores.

### 3. Collaborator Discovery (2nd-Degree)
- Discovery query should return researchers who are co-authors of my co-authors but have not yet collaborated with me.
- **Priority**: Rank by shared co-authors and Jaccard similarity of research domains.

## Integration Pattern
- **Graph Updates**: Node.js `graphSync` worker will handle writing `ENDORSES` and `CITES` edges.
- **Impact Scoring**: Python ML Service will trigger the GDS PageRank execution via a Cypher call.
- **Discovery**: Expose as a new endpoint `GET /api/v1/discovery/suggested-collaborators`.
