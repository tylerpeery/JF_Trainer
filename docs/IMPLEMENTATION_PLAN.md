# AI Training Pathfinder Implementation Plan

`docs/IMPLEMENTATION_PLAN.md` is the authoritative source for implementation phases, acceptance criteria, dependencies, and current phase status.

## Current Phase Status

- Phase 1: Complete
- Phase 2: Complete, repaired against the Joint Force assessment requirements
- Phase 3: Complete
- Phase 4: Complete
- Phase 5: Not started
- Phase 6: Not started

Phase 5 and later work must not begin without a separate instruction.

## Assumptions

- The MVP remains a static GitHub Pages application with no build process.
- `docs/PRODUCT_SPEC.md` controls product requirements.
- `README.md` is public overview documentation and is not authoritative.
- Supabase is deferred until Phase 5.
- Phase 3 catalog records are production training-resource records with verification notes.
- Account mode and guest transfer are intentionally deferred.

## Phase 1: Static App Shell And Safety Baseline

Status: Complete, repaired against the Joint Force assessment requirements

Scope:

- Create the durable documentation setup: `AGENTS.md`, `docs/PRODUCT_SPEC.md`, and `docs/IMPLEMENTATION_PLAN.md`.
- Create a GitHub Pages-compatible static app using `index.html`, responsive CSS, and ES modules.
- Add a responsive application shell, landing page, basic view-based navigation, and placeholder views for Assessment, My Path, Training Catalog, and Progress.
- Display a clear information-handling warning.
- Add an accessible guest/demo-mode entry point.
- Add configuration JSON for fields, work patterns, fluency levels, technical-orientation levels, milestones, and achievements.
- Add storage interface and localStorage adapter foundation with safe handling for missing or corrupted app-owned data.
- Add a small catalog containing only unmistakably labeled unverified sample records.
- Update `README.md` with local run and GitHub Pages instructions.

Acceptance criteria:

- The application runs through a basic local static server without a build step.
- Landing page and placeholder views work.
- Navigation is usable with a keyboard.
- The information-handling warning is clearly displayed.
- Relative paths are suitable for a GitHub Pages repository subdirectory.
- Configuration data is separated from UI code.
- Storage abstraction exists without coupling storage to the interface.
- Missing or corrupted localStorage does not crash the app.
- No external training information is presented as verified unless supporting evidence exists.
- `AGENTS.md`, `docs/PRODUCT_SPEC.md`, and `docs/IMPLEMENTATION_PLAN.md` are present and internally consistent.
- No browser console errors appear during the normal Phase 1 flow.
- No private credentials or secrets are committed.
- No Phase 2 or later functionality is implemented.

Dependencies:

- None beyond a local static server for manual verification.

## Phase 2: Assessment And Profile Scoring

Status: Complete

Scope:

- Implement the 10 to 12 question assessment.
- Enforce field and work-pattern selection limits.
- Calculate practical AI fluency and technical orientation separately.
- Capture whether the result seems accurate.
- Save the guest assessment result and profile-accuracy feedback in the existing localStorage foundation.
- Use pure validation logic for required answers, selection limits, unknown option IDs, and contradictory selections.
- Apply configurable scoring weights plus explicit eligibility gates.
- Display plain-language evidence explanations without exposing raw scores in the normal interface.
- Safely discard incompatible old Phase 2 assessment results without clearing unrelated guest data.

Acceptance criteria:

- Assessment completes in one flow.
- Results include separate fluency and technical-orientation dimensions.
- Selection limits are enforced.
- Primary field cannot also be selected as a secondary field.
- Learning goals are limited to one to three selections.
- `None yet` and `No preference` are enforced as mutually exclusive choices.
- No required free text is introduced.
- Phase 1 safety warning remains visible or readily available.
- Technical orientation cannot be inflated by governance, supervision, output verification, responsible information handling, or use frequency alone.
- Practical fluency cannot be inflated to Applied user or Advanced practitioner by frequency, coding, or hypothetical scenario answers alone.
- Results include meaningful evidence explanations for both dimensions.
- Saved answers and profile-accuracy feedback are restored when the assessment is revisited.
- Incompatible old assessment data is handled safely.
- `node --test` passes.
- No recommendation scoring or catalog matching is implemented.

