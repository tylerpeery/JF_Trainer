# Supabase Schema And RLS Plan

Phase 5 uses Supabase only for optional account mode. Guest mode continues to work without Supabase.

## Security Model

- Browser code may use only the Supabase project URL and browser-safe publishable key.
- Never place a service-role key, private key, database password, or other secret in frontend code.
- Passwords are handled only by Supabase Auth. Do not add Pathfinder columns, JSON fields, local storage records, exports, logs, or custom hashes for passwords.
- Row Level Security must be enabled before pilot account testing.
- Authenticated users may read, insert, update, and delete only their own Pathfinder rows.
- SQL must explicitly revoke application-table privileges from unauthenticated roles and grant only necessary table privileges to `authenticated`.
- The app-managed account tables store normalized application state and reportable fields by `user_id`; they do not store rank, unit, duty location, clearance, mission, weapon system, or operational details.

## Hybrid MVP Tables

Phase 5 uses a hybrid model:

- `pathfinder_user_states` keeps the full app-state snapshot for app restore and account sync.
- Normalized report tables expose dashboard-friendly fields without requiring JSONB extraction for common pilot metrics.

This keeps the frontend storage model simple while making later dashboards and reports easier to build.

Phase 6 guest-to-account import uses the same tables. Imported guest records are merged into the signed-in user's app-state snapshot and normalized report tables by stable IDs; no separate transfer table is required for the MVP.

## App-State Snapshot

`public.pathfinder_user_states`

| Column | Type | Purpose |
| --- | --- | --- |
| `user_id` | `uuid` primary key | Supabase authenticated user ID. |
| `state` | `jsonb` | Normalized Pathfinder state: assessment, progress records, milestone reflections, and achievements. |
| `created_at` | `timestamptz` | Row creation timestamp. |
| `updated_at` | `timestamptz` | Last application update timestamp. |

## Reportable Tables

`public.pathfinder_user_profiles`

Stores one current profile row per user: practical AI fluency, technical orientation, field/work-pattern selections, goals, time availability, preferred formats, responsibility, and profile-accuracy feedback.

`public.pathfinder_assessment_results`

Stores the full assessment result by user, including answers, selections, evidence arrays, and accuracy feedback.

`public.pathfinder_resource_progress`

Stores one row per user/resource with start/completion status, timestamps, duration metadata, path stage, provider, format, and matching tags.

`public.pathfinder_completion_feedback`

Stores optional takeaway, relevance, and difficulty feedback per user/resource.

`public.pathfinder_milestone_reflections`

Stores optional five- and ten-hour reflection responses by user/milestone.

`public.pathfinder_earned_achievements`

Stores one row per user/achievement ID. Achievements remain professional engagement indicators, not certification or readiness.

## Reporting Boundary

The schema prepares for future dashboards and reports, but Phase 5 does not implement dashboard UI, organization reporting, supervisor views, or administrator access. Those require a separate approved access model. The included RLS policies keep normal authenticated users scoped to their own rows.

## SQL

Apply the SQL in `supabase/schema.sql` to the Supabase project before enabling account mode in `data/supabase-config.json`.

The SQL uses `create table if not exists` and drops/recreates same-named policies so it can be reapplied after the earlier compact Phase 5 schema during pilot setup.

## GitHub Pages Auth Redirects

Add the deployed GitHub Pages URL and local test URL to Supabase Auth redirect allow-list entries, for example:

- `https://USERNAME.github.io/REPOSITORY-NAME/`
- `https://USERNAME.github.io/REPOSITORY-NAME/?mode=password-recovery`
- `http://localhost:8000/`
- `http://localhost:8000/?mode=password-recovery`

Keep `data/supabase-config.json` `authRedirectPath` as `"./"` so redirects resolve correctly from a GitHub Pages repository subdirectory.

## Supabase Auth Settings

Enable the Supabase Email provider for email-and-password signup, email-and-password sign-in, password reset emails, and optional magic links.

Password reset requests use the same GitHub Pages-aware redirect logic as sign-in, plus `?mode=password-recovery`. When Supabase emits `PASSWORD_RECOVERY`, the app shows a dedicated new-password form and defers ordinary signed-in account setup, display-name prompts, and guest-data import until recovery is resolved.

For a controlled pilot, email confirmation may be temporarily disabled if the default Supabase mail service is too rate limited. The application is written so routine password sign-in does not require an authentication email and does not claim that an email address is verified. Password reset, magic links, and email verification still require working email delivery.

Before wider deployment:

- Configure custom SMTP in Supabase Auth settings.
- Re-enable email confirmation after SMTP is operational.
- Re-test signup, sign-in, sign-out, password reset, magic link, session restoration, and user isolation.
