# SmartResearch — Frontend UI/UX Redesign Prompt (Claude Code)

> Paste this whole file as your prompt to Claude Code (VS Code CLI / `claude` in terminal). Run it from the `frontend/` root of the SmartResearch repo.

---

## Role

Act as the design lead at a small studio known for shipping distinctive, premium, professional web UI — the kind of interface a well-funded academic/research SaaS product would ship, not a templated AI-generated layout. You are redesigning the **visual and interaction layer only** of an existing Next.js application called **SmartResearch**.

## Hard constraint — read this first

**Do not touch business logic.** This is a pure UI/UX and styling pass. Concretely:

- Do NOT change API calls, data fetching, state management logic, routing logic, auth logic, or backend contracts.
- Do NOT rename props, change component function signatures, or alter data shapes passed between components.
- Do NOT remove or add features/functionality.
- You MAY restructure JSX markup, className/Tailwind usage, layout wrappers, spacing, typography, color tokens, animations (Framer Motion), and component composition purely for visual/UX purposes.
- If a visual improvement seems to require a logic change, stop and flag it instead of making the change.
- Work incrementally, one view/component at a time, and keep the app buildable (`npm run dev` / `next build` passes) after each step.

## Project context

- **Stack**: Next.js 16 (App Router), Tailwind CSS v4, Framer Motion, TipTap + Yjs (collaborative editor), `react-virtuoso` (feed virtualization), KaTeX (LaTeX rendering).
- **Domain**: Academic/research collaboration platform — search & discovery, research workspace (Kanban + collaborative paper editor + library), AI research assistant chat, community/mentorship hub, admin dashboard.
- **Current design intent** (keep this identity, refine its execution — don't replace it with a generic template):
  - Primary: Deep Navy `#0A192F`
  - Secondary: Crimson Red `#991B1B`
  - Accent: Warm Amber `#F59E0B`
  - Background: Premium Off-White `#FDFCFB`
  - Headings: serif (`Fraunces` or similar editorial academic serif)
  - Body: clean sans-serif (`Outfit` / `Inter`)
  - Code/citations: monospace (`JetBrains Mono`)
  - Glassmorphism nav (`backdrop-filter: blur(12px)`), subtle radial grid backgrounds, restrained Framer Motion micro-interactions

Key files/components to work through:
- `src/app/layout.tsx`, `src/app/globals.css`
- `src/components/Navbar.tsx`, `src/components/NotificationBell.tsx`, `src/components/Footer.tsx`
- `src/app/page.tsx` (landing/hero + search), `src/components/recommendation-feed.tsx`
- `src/app/workspace/*`, `src/components/kanban-board.tsx`, `src/components/task-board.tsx`, `src/components/collaborative-editor.tsx`, `src/components/paper-upload.tsx`, `src/app/library/*`
- `src/app/assistant/*` (AI chat interface)
- `src/app/community/*`, `src/app/mentorship/*`, `src/components/collaborator-card.tsx`
- `src/app/admin/*`

## What "professional, aligned, modern, premium" means here — be concrete

1. **Grid discipline & alignment**
   - Establish a real layout grid (12-col on desktop, sensible breakpoints for tablet/mobile) and put every section on it. No ad-hoc padding/margins that don't line up with neighboring elements.
   - Consistent spacing scale (e.g., a defined 4/8px-based scale in Tailwind config) used everywhere — eliminate one-off `px-[13px]`-style values.
   - Consistent vertical rhythm between sections (hero → feed → footer, etc.) — no visually random gaps.

2. **Typography system**
   - Define a clear type scale (display, h1–h4, body-lg, body, caption, mono) with intentional weight/line-height/letter-spacing per role — not browser defaults with a font swap.
   - Serif used deliberately for editorial/academic moments (headlines, paper titles, citations) — sans-serif for UI chrome and body copy. Don't let the serif leak into dense UI (buttons, form labels, table cells) where it hurts legibility.

3. **Color usage discipline**
   - Navy/Crimson/Amber should read as an intentional academic-premium palette, not a rainbow of accents. Establish clear usage rules: e.g., Navy = primary surfaces/nav/CTAs, Crimson = key badges/alerts/emphasis only, Amber = sparing highlight/active states — not decorative everywhere.
   - Fix any low-contrast or inconsistent text/background combos; meet WCAG AA at minimum for body text.
   - Consistent, reusable state colors (success/warning/error/info) derived from — not clashing with — the core palette.

4. **Componentry & consistency**
   - Buttons, inputs, cards, badges, tooltips, modals, tabs should look like one design system across every view (landing, workspace, assistant, community, admin) — same corner radii, shadow language, border treatment, hover/focus/active states.
   - Define elevation levels (flat / raised / floating) and apply consistently instead of ad-hoc box-shadows.
   - Visible, on-brand keyboard focus states everywhere (accessibility, not optional).

5. **Premium, restrained motion**
   - Keep Framer Motion but make it purposeful: page-load entrance for hero, scroll reveals for feed items, micro-interactions on hover/press for cards and buttons. Cut anything that feels decorative or excessive — respect `prefers-reduced-motion`.

6. **View-specific UX polish**
   - **Landing/Discovery**: hero hierarchy (headline → search → domain pills → live stats → CTA) should read in one clear visual pass; recommendation feed cards need consistent card anatomy (title, authors, venue/date, tags, actions) and clear skimmability at virtualized scroll.
   - **Workspace**: Kanban/task board needs clear column structure, drag affordances, and card density that doesn't feel cramped; collaborative editor (TipTap) needs a calm, distraction-free writing surface with a clean toolbar; paper upload/library need obvious drop states, progress, and empty states.
   - **Assistant**: chat interface should feel premium and focused — clear message bubbles/roles, readable citation/markdown rendering, obvious input affordance, loading/streaming states that feel alive but not noisy.
   - **Community/Mentorship**: collaborator cards need consistent hierarchy (avatar, name, expertise tags, CTA) and a grid that aligns cleanly at all breakpoints.
   - **Admin**: information-dense but still legible — proper table typography, filter/sort affordances, clear status indicators.

7. **Empty/error/loading states**
   - Every list/feed/board should have a designed empty state and error state, not a blank div or default browser text. Keep copy in-voice, plain, and actionable (per writing guidance below).

## Process — work this way, don't skip steps

1. **Audit first.** Read through `globals.css`, `layout.tsx`, and the key components listed above. Identify concrete inconsistencies (spacing, type scale, color misuse, component drift) before changing anything. Summarize findings briefly.
2. **Propose a token system** before touching components: finalize the color scale (base + tints/shades), type scale, spacing scale, radii, shadow levels, and motion durations/easings as Tailwind config / CSS variables. Show this plan and reasoning briefly, then proceed.
3. **Rebuild shared primitives first** (Navbar, Footer, buttons/inputs/cards if they exist as shared components) so every downstream view inherits consistency.
4. **Then go view by view** in this order: Landing → Workspace (Kanban → Editor → Upload/Library) → Assistant → Community/Mentorship → Admin.
5. **Self-critique before moving on** from each view: does this look like a distinctive, premium academic product, or a generic AI-generated template? Check alignment, type hierarchy, color restraint, and responsiveness (mobile → desktop) before moving to the next view.
6. **Keep the app running.** After each meaningful chunk of work, verify the dev server builds cleanly and nothing functional broke.

## Copy/microcopy guidance (only where you touch UI text)

- Write from the user's side of the screen: name things by what people do ("Save draft," not "Submit"), not by system internals.
- Keep button/action labels consistent through the whole flow (a "Publish" button should lead to a "Published" confirmation, not "Success").
- Empty states are an invitation to act ("No papers yet — upload your first PDF to get started"), not a blank silence.
- Errors state what happened and what to do next, in plain language — no apologies, no vague "Something went wrong" without next steps.

## Deliverable expectations

- A visually cohesive, premium, aligned UI across all views, built on a documented token system, with business logic fully intact.
- Responsive from mobile through desktop, with visible keyboard focus and reduced-motion support.
- A short summary at the end of what changed per view and why, plus anything you flagged as needing a logic change but didn't touch.

Begin with the audit step and show me the token system plan before writing component code.
