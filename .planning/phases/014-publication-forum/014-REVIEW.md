---
status: issues_found
phase: 14
phase_name: Publication Forum
depth: standard
files_reviewed: 14
findings:
  critical: 3
  warning: 6
  info: 4
  total: 13
reviewed_at: 2026-04-27T11:41:00+06:00
---

# Code Review — Phase 14: Publication Forum

## Summary

Reviewed 14 source files across 4 layers (services, API routes, components, pages). Found **3 critical**, **6 warning**, and **4 info** issues. The most impactful findings are security gaps in the forum POST endpoint (no auth, no input validation, no rate limiting) and the use of `Math.random()` for ID generation which is predictable and collision-prone.

---

## Critical Findings

### CR-01: Forum POST endpoint accepts arbitrary data with zero validation
**File:** `frontend/src/app/api/forum/route.ts:9-13`
**Category:** Security — Injection / Mass Assignment

```typescript
export async function POST(request: Request) {
  const data = await request.json();
  const thread = await ForumService.createThread(data);
  return NextResponse.json(thread);
}
```

The `data` object is passed directly to `createThread()` which accepts `Partial<Thread>`. An attacker can:
- Set `authorTrustRank: 100` to bypass spam filtering entirely
- Set `isSpam: false` to override the spam evaluation
- Set `upvotes: 999999` to manipulate feed ranking
- Inject arbitrary `authorId` to impersonate users

**Fix:** Destructure and whitelist only allowed fields (`title`, `content`). Derive `authorId` and `authorTrustRank` from the authenticated session.

---

### CR-02: No authentication on any API route
**Files:** `frontend/src/app/api/forum/route.ts`, `checklist/route.ts`, `journals/route.ts`
**Category:** Security — Authentication Bypass

All three API routes are publicly accessible with no session or token validation. The forum POST endpoint allows unauthenticated thread creation. The checklist endpoint hardcodes `'mock-user'`.

**Fix:** Add auth middleware (NextAuth `getServerSession` or equivalent) to all routes. Return 401 for unauthenticated requests.

---

### CR-03: `Math.random()` used for ID generation — predictable and collision-prone
**File:** `frontend/src/services/forum-service.ts:39, 58`
**Category:** Security — Weak Random

```typescript
id: Math.random().toString(36).substr(2, 9),
```

`Math.random()` is not cryptographically secure. The 9-character base-36 ID has ~46 bits of entropy with a predictable PRNG, making ID enumeration and collision feasible at scale.

**Fix:** Use `crypto.randomUUID()` (available in Node 19+ and modern browsers) or `nanoid()` from the `nanoid` package.

---

## Warning Findings

### WR-01: In-memory static state in ForumService — data loss on every deploy
**File:** `frontend/src/services/forum-service.ts:23`
**Category:** Architecture — Data Persistence

```typescript
private static threads: Thread[] = [];
```

All forum data lives in a static class variable. In a serverless Next.js environment (Vercel), each function invocation may run in a separate process — data is not shared and is wiped on cold starts. Even on a long-running server, redeployments clear everything.

