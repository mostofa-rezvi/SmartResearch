**Role**: `roles/frontend.md` + `roles/backend.md`
**Context**: `context/database.md`

**Task**: Build Chapter 6: The Library (Journal Directory)

**Description**:
ResearchBridge provides a carefully organized directory of academic journals. The landscape must be deeply searchable and navigable like a well-organized library rather than an undifferentiated database.

**Requirements**:
1. **Directory Architecture & Filtering**:
   - Implement filtering anchored around Quality Tiers: **Q1, Q2, and Q3**.
   - Implement filtering by **Geography** (country or region associated with publisher/audience).
   - Implement filtering by **Institutional Grouping** (university consortiums, professional associations, government bodies, independent).
2. **Deep Taxonomy**:
   - Build a robust Category and Subcategory system. Users must be able to drill down (e.g., Life Sciences -> Molecular Biology).
3. **User Interface (The Library)**:
   - A dedicated "Library" or "Journal Directory" page.
   - Elegant hierarchical navigation (sidebar or collapsible tree) across the dimensions listed above.
4. **Data Models**:
   - `journals`, with properties/relations mapping to quality tiers, geographic regions, institutional types, and deep category trees.