Dependencies:

- Phase 1 app shell, configuration loading, and storage foundation.

## Phase 3: Catalog, Config, And Recommendation Engine

Status: Complete

Scope:

- Replace sample catalog records with approximately 12 to 15 verified free resources.
- Keep inactive provisional records for supplied resources whose exact destination, free status, or duration claim cannot be verified sufficiently.
- Implement deterministic recommendation scoring using editable weights and thresholds.
- Ensure every path includes all five required stages.
- Produce plain-language explanations for recommendations.
- Add internal applied-practice cards.
- Keep recommendation logic separate from UI and storage code.
- Keep recommendation weights and thresholds editable in JSON.

Acceptance criteria:

- No fabricated resource facts appear in the catalog.
- Each active production catalog record has verification evidence, an official source URL, a last verified date, an access classification, and either an official duration or a clear no-duration claim.
- Inactive provisional records are not recommended.
- Recommendation logic has no UI or storage dependency.
- Every generated path includes AI foundation, responsible use and output evaluation, role-aligned application, hands-on practice, and optional deeper learning.
- `node --test` passes for recommendation path coverage, catalog validation, and Phase 2 regression tests.
- No Phase 4 progress tracking, completion controls, milestones, or achievement calculation is implemented.

Dependencies:

- Phase 2 assessment profile output.
- Manual verification of production catalog data.

## Phase 4: Guest Progress, Milestones, And Achievements

Status: Complete

Scope:

- Implement guest progress tracking in `localStorage`.
- Add start, complete, undo completion, optional completion date, optional takeaway, feedback, export, and reset.
- Add milestone, progress-point, badge, and achievement displays.
- Prevent duplicate credit when completion status is toggled.
- Keep milestone reflection prompts optional and limited to nonsensitive information.

Acceptance criteria:

- Completion toggling cannot double-count time, XP, or achievements.
- Milestones do not promote expertise level.
- Five- and ten-hour reflections are optional.
- Export and reset work for guest mode.
- `node --test` passes for progress, milestone, achievement, recommendation, and assessment regression coverage.

Dependencies:

- Phase 3 catalog and recommendation outputs.

## Phase 5: Supabase Account Mode

Status: Not started

Scope:

- Add Supabase browser client setup.
- Add authentication UI.
- Add account storage adapter.
- Add schema planning and Row Level Security SQL.
- Save assessment, progress, feedback, achievements, and milestone reflections per authenticated user.

Acceptance criteria:

- Authenticated users can access only their own rows.
- Guest mode still works without Supabase.
- Browser code contains no service-role key or private secret.
- Auth redirects work on GitHub Pages.

Dependencies:

- Stable guest data model from Phase 4.
- Supabase project configuration.

## Phase 6: Guest Transfer, Polish, And Pilot Readiness

Status: Not started

Scope:

- Add guest-to-account import.
- Deduplicate imported records by stable IDs.
- Complete accessibility and mobile layout pass.
- Add accessible completion animation with reduced-motion fallback.
- Add pilot-readiness checklist.

Acceptance criteria:

- Guest import preserves progress and avoids duplicates.
- App meets WCAG 2.1 AA-oriented checks.
- Guest and account flows pass manual pilot tests.
- Deferred or known limitations are documented.

Dependencies:

- Phase 5 account mode.

## Deferred Work

The following are not part of Phase 4:

- Supabase implementation
- Authentication
- Guest-to-account transfer
- Enterprise integrations
- Organization dashboards
- Automated certificate verification
- LLM-generated recommendations
