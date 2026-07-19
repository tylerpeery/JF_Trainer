# AI Training Catalog Research Guide

This guide defines durable research standards for expanding the AI Training Pathfinder catalog. It covers candidate records, production catalog records, controlled vocabularies, candidate lifecycle, quality review, provider diversity, and re-verification.

Authoritative product requirements remain in `docs/PRODUCT_SPEC.md`. The current production catalog is `data/training-resources.json`. When this guide is used inside a ChatGPT Project rather than the repository, treat uploaded files named `PRODUCT_SPEC.md` and `training-resources.json` as the authoritative equivalents of those repository paths.

Changing operational history belongs in `docs/research-decision-log.md`. Specialty search lenses belong in `docs/SPECIALTY_RESEARCH_LENSES.md`.

## Research Purpose

Research should identify free, public, role-relevant AI learning resources that can improve the catalog without duplicating existing entries or weakening verification standards.

The research agent should use broadly understandable Joint Force terminology, but must not request, infer, store, or produce training recommendations based on:

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

All role alignment must be based on professional field, work pattern, learner level, learning goal, responsibility, format, and available training time.

## Current Catalog Sources

Production external catalog:

```text
data/training-resources.json
```

Internal fictional practice cards:

```text
data/applied-practice-cards.json
```

Do not duplicate existing active catalog resources. A candidate can still be useful if it fills a gap, provides a better official source, resolves an inactive provisional record, or replaces an existing record with a clearer verified destination after review.

## Research Candidate Record

Use a research candidate record before attempting to create or edit a production catalog record. Candidate records preserve uncertainty and help reviewers compare options without prematurely forcing findings into the app schema.

```json
{
  "candidateId": "candidate-stable-lowercase-id",
  "discoveredAt": "YYYY-MM-DD",
  "lastReviewedAt": "YYYY-MM-DD",
  "discoverySource": "How this candidate was found",
  "exactTitle": "Exact title from official page",
  "provider": "Official provider name",
  "officialSourceUrl": "Official page reviewed",
  "sourceActive": true,
  "accessClassification": "fully-free",
  "freeAccessEvidence": "What the official page says or what was observed",
  "officialDurationMinutes": 30,
  "durationStatus": "verified-official",
  "durationEvidence": "Official page lists 30 minutes",
  "accountRequirements": "No account required to view page",
  "prerequisites": [],
  "specialtyUseCase": "Specific nonsensitive role or capability use case",
  "gapFilled": ["Missing role-aligned application for maintenance"],
  "proposedMappings": {
    "professionalFields": ["Maintenance"],
    "workPatterns": ["sustain-optimize"],
    "practicalFluencyLevels": ["foundational-user", "applied-user"],
    "technicalOrientations": ["general-user", "productivity-low-code"],
    "learningGoals": ["automate-repetitive-tasks", "evaluate-outputs"],
    "responsibilityIds": ["own-tasks", "review-others"],
    "pathStage": "Role-aligned application",
    "formatId": "interactive-lesson",
    "tags": ["workflow", "verification"]
  },
  "directOrInferredRelevance": "direct",
  "mappingEvidence": [
    {
      "mapping": "workPatterns:sustain-optimize",
      "evidence": "Official objectives teach troubleshooting or workflow optimization."
    }
  ],
  "qualityReview": {
    "credibility": 4,
    "instructionalSubstance": 4,
    "roleRelevance": 4,
    "accessibility": 3,
    "vendorNeutrality": 3,
    "currency": 4,
    "userFriction": 4,
    "notes": "Substantive resource with moderate product framing."
  },
  "confidence": "high",
  "concerns": [],
  "unresolvedQuestions": [],
  "comparisonResources": ["existing-resource-id-or-title"],
  "recommendedDisposition": "advance-for-curriculum-review",
  "reviewerDecision": "pending"
}
```

### Candidate Required Fields

- Candidate ID
- Exact title and provider
- Official source URL
- Proposed mappings
- Specific gap filled
- Direct or inferred relevance
- Evidence supporting each mapping
- Confidence: `high`, `medium`, or `low`
- Unresolved issues
- Recommended disposition
- Reviewer decision

### Recommended Dispositions

