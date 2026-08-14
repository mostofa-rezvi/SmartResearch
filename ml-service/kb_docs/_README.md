# kb_docs — drop-in knowledge base for the AI Research Assistant

Every `.md` or `.txt` file in this folder becomes a document the AI Research
Assistant can retrieve and cite, alongside the curated docs in
`../knowledge_base.py` and the indexed papers/researchers. Use it to give the
assistant dependable, grounded knowledge on topics your corpus is thin on.

## How to add knowledge

1. Create a file here, e.g. `my-topic.md`. **One self-contained topic per file.**
2. (Optional) Add frontmatter at the top to set metadata:

   ```
   ---
   title: Low-resource NLP
   type: concept        # concept = research knowledge, guide = platform how-to
   category: nlp
   ---
   Body text goes here — a few factual, self-contained paragraphs on the topic.
   ```

   Without frontmatter, the title is taken from the first `# heading` (or the
   filename) and the type defaults to `concept`.
3. Restart the ML service so it reloads the folder:
   `docker restart rb-ml` (or restart your local `uvicorn`).
4. Ask the assistant — your file now shows up under **Sources** when relevant.

## Conventions

- Files starting with `_` or `.` (like this README) are **ignored** — they are
  notes, not knowledge.
- Keep each file focused: "what it is + why it matters + how it's used" reads and
  embeds best. Retrieval thresholds keep irrelevant docs out of answers.
- The folder is bind-mounted into the container (`./ml-service:/app`), so no image
  rebuild is needed — add a file, restart the service, done.

Override the folder location with the `KB_DOCS_DIR` environment variable.
