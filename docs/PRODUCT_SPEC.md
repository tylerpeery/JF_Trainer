# AI Training Pathfinder Product Specification

`docs/PRODUCT_SPEC.md` is the authoritative source for product requirements. If this document conflicts with `README.md`, this document controls.

## Product Purpose And Pilot Scope

AI Training Pathfinder helps users find free AI training tailored to their professional field, work patterns, current practical AI fluency, technical orientation, learning goals, preferred formats, and available training time.

The MVP is a small demonstration pilot for approximately 3 to 12 testers. It is not intended for enterprise authentication, CAC integration, organizational reporting, high-security information handling, paid-course transactions, automated certificate verification, supervisor surveillance, or readiness certification.

Users must be warned not to enter classified, controlled, operationally sensitive, medical, personally identifiable, proprietary, credential, or other sensitive information.

## Technology Architecture

- Public hosting: GitHub Pages.
- Frontend: plain HTML, responsive CSS, and plain JavaScript ES modules.
- Build process: none.
- Guest storage: browser `localStorage`.
- Account storage: Supabase Free, deferred until Phase 5.
- Catalog: static JSON stored in the repository.
- Recommendation approach: deterministic, rules-based, explainable scoring.

The MVP must not use React, Vite, TypeScript, Next.js, a custom application server, or an LLM API unless this specification is intentionally revised. Browser code must never contain a Supabase service-role key or private secret.

## User Profile Dimensions

The app must not represent expertise as a single ladder. It uses two separate dimensions:

Practical AI fluency:

- New to AI
- Foundational user
- Applied user
- Advanced practitioner

Technical orientation:

- General user
- Productivity and low-code user
- Developer or data practitioner
- AI/ML builder

The assessment calculates these dimensions from behavior- and scenario-based questions. Users may indicate whether the calculated result seems accurate.

## Professional Fields And Work Patterns

Users select one primary professional field and up to two secondary fields:

- Intelligence, research, and analysis
- Operations and mission planning
- Maintenance and logistics
- Acquisition and program management
- Cybersecurity and information technology
- Software development, data, and AI
- Healthcare
- Education, training, and communication
- Leadership, policy, and governance
- Administration and general support
- Other

Users select up to three work patterns:

- Analyze information
- Create and communicate
- Plan and decide
- Build and automate
- Sustain and optimize
- Lead and govern

Recommendations must consider both field and work pattern. A job title alone must not determine training needs.

## Assessment Requirements

The assessment should contain approximately 10 to 12 questions and target a three- to five-minute completion time. It should measure:

- Recent frequency of generative-AI use
- Activities completed independently
- Ability to verify plausible AI output
- Ability to improve prompts and break down tasks
- Responsible handling of work information
- Understanding of generative-AI limitations
- Technical experience
- Responsibility for reviewing, supervising, governing, or building AI-assisted work
- Learning goals
- Weekly available training time
- Preferred learning formats

Free-text responses are optional and must be accompanied by sensitive-information warnings.

## Recommendation Approach

The recommendation engine must remain separate from UI and storage code. Recommendation weights and scoring thresholds belong in editable configuration data.

Recommendations should consider:

- Work-pattern match
- Professional-field match
- Practical-fluency match
- Learning-goal match
- Technical-orientation match
- Supervisor or governance responsibilities
- Format preference
- Available time
- Prerequisites
- Completed resources
- Duplicate content
- Provider diversity

Each recommended item must include plain-language explanations, such as:

- Selected because of your professional field
- Selected because you want to evaluate AI outputs
- Appropriate for your current practical-fluency level
- Fits your available training time

## Learning Path Stages

Every personalized path must include:

1. AI foundation
2. Responsible use and output evaluation
3. Role-aligned application
4. Hands-on practice
5. Optional deeper learning

A user must not receive only specialty courses while missing foundational or responsible-use content.

## Training Milestones

Training hours measure engagement, not proficiency. Completing five or ten hours must not automatically promote the user's expertise level.

Initial milestones:

- Assessment complete: Path Selected
- 1 hour: Orientation Complete
- 3 hours: Foundation Building
- 5 hours: Adoption Momentum
- 10 hours: Applied Foundation
- Beyond 10 hours: Continued Development

Milestone names, descriptions, and required hours must remain configurable.

Milestone disclaimer:

These milestones do not constitute certification, authorization, mission readiness, or validated job proficiency.

At the five- and ten-hour milestones, the app may optionally ask:

- Whether the user is using AI more frequently
- Whether the user is more confident evaluating AI output
- For one nonsensitive example of applying the training

## Professional Gamification Rules

Use professional, low-pressure gamification:

