# AI Training Pathfinder

AI Training Pathfinder is a small demonstration MVP that will help users find free AI training relevant to their professional field, work patterns, practical AI fluency, technical orientation, learning goals, and available time.

Users will complete a short assessment, receive an explainable learning path, follow links to reputable free external training, and track progress through professional learning milestones.

## Project Status

This project is implemented through Phase 2: Assessment and Profile Scoring. Phase 2 includes the static application shell, safety warning, configuration data, sample-only catalog records, storage foundation, assessment flow, profile scoring, and profile-accuracy feedback.

It is intended for a small pilot group of approximately 3 to 12 testers. It is not intended for large-scale deployment, enterprise use, official certification, or operational-readiness determinations.

Authoritative documentation:

- Product requirements: `docs/PRODUCT_SPEC.md`
- Implementation phases and acceptance criteria: `docs/IMPLEMENTATION_PLAN.md`
- Repository working instructions: `AGENTS.md`

`README.md` is a public overview and is not authoritative when it conflicts with the product specification.

## Planned Features

- Short AI experience and learning-needs assessment
- Separate practical AI fluency and technical-orientation profiles
- Role- and work-pattern-based training recommendations
- Explainable recommendation logic
- Curated catalog of free external AI training
- Guest mode using browser storage
- Optional user accounts with globally saved progress
- Training completion tracking
- Five- and ten-hour learning milestones
- Professional achievements and progress indicators
- Short role-aligned practice activities
- Resource relevance and difficulty feedback

## Technology Approach

The MVP uses:

- HTML
- CSS
- JavaScript ES modules
- GitHub Pages
- Browser `localStorage` for guest mode
- Supabase for optional authentication and globally saved progress, deferred until Phase 5
- Static JSON configuration and catalog data
- A deterministic, rules-based recommendation engine in a later phase

The MVP does not use React, Vite, TypeScript, a custom application server, or an LLM API.

## Project Structure

The Phase 1 structure is:

```text
ai-training-pathfinder/
|-- index.html
|-- README.md
|-- AGENTS.md
|-- css/
|   `-- styles.css
|-- data/
|   |-- achievements.json
|   |-- app-config.json
|   |-- milestones.json
|   `-- training-resources.json
|-- docs/
|   |-- IMPLEMENTATION_PLAN.md
|   `-- PRODUCT_SPEC.md
`-- js/
    |-- app.js
    |-- catalog.js
    |-- configuration.js
    `-- storage/
        |-- local-storage.js
        `-- storage-manager.js
```

## Running Locally

Because this project uses JavaScript modules and loads JSON files, open it through a local web server rather than by double-clicking `index.html`.

One simple option is Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Another option is the Live Server extension for Visual Studio Code.

## GitHub Pages Deployment

The site is intended to be published through GitHub Pages.

General setup:

1. Push the project to a GitHub repository.
2. Open the repository's Settings.
3. Select Pages.
4. Choose deployment from a branch.
5. Select the appropriate branch, usually `main`.
6. Select the repository root as the publishing folder.
7. Save the settings.
8. Wait for GitHub to publish the site.

The published address will normally resemble:

```text
https://USERNAME.github.io/REPOSITORY-NAME/
```

All internal file paths should remain relative so the application works correctly from a GitHub Pages repository subdirectory.

## Current Phase 2 Behavior

Implemented through Phase 2:

- Responsive static app shell
- Landing page
- Assessment flow
- Placeholder views for My Path, Training Catalog, and Progress
- Information-handling warning
- Accessible guest/demo entry point
- Configuration JSON
- localStorage adapter foundation
- Separate practical AI fluency and technical-orientation scoring
- Profile accuracy feedback
- Unverified sample catalog records clearly labeled as sample data

Phase 2 does not include recommendation scoring, full progress tracking, achievements, Supabase, authentication, guest-to-account transfer, or production training-resource data.

## Training Catalog

The production training catalog will include verified free resources from reputable providers in a later phase.

Course titles, links, durations, certificate information, pricing status, and providers must be verified before being presented as factual. The current catalog records are unverified sample data only.

## Privacy And Information Handling

This project is not designed to collect or process sensitive information.

Users should not enter:

- Classified information
- Controlled information
- Operationally sensitive information
- Protected medical information
- Personally identifiable information
- Proprietary organizational information
- Account credentials or passwords

The MVP should collect only the minimum information required to create recommendations and track learning progress. Phase 2 collects assessment selections and optional profile-accuracy feedback.

## Accessibility

The project should follow accessible web-design practices, including:

- Semantic HTML
- Keyboard navigation
- Accessible form labels
- Sufficient contrast
- Screen-reader-friendly progress indicators
- Reduced-motion support
- No information communicated through color alone

The target is general alignment with WCAG 2.1 AA practices.

## Development Notes

- Keep the initial implementation simple.
- Separate recommendation logic from the interface.
- Separate storage logic from the interface.
- Keep configuration values editable.
- Use stable identifiers for resources and achievements.
- Avoid unnecessary dependencies.
- Do not fabricate external resource information.
- Preserve accessibility and mobile usability.
- Verify normal user flows before marking a phase complete.

## License

A license has not yet been selected.

Until a license is added, the absence of a license should not be interpreted as permission to reuse, distribute, or modify the project outside applicable copyright rules.
