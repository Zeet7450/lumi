begin;

create schema private;
revoke all on schema private from public, anon, authenticated;

alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private revoke execute on functions from public, anon, authenticated;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

create function private.reject_immutable_change()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception '% rows are append-only', tg_table_name using errcode = '55000';
end;
$$;

create function private.validate_published_notice_snapshot()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  source_status text;
  source_approved_by uuid;
  source_approved_at timestamptz;
begin
  select notice.status, notice.approved_by, notice.approved_at
    into source_status, source_approved_by, source_approved_at
    from public.public_notices as notice
   where notice.id = new.source_notice_id;

  if not found
    or source_status not in ('PUBLISHED', 'EXPIRED')
    or source_approved_by is null
    or source_approved_at is null then
    raise exception 'published notice snapshot requires an approved published source notice'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.reject_immutable_change() from public, anon, authenticated;
revoke all on function private.validate_published_notice_snapshot() from public, anon, authenticated;

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  province_slug text not null check (province_slug in ('kalbar', 'kalteng', 'kalsel', 'kaltim', 'kaltara')),
  province_name text not null,
  administrative_name text not null,
  display_name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  catalogue_source text not null default 'LUMI curated Kalimantan catalogue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  organization text not null,
  job_title text not null,
  role text not null check (role in ('DLH', 'BPBD', 'DISKOMINFO', 'ADMIN_DEMO', 'CITIZEN')),
  region_id uuid references public.regions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (revoked_at is null or revoked_at >= created_at)
);

create table public.scenario_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  scenario_type text not null check (scenario_type = 'LAND_FIRE_HAZE'),
  description text not null,
  default_parameters jsonb not null check (jsonb_typeof(default_parameters) = 'object'),
  timeline jsonb not null check (jsonb_typeof(timeline) = 'array'),
  synthetic_label text not null default 'SIMULATION MODE — Data uji, bukan kondisi nyata.',
  is_active boolean not null default true,
  is_synthetic boolean not null default true check (is_synthetic = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0)
);

create table public.scenario_runs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.scenario_templates(id) on delete restrict,
  region_id uuid not null references public.regions(id) on delete restrict,
  status text not null default 'READY' check (status in ('READY', 'RUNNING', 'PAUSED', 'WAITING_HUMAN', 'COMPLETED', 'RESET')),
  simulation_speed smallint not null default 1 check (simulation_speed in (1, 5, 10)),
  active_parameters jsonb not null check (jsonb_typeof(active_parameters) = 'object'),
  simulated_elapsed_seconds integer not null default 0 check (simulated_elapsed_seconds >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  is_synthetic boolean not null default true check (is_synthetic = true),
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0),
  check (completed_at is null or started_at is not null)
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  scenario_run_id uuid references public.scenario_runs(id) on delete restrict,
  region_id uuid not null references public.regions(id) on delete restrict,
  source_name text not null,
  source_type text not null check (source_type in ('SIMULATOR', 'CITIZEN_REPORT', 'MANUAL_DEMO')),
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  observation_type text not null check (observation_type in ('HOTSPOT', 'AIR_QUALITY', 'WIND', 'SMOKE', 'COMBINED')),
  aqi integer check (aqi between 0 and 500),
  pm25 numeric(8,2) check (pm25 >= 0),
  pollutant_basis text check (pollutant_basis is null or pollutant_basis = 'PM25'),
  wind_direction_degrees numeric(6,2) check (wind_direction_degrees >= 0 and wind_direction_degrees < 360),
  wind_speed_kmh numeric(8,2) check (wind_speed_kmh >= 0),
  fire_intensity smallint check (fire_intensity between 1 and 5),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  raw_evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(raw_evidence) = 'object'),
  validation_status text not null default 'SYNTHETIC_RECEIVED' check (validation_status in ('SYNTHETIC_RECEIVED', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED')),
  is_synthetic boolean not null default true check (is_synthetic = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0),
  check (received_at >= observed_at),
  check (aqi is not null or pm25 is not null or observation_type <> 'AIR_QUALITY'),
  check (pollutant_basis is null or aqi is not null)
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  scenario_run_id uuid references public.scenario_runs(id) on delete restrict,
  primary_observation_id uuid references public.observations(id) on delete restrict,
  region_id uuid not null references public.regions(id) on delete restrict,
  incident_type text not null check (incident_type = 'LAND_FIRE_HAZE'),
  title text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  verification_status text not null default 'INDICATION' check (verification_status in ('INDICATION', 'NEEDS_VERIFICATION', 'VERIFIED', 'ACTIVE_RESPONSE', 'CONTROLLED', 'CLOSED')),
  severity text not null check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  operational_priority text not null default 'MONITOR' check (operational_priority in ('MONITOR', 'VERIFY', 'HIGH_RESPONSE')),
  bpbd_owner_id uuid references auth.users(id) on delete restrict,
  is_synthetic boolean not null default true check (is_synthetic = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0)
);

create table public.scenario_events (
  id uuid primary key default gen_random_uuid(),
  scenario_run_id uuid not null references public.scenario_runs(id) on delete restrict,
  event_id text not null,
  actor_type text not null check (actor_type in ('admin_simulator', 'agent')),
  event_type text not null,
  event_timestamp timestamptz not null,
  parameter_before jsonb,
  parameter_after jsonb,
  affected_incident_id uuid references public.incidents(id) on delete restrict,
  is_synthetic boolean not null default true check (is_synthetic = true),
  created_at timestamptz not null default now(),
  unique (scenario_run_id, event_id),
  check (parameter_before is null or jsonb_typeof(parameter_before) = 'object'),
  check (parameter_after is null or jsonb_typeof(parameter_after) = 'object')
);

create table public.environmental_assessments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete restrict,
  observation_id uuid references public.observations(id) on delete restrict,
  assessed_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'VALIDATED', 'REJECTED')),
  aqi integer not null check (aqi between 0 and 500),
  pm25 numeric(8,2) not null check (pm25 >= 0),
  pollutant_basis text not null default 'PM25' check (pollutant_basis = 'PM25'),
  wind_direction_degrees numeric(6,2) not null check (wind_direction_degrees >= 0 and wind_direction_degrees < 360),
  wind_speed_kmh numeric(8,2) not null check (wind_speed_kmh >= 0),
  impact_zone jsonb not null check (jsonb_typeof(impact_zone) = 'object'),
  findings text not null,
  is_synthetic boolean not null default true check (is_synthetic = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0)
);