- Segmented progress bar
- Learning XP or progress points
- Milestone badges
- Achievement cabinet
- Recommended next step
- Optional applied challenges
- Accessible completion animation that can be disabled

Do not use:

- Public leaderboards
- Daily streaks
- Inactivity penalties
- Virtual currency
- Cartoon avatars
- Military-rank-style levels
- Achievements based only on opening a link
- Language implying certification, authorization, or readiness

Initial achievements:

- Path Selected
- First Step
- Foundation Built
- Responsible AI Learner
- Evidence Checker
- Workflow Designer
- Role-Aligned Learner
- Adoption Momentum
- Applied Foundation
- Cross-Functional Learner

Achievements must be earned only once.

## Training Resource Data Requirements

Begin with approximately 12 to 15 verified free resources from multiple reputable providers in a later phase. Potential providers include IBM SkillsBuild, Microsoft Learn, Elements of AI, Google Machine Learning Education, AWS Skill Builder, NIST guided resources, and OpenAI Academy only after access and cost are verified.

Never invent course titles, URLs, durations, certificates, providers, free status, or verification evidence. Phase 1 may contain only unmistakably labeled unverified sample records.

Each training-resource record should support:

- Stable resource ID
- Title
- Provider
- Description
- URL
- Professional fields
- Work patterns
- Practical-fluency levels
- Technical orientations
- Estimated duration
- Format
- Learning objectives
- Prerequisites
- Free-status verification
- Certificate availability
- Foundational or optional status
- Tags
- Last verification date
- Evidence or source note
- Active/inactive status

The catalog remains editable as JSON without an administrator interface.

## Applied Practice Cards

The app should include short internal practice cards using fictional, nonsensitive information. These should take approximately 15 to 30 minutes and supplement external training where free specialty-specific courses are unavailable.

Initial practice card themes:

- Analyst evaluation challenge
- Planning assumptions challenge
- Maintenance or logistics workflow challenge
- Leadership and human-approval challenge
- Trainer audience-adaptation challenge
- Healthcare privacy and verification challenge

## Progress Tracking

Users should be able to:

- Start a resource
- Mark it complete
- Record an optional completion date
- Record an optional takeaway
- Undo accidental completion
- View completed minutes and hours
- See progress toward five and ten hours
- View achievements
- See a recommended next activity

Completion is initially based on user attestation. The app must prevent duplicate XP, time, and achievement credit when completion status is toggled.

After completion, the app may optionally collect:

- Relevance to the user's work on a 1 to 5 scale
- Difficulty: too easy, appropriate, or too difficult

## Storage Modes

Guest/demo mode:

- No account required.
- Data stored in `localStorage`.
- Clearly explain that data remains on that browser and device.
- Provide reset and export functions in a later progress phase.

Account mode:

- Supabase authentication, deferred until Phase 5.
- Progress available across devices.
- Each user may access only their own profile, assessment, progress, and achievements.
- Training catalog data may be publicly readable.
- Use Row Level Security.

Guest-to-account transfer may be added after both storage modes are stable.

## Accessibility

Aim for WCAG 2.1 AA practices:

- Semantic HTML
- Keyboard navigation
- Accessible form labels
- Sufficient contrast
- Screen-reader-friendly progress indicators
- No information communicated through color alone
- Reduced-motion support

## Privacy And Information Handling Boundaries

The MVP must not collect or process sensitive information. It must warn users not to enter:

- Classified information
- Controlled information
- Operationally sensitive information
- Medical or protected health information
- Personally identifiable information
- Proprietary organizational information
- Account credentials or passwords

The app should collect only the minimum information needed to recommend learning resources and track user-attested learning progress.

## Current Implemented Scope

Implemented through Phase 2:

- Static GitHub Pages-compatible app shell
- Safety warning and guest/demo entry point
- Configurable professional fields, work patterns, profile levels, milestones, and achievements
- Short assessment flow
- Field and work-pattern selection limits
- Separate practical AI fluency and technical-orientation scoring
- User feedback on whether the calculated profile seems accurate
- Guest localStorage foundation for assessment results

## Deferred Features

Deferred beyond the current Phase 2 scope:

- Recommendation scoring
- Full progress tracking
- Achievement calculation
- Supabase
- Authentication
- Guest-to-account transfer
- Production catalog data
- Enterprise or CAC authentication
- Automated certificate verification
- Live web scraping
- Organization-level dashboards
- Supervisor surveillance
- LLM-generated recommendations
- AI chatbots
- High-stakes readiness certification
- Complex administrator interface

## MVP Success Criteria

The MVP succeeds when pilot users can complete a short assessment, receive an explainable path spanning the required stages, follow links to verified free resources, complete nonsensitive practice cards, attest to completed training, and see professional progress indicators without any implication of certification or readiness.
