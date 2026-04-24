# Antigravity Chat Prompt
## "Run enhance-file on a selected skill or command"

---

### How to use

1. Open Antigravity chat
2. Select (or paste the path of) the skill or command file you want to upgrade
3. Send the prompt below — replace the bracketed part with your file path

---

### The Prompt

```
@enhance-file

Selected file: `.agent/[skills|commands]/YOUR-FILE-NAME.md`

Run the enhance-file command on the file above.

Context:
- Project: ResearchBridge — Smart Research Collaboration Platform
- Stack: Next.js 14 · Node/Express · Python FastAPI · PostgreSQL · Neo4j · 
  Elasticsearch · Redis · Kafka · Kubernetes · Cloudflare
- Goal: Rewrite this file so every time you use it, you produce complete,
  strictly typed, validated, error-safe, documented, deployable production code.
  No snippets. No placeholders. No `any` types. No silent catches.

Apply every rule in the enhance-file command:
1. Complete YAML front-matter
2. Sharp purpose block
3. Full project context injection
4. Exhaustive output specification
5. Hard constraints / never-do list
6. At least one before/after example
7. Step-by-step execution plan (if this is a command file)
8. Self-check checklist at the end

Return the full rewritten file, then a one-paragraph CHANGES summary.
```

---

### Batch variant — enhance multiple files at once

```
@enhance-file

I want to enhance the following files in sequence. 
Process each one fully before moving to the next.

Files:
1. `.agent/skills/FILE-ONE.md`
2. `.agent/skills/FILE-TWO.md`
3. `.agent/commands/FILE-THREE.md`

Project: ResearchBridge SRCP — full stack as defined in enhance-file command.

For each file:
- Apply all 8 enhancement rules from the enhance-file command
- Return the complete rewritten file
- End with: ENHANCED: <filename> + one-paragraph CHANGES summary
- Then move to the next file
```

---

### Skill-specific variant — when the file belongs to a specific layer

```
@enhance-file

Selected file: `.agent/skills/YOUR-SKILL-FILE.md`
Layer: [Backend | Frontend | ML/AI | Database | DevOps | Integration]

This skill is used when Antigravity writes [describe what this skill covers,
e.g., "Neo4j Cypher queries for graph traversal"].

Enhance it so that every time you use this skill you:
- Write complete, production-ready [TypeScript / Python / Cypher / YAML / etc.]
- Include strict types, Zod/Pydantic validation, and explicit error handling
- Follow ResearchBridge naming and folder conventions
- Never use placeholders — always output the full, deployable file

Apply all rules from the enhance-file command and return the full rewritten file.
```

---

### Command-specific variant — when the file is a command

```
@enhance-file

Selected file: `.agent/commands/YOUR-COMMAND-FILE.md`

This is a command file. Enhance it so it:
- Has a precise trigger condition (when exactly should this command run)
- Has a numbered step-by-step execution plan
- Defines the exact input variables it expects
- Defines the exact output format it must return
- Lists all hard constraints (what it must never do)
- Includes a before/after example of the output quality difference
- Ends with a self-check checklist

Stack context: ResearchBridge SRCP (Next.js · FastAPI · Postgres · Neo4j · 
Elasticsearch · Redis · Kafka · K8s).

Return the full rewritten command file + CHANGES summary.
```

---

### Quick one-liner (fastest way)

If you just want to quickly enhance one file without the full context block:

```
@enhance-file `.agent/skills/YOUR-FILE.md` — ResearchBridge SRCP stack. 
Full rewrite. Production grade. All 8 enhancement rules. Return complete file + CHANGES.
```

---

### What Antigravity will return

After running any of the above prompts, Antigravity returns:

1. **The complete rewritten `.md` file** — copy this back into your `.agent/` folder, replacing the original
2. **ENHANCED: `filename`** — confirmation line
3. **CHANGES: `paragraph`** — what was weak in the original and what was improved

> **Tip:** After receiving the enhanced file, send it straight back with:
> `Save this as .agent/skills/YOUR-FILE.md and use it from now on.`
> Antigravity will update its active context immediately.
