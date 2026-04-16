# Bug Investigation Workflow

1. **Reproduce**: Ask for steps, logs, or error screenshot.
2. **Locate**: Identify affected module via routes and stack trace.
3. **Analyse**:
   - Check service logic.
   - Validate database state.
   - Review recent changes in `memory/decisions.md`.
4. **Fix**: Propose patch with explanation.
5. **Test**: Ensure fix passes existing tests and add regression test.