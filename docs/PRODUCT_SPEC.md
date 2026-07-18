# AI Training Pathfinder Product Specification

`docs/PRODUCT_SPEC.md` is the authoritative source for product requirements. If this document conflicts with `README.md`, this document controls.

## Product Purpose And Pilot Scope

AI Training Pathfinder helps users find free AI training tailored to their professional field, work patterns, current practical AI fluency, technical orientation, learning goals, preferred formats, and available training time.

The MVP is a small demonstration pilot for approximately 3 to 12 testers. It is not intended for enterprise authentication, CAC integration, organizational reporting, high-security information handling, paid-course transactions, automated certificate verification, supervisor surveillance, or readiness certification.

Users must be warned not to enter classified, controlled, operationally sensitive, medical, personally identifiable, proprietary, credential, or other sensitive information.

## Joint Force Design Context

AI Training Pathfinder is intended to demonstrate how personnel across a diverse Joint Force could receive AI education tailored to their roles, responsibilities, existing expertise, and anticipated uses of AI.

The MVP may be publicly accessible and should use broadly understandable terminology, but its design must account for the range of military, civilian, technical, operational, analytical, medical, educational, acquisition, maintenance, administrative, and leadership roles found across the Joint Force.

The tool must not request:

- Military service
- Rank or grade
- Unit or organization
- Duty location
- Clearance level
- Weapon system
- Mission assignment
- Operational details
- Classified information
- Controlled unclassified information
- Personally identifiable information

The assessment should tailor learning based on professional activities and responsibilities rather than rank, status, or organizational affiliation.

All scenarios and applied exercises must use fictional, nonsensitive information.

## Joint Force Professional Fields

Users select one primary professional field and may select up to two secondary fields:

1. Intelligence, research, and analysis
2. Operations and mission planning
3. Maintenance and logistics
4. Acquisition and program management
5. Cybersecurity and information technology
6. Software development, data, and AI
7. Healthcare
8. Education, training, and communication
9. Leadership, policy, and governance
10. Administration and general support
11. Other

These fields should remain configurable.

## Joint Force Work Patterns

Users select up to three work patterns:

1. Analyze information: research, compare sources, identify patterns, summarize evidence, and produce assessments.
2. Create and communicate: draft reports, presentations, instructions, correspondence, educational material, or other products.
3. Plan and decide: develop options, identify assumptions, evaluate tradeoffs, plan activities, and support decisions.
4. Build and automate: write code, query or manipulate data, automate workflows, and develop technical systems.
5. Sustain and optimize: troubleshoot equipment or processes, forecast requirements, improve workflows, and support maintenance or logistics.
6. Lead and govern: supervise personnel, review AI-assisted products, approve decisions, establish policy, manage risk, and assign accountability.

Professional field and work pattern must remain separate. A user's job field alone does not determine the appropriate training path.

## Joint Force Expertise Model

Do not place all users on a single expertise ladder.

Calculate two separate dimensions:

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

Technical coding ability must not automatically produce a high practical-fluency rating. Leadership, governance, output evaluation, and responsible-use capabilities must also be recognized.

Rank, seniority, age, and years of service must not be used as proxies for AI expertise.

## Required Assessment Design

The assessment should contain approximately 10 to 12 questions and take approximately three to five minutes.

Questions should rely primarily on behavior, experience, and scenarios rather than asking users to rate themselves as beginner, intermediate, or expert.

### Question 1: Primary Professional Field

Which professional field best describes your primary work?

Use the approved professional-field list.

Allow one primary selection and up to two optional secondary selections.

### Question 2: Work Patterns

Which activities best describe your work?

Allow up to three selections from the approved work-pattern list.

### Question 3: Learning Goals

What do you most want to learn?

Allow up to three selections:

- Understand AI terminology and capabilities
- Use generative AI for everyday productivity
- Improve research and analysis
- Improve writing and communication
- Work with data
- Automate repetitive tasks
- Evaluate AI outputs and reduce errors
- Understand responsible use, policy, and risk
- Supervise AI-assisted work
- Build AI-enabled applications
- Understand machine learning
- Teach others to use AI

### Question 4: Recent Use

How often have you used a generative-AI tool during the past 30 days?

- Never
- Once or twice
- Several times
- Weekly
- Several times per week
- Daily

This measures exposure and use frequency, not proficiency by itself.

### Question 5: Independent Experience

Which of the following have you done independently?

Allow multiple selections:

- Asked an AI tool a simple question
- Revised a prompt after receiving a poor result
- Supplied context, examples, or source material
- Compared AI output against authoritative sources
- Created a reusable prompt or template
- Used AI as one step in a repeatable workflow
- Used an AI API, coding assistant, or automation tool
- Built or evaluated an AI or machine-learning system

Weight advanced behaviors more heavily than basic tool access.

### Question 6: Output Verification Scenario

An AI system produces a convincing answer for an important work product. What would you normally do?

- Use it because it appears reasonable
- Read it for obvious errors
- Independently verify important claims
- Verify claims, inspect available sources, document uncertainty, and determine what requires human judgment

The strongest response demonstrates verification proportional to the consequences of the task.

### Question 7: Prompt and Workflow Scenario

An AI response is incomplete or inaccurate. What are you most likely to do next?

