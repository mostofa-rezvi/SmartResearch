"""
SmartResearch GraphQL v2 API
Built with Strawberry (Python) — mounted inside the FastAPI ML service.

Schema covers:
  - Researcher profile lookup
  - Paper search with filters
  - Recommendation feed
"""

import os
import asyncio
import logging
from typing import Optional, List
import strawberry
from strawberry.fastapi import GraphQLRouter
import psycopg2
import psycopg2.extras

logger = logging.getLogger(__name__)

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/researchbridge")


def get_db():
    return psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)


# ─────────────────────────────────────────────────────────────────────────────
# GraphQL Types
# ─────────────────────────────────────────────────────────────────────────────

@strawberry.type
class ResearcherType:
    id: int
    name: str
    email: Optional[str] = None
    institution: Optional[str] = None
    research_interests: Optional[List[str]] = None
    bio: Optional[str] = None
    cited_by_count: Optional[int] = None
    works_count: Optional[int] = None
    h_index: Optional[int] = None


@strawberry.type
class PaperType:
    id: int
    title: str
    abstract: Optional[str] = None
    doi: Optional[str] = None
    publication_year: Optional[int] = None
    citation_count: Optional[int] = None
    open_access: Optional[bool] = None
    journal_name: Optional[str] = None


@strawberry.type
class RecommendationResult:
    researcher: ResearcherType
    score: float


@strawberry.type
class PaginatedResearchers:
    items: List[ResearcherType]
    total: int
    page: int
    page_size: int


@strawberry.type
class PaginatedPapers:
    items: List[PaperType]
    total: int
    page: int
    page_size: int


# ─────────────────────────────────────────────────────────────────────────────
# Resolvers
# ─────────────────────────────────────────────────────────────────────────────

def _fetch_researcher(user_id: int) -> Optional[ResearcherType]:
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT u.id, u.name, u.email, rp.institution, rp.research_interests,
                   rp.bio, rp.cited_by_count, rp.works_count, rp.h_index
            FROM users u
            LEFT JOIN researcher_profiles rp ON u.id = rp.user_id
            WHERE u.id = %s
        """, (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return None
        return ResearcherType(
            id=row["id"],
            name=row["name"],
            email=row["email"],
            institution=row.get("institution"),
            research_interests=row.get("research_interests") or [],
            bio=row.get("bio"),
            cited_by_count=row.get("cited_by_count"),
            works_count=row.get("works_count"),
            h_index=row.get("h_index"),
        )
    except Exception as e:
        logger.error(f"[GraphQL] _fetch_researcher error: {e}")
        return None


def _search_researchers(query: str, page: int, page_size: int) -> PaginatedResearchers:
    try:
        conn = get_db()
        cur = conn.cursor()
        offset = (page - 1) * page_size
        like = f"%{query}%"
        cur.execute("""
            SELECT COUNT(*) OVER() AS total,
                   u.id, u.name, u.email, rp.institution,
                   rp.research_interests, rp.bio, rp.cited_by_count, rp.works_count, rp.h_index
            FROM users u
            LEFT JOIN researcher_profiles rp ON u.id = rp.user_id
            WHERE u.name ILIKE %s OR rp.institution ILIKE %s
               OR EXISTS (SELECT 1 FROM unnest(rp.research_interests) AS ri WHERE ri ILIKE %s)
            ORDER BY rp.cited_by_count DESC NULLS LAST
            LIMIT %s OFFSET %s
        """, (like, like, like, page_size, offset))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        total = rows[0]["total"] if rows else 0
        items = [
            ResearcherType(
                id=r["id"], name=r["name"], email=r["email"],
                institution=r.get("institution"),
                research_interests=r.get("research_interests") or [],
                bio=r.get("bio"), cited_by_count=r.get("cited_by_count"),
                works_count=r.get("works_count"), h_index=r.get("h_index"),
            )
            for r in rows
        ]
        return PaginatedResearchers(items=items, total=total, page=page, page_size=page_size)
    except Exception as e:
        logger.error(f"[GraphQL] _search_researchers error: {e}")
        return PaginatedResearchers(items=[], total=0, page=page, page_size=page_size)


def _search_papers(query: str, year_from: Optional[int], year_to: Optional[int],
                   open_access_only: bool, page: int, page_size: int) -> PaginatedPapers:
    try:
        conn = get_db()
        cur = conn.cursor()
        offset = (page - 1) * page_size
        like = f"%{query}%"
        conditions = ["(j.name ILIKE %s OR j.description ILIKE %s)"]
        params: list = [like, like]
        if year_from:
            conditions.append("j.publication_year >= %s")
            params.append(year_from)
        if year_to:
            conditions.append("j.publication_year <= %s")
            params.append(year_to)
        if open_access_only:
            conditions.append("j.open_access = TRUE")
        where = " AND ".join(conditions)
        cur.execute(f"""
            SELECT COUNT(*) OVER() AS total,
                   j.id, j.name AS title, j.description AS abstract,
                   j.doi, j.publication_year, j.citation_count, j.open_access,
                   j.name AS journal_name
            FROM journals j
            WHERE {where}
            ORDER BY j.citation_count DESC NULLS LAST
            LIMIT %s OFFSET %s
        """, params + [page_size, offset])
        rows = cur.fetchall()
        cur.close()
        conn.close()
        total = rows[0]["total"] if rows else 0
        items = [
            PaperType(
                id=r["id"], title=r["title"], abstract=r.get("abstract"),
                doi=r.get("doi"), publication_year=r.get("publication_year"),
                citation_count=r.get("citation_count"), open_access=r.get("open_access"),
                journal_name=r.get("journal_name"),
            )
            for r in rows
        ]
        return PaginatedPapers(items=items, total=total, page=page, page_size=page_size)
    except Exception as e:
        logger.error(f"[GraphQL] _search_papers error: {e}")
        return PaginatedPapers(items=[], total=0, page=page, page_size=page_size)


# ─────────────────────────────────────────────────────────────────────────────
# Schema
# ─────────────────────────────────────────────────────────────────────────────

@strawberry.type
class Query:
    @strawberry.field(description="Look up a researcher by their user ID")
    async def researcher(self, id: int) -> Optional[ResearcherType]:
        return await asyncio.to_thread(_fetch_researcher, id)

    @strawberry.field(description="Full-text search across researcher profiles")
    async def search_researchers(
        self,
        query: str,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedResearchers:
        page_size = min(page_size, 50)
        return await asyncio.to_thread(_search_researchers, query, page, page_size)

    @strawberry.field(description="Search the journal/paper catalog with filters")
    async def search_papers(
        self,
        query: str,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
        open_access_only: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedPapers:
        page_size = min(page_size, 50)
        return await asyncio.to_thread(
            _search_papers, query, year_from, year_to, open_access_only, page, page_size
        )


schema = strawberry.Schema(query=Query)

# Mount this router in main.py:  app.include_router(graphql_router, prefix="/graphql")
graphql_router = GraphQLRouter(schema, graphiql=True)
