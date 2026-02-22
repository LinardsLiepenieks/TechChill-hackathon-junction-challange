import { Rulebook } from "@/types";

export const organizerRulebook: Rulebook = {
  title: "Project Guidelines",
  content: `1. Project Goals
  - Build a functional prototype that solves a real problem.
  - Demonstrate technical skill, creativity, and teamwork.
  - Deliver a solution that could realistically be developed further.

2. Minimum Requirements
  - A working demo accessible via a public URL.
  - Source code pushed to the provided Git repository.
  - A brief README with project description and tech stack.
  - All team members listed in the submission form.

3. Pitch Presentation
  - Each team has 3 minutes to pitch, followed by 2 minutes of Q&A.
  - The pitch must include: the problem, your solution, a live demo, and next steps.
  - All team members should be present during the pitch.

4. Judging Criteria
  - Innovation (25%): Originality of the idea and approach.
  - Technical Execution (25%): Code quality, architecture, and completeness.
  - Design & UX (25%): Usability, visual design, and accessibility.
  - Impact (25%): Real-world potential and scalability.

5. Timeline
  - Hacking ends at the announced deadline. No commits accepted after.
  - Pitches begin 30 minutes after the submission deadline.
  - Results are announced at the closing ceremony.

6. Rules
  - Teams of 2–5 members. One team per person.
  - Open-source libraries and public APIs are allowed.
  - Pre-existing code must be disclosed in the README.
  - Plagiarism or misrepresentation leads to disqualification.`,
};

export const challengeRulebook: Rulebook = {
  title: "Challenge: AI for Sustainable Cities",
  content: `Challenge Partner: GreenTech Solutions

1. Challenge Brief
  Build an AI-powered tool that helps cities reduce their environmental footprint. Your solution should use machine learning, LLMs, or data analysis to address at least one urban sustainability issue.

2. Focus Areas
  - Energy: Smart grid optimization, building energy monitoring, renewable forecasting.
  - Transport: Route optimization, public transit analysis, emission tracking.
  - Waste: Smart sorting, collection optimization, circular economy tools.
  - Green spaces: Urban planning, air quality monitoring, biodiversity tracking.

3. Technical Requirements
  - Must include an AI/ML component (not just rule-based logic).
  - Must use at least one real or realistic dataset.
  - API integrations with city data sources are encouraged.
  - Solution must be demonstrable in the 3-minute pitch.

4. Challenge-Specific Prizes
  - 1st Place: €3,000 + mentorship program with GreenTech Solutions.
  - 2nd Place: €1,500 + cloud credits.
  - 3rd Place: €500.

5. Evaluation (in addition to general criteria)
  - Relevance: How well does the solution address urban sustainability?
  - Data Usage: Creative and meaningful use of data.
  - Feasibility: Could this be deployed in a real city within 6 months?

6. Resources Provided
  - Access to GreenTech city dataset API (credentials in Slack).
  - Mentor office hours: Saturday 14:00–16:00, Sunday 10:00–12:00.
  - GPU compute credits for model training (see #challenge-ai channel).`,
};
