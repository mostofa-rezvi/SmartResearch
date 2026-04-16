.agent/
├── core/                 # Immutable project DNA
├── context/              # Live system awareness
├── roles/                # Specialised AI personas
├── workflows/            # Step-by-step execution plans
├── prompts/              # Reusable task templates
├── memory/               # Persistent decisions & history
├── tasks/                # One-off or recurring jobs
├── tools/                # Helper scripts
└── output/               # Generated artifacts (gitignored)

.agent/
├── core/
│   ├── architecture.md
│   └── stack.md
├── context/
│   └── database.md
├── roles/
│   ├── backend.md
│   └── frontend.md
├── workflows/
│   └── create-feature.md
├── memory/
│   ├── decisions.md
│   └── roadmap.md




1. Before Starting a New Feature
Ask agent:
"Read workflows/create-feature.md and outline the steps to add [feature name]."

2. While Coding
Ask for code generation:
"Using prompts/generate-api.md, create the endpoint for [feature]."

3. Debugging
Provide error and ask:
"Use workflows/debug-bug.md to diagnose this 500 error."

4. Deployment
Use:
"Follow workflows/deploy-release.md and generate a checklist."

5. Updating Context
After any schema change, manually update context/database.md or run tools/db-map.py.

After an architectural decision, append to memory/decisions.md.