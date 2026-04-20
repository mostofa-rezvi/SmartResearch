# ResearchBridge — Comprehensive UI Design Prompt for Google Antigravity Agent

## Project Overview
**ResearchBridge** is a unified digital ecosystem built specifically for the global research community—from undergraduate students in Dhaka to senior professors in Berlin. It is designed to bridge the isolation in academia by fostering structured, intelligent, and human-centered discovery and collaboration. The design must feel **prestigious, secure, authoritative, and intellectually alive**, facilitating the journey from curiosity to contribution.

## Design System & Visual Language

### Color Palette (Premium Academic Aesthetic)
- **Primary (The Core):** Oxford Blue `#0A192F` (Depth, authority, tradition)
- **Secondary (The Bridge):** Academic Crimson `#991B1B` (Energy, passion, scholarly focus)
- **Accent (The Spark):** Cyber Gold `#F59E0B` (Inspiration, high-value highlights, CTAs)
- **Neutral Background:** Cool Slate `#F8FAFC`
- **Surface Cards:** Pristine White `#FFFFFF` with glassmorphism `rgba(255, 255, 255, 0.7)` and `backdrop-filter: blur(10px)`.
- **Text:** Slate-900 `#0F172A` (Headings), Slate-600 `#475569` (Body).

### Typography
- **Headings:** *Fraunces* or *Playfair Display* (Variable serif – creates an "editorial/journal" feel).
- **Body & UI:** *Outfit* or *Inter* (Clean, modern sans-serif for high-density information).
- **Academic Context:** Monospace fonts like *JetBrains Mono* (Small caps) for metadata like DOI, timestamps, and tiers (Q1/Q2/Q3).

### Imagery & Iconography
- **Visuals:** Abstract generative 3D nodes, fiber-optic-like connections, and subtle parchment textures as backgrounds. Avoid generic lab photography; use high-end conceptual 3D renders of "knowledge networks."
- **Icon Set:** *Lucide* or *Phosphor* (Duotone style, using Secondary color for accents).

---

## Global Components

### The "Credentialed" Navbar
Sticky, ultra-clean glassmorphism with a subtle border-bottom.
- **Left:** ResearchBridge Logo (Minimalist Bridge/Book hybrid).
- **Center:** [Library (Journals)] [Discovery (Search)] [Community (Feed)] [Groups].
- **Right:** [About] [Support] | [Login] [Join the Lab (Teal Button)].

### The Multi-Tier Footer
- **Academic Credits:** Logo + "Unifying Global Knowledge from Student to Professor."
- **Navigation:** Structured by product chapters (The Library, The Living Room, The Discovery Engine).
- **Security & Trust:** Trust badges (Email Verified, Data Protection, Institution Link).
- **Social:** Professional links only (LinkedIn, ResearchGate, ORCID).

---

## The User Journey: Page-by-Page Specification

### 1. The Welcome Door (Landing Page `/`)
- **Hero:** A stunning 3D animation of a global network pulse.
- **Headline:** *"From Curiosity to Contribution. Your Unified Research Home."*
- **Call to Action:** Two-path entry: "Start Your Journey (New User)" and "Accept Invitation (Senior Researcher)."
- **Value Props:** Focus on solving "Researcher Isolation."

### 2. Registration & The First Habit (`/register`)
- **Fields:** Full Name, Email, Status (New/Amateur), Institution.
- **The Flow:** Post-registration, users see a "Verification Sent" screen. Clicking the link takes them **back to the Login screen** (establishing the habit of authenticated, secure entry).

### 3. The Gate: Secure Login (`/login`)
- **Step 1:** Traditional Email/Password.
- **Step 2 (The Vault):** Mandatory OTP verification. High-end UI with a countdown timer and "Resend to Email" option.
- **Vibe:** "Your research data and reputation are protected here."

### 4. Mandatory Onboarding: The Research Interest Form (`/onboarding`)
- **Nature:** Non-dismissible guided conversation.
- **Interactions:** Thoughtful questions about fields of study (Theoretical vs. Applied), problem-solving goals, and keyword selection.
- **Visuals:** Progress-driven multipage form with animated keyword "bubbles" that the user gathers as they define their profile.

### 5. The Living Room: Community Feed (`/community`)
- **Q&A Hub:** StackOverflow-style structure but for "methodology struggles" or "literature gaps." Answers rise based on verified credibility.
- **Thoughts:** A social stream for "observations" and "reactions to studies."
- **Vibe:** Collaborative, public knowledge building.

### 6. The Groups Hub (`/groups`)
- **Public Groups:** Organized by domain (e.g., "South Asian Ecology").
- **Private Groups:** Invitation-only spaces for "Sensitive Projects" or "Study Circles."
- **UI:** Card grid showing membership count and "Privacy Status" badges.

### 7. The Library: Journal Directory (`/journals`)
- **Tiered Filtering:** Prominent buttons for **Q1, Q2, and Q3** tiers.
- **Geographic Axis:** World map interactive filter or dropdown for "Bangladesh", "Europe", etc.
- **Category System:** Deep taxonomy (Life Sciences -> Molecular Biology).
- **Design:** Feels like browsing a high-end physical library but with digital precision.

### 8. The Discovery Engine: Research Search (`/search`)
- **Input:** Smart search bar accepting Natural Language, DOI, or Author name.
- **Contextual Results:** Papers are highlighted with "Matches Your Interests" or "Trending in Your Field" based on onboarding data.
- **Tools:** "Quick Save to Profile", "Share to Community", "Follow Author".

### 9. User Profile: The Academic Identity (`/profile/@username`)
- **Standard User:** Interests, contributions (Q&A/Posts), saved papers, and a vertical "Journey Timeline."
- **Invited User (Professor):** Expanded fields for Institution, Rank, Students Supervised, Ongoing Projects, and verified Publications list.
- **Visuals:** Looks like a "Living Academic CV."

### 10. Dashboard: The Personalized Hub (`/dashboard`)
- **Widgets:** "Tailored Suggestions" (Cold-start problem solved!), "Recent Paper Mentions", "Discussion Replies", and "Group Activity."
- **Tone:** Encouraging, showing the user's progress in the ecosystem.

---

## Specialized Interactions (The Antigravity Feel)
1. **The "Honest" Recommendation:** UI displays a "Why this is here" tooltip (e.g., "Because you tagged 'Machine Learning' in Onboarding").
2. **Professor Verification:** Distinct gold-borders or "Verified Expert" icons for Invited Users.
3. **Smooth Transitions:** Page changes should feel like turning a page in a heavy, high-quality book—substantial yet fluid.

## Technical & Writing Guidelines
- **UX Writing:** Scholarly yet accessible. Instead of "Error," use "Dead end in the hypothesis." Instead of "Dashboard," use "My Research Lab."
- **Performance:** Instant search results with skeleton loaders that mimic paper outlines.
- **Responsiveness:** Desktop-first for detailed reading, but high-quality mobile "Snapshot" views for community tracking.

---
*Created for Google Antigravity Agent – ResearchBridge Project Core Standards.*