create table public.response_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete restrict,
  title text not null,
  description text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'CANCELLED')),
  assignee_id uuid references auth.users(id) on delete restrict,
  command_post text,
  needs jsonb not null default '[]'::jsonb check (jsonb_typeof(needs) = 'array'),
  is_synthetic boolean not null default true check (is_synthetic = true),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0)
);

create table public.public_notices (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete restrict,
  target_region_id uuid not null references public.regions(id) on delete restrict,
  title text not null,
  body text not null,
  guidance jsonb not null default '[]'::jsonb check (jsonb_typeof(guidance) = 'array'),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REVISION_REQUESTED', 'REJECTED', 'EXPIRED')),
  submitted_by uuid references auth.users(id) on delete restrict,
  submitted_at timestamptz,
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  review_note text,
  supersedes_notice_id uuid references public.public_notices(id) on delete restrict,
  is_synthetic boolean not null default true check (is_synthetic = true),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0),
  check ((status in ('PUBLISHED', 'EXPIRED')) = (published_at is not null)),
  check (status not in ('PUBLISHED', 'EXPIRED') or (approved_by is not null and approved_at is not null)),
  check (expires_at is null or published_at is not null)
);

create table public.published_notices (
  id uuid primary key default gen_random_uuid(),
  source_notice_id uuid not null unique references public.public_notices(id) on delete restrict,
  incident_public_id uuid not null,
  region_slug text not null,
  region_name text not null,
  title text not null,
  body text not null,
  guidance jsonb not null default '[]'::jsonb check (jsonb_typeof(guidance) = 'array'),
  severity text not null check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  published_at timestamptz not null,
  expires_at timestamptz,
  is_synthetic boolean not null default true check (is_synthetic = true),
  synthetic_label text not null default 'SIMULATION MODE — Data uji, bukan kondisi nyata.',
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at > published_at)
);

