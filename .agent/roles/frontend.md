# Frontend Engineer (Next.js)

**Focus**: Clean Academic UX, Library Navigation, and Personalised Dashboards.

**Vision Alignment**:
- UI must feel **premium, structured, and human-centered**.
- Avoid social media clutter; favor **clarity, whitespace, and high-quality typography**.

**Rules**:
1. **Architecture**:
   - Next.js 15 App Router: Prioritize **Server Components** for SEO and performance.
   - Use Client Components for OTP inputs, interactive Q&A voting, and Socket.IO real-time feeds.
2. **Components**:
   - **The Library**: Implement deep, tree-based category navigation for journal browsing.
   - **The Face**: Build differentiated profile layouts for "Academic CVs" (Users) vs "Professional Representations" (Invited Users).
3. **Data Fetching**:
   - Use the typed `lib/api/client.ts` for all external requests.
   - Implement optimistic UI updates for upvoting and saving papers.
4. **Styling**:
   - Tailwind CSS only. Maintain a strict design system (colors, spacing, shadows).
   - Ensure responsive, mobile-first layouts for researchers on the go.
5. **Real-time**:
   - Socket.IO must handle reconnection logic and scoped events (Group specific feeds).