**Fix:** Replace with database persistence (PostgreSQL via Prisma, per the project's existing backend stack).

---

### WR-02: Spam filter is trivially bypassable
**File:** `frontend/src/services/trustrank-moderation.ts:1-12`
**Category:** Security — Insufficient Validation

The spam filter requires BOTH low TrustRank AND suspicious keywords. A spammer with TrustRank ≥ 10 passes all checks unconditionally. The keyword list (`'buy now'`, `'cheap'`) is trivially evadable with Unicode lookalikes, zero-width characters, or different phrasing.

**Fix:** Add content-only heuristics that apply regardless of TrustRank (e.g., excessive caps ratio, repeated text, known spam URL domains). Consider a scoring model instead of a binary AND gate.

---

### WR-03: Forum `upvote()` has no duplicate vote protection
**File:** `frontend/src/services/forum-service.ts:68-71`
**Category:** Logic — Data Integrity

```typescript
static async upvote(threadId: string) {
  const thread = this.threads.find(t => t.id === threadId);
  if (thread) thread.upvotes++;
}
```

No tracking of which user voted. A single user can call this endpoint in a loop to inflate any thread to the top of the TrustRank-weighted feed.

**Fix:** Track voter IDs in a `Set` per thread. Reject duplicate votes.

---

### WR-04: No error handling on frontend `fetch()` calls
**Files:** `frontend/src/app/(dashboard)/forum/page.tsx:10-15`, `publication/page.tsx:12-17`
**Category:** Reliability — Error Handling

Both pages call `fetch()` without `.catch()` or `try/catch`. A network error or 500 response will leave the loading spinner spinning forever. The `res.json()` call will throw on non-JSON error responses.

**Fix:** Add try/catch with error state, and check `res.ok` before parsing JSON.

---

### WR-05: Inconsistent return type from `evaluateSpam` — missing `reason` on clean results
**File:** `frontend/src/services/trustrank-moderation.ts:11`
**Category:** Type Safety

```typescript
return { isSpam: false };  // No `reason` field
```

vs.

```typescript
return { isSpam: true, reason: 'Low TrustRank and suspicious content' };
```

The return type is implicitly `{ isSpam: boolean; reason?: string }` which forces null checks downstream. This will cause issues when logging or displaying moderation reasons.

**Fix:** Define an explicit return type and always include `reason` (even if `null` or empty string for clean content).

---

### WR-06: Publication page has two `<h1>` elements — SEO violation
**File:** `frontend/src/app/(dashboard)/publication/page.tsx:29, 38`
**Category:** SEO / Accessibility

```html
<h1>Journal Recommender</h1>
...
<h1>Publication Assistant</h1>
```

Two `<h1>` tags on a single page hurts SEO ranking and screen reader navigation. 

**Fix:** Use a single `<h1>` for the page title. Demote section headings to `<h2>`.

---

## Info Findings

### IR-01: All component props typed as `any` — no type safety
**Files:** `ForumThread.tsx:5`, `JournalRecommender.tsx:3`, `PublicationChecklist.tsx:3`
**Category:** Type Safety

```typescript
export const ForumThread = ({ thread }: { thread: any }) => {
```

Proper interfaces exist in `forum-service.ts` (`Thread`, `Reply`) but are not used in component props. This defeats TypeScript's purpose.

**Fix:** Import and use the `Thread` interface for `ForumThread` props. Create and export similar interfaces for journal and checklist data.

---

### IR-02: Hardcoded timestamp "2h ago" in ForumThread
**File:** `frontend/src/components/forum/ForumThread.tsx:16`
**Category:** UX — Hardcoded Data

```tsx
<span className="text-sm text-gray-500">• 2h ago</span>
```

Every thread displays "2h ago" regardless of actual creation time. The `Thread` interface doesn't include a `createdAt` field.

**Fix:** Add `createdAt: Date` to the `Thread` interface and compute relative time (e.g., using `date-fns/formatDistanceToNow`).

---

### IR-03: Journal recommender returns mock data — no actual API integration
**File:** `frontend/src/services/journal-recommender.ts:1-8`
**Category:** Completeness — Stub Implementation

The service returns hardcoded arrays with string-concatenated journal names. There is no HTTP call to DOAJ or Scimago APIs.

**Fix:** Implement actual `fetch()` calls to the DOAJ search API (`https://doaj.org/api/search/journals/`) and normalize the response. Gate behind an environment variable for development fallback.

---

### IR-04: Template download URLs point to non-existent files
**File:** `frontend/src/services/publication-checklist.ts:4-6`
**Category:** Completeness — Missing Assets

```typescript
{ id: 'ieee-conf', name: 'IEEE Conference Template', url: '/templates/ieee.docx' },
```

No `/templates/` directory or `.docx`/`.tex` files exist in the `public/` folder. Clicking "Download" will 404.

**Fix:** Add actual template files to `frontend/public/templates/` or link to canonical external URLs.

---

## Files Reviewed

| # | File | Issues |
|---|------|--------|
| 1 | `services/journal-recommender.ts` | IR-03 |
| 2 | `services/publication-checklist.ts` | IR-04 |
| 3 | `services/trustrank-moderation.ts` | WR-02, WR-05 |
| 4 | `services/forum-service.ts` | CR-03, WR-01, WR-03 |
| 5 | `app/api/journals/route.ts` | CR-02 |
| 6 | `app/api/checklist/route.ts` | CR-02 |
| 7 | `app/api/forum/route.ts` | CR-01, CR-02 |
| 8 | `components/forum/TrustRankBadge.tsx` | Clean |
| 9 | `components/forum/SpamAlert.tsx` | Clean |
| 10 | `components/forum/ForumThread.tsx` | IR-01, IR-02 |
| 11 | `components/journal/JournalRecommender.tsx` | IR-01 |
| 12 | `components/publication/PublicationChecklist.tsx` | IR-01 |
| 13 | `app/(dashboard)/forum/page.tsx` | WR-04 |
| 14 | `app/(dashboard)/publication/page.tsx` | WR-04, WR-06 |
