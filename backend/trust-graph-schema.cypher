// ============================================================================
// ResearchBridge Trust-Graph (Neo4j) Schema & Initialization Script
// Purpose: Models the academic TrustRank relationship network.
// ============================================================================

// ----------------------------------------------------------------------------
// 1. NODE CONSTRAINTS & INDEXING (Ensures Unique Nodes & Traversal Performance)
// ----------------------------------------------------------------------------

// (:Researcher)
CREATE CONSTRAINT researcher_id IF NOT EXISTS FOR (r:Researcher) REQUIRE r.userId IS UNIQUE;
CREATE INDEX researcher_role IF NOT EXISTS FOR (r:Researcher) ON (r.role);
CREATE INDEX researcher_impact IF NOT EXISTS FOR (r:Researcher) ON (r.impactScore);

// (:Paper)
CREATE CONSTRAINT paper_doi IF NOT EXISTS FOR (p:Paper) REQUIRE p.doi IS UNIQUE;
CREATE INDEX paper_year IF NOT EXISTS FOR (p:Paper) ON (p.publicationYear);

// (:Institution)
CREATE CONSTRAINT institution_name IF NOT EXISTS FOR (i:Institution) REQUIRE i.name IS UNIQUE;

// (:Question) & (:Thought) - Tied to the Community Living Room
CREATE CONSTRAINT question_id IF NOT EXISTS FOR (q:Question) REQUIRE q.postId IS UNIQUE;
CREATE CONSTRAINT thought_id IF NOT EXISTS FOR (t:Thought) REQUIRE t.postId IS UNIQUE;


// ----------------------------------------------------------------------------
// 2. RELATIONSHIP DEFINITIONS (Graph Semantics & Rules)
// ----------------------------------------------------------------------------

/**
 * [ :MENTORS ]
 * A Senior or Verified Scholar explicitly supervising standard/student researchers.
 * Influences TrustRank significantly bridging credibility.
 */
// Example Graph traversal definition:
// (r1:Researcher {role: 'invited_user'})-[:MENTORS {startYear: 2024}]->(r2:Researcher {role: 'user'})

/**
 * [ :SUPPORTS ]
 * Generated from Community Living Room engagement.
 * Emitted when r1 upvotes a Thought/Question or accepts an answer from r2.
 * Stores weight based on interaction strength.
 */
// Example: (r1:Researcher)-[:SUPPORTS {weight: 1.5, interaction_type: 'upvote'}]->(t:Thought)-[:AUTHORED_BY]->(r2:Researcher)

/**
 * [ :AUTHORED ]
 * Connects researcher nodes to their verified external output.
 */
// Example: (r:Researcher)-[:AUTHORED {role: 'first_author'}]->(p:Paper)

/**
 * [ :AFFILIATED_WITH ]
 * Institutional bindings. Connects back to the verified journals network geography.
 */
// Example: (r:Researcher)-[:AFFILIATED_WITH {department: 'Computer Science'}]->(i:Institution)


// ----------------------------------------------------------------------------
// 3. EXAMPLE GRAPH INITIALIZATION (For Local Testing / Traversal Optimization)
// ----------------------------------------------------------------------------

/*
// Seed Script Example:
MERGE (mit:Institution {name: 'MIT', geography: 'Global'})

MERGE (drSmith:Researcher {userId: 101, name: 'Dr. Smith', role: 'invited_user', impactScore: 85})
MERGE (jane:Researcher {userId: 202, name: 'Jane Doe', role: 'user', impactScore: 12})

MERGE (paper1:Paper {doi: '10.1000/xyz123', title: 'Neo4j in Academia', publicationYear: 2025})

// Construct Trust Paths
MERGE (drSmith)-[:AFFILIATED_WITH {department: 'AI'}]->(mit)
MERGE (drSmith)-[:AUTHORED {role: 'first'}]->(paper1)
MERGE (drSmith)-[:MENTORS {startYear: 2025}]->(jane)

// Jane supports Dr. Smith via Platform Activity
MERGE (jane)-[:SUPPORTS {weight: 1.0, type: 'answer_accept'}]->(drSmith)
*/
