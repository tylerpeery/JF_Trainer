# AI Training Pathfinder

AI Training Pathfinder is a small demonstration MVP that will help users find free AI training relevant to their professional field, work patterns, practical AI fluency, technical orientation, learning goals, and available time.

Users will complete a short assessment, receive an explainable learning path, follow links to reputable free external training, and track progress through professional learning milestones.

## Project Status

This project is implemented through Phase 3: Catalog, Config, and Recommendation Engine. Phase 3 includes the static application shell, safety warning, configuration data, storage foundation, Joint Force-oriented assessment flow, profile scoring with evidence explanations, validation, verified free-resource catalog records, deterministic recommendations, internal practice cards, tests, and profile-accuracy feedback.

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
- Curated catalog of verified free external AI training
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

The current static project structure is:

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
|   |-- applied-practice-cards.json
|   |-- assessment-questions.json
|   |-- milestones.json
|   |-- recommendation-config.json
|   `-- training-resources.json
|-- docs/
|   |-- IMPLEMENTATION_PLAN.md
|   `-- PRODUCT_SPEC.md
|-- package.json
|-- js/
|   |-- app.js
|   |-- assessment.js
|   |-- assessment-validation.js
|   |-- catalog.js
|   |-- configuration.js
|   |-- recommendations.js
|   `-- storage/
|       |-- local-storage.js
|       `-- storage-manager.js
`-- tests/
    |-- phase2-assessment.test.js
    `-- phase3-recommendations.test.js
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

## Running Tests

Automated checks use Node's built-in test runner with no external test dependency:

```bash
node --test
```

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

## Current Phase 3 Behavior

Implemented through Phase 3:

- Responsive static app shell
- Landing page
- Assessment flow
- Pure assessment validation
- Generated My Path view
- Training Catalog view
- Placeholder Progress view
- Information-handling warning
- Accessible guest/demo entry point
- Configuration JSON
- localStorage adapter foundation
- Separate practical AI fluency and technical-orientation scoring
- Plain-language result evidence without showing raw numeric scores in the normal interface
- Profile accuracy feedback
- Verified free external training-resource records with evidence notes
- Deterministic recommendation scoring using editable JSON weights and thresholds
- Five-stage recommended learning path
- Internal fictional applied-practice cards

Phase 3 does not include full progress tracking, achievements, Supabase, authentication, guest-to-account transfer, or production completion attestation.

## Training Catalog

The training catalog includes verified free resources from reputable providers, with source notes and verification dates stored in `data/training-resources.json`.

Course titles, links, durations, certificate information, pricing status, and providers must be verified before being presented as factual. When a fact is not verified, the catalog record must say so rather than guessing.

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

The MVP should collect only the minimum information required to create recommendations and track learning progress. Phase 3 collects assessment selections and optional profile-accuracy feedback; progress tracking remains deferred.

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
