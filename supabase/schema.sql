create table if not exists public.pathfinder_user_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on public.pathfinder_user_states from anon;
revoke all on public.pathfinder_user_states from public;

alter table public.pathfinder_user_states enable row level security;

drop policy if exists "Users can read their own pathfinder state" on public.pathfinder_user_states;
drop policy if exists "Users can insert their own pathfinder state" on public.pathfinder_user_states;
drop policy if exists "Users can update their own pathfinder state" on public.pathfinder_user_states;
drop policy if exists "Users can delete their own pathfinder state" on public.pathfinder_user_states;

create policy "Users can read their own pathfinder state"
  on public.pathfinder_user_states
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own pathfinder state"
  on public.pathfinder_user_states
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own pathfinder state"
  on public.pathfinder_user_states
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own pathfinder state"
  on public.pathfinder_user_states
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete
  on public.pathfinder_user_states
  to authenticated;

create table if not exists public.pathfinder_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  assessment_completed_at timestamptz,
  practical_fluency_id text,
  practical_fluency_label text,
  technical_orientation_id text,
  technical_orientation_label text,
  primary_field text,
  secondary_fields text[] not null default array[]::text[],
  work_patterns text[] not null default array[]::text[],
  learning_goals text[] not null default array[]::text[],
  weekly_time text,
  preferred_formats text[] not null default array[]::text[],
  ai_responsibility text,
  profile_accuracy_feedback text,
  profile_accuracy_feedback_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.pathfinder_assessment_results (
  user_id uuid primary key references auth.users(id) on delete cascade,
  assessment_version text,
  completed_at timestamptz,
  answers jsonb not null default '{}'::jsonb,
  selections jsonb not null default '{}'::jsonb,
  practical_fluency_evidence jsonb not null default '[]'::jsonb,
  technical_orientation_evidence jsonb not null default '[]'::jsonb,
  accuracy_feedback jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.pathfinder_resource_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id text not null,
  resource_type text not null default 'resource',
  title text not null,
  provider text,
  path_stage text,
  status text not null check (status in ('started', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  completion_date date,
  estimated_minutes integer,
  duration_status text,
  format text,
  source_url text,
  work_patterns text[] not null default array[]::text[],
  learning_goals text[] not null default array[]::text[],
  professional_fields text[] not null default array[]::text[],
  tags text[] not null default array[]::text[],
  updated_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create table if not exists public.pathfinder_completion_feedback (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id text not null,
  takeaway text,
  relevance integer check (relevance is null or relevance between 1 and 5),
  difficulty text check (difficulty is null or difficulty in ('too-easy', 'appropriate', 'too-difficult')),
  updated_at timestamptz not null default now(),
  primary key (user_id, resource_id),
  foreign key (user_id, resource_id)
    references public.pathfinder_resource_progress(user_id, resource_id)
    on delete cascade
);

create table if not exists public.pathfinder_milestone_reflections (
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_id text not null,
  using_ai_more text check (using_ai_more is null or using_ai_more in ('yes', 'no', 'not-sure')),
  evaluating_output_confidence text check (evaluating_output_confidence is null or evaluating_output_confidence in ('yes', 'no', 'not-sure')),
  nonsensitive_example text,
  updated_at timestamptz not null default now(),
  primary key (user_id, milestone_id)
);

create table if not exists public.pathfinder_earned_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  earned_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

revoke all on public.pathfinder_user_profiles from anon;
revoke all on public.pathfinder_user_profiles from public;
revoke all on public.pathfinder_assessment_results from anon;
revoke all on public.pathfinder_assessment_results from public;
revoke all on public.pathfinder_resource_progress from anon;
revoke all on public.pathfinder_resource_progress from public;
revoke all on public.pathfinder_completion_feedback from anon;
revoke all on public.pathfinder_completion_feedback from public;
revoke all on public.pathfinder_milestone_reflections from anon;
revoke all on public.pathfinder_milestone_reflections from public;
revoke all on public.pathfinder_earned_achievements from anon;
revoke all on public.pathfinder_earned_achievements from public;

alter table public.pathfinder_user_profiles enable row level security;
alter table public.pathfinder_assessment_results enable row level security;
alter table public.pathfinder_resource_progress enable row level security;
alter table public.pathfinder_completion_feedback enable row level security;
alter table public.pathfinder_milestone_reflections enable row level security;
alter table public.pathfinder_earned_achievements enable row level security;

drop policy if exists "Users can read their own pathfinder profile" on public.pathfinder_user_profiles;
drop policy if exists "Users can insert their own pathfinder profile" on public.pathfinder_user_profiles;
drop policy if exists "Users can update their own pathfinder profile" on public.pathfinder_user_profiles;
drop policy if exists "Users can delete their own pathfinder profile" on public.pathfinder_user_profiles;
drop policy if exists "Users can read their own pathfinder assessment result" on public.pathfinder_assessment_results;
drop policy if exists "Users can insert their own pathfinder assessment result" on public.pathfinder_assessment_results;
drop policy if exists "Users can update their own pathfinder assessment result" on public.pathfinder_assessment_results;
drop policy if exists "Users can delete their own pathfinder assessment result" on public.pathfinder_assessment_results;
drop policy if exists "Users can read their own pathfinder resource progress" on public.pathfinder_resource_progress;
drop policy if exists "Users can insert their own pathfinder resource progress" on public.pathfinder_resource_progress;
drop policy if exists "Users can update their own pathfinder resource progress" on public.pathfinder_resource_progress;
drop policy if exists "Users can delete their own pathfinder resource progress" on public.pathfinder_resource_progress;
drop policy if exists "Users can read their own pathfinder completion feedback" on public.pathfinder_completion_feedback;
drop policy if exists "Users can insert their own pathfinder completion feedback" on public.pathfinder_completion_feedback;
drop policy if exists "Users can update their own pathfinder completion feedback" on public.pathfinder_completion_feedback;
drop policy if exists "Users can delete their own pathfinder completion feedback" on public.pathfinder_completion_feedback;
drop policy if exists "Users can read their own pathfinder milestone reflection" on public.pathfinder_milestone_reflections;
drop policy if exists "Users can insert their own pathfinder milestone reflection" on public.pathfinder_milestone_reflections;
drop policy if exists "Users can update their own pathfinder milestone reflection" on public.pathfinder_milestone_reflections;
drop policy if exists "Users can delete their own pathfinder milestone reflection" on public.pathfinder_milestone_reflections;
drop policy if exists "Users can read their own pathfinder earned achievement" on public.pathfinder_earned_achievements;
drop policy if exists "Users can insert their own pathfinder earned achievement" on public.pathfinder_earned_achievements;
drop policy if exists "Users can update their own pathfinder earned achievement" on public.pathfinder_earned_achievements;
drop policy if exists "Users can delete their own pathfinder earned achievement" on public.pathfinder_earned_achievements;

create policy "Users can read their own pathfinder profile"
  on public.pathfinder_user_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own pathfinder profile"
  on public.pathfinder_user_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own pathfinder profile"
  on public.pathfinder_user_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own pathfinder profile"
  on public.pathfinder_user_profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own pathfinder assessment result"
  on public.pathfinder_assessment_results
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own pathfinder assessment result"
  on public.pathfinder_assessment_results
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own pathfinder assessment result"
  on public.pathfinder_assessment_results
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own pathfinder assessment result"
  on public.pathfinder_assessment_results
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own pathfinder resource progress"
  on public.pathfinder_resource_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own pathfinder resource progress"
  on public.pathfinder_resource_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own pathfinder resource progress"
  on public.pathfinder_resource_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own pathfinder resource progress"
  on public.pathfinder_resource_progress
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own pathfinder completion feedback"
  on public.pathfinder_completion_feedback
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own pathfinder completion feedback"
  on public.pathfinder_completion_feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own pathfinder completion feedback"
  on public.pathfinder_completion_feedback
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own pathfinder completion feedback"
  on public.pathfinder_completion_feedback
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own pathfinder milestone reflection"
  on public.pathfinder_milestone_reflections
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own pathfinder milestone reflection"
  on public.pathfinder_milestone_reflections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own pathfinder milestone reflection"
  on public.pathfinder_milestone_reflections
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own pathfinder milestone reflection"
  on public.pathfinder_milestone_reflections
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own pathfinder earned achievement"
  on public.pathfinder_earned_achievements
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own pathfinder earned achievement"
  on public.pathfinder_earned_achievements
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own pathfinder earned achievement"
  on public.pathfinder_earned_achievements
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own pathfinder earned achievement"
  on public.pathfinder_earned_achievements
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete
  on public.pathfinder_user_profiles,
     public.pathfinder_assessment_results,
     public.pathfinder_resource_progress,
     public.pathfinder_completion_feedback,
     public.pathfinder_milestone_reflections,
     public.pathfinder_earned_achievements
  to authenticated;
