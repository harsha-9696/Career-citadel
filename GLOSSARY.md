# Career Citadel Glossary

Canonical domain terminology for the Career Citadel codebase.

## Core Concepts

- **Candidate Profile**: The structured state object representing a user's career profile (target roles, experience level, extracted resume skills, gaps, and evaluation history).
- **Citadel Brain**: Centralized reactive shared memory store (`src/services/citadelBrain.ts`) that allows autonomous AI agents to share real-time cross-agent context, transcripts, and identified candidate strengths/weaknesses.
- **Agent Suite**: Dedicated 3D room within the 48m x 38m Citadel floorplan assigned to a specialized AI career counselor.
- **Babu (ATS Auditor)**: Client-side resume parsing (`pdfjs-dist`), keyword density scoring, and bullet rewrites.
- **Ravi (Technical Interviewer)**: Live technical interview simulator with STAR evaluation rubrics.
- **Harsha (Executive Roast)**: High-stress reality-check executive grilling session testing composure and clarity.
- **Radha (Compensation & Negotiation)**: Market compensation benchmarking and live compensation negotiation counter-strategy.
- **Veena (Onboarding Concierge)**: Front desk onboarding agent establishing the initial candidate portfolio baseline.
- **OfficeWorld**: Three.js Canvas component hosting the 3D environment, animated rigged characters (`DelegationCharacter`), spatial collisions, and follow-camera controls.
- **Audio SFX Engine**: Web Audio procedural sound synthesizer delivering footstep acoustics, ambient HVAC hum, terminal clicks, and teleport chimes without external audio asset downloads.
