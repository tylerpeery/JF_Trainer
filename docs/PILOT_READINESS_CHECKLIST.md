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
- Create a Supabase email/password account from localhost and from the GitHub Pages URL.
- Sign out, then sign back in with email/password without requiring a new authentication email.
- Confirm invalid-password and duplicate-account attempts show safe Supabase Auth error messages and do not alter guest data.
- Send an optional magic link and confirm rate-limit or email-delivery failures are handled clearly.
- For an account originally created or used through magic-link sign-in, use password reset to set a password before testing email/password sign-in for that account.
- Test password-reset email preparation, noting that delivery requires working SMTP/email settings.
- Open a password-reset email link and confirm the app returns to `?mode=password-recovery`.
- Confirm the password-recovery form appears instead of display-name onboarding, guest-data transfer, or ordinary account setup prompts.
- Confirm mismatched, short, expired-session, and valid password-recovery cases are handled clearly.
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
- Password-recovery redirect URLs with `?mode=password-recovery` are allow-listed for GitHub Pages and localhost.
- Supabase Email provider is enabled for email/password auth, password reset, and optional magic links.
- If email confirmation is disabled during the controlled pilot, the UI does not claim that addresses are verified.
- Custom SMTP is configured before wider deployment, then email confirmation is re-enabled and retested.

## Known MVP Limitations

- Completion is based on user attestation.
- Milestones, points, and achievements indicate learning engagement only.
- The app does not certify proficiency, authorization, mission readiness, or job qualification.
- Organization dashboards, reporting roles, supervisor views, and administrator access are not implemented.
- Automated certificate verification is not implemented.
- Enterprise or CAC authentication is not implemented.
- Catalog updates remain manual JSON edits with human verification.
- Password reset, email verification, and magic links depend on Supabase email delivery and custom SMTP readiness.
- The app does not process classified, controlled, operationally sensitive, medical, personally identifiable, proprietary, credential, or other protected information.
