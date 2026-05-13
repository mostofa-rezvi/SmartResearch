# Context
You are an expert Frontend Architect and UI/UX Developer. We are building the "Community" section of **SmartResearch**—a premium "Researcher Hub" where scholars can engage in high-level academic discourse, ask commonly asked research questions, and provide authoritative answers. The goal is to create a Quora-style experience tailored for researchers, where people build reputation through field-specific expertise and community participation. The project is built using **Next.js 14 (App Router)**, **Tailwind CSS**, and **Framer Motion**.

# Objective
Engineer a top-notch, production-ready "Researcher Hub" community interface that facilitates participation, rewards expertise, and establishes a clear reputation system for researchers.

# Functional Requirements
1. **Researcher Hub Feed:** A sophisticated feed that distinguishes between "Questions" (requiring authoritative answers) and "Insights/Thoughts" (discussion-based).
2. **Authoritative Q&A System:** 
   - Detailed Question pages where answers are ranked by community upvotes and researcher reputation.
   - Support for "Verified Answers" by recognized field experts.
3. **Reputation & Expertise System:**
   - **Reputation Badges:** Display expertise scores and badges (e.g., "Top Contributor in Quantum Computing") next to user profiles.
   - **Field Ownership:** Visual indicators showing a researcher's dominant fields of expertise based on their contributions.
4. **Interactive Researcher Profile:** Snippets within the community that link to full profiles, highlighting their impact, reputation score, and key research fields.
5. **Rich Participation Tools:**
   - Rich-text editor for answers (supporting LaTeX/MathJax for academic formulas).
   - Nested "threaded" discussions for nuanced follow-up questions.
   - Shareable "Research Bites" for quick dissemination of findings.

# UI/UX & Aesthetic Constraints
- **Design Language:** "Academic Premium"—minimalist, authoritative, and clean. Use a palette of deep slates, emeralds (for growth/expertise), and soft glassmorphism effects.
- **Micro-interactions:** 
   - Smooth "Reputation Gain" animations when a post is upvoted.
   - Elegant "Skeletonizer" loading states for the feed and detail views.
   - Fluid transitions between the feed and individual discussion threads using Framer Motion.
- **Aesthetic Excellence:** The interface should feel like a high-end research tool, not just another social network. Use high-quality typography (Inter/Outfit) and subtle micro-shadows.

# Architecture & Code Quality Requirements
- **Framework:** Next.js 14 App Router.
- **Modularity:** Separate logic into reusable components (`/src/components/community`) and specialized hooks (`/src/hooks/useCommunity`).
- **State Management:** Use React Context or Zustand for community-wide state (filters, search, live updates).
- **Real-time Integration:** Ensure the UI gracefully handles live updates via Socket.io (e.g., live upvote counts, "New Answer" notifications).

# Output Delivery
1. **Folder Structure:** Propose a clean directory layout for the community module within `src/app/community` and `src/components/community`.
2. **Key Components:** Generate code for:
   - `ExpertiseBadge`: A reusable badge showing field authority.
   - `AnswerCard`: A detailed response card featuring the researcher's reputation.
   - `QuestionDetailView`: The main layout for a dedicated question page.
3. **Reputation Logic:** Provide a frontend-ready model for calculating and displaying visual reputation cues based on user data.
4. **Skeleton States:** Implement the `SkeletonAnswerCard` using Tailwind and Framer Motion for a premium loading experience.