create table public.citizen_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  region_id uuid not null references public.regions(id) on delete restrict,
  scenario_run_id uuid references public.scenario_runs(id) on delete restrict,
  description text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  media_reference text,
  privacy_level text not null default 'INTERNAL' check (privacy_level in ('INTERNAL', 'REPORTER_ONLY')),
  verification_status text not null default 'PENDING_VERIFICATION' check (verification_status in ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
  is_synthetic boolean not null default true check (is_synthetic = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete restrict,
  actor_type text not null check (actor_type in ('USER', 'ADMIN_SIMULATOR', 'AGENT', 'SYSTEM')),
  actor_role text check (actor_role is null or actor_role in ('DLH', 'BPBD', 'DISKOMINFO', 'ADMIN_DEMO', 'CITIZEN', 'SYSTEM')),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  scenario_run_id uuid references public.scenario_runs(id) on delete restrict,
  event_id text,
  before_summary jsonb,
  after_summary jsonb,
  outcome text not null default 'SUCCESS' check (outcome in ('SUCCESS', 'REJECTED', 'FAILED')),
  is_synthetic boolean not null default true check (is_synthetic = true),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (before_summary is null or jsonb_typeof(before_summary) = 'object'),
  check (after_summary is null or jsonb_typeof(after_summary) = 'object')
);

create index profiles_role_idx on public.profiles (role);
create index app_sessions_user_expires_idx on public.app_sessions (user_id, expires_at desc);
create index app_sessions_active_idx on public.app_sessions (expires_at) where revoked_at is null;
create index scenario_runs_template_status_idx on public.scenario_runs (template_id, status);
create index scenario_runs_region_created_idx on public.scenario_runs (region_id, created_at desc);
create index observations_region_status_time_idx on public.observations (region_id, validation_status, observed_at desc);
create index observations_run_idx on public.observations (scenario_run_id) where scenario_run_id is not null;
create index incidents_region_status_idx on public.incidents (region_id, verification_status, updated_at desc);
create index incidents_run_idx on public.incidents (scenario_run_id) where scenario_run_id is not null;
create index scenario_events_run_time_idx on public.scenario_events (scenario_run_id, event_timestamp, id);
create index environmental_assessments_incident_idx on public.environmental_assessments (incident_id, created_at desc);
create index response_actions_incident_status_idx on public.response_actions (incident_id, status, updated_at desc);
create index public_notices_status_created_idx on public.public_notices (status, created_at desc);
create index public_notices_incident_idx on public.public_notices (incident_id, revision desc);
create index published_notices_region_published_idx on public.published_notices (region_slug, published_at desc);
create index citizen_reports_region_status_idx on public.citizen_reports (region_id, verification_status, created_at desc);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id, occurred_at desc);
create index audit_events_run_idx on public.audit_events (scenario_run_id, occurred_at) where scenario_run_id is not null;

create trigger regions_set_updated_at before update on public.regions for each row execute function private.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger scenario_templates_set_updated_at before update on public.scenario_templates for each row execute function private.set_updated_at();
create trigger scenario_runs_set_updated_at before update on public.scenario_runs for each row execute function private.set_updated_at();
create trigger observations_set_updated_at before update on public.observations for each row execute function private.set_updated_at();
create trigger incidents_set_updated_at before update on public.incidents for each row execute function private.set_updated_at();
create trigger environmental_assessments_set_updated_at before update on public.environmental_assessments for each row execute function private.set_updated_at();
create trigger response_actions_set_updated_at before update on public.response_actions for each row execute function private.set_updated_at();
create trigger public_notices_set_updated_at before update on public.public_notices for each row execute function private.set_updated_at();
create trigger citizen_reports_set_updated_at before update on public.citizen_reports for each row execute function private.set_updated_at();

create trigger published_notices_no_update before update or delete on public.published_notices for each row execute function private.reject_immutable_change();
create trigger audit_events_no_update before update or delete on public.audit_events for each row execute function private.reject_immutable_change();
create trigger published_notices_validate_source before insert on public.published_notices for each row execute function private.validate_published_notice_snapshot();

alter table public.regions enable row level security;
alter table public.profiles enable row level security;
alter table public.app_sessions enable row level security;
alter table public.scenario_templates enable row level security;
alter table public.scenario_runs enable row level security;
alter table public.observations enable row level security;
alter table public.incidents enable row level security;
alter table public.scenario_events enable row level security;
alter table public.environmental_assessments enable row level security;
alter table public.response_actions enable row level security;
alter table public.public_notices enable row level security;
alter table public.published_notices enable row level security;
alter table public.citizen_reports enable row level security;
alter table public.audit_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

commit;
