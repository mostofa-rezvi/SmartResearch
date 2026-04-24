---
name: enhance-file
description: >
  Enhances a selected .agent/skills or .agent/commands file into a
  top-notch, production-grade markdown file. Rewrites instructions,
  adds structured context, expands edge-case handling, and ensures
  the file generates the best possible code output from the agent.
version: 1.0.0
author: Mostofa Aminur Rashid
project: ResearchBridge · SRCP
tags: [meta, enhancement, skills, commands, quality]
---

# enhance-file

## Purpose

Take the **currently selected** `.agent/skills/*.md` or `.agent/commands/*.md` file
and rewrite it to production-grade quality. The enhanced file must make
Antigravity generate consistently excellent, fully typed, well-structured,
production-ready code — no shortcuts, no placeholders, no generic output.

---

## Trigger

Run this command when:
- A skill or command file feels vague, shallow, or produces mediocre output
- You add a new feature domain and want a purpose-built file for it
- You want to standardise all files to the same quality baseline
- Output from Antigravity on a task is inconsistent or incomplete

---

## Input

```
$SELECTED_FILE  — the full path of the skill or command file to enhance
$FILE_CONTENT   — the current raw content of that file
$PROJECT_CONTEXT — ResearchBridge SRCP: Next.js · Node/Express · Python FastAPI ·
                   PostgreSQL · Neo4j · Elasticsearch · Redis · Kafka · Kubernetes
```

---

## Enhancement Rules (apply all, no exceptions)

### 1. Front-matter — always complete
Every file must have valid YAML front-matter:
```yaml
---
name:         # kebab-case identifier
description:  # one precise sentence — what this file makes the agent DO
version:      # semver
tags:         # array of relevant layer tags
scope:        # skill | command
applies_to:   # which layers / files / domains this covers
---
```

### 2. Purpose block — sharp and specific
- One paragraph, ≤ 4 sentences
- State the exact output this file produces
- Name the tech stack it targets
- State what "bad output" looks like so the agent knows what to avoid

### 3. Context injection
Explicitly give the agent what it needs to know **without the user repeating it**:
- Project stack (versions where relevant)
- Folder structure conventions
- Naming conventions (camelCase functions, PascalCase components, snake_case DB columns)
- Import style (absolute paths via `@/`, no relative `../../`)
- Error handling pattern used in this project (Result type / try-catch / Zod parse)

### 4. Output specification — exhaustive
Define every property of the expected output:
```
FORMAT:       TypeScript / Python / SQL / YAML / etc.
STYLE:        function style, class style, or module pattern
LENGTH:       full file, not a snippet
COMMENTS:     JSDoc on all exports; inline only for non-obvious logic
TYPES:        strict types everywhere, no `any`, no implicit returns
TESTS:        unit test stubs included unless command says otherwise
ERROR HANDLING: explicit, never silent catch blocks
IMPORTS:      all imports at top, grouped (external → internal → types)
```

### 5. Constraints block — what the agent must NEVER do
List hard prohibitions relevant to this file's domain. Examples:
- Never use `any` type in TypeScript
- Never write a route handler without input validation (Zod schema required)
- Never create a DB query without parameterised inputs
- Never skip error handling on async operations
- Never use `console.log` in production code (use the project logger)
- Never hardcode secrets, URLs, or environment values

### 6. Examples — at least one before / after
Show a **before** (mediocre output) and an **after** (what this file should produce).
This is the single most powerful signal for the agent.

```ts
// ❌ BEFORE — what mediocre output looks like
async function getUser(id) {
  const user = await db.query(`SELECT * FROM users WHERE id = ${id}`)
  return user
}

// ✅ AFTER — what this command must produce
import { db } from '@/lib/db'
import { UserSchema, type User } from '@/types/user'
import { AppError } from '@/lib/errors'

/**
 * Retrieves a single user by primary key.
 * @throws {AppError} 404 if user not found
 */
export async function getUserById(id: string): Promise<User> {
  const row = await db.query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [id]
  )
  if (!row) throw new AppError('User not found', 404)
  return UserSchema.parse(row)
}
```

### 7. Step-by-step execution plan (commands only)
For `.agent/commands/` files, add an explicit numbered plan:
```
1. Read $SELECTED_FILE and understand its current intent
2. Identify the layer (frontend / backend / ML / database / DevOps)
3. Apply all enhancement rules above
4. Output the full rewritten file — never a diff, always the complete file
5. After the file, output a one-paragraph summary of what changed and why
```

### 8. Quality checklist (append to every enhanced file)
Every enhanced file must end with this section so Antigravity self-checks:
```markdown
## Self-check before output
- [ ] Front-matter is complete and accurate
- [ ] Purpose is specific to this domain, not generic
- [ ] Output spec covers format, style, types, errors, imports
- [ ] At least one before/after example is included
- [ ] Constraints list all hard prohibitions
- [ ] No placeholder text remains (no "TODO", "add logic here", "…")
- [ ] File produces deterministically excellent output on every run
```

---

## What the enhanced file must guarantee

When Antigravity uses the enhanced file on any task in its domain, the output must be:

| Property | Requirement |
|----------|-------------|
| **Complete** | Full file, not a snippet. All imports, exports, types present. |
| **Typed** | Strict TypeScript / typed Python. Zero `any`. |
| **Validated** | All external input validated (Zod / Pydantic). |
| **Error-safe** | Every async operation has explicit error handling. |
| **Tested** | Unit test stubs co-located or in `__tests__/`. |
| **Documented** | JSDoc / docstrings on all public exports. |
| **Consistent** | Follows project naming, import, and folder conventions. |
| **Deployable** | Code runs in production without modification. |

---

## Output format for this command

Return the **complete rewritten file** using this wrapper:

````markdown
---
[complete front-matter]
---

[all sections as defined above]

## Self-check before output
[checklist]
````

Then on a new line, output:

```
ENHANCED: <original filename>
CHANGES:  <one paragraph — what was weak, what was added, why it now produces better output>
```

---

## Project stack quick-reference (always available to this command)

```
Frontend      Next.js 14 (App Router) · React 18 · Tailwind CSS · shadcn/ui
Real-time     Socket.IO · Yjs (CRDT) · Tiptap
API           Node.js 20 · Express 5 · Zod validation · JWT + OAuth 2.0
ML Service    Python 3.11 · FastAPI · sentence-transformers · Pydantic v2
Primary DB    PostgreSQL 16 · Prisma ORM
Graph DB      Neo4j 5 · neo4j-driver
Search        Elasticsearch 8 · kNN dense_vector
Cache         Redis 7 · ioredis
Queue         Apache Kafka · kafkajs
Infra         Docker · Kubernetes · Helm · GitHub Actions
CDN/Security  Cloudflare · WAF · DDoS protection
Monitoring    Prometheus · Grafana · Loki
Testing       Vitest · Playwright · pytest · k6
```
