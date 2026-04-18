# Known Issues & Constraints

## Auth & Security
- **OTP Cooldown**: Currently no enforced cooldown between resend requests (Fix planned for Chapter 2).
- **Session Duration**: Invited User sessions are currently the same length as standard users; experts may require longer persistence.

## Discovery Engine
- **Cold-start Delay**: Neo4j relationship mapping can take up to 2 seconds for new users (Optimization needed for Step 4).
- **Keyword Overlap**: Ambiguous keywords (e.g., "Biology") lead to diluted search results.

## Community
- **Answer Ranking**: Upvote algorithm doesn't yet account for the voter's own Trust Score (Planned for Chapter 3).