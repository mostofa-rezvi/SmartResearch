import { NextRequest, NextResponse } from "next/server";

/**
 * Search autocomplete — proxies to the backend hybrid discovery search
 * (ES kNN + keyword + RRF) at /api/v1/discovery/search. Replaces the previous
 * hardcoded mock. Requires the caller's Authorization header (forwarded to the
 * authenticated backend route). Degrades to an empty suggestion list on any
 * error rather than showing fabricated data.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const INDEX_TO_TYPE: Record<string, string> = {
  users: "Researcher",
  papers: "Paper",
  projects: "Project",
  posts: "Discussion",
};

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim();

  // Backend requires a query of at least 2 chars; short-circuit otherwise.
  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    // Not signed in — no suggestions rather than a mock.
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/v1/discovery/search?query=${encodeURIComponent(q)}`,
      {
        headers: { Authorization: authHeader },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const body = await res.json();
    const hits: any[] = body?.data || [];

    const suggestions = hits.slice(0, 6).map((hit) => ({
      title: hit.name || hit.title || String(hit.id),
      type: INDEX_TO_TYPE[hit._index] || "Result",
    }));

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