- Stop using the tool
- Ask the same question again
- Rewrite the question with more detail
- Add context, constraints, examples, and a requested output format
- Break the task into smaller steps and test each step separately

This question should distinguish basic prompting from structured workflow design.

### Question 8: Responsible Information Handling

Before entering work-related information into an AI system, which best describes your approach?

- I generally enter whatever information is needed
- I avoid obviously personal or sensitive information
- I determine whether the tool is approved and minimize the information entered
- I consider tool approval, classification or sensitivity, retention, access, downstream use, and required human review

Display a reminder that users must not provide actual sensitive examples when answering.

### Question 9: Understanding AI Limitations

Present a scenario-based question testing whether the user understands that generative-AI systems:

- Generate outputs from learned patterns
- Can produce plausible but incorrect information
- May omit context or reflect bias
- Require verification appropriate to the task and consequences

Do not phrase this only as a self-assessment such as "How well do you understand hallucinations?"

### Question 10: Technical Experience

Which best describes your technical experience?

- I primarily use ordinary workplace software
- I use advanced spreadsheets, formulas, or low-code tools
- I write scripts or query data
- I develop software or use APIs
- I build, train, deploy, or evaluate AI or machine-learning systems

This primarily informs technical orientation, not overall practical fluency.

### Question 11: Responsibility and Authority

Which best describes your relationship to AI-assisted work?

- I primarily complete my own tasks
- I review other people's work
- I supervise personnel or approve products
- I develop policy or manage organizational risk
- I build or operate technical systems

This should influence recommendations for human oversight, governance, evaluation, and technical training.

### Question 12: Learning Constraints and Preferences

Ask: how much time can you normally devote to AI learning each week?

- Less than 30 minutes
- 30 to 60 minutes
- 1 to 2 hours
- 2 to 4 hours
- More than 4 hours

Also collect preferred formats:

- Reading
- Video
- Interactive lesson
- Hands-on exercise or lab
- No preference

## Assessment Result Requirements

After scoring, display:

- Practical AI fluency result
- Technical-orientation result
- A short explanation of the evidence that contributed to each result
- A question asking whether the result seems accurate

Users may indicate:

- Yes, it seems accurate
- It seems too low
- It seems too high
- I am not sure

This feedback is for pilot calibration. It should not automatically replace the calculated result without recording both values.

## Scoring Principles

Keep scoring rules and thresholds configurable and separate from the interface.

The calculation should follow these principles:

- Demonstrated behaviors carry more weight than use frequency.
- Verification and responsible-use judgment contribute to practical fluency.
- Technical experience primarily contributes to technical orientation.
- Supervisory and governance responsibilities affect recommended content but do not automatically increase expertise.
- Frequent use without verification practices should not produce an advanced rating.
- Coding experience without responsible-use or evaluation skills should not produce an advanced practical-fluency rating.
- A user may be highly experienced in leadership or governance while having a general-user technical orientation.
- A user may be technically advanced while still needing foundational responsible-use training.

## Role Alignment Principle

Recommendations must combine:

- Professional field
- Work patterns
- Practical AI fluency
- Technical orientation
- Learning goals
- Responsibility for review, leadership, governance, or system development
- Available learning time
- Preferred format

The system should not assume that all members of one career field need the same pathway.

For example:

- An intelligence analyst may need source verification, hallucination detection, structured analysis, and data-evaluation training.
- A maintenance or logistics user may need workflow support, troubleshooting assistance, predictive concepts, and human review of recommendations.
- A planner may need assumptions testing, option comparison, and limitations of AI-supported decision aids.
- A leader may need governance, accountability, risk management, and review of AI-assisted work.
- A developer may need evaluation, responsible-system design, APIs, automation, and technical implementation.
- An educator may need audience adaptation, lesson development, evaluation, and responsible classroom use.

These examples illustrate matching logic and must not require users to disclose actual missions, systems, or operational details.

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
- Official source URL
- Professional fields
- Work patterns
- Practical-fluency levels
- Technical orientations
- Official duration in minutes when displayed by the provider
- Duration status, including `needs-manual-verification` when no official duration is displayed
- Format
- Learning objectives
- Prerequisites
- Account or product requirements
- Free-status verification
- Free-access classification
- Certificate availability
- Foundational or optional status
- Tags
- Last verification date
- Evidence or source note
- Active/inactive status

Catalog records must not estimate or invent duration. If a provider does not display an official duration, set the duration to `null`, mark the duration status as needing manual verification, and do not make a duration claim in the user interface.

Inactive provisional records may be retained for manually reviewed resources, redirected destinations, or resources whose free status cannot be verified sufficiently. They must not be recommended until the unresolved verification issue is closed.

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

Implemented through Phase 3:

- Static GitHub Pages-compatible app shell
- Safety warning and guest/demo entry point
- Configurable professional fields, work patterns, profile levels, milestones, and achievements
- Short assessment flow
- Field and work-pattern selection limits
- Separate practical AI fluency and technical-orientation scoring
- User feedback on whether the calculated profile seems accurate
- Guest localStorage foundation for assessment results
- Verified free-resource catalog with source evidence notes
- Deterministic recommendation scoring using editable JSON weights and thresholds
- Five-stage learning path generation
- Plain-language recommendation explanations
- Internal applied-practice cards using fictional, nonsensitive scenarios

## Deferred Features

Deferred beyond the current Phase 3 scope:

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
