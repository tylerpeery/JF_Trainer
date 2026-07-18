# Repository Instructions

This repository implements the AI Training Pathfinder MVP as a static GitHub Pages application. `docs/PRODUCT_SPEC.md` is authoritative for product requirements, and `docs/IMPLEMENTATION_PLAN.md` is authoritative for phases and acceptance criteria. `README.md` is a public overview only.

## Architecture

- Use plain HTML, responsive CSS, and plain JavaScript ES modules.
- Do not add React, Vite, TypeScript, Next.js, a custom application server, or an LLM API for the MVP unless the product spec and implementation plan are explicitly updated.
- Keep file paths relative so the app works from a GitHub Pages repository subdirectory.
- Keep recommendation logic separate from UI code and storage code.
- Keep configuration data in `data/` JSON files.

## Important Directories

- `index.html`: static application entrypoint.
- `css/`: global responsive styles.
- `js/`: ES modules for app shell, configuration, catalog loading, and storage.
- `js/storage/`: storage interface and adapters.
- `js/supabase-client.js` and `js/account-mode.js`: Supabase browser client setup and authentication UI.
- `data/`: editable configuration, milestones, achievements, and catalog data.
- `docs/`: authoritative product and implementation documentation.
- `supabase/schema.sql`: Phase 5 hybrid account-mode schema and Row Level Security SQL.
- `docs/PILOT_READINESS_CHECKLIST.md`: Phase 6 manual pilot verification checklist.

## Security And Data Handling

- Never commit private credentials, secrets, Supabase service-role keys, or private API keys.
- Browser code may only use the Supabase project URL and browser-safe publishable key.
- Passwords must go only through Supabase Auth methods; never store passwords in Pathfinder tables, browser storage, exports, logs, or custom hashes.
- Supabase account storage uses one app-state snapshot row plus normalized report tables; keep all user-owned tables protected by Row Level Security.
- Warn users not to enter classified, controlled, operationally sensitive, medical, personally identifiable, proprietary, credential, or other protected information in assessment, progress, or feedback fields.
- Do not fabricate external training titles, providers, URLs, durations, certificates, free status, or verification evidence.
- Placeholder catalog entries must be unmistakably labeled as unverified sample data.

## Accessibility

- Use semantic HTML, accessible form labels, keyboard-accessible controls, visible focus states, sufficient contrast, screen-reader-friendly status text, and reduced-motion support.
- Do not communicate information through color alone.
- Check mobile and desktop layouts before declaring UI work complete.

## Run And Verify

Run locally through a static server because ES modules and JSON files are loaded by the browser:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/`.

Before declaring a task complete:

- Run `node --test` when automated tests are present.
- Verify the normal navigation flow with keyboard and pointer.
- Confirm the safety warning is clearly visible.
- Confirm missing or corrupted app-owned `localStorage` does not crash the app.
- Confirm no browser console errors appear in the normal approved flow.
- Confirm no later-phase functionality was implemented unless separately requested.
- For pilot-readiness changes, review `docs/PILOT_READINESS_CHECKLIST.md`.
- Review the diff and update `docs/PRODUCT_SPEC.md` or `docs/IMPLEMENTATION_PLAN.md` when behavior, scope, phases, or acceptance criteria change.