- `advance-for-curriculum-review`
- `hold-for-manual-verification`
- `reject`

## Candidate Lifecycle

Use separate fields for research state, verification state, and production activation.

### Research Status

| Status | Meaning |
| --- | --- |
| `discovered` | Candidate identified but official source not yet reviewed. |
| `source-reviewed` | Official source opened and basic title/provider/destination checked. |
| `metadata-verified` | Title, provider, access, duration status, prerequisites, account requirements, and source evidence reviewed. |
| `curriculum-approved` | Reviewer approves role relevance, quality, and mappings for catalog inclusion. |
| `active` | Resource is approved and enabled in the production catalog. |
| `inactive-provisional` | Candidate or record is retained for review but not active. |
| `rejected` | Candidate should not be reconsidered unless conditions change. |
| `needs-reverification` | Existing candidate or production record is stale, broken, redirected, or reported inaccurate. |

### Verification Status

Use verification status to describe source evidence, not curriculum approval:

- `verified`
- `manual-review`
- `needs-reverification`
- `rejected`

### Production Active Flag

Use `active: true` only for production records that may appear in catalog browsing and recommendation paths. Inactive provisional records may remain in the JSON for traceability but must not be recommended.

Example:

```json
{
  "researchStatus": "curriculum-approved",
  "verificationStatus": "verified",
  "active": true
}
```

## Production Catalog Record Schema

Reserve this schema for resources that pass research and curriculum review. This is the current app-compatible schema.

```json
{
  "id": "stable-lowercase-resource-id",
  "title": "Exact official title",
  "provider": "Official provider name",
  "description": "Concise verified description of what the resource teaches.",
  "url": "Official learner-facing URL",
  "sourceUrl": "Official evidence URL used for verification",
  "professionalFields": ["All fields"],
  "workPatterns": ["analyze-information"],
  "practicalFluencyLevels": ["new-to-ai"],
  "technicalOrientations": ["general-user"],
  "durationMinutes": 30,
  "durationStatus": "verified-official",
  "estimatedMinutes": 30,
  "durationNote": "Official provider page lists a duration of 30 minutes.",
  "format": "Interactive lesson",
  "formatId": "interactive-lesson",
  "learningGoals": ["ai-terminology-capabilities"],
  "responsibilityIds": ["own-tasks"],
  "learningObjectives": ["Understand foundational AI concepts."],
  "prerequisites": [],
  "accountRequirements": "No account required to view the module page.",
  "accessClassification": "fully-free",
  "freeStatusVerification": "Verified public official page access; no payment requirement was presented during verification.",
  "certificateAvailability": "No certificate claim is made from the verified page.",
  "pathStage": "AI foundation",
  "foundationalStatus": "foundational",
  "resourceType": "module",
  "tags": ["ai-foundation"],
  "lastVerifiedAt": "YYYY-MM-DD",
  "lastVerificationDate": "YYYY-MM-DD",
  "evidenceNote": "Official page verifies title, provider, free access status, duration, and key objectives.",
  "evidenceUrl": "Official evidence URL",
  "verificationStatus": "verified",
  "active": true,
  "sampleData": false
}
```

## Compatibility Field Rules

Some duplicate fields are currently required by the application and regression tests. Until the app schema is intentionally migrated, use these canonical definitions:

| Current Fields | Canonical Rule |
| --- | --- |
| `sourceUrl` and `evidenceUrl` | `sourceUrl` is canonical. `evidenceUrl` is a compatibility alias and must match `sourceUrl` unless a schema migration adds an evidence-sources array. |
| `lastVerifiedAt` and `lastVerificationDate` | `lastVerifiedAt` is canonical. `lastVerificationDate` is a compatibility alias and must match `lastVerifiedAt`. |
| `durationMinutes` and `estimatedMinutes` | `durationMinutes` records official duration evidence. `estimatedMinutes` is the currently consumed app field for display, time-fit recommendations, progress credit, and reporting. For exact official durations, both should match. If no exact duration should be credited, both should be `null`. |

Future schema improvement to consider:

```json
{
  "officialDurationMinutes": 30,
  "creditedDurationMinutes": 30,
  "durationStatus": "verified-official",
  "evidenceSources": ["https://example.org/course"]
}
```

