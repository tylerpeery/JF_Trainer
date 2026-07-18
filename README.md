# jftrainer
An AI tailored and AI vectored training for members to reach AI activation within the JF, geared toward their specialty and experience levels.

# AI Training Pathfinder

AI Training Pathfinder is a small demonstration tool designed to help users find free AI training that is relevant to their professional field, work activities, experience level, learning goals, and available time.

Users complete a short assessment, receive an explainable learning path, follow links to external training resources, and track their progress toward configurable learning milestones.

## Project Status

This project is currently an early MVP intended for a pilot group of approximately 3–12 users.

It is not intended for large-scale deployment, enterprise use, official certification, or operational-readiness determinations.

## Planned Features

* Short AI experience and learning-needs assessment
* Separate practical AI fluency and technical-orientation profiles
* Role- and work-pattern-based training recommendations
* Explainable recommendation logic
* Curated catalog of free external AI training
* Guest mode using browser storage
* Optional user accounts with globally saved progress
* Training completion tracking
* Five- and ten-hour learning milestones
* Professional achievements and progress indicators
* Short role-aligned practice activities
* Resource relevance and difficulty feedback

## Learning Milestones

The application may display milestones such as:

* Path Selected
* Orientation Complete
* Foundation Building
* Adoption Momentum
* Applied Foundation
* Continued Development

These milestones measure learning participation and engagement.

They do not represent certification, authorization, mission readiness, or validated professional proficiency.

## Initial Technology Approach

The initial MVP is expected to use:

* HTML
* CSS
* JavaScript ES modules
* GitHub Pages
* Browser `localStorage` for guest mode
* Supabase for optional authentication and globally saved progress
* A static JSON training catalog
* A deterministic, rules-based recommendation engine

The initial version will not use React, Vite, a custom application server, or an LLM API unless later development demonstrates a clear need.

## Project Structure

The final structure may evolve, but the repository is expected to resemble:

```text
ai-training-pathfinder/
├── index.html
├── README.md
├── AGENTS.md
├── assets/
├── css/
│   └── styles.css
├── data/
│   └── training-resources.json
├── docs/
│   ├── PRODUCT_SPEC.md
│   └── IMPLEMENTATION_PLAN.md
└── js/
    ├── app.js
    ├── assessment.js
    ├── catalog.js
    ├── configuration.js
    ├── progress.js
    ├── recommendations.js
    └── storage.js
```

## Running Locally

Because this project uses JavaScript modules and may load JSON files, it should be opened through a local web server rather than by double-clicking `index.html`.

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
2. Open the repository’s **Settings**.
3. Select **Pages**.
4. Choose deployment from a branch.
5. Select the appropriate branch, usually `main`.
6. Select the repository root as the publishing folder.
7. Save the settings.
8. Wait for GitHub to publish the site.

The published address will normally resemble:

```text
https://USERNAME.github.io/REPOSITORY-NAME/
```

All internal file paths should be relative so the application works correctly from a GitHub Pages repository subdirectory.

## Guest Mode

Guest-mode progress is stored in the user’s browser.

Guest users should be informed that:

* Their progress remains on the same browser and device.
* Clearing browser data may erase their progress.
* Progress will not automatically transfer between devices.
* Export and reset controls should be available.

## Account Mode

A later phase will use Supabase to provide:

* User authentication
* Cross-device progress
* Saved assessment results
* Training completion records
* Earned achievements

Supabase Row Level Security must ensure that users can only access their own profile and progress records.

No Supabase service-role key or other private credential may be included in browser code or committed to this repository.

## Training Catalog

The training catalog will include free resources from reputable providers.

Potential providers include:

* IBM SkillsBuild
* Microsoft Learn
* Elements of AI
* Google Machine Learning education
* AWS Skill Builder
* NIST
* OpenAI Academy, after access and cost are verified

Course titles, links, durations, certificate information, and pricing status must be verified before being presented as factual.

The application must not invent training resources or course details.

## Privacy and Information Handling

This project is not designed to collect or process sensitive information.

Users should not enter:

* Classified information
* Controlled unclassified information
* Operationally sensitive information
* Protected medical information
* Personally identifiable information
* Proprietary organizational information
* Account credentials or passwords

The MVP should collect only the minimum information required to create recommendations and track learning progress.

## Accessibility

The project should follow accessible web-design practices, including:

* Semantic HTML
* Keyboard navigation
* Accessible form labels
* Sufficient contrast
* Screen-reader-friendly progress indicators
* Reduced-motion support
* No information communicated through color alone

The target is general alignment with WCAG 2.1 AA practices.

## Recommendation Approach

The initial recommendation system will use transparent rules rather than an AI model.

Recommendations may consider:

* Professional field
* Common work patterns
* Practical AI fluency
* Technical orientation
* Learning goals
* Available weekly time
* Preferred learning format
* Course prerequisites
* Previously completed resources
* Provider diversity

Each recommendation should include a plain-language explanation of why it was selected.

## Development Principles

* Keep the initial implementation simple.
* Separate recommendation logic from the interface.
* Separate storage logic from the interface.
* Keep configuration values editable.
* Use stable identifiers for resources and achievements.
* Avoid unnecessary dependencies.
* Do not fabricate external resource information.
* Preserve accessibility and mobile usability.
* Verify normal user flows before marking a phase complete.

## Contributing

This repository is currently an experimental MVP.

Before making substantial changes, review:

* `AGENTS.md`
* `docs/PRODUCT_SPEC.md`
* `docs/IMPLEMENTATION_PLAN.md`

Changes that affect product behavior, architecture, data handling, or milestone definitions should also update the relevant documentation.

## License

A license has not yet been selected.

Until a license is added, the absence of a license should not be interpreted as permission to reuse, distribute, or modify the project outside applicable copyright rules.
