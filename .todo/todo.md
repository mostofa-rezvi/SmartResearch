## How It Actually Works
# Neither folder auto-executes. Here's the real flow:

> .agent/skills/ → 📖 Reference Only (You Never Open These During Work)
- These files exist so you understand what each /gsd-* command does. Antigravity already has all GSD skills built-in. You don't need to give it these files.

> .agent/commands/ → 📋 Your Playbook (You Read → You Type)

These are your step-by-step instructions. The workflow is:

```
1. YOU open CMD-001-init-project.md
2. YOU read the "Context to Provide" section
3. YOU type in Antigravity chat:

   /gsd-new-project
   
   ResearchBridge — Smart Research Collaboration Platform...
   [paste the context block from the file]

4. Antigravity executes the GSD skill
5. YOU move to CMD-002
```

## The Answer
# You don't give files to Antigravity. You read them yourself and type the command.

> .agent/skills/ = Reference dictionary. You never open these during work. They're for understanding what each skill does.

> .agent/commands/ = Your checklist. You open the CMD file, read the context block, then type the /gsd-* command into chat with that context.

# Example with CMD-001
- You open CMD-001-init-project.md, see the "Context to Provide" section, then in Antigravity chat you type:

```
/gsd-new-project

ResearchBridge — Smart Research Collaboration Platform (SRCP).
Mono-repo: Next.js frontend, Node/Express API, Python FastAPI ML service.
Databases: PostgreSQL, Redis (Streams + Pub/Sub), Neo4j, Elasticsearch.
Target: 3-week production build.
```
Antigravity reads the /gsd-new-project skill (which is built into its system — not from your files) and executes it with your context.