## Field Rules

### Identity And Status

| Field | Rule |
| --- | --- |
| `id` | Stable lowercase ID. Do not change after publication unless replacing the record. |
| `title` | Exact current title from the official provider page. |
| `provider` | Official provider name. |
| `description` | Summarize verified learning content. Do not add unsupported claims. |
| `url` | Learner-facing official page. |
| `sourceUrl` | Canonical official page used as evidence. Usually the same as `url`. |
| `active` | `true` only when title, destination, free/access status, curriculum relevance, and display claims are verified. Unknown duration can be active if transparently represented and not credited. |
| `verificationStatus` | Use `verified` for verified source evidence; use `manual-review` or `needs-reverification` when evidence is incomplete or stale. |
| `sampleData` | Must be `false` for production records. Placeholder data must be unmistakably labeled and inactive. |

### Access Classifications

| Value | Meaning |
| --- | --- |
| `fully-free` | Complete learning content is free to access. |
| `free-course-optional-paid-certificate` | Course content is free; certificate, badge, or credential may require payment. |
| `free-content-with-paid-or-subscription-exercise` | Some instructional content is free, but meaningful exercises, labs, or assessments require payment/subscription. |
| `publicly-accessible-free-status-not-explicitly-confirmed` | Page is public, but complete free access is not documented. |
| `requires-paid-platform` | Requires paid platform, cloud credits, subscription, or paid product access. |
| `free-introduction-paid-full-course` | Introductory content is free, but full course is paid. |
| `not-free` | Learning content requires payment. |
| `geographically-restricted` | Access appears limited by geography. |
| `employer-or-institution-restricted` | Access requires employer, school, government, or institutional entitlement. |

Rejected and provisional candidates should still receive the most accurate access classification.

### Duration And Credit

| Field | Rule |
| --- | --- |
| `durationStatus` | Use `verified-official` for exact provider duration; `verified-official-sum` for summed official unit durations; `verified-official-approximate` for provider-stated approximate duration; `verified-official-variable` for official variable duration; `needs-manual-verification` when no official duration is shown. |
| `durationMinutes` | Official exact credited duration in minutes only. Use `null` when the provider does not display one or only gives a range/variable duration. |
| `estimatedMinutes` | Current app field for duration display, time-fit recommendations, progress credit, and reports. Use `null` when no exact duration should be credited. |
| `durationNote` | Explain the official duration evidence, variable duration, or why no duration is credited. |

Duration does not have to block activation by itself. A resource may be active when title, destination, free access, and curriculum relevance are verified while duration is transparently unknown. In that case, set duration fields to `null`, explain the no-duration condition, and do not use the resource for hour-credit claims unless an approved internal activity defines credited minutes.

### Learning Metadata

| Field | Rule |
| --- | --- |
| `professionalFields` | Use configured field names. Use `All fields` only when the resource is broadly applicable across fields. |
| `workPatterns` | Use configured work-pattern IDs. Do not derive work pattern from professional field alone. |
| `practicalFluencyLevels` | Use practical fluency IDs from the taxonomy. |
| `technicalOrientations` | Use technical-orientation IDs from the taxonomy. |
| `learningGoals` | Use learning-goal IDs from the taxonomy. |
| `responsibilityIds` | Use responsibility IDs from the taxonomy. |
| `pathStage` | Must be one of the five learning path stages. |
| `format` and `formatId` | Use the format taxonomy. |
| `tags` | Use short lowercase tags such as `governance`, `prompting`, `machine-learning`, `healthcare`, `education`, `verification`, `data`, `hands-on`, or provider tags. |

## Professional Taxonomy

### Professional Fields

Use these configured field names:

- Intelligence, research, and analysis
- Operations and mission planning
- Maintenance
- Logistics
- Acquisition and program management
- Cybersecurity and information technology
- Software development, data, and AI
- Healthcare
- Education, training, and communication
- Leadership, policy, and governance
- Administration and general support
- Other

Catalog-only broad applicability value:

- All fields

Use `All fields` only for broadly useful AI foundations, responsible-use content, or general productivity resources. Do not use `All fields` to avoid doing relevance analysis.

