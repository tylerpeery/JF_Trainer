# Pilot Readiness Checklist

Use this checklist before sharing AI Training Pathfinder with pilot testers. `docs/PRODUCT_SPEC.md` remains authoritative for product requirements, and `docs/IMPLEMENTATION_PLAN.md` remains authoritative for phase acceptance criteria.

## Required Manual Checks

- Run the app from a local static server at `http://localhost:8000/`.
- Confirm the safety warning is visible before entering the assessment.
- Complete the assessment with keyboard and pointer controls.
- Confirm the generated path includes all five learning-path stages.
- Start and complete at least one resource or practice card.
- Confirm completion produces a visible confirmation and that reduced-motion mode does not rely on motion.
- Undo and re-complete the same item, then confirm time, points, milestones, and achievements are not duplicated.
- Export guest data and confirm the file contains only app-managed assessment, progress, feedback, reflection, and achievement state.
- Reset guest data and confirm assessment, progress, reflections, and achievements are cleared.
- Sign in with Supabase account mode from localhost and from the GitHub Pages URL.
- Import guest data while signed in and confirm duplicate resource, milestone, and achievement IDs are merged.
- Sign out and sign back in, then confirm account assessment and progress persist.
- Test a second account and confirm it cannot see or overwrite the first account's rows.
- Confirm no browser console errors appear during the normal pilot flow.
- Confirm mobile layout at narrow viewport widths does not overlap controls or text.

## Accessibility Checks

- All navigation and form controls are reachable by keyboard.
- Visible focus appears on links, buttons, inputs, selects, textareas, and the skip link.
- Form controls have visible labels.
- Validation and status messages are announced through live regions or visible text.
- Color is not the only signal for status, milestones, or achievement state.
- Text remains readable and usable at mobile widths.
- Reduced-motion mode avoids smooth scrolling and disables completion animation motion.

## Supabase Checks

- `supabase/schema.sql` has been applied in the Supabase SQL editor.
- Row Level Security is enabled on every `pathfinder_*` table.
- Normal authenticated-user policies scope every table to `auth.uid() = user_id`.
- Frontend configuration contains only the Supabase project URL and browser-safe publishable key.
- No service-role key, database password, JWT signing secret, or private key is present in browser code.
- GitHub Pages and localhost redirect URLs are allow-listed in Supabase Auth settings.

## Known MVP Limitations

- Completion is based on user attestation.
- Milestones, points, and achievements indicate learning engagement only.
- The app does not certify proficiency, authorization, mission readiness, or job qualification.
- Organization dashboards, reporting roles, supervisor views, and administrator access are not implemented.
- Automated certificate verification is not implemented.
- Enterprise or CAC authentication is not implemented.
- Catalog updates remain manual JSON edits with human verification.
- The app does not process classified, controlled, operationally sensitive, medical, personally identifiable, proprietary, credential, or other protected information.