### Work Patterns

| ID | Label | Description |
| --- | --- | --- |
| `analyze-information` | Analyze information | Research, compare sources, identify patterns, summarize evidence, and produce assessments. |
| `create-communicate` | Create and communicate | Draft reports, presentations, instructions, correspondence, educational material, or other products. |
| `plan-decide` | Plan and decide | Develop options, identify assumptions, evaluate tradeoffs, plan activities, and support decisions. |
| `build-automate` | Build and automate | Write code, query or manipulate data, automate workflows, and develop technical systems. |
| `sustain-optimize` | Sustain and optimize | Troubleshoot equipment or processes, forecast requirements, improve workflows, and support maintenance or logistics. |
| `lead-govern` | Lead and govern | Supervise personnel, review AI-assisted products, approve decisions, establish policy, manage risk, and assign accountability. |

Professional field and work pattern must remain separate. For example, a healthcare user may analyze information, create communications, lead and govern, or use ordinary software; the field alone does not determine the path.

### Practical AI Fluency

| ID | Label |
| --- | --- |
| `new-to-ai` | New to AI |
| `foundational-user` | Foundational user |
| `applied-user` | Applied user |
| `advanced-practitioner` | Advanced practitioner |

### Technical Orientation

| ID | Label |
| --- | --- |
| `general-user` | General user |
| `productivity-low-code` | Productivity and low-code user |
| `developer-data-practitioner` | Developer or data practitioner |
| `ai-ml-builder` | AI/ML builder |

Technical orientation is not the same as practical AI fluency. Coding experience alone should not imply advanced practical fluency, and governance experience alone should not imply advanced technical orientation.

### Learning Path Stages

Every generated path must include all five stages:

1. AI foundation
2. Responsible use and output evaluation
3. Role-aligned application
4. Hands-on practice
5. Optional deeper learning

### Learning Goals

| ID | Label |
| --- | --- |
| `ai-terminology-capabilities` | Understand AI terminology and capabilities |
| `generative-ai-productivity` | Use generative AI for everyday productivity |
| `research-analysis` | Improve research and analysis |
| `writing-communication` | Improve writing and communication |
| `work-with-data` | Work with data |
| `automate-repetitive-tasks` | Automate repetitive tasks |
| `evaluate-outputs` | Evaluate AI outputs and reduce errors |
| `responsible-use-risk` | Understand responsible use, policy, and risk |
| `supervise-ai-work` | Supervise AI-assisted work |
| `build-ai-apps` | Build AI-enabled applications |
| `understand-machine-learning` | Understand machine learning |
| `teach-others` | Teach others to use AI |

### Responsibility IDs

| ID | Label |
| --- | --- |
| `own-tasks` | I primarily complete my own tasks |
| `review-others` | I review other people's work |
| `supervise-approve` | I supervise personnel or approve products |
| `policy-risk` | I develop policy or manage organizational risk |
| `build-operate-systems` | I build or operate technical systems |

### Format IDs

| ID | Label |
| --- | --- |
| `reading` | Reading |
| `video` | Video |
| `interactive-lesson` | Interactive lesson |
| `hands-on-lab` | Hands-on exercise or lab |

## Direct Versus Inferred Relevance

Direct relevance means the official title, description, learning objectives, provider metadata, or course modules explicitly support the selected field, work pattern, learner level, or learning goal.

Inferred relevance is allowed when public objectives clearly map to a work pattern or learning need, but the official page does not name the field. When relevance is inferred, record the inference and supporting evidence in the candidate record or decision log.

Do not infer relevance from:

- Rank, seniority, service, unit, duty location, clearance, weapon system, mission, or operational context.
- Broad claims such as "AI applies to everyone" without a specific field, work pattern, stage, or learning goal.
- Paid product marketing pages that do not provide accessible learning content.
- Public landing pages where the full course, free status, destination, or relevant content cannot be verified.

## Verification Workflow

For each candidate resource:

1. Open the exact official provider page.
2. Confirm the page is active.
3. Confirm the exact current title and provider.
4. Confirm whether learning content is free to access.
5. Classify access using the controlled vocabulary above.
6. Record official duration only when displayed by the provider.
7. If no exact official duration is available, explain the duration condition and whether any completion credit is recommended.
8. Record prerequisites and account requirements.
9. Record `lastReviewedAt` for the candidate or `lastVerifiedAt` for a production record.
10. Record the official page in `officialSourceUrl` for candidates or `sourceUrl` for production records.
11. Keep the resource inactive if free status, title, destination, source evidence, or curriculum relevance cannot support the app's claims.

Special case: NIST AI RMF Playbook should be treated as a guided reference activity, not a conventional course. Do not credit the whole document automatically without an internal Pathfinder activity.

## Resource Quality Rubric

Score these from 1 to 5 in candidate records. Scores inform human review; they do not automatically approve or reject a resource.

| Criterion | What To Check |
| --- | --- |
| Credibility | Official or reputable provider, stable source, transparent authorship or institutional backing. |
| Instructional substance | Clear teaching content rather than a thin overview or marketing page. |
| Role relevance | Resource actually delivers the claimed field, work-pattern, or specialty capability. |
| Accessibility | Captions, transcripts, readable structure, keyboard-friendly public pages, or accessible alternative formats when visible. |
| Vendor neutrality | Educational balance versus excessive product promotion or lock-in. |
| Currency | Recent enough for the topic, maintained, or still conceptually valid. |
| User friction | Reasonable access path, account requirements, prerequisites, and product requirements. |

Additional review prompts:

- Are learning objectives clear?
- Is depth appropriate for the mapped learner level?
- Are there opportunities for practice, reflection, or knowledge checking?
- Are prerequisites realistic for the mapped audience?
- Does the resource require paid labs, cloud credits, proprietary products, or institutional entitlement?
- Does the resource use examples that can be understood without sensitive mission details?

## Provider Diversity Rule

Provider concentration is not itself a reason to reject a strong resource. However, each research report should identify when a specialty, learning-path stage, or learner level is dominated by one provider and should actively search for credible alternatives.

This rule is intended to prevent the catalog from becoming an index of a single provider when comparable free resources exist elsewhere.

## Re-Verification Policy

- Recheck active resources every 180 days.
- Recheck inactive provisional resources before reconsideration.
- Recheck immediately when a user reports a broken link, changed pricing, inaccessible content, redirected destination, or inaccurate metadata.
- Mark a resource `needs-reverification` when its verification age exceeds the threshold or material metadata may have changed.
- Verify the complete active catalog before a formal pilot, public release, or major catalog update.

## Decision Log

Do not maintain a growing course-by-course decision log in this durable guide. Use:

```text
docs/research-decision-log.md
```

Required decision-log columns:

- Resource
- Provider
- Official source
- Research status
- Verification status
- Active
- Access classification
- Reason accepted or rejected
- Outstanding question
- Last reviewed

Provider-specific unresolved cases, such as OpenAI Academy access uncertainty or AWS final-destination free-tier verification, belong in the decision log unless they become durable general rules.

## Gap Review

When proposing a new resource, identify what gap it fills:

- Missing professional field coverage
- Missing work-pattern coverage
- Missing beginner foundation
- Missing responsible-use or output-evaluation coverage
- Missing role-aligned application
- Missing hands-on practice
- Missing optional deeper learning
- Missing format preference, such as video or short reading
- Missing low-time option under 30 or 60 minutes
- Replacement for an inactive provisional record
- Provider diversity improvement

Use `docs/SPECIALTY_RESEARCH_LENSES.md` for a more detailed specialty and capability search framework.

## Evidence And Literature Summary Needs

The repository currently documents product rationale in `docs/PRODUCT_SPEC.md`, especially:

- Joint Force design context
- Role alignment principle
- Five-stage learning path requirement
- Five- and ten-hour milestone disclaimer
- Privacy and information-handling boundaries

Further research may summarize external evidence for:

- Role-aligned adult learning and job-relevant training design
- Scenario-based assessment over self-rated expertise
- Responsible AI literacy, verification, and human oversight
- Professional learning milestones as engagement measures rather than proficiency certification
- Military or public-sector AI education needs stated in public, nonsensitive sources

Do not add literature claims to the product or catalog unless the source is public, official or otherwise reputable, and cited separately.
