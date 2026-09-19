-- DEPRECATED, UNAPPLIED P0 PROTOTYPE. DO NOT APPLY.
-- The authoritative Stage 1 schema lives under /supabase/migrations.
-- Retained temporarily only as historical input for the Stage 2 adapter.
begin;

create schema if not exists lumi;
revoke all on schema lumi from public, anon, authenticated;

alter default privileges for role postgres in schema lumi
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema lumi
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema lumi
  revoke execute on functions from public, anon, authenticated;

create table if not exists lumi.regions (
  id text primary key,
  slug text not null unique,
  name text not null,
  province text not null,
  latitude numeric,
  longitude numeric
);

create table if not exists lumi.users (
  id text primary key,
  email text not null unique,
  display_name text not null,
  organization text not null,
  job_title text not null,
  role text not null check (role in ('DLH', 'BPBD', 'DINKES', 'DISKOMINFO', 'ADMIN_DEMO', 'CITIZEN')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists lumi.sessions (
  token_hash text primary key,
  user_id text not null references lumi.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_expires_at_idx on lumi.sessions (expires_at);

create table if not exists lumi.source_snapshots (
  id text primary key,
  region_id text not null references lumi.regions(id),
  signal_kind text not null check (signal_kind in ('PM25', 'WEATHER', 'WIND', 'HOTSPOT')),
  value_text text,
  value_number numeric,
  unit text,
  source text not null,
  observed_at timestamptz not null,
  retrieved_at timestamptz not null,
  freshness text not null check (freshness in ('FRESH', 'STALE', 'UNAVAILABLE')),
  mode text not null check (mode = 'LIVE'),
  note text,
  pm25_source text check (pm25_source in ('STATION', 'MODEL')),
  wind_supports_impact boolean,
  hotspot_distance_km numeric,
  payload_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check ((value_text is null) <> (value_number is null) or (value_text is null and value_number is null))
);
create index if not exists source_snapshots_region_observed_idx on lumi.source_snapshots (region_id, observed_at desc);

create table if not exists lumi.priority_decisions (
  id text primary key,
  region_id text not null references lumi.regions(id),
  tier text not null check (tier in ('MONITOR', 'VERIFY', 'HIGH_RESPONSE')),
  rationale jsonb not null,
  evidence_ids jsonb not null,
  data_gaps jsonb not null,
  owner_hints jsonb not null,
  policy_version text not null check (policy_version = 'ruleset-v1'),
  decided_at timestamptz not null,
  mode text not null check (mode = 'LIVE')
);
create index if not exists priority_decisions_region_decided_idx on lumi.priority_decisions (region_id, decided_at desc);

create table if not exists lumi.incidents (
  id text primary key,
  region_id text not null references lumi.regions(id),
  decision_id text not null references lumi.priority_decisions(id),
  workflow_status text not null check (workflow_status in ('OPEN', 'RESOLVED')),
  data_version integer not null check (data_version > 0),
  updated_at timestamptz not null
);
create unique index if not exists open_incident_per_region_idx on lumi.incidents (region_id) where workflow_status = 'OPEN';

create table if not exists lumi.action_briefs (
  id text primary key,
  incident_id text not null unique references lumi.incidents(id) on delete cascade,
  actions jsonb not null,
  review_note text not null default '',
  status text not null check (status = 'DRAFT'),
  revision integer not null check (revision > 0),
  updated_at timestamptz not null
);

create table if not exists lumi.public_notices (
  id text primary key,
  incident_id text not null references lumi.incidents(id),
  decision_id text not null references lumi.priority_decisions(id),
  region_id text not null references lumi.regions(id),
  text text not null,
  status text not null check (status in ('DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'PUBLISHED')),
  revision integer not null check (revision > 0),
  submitted_by text references lumi.users(id),
  approved_by text references lumi.users(id),
  approved_at timestamptz,
  rejection_note text,
  published_at timestamptz,
  superseded_at timestamptz,
  supersedes_notice_id text references lumi.public_notices(id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check ((status = 'PUBLISHED') = (published_at is not null))
);
create unique index if not exists one_active_published_notice_per_region_idx
  on lumi.public_notices (region_id)
  where status = 'PUBLISHED' and superseded_at is null;

create or replace function lumi.guard_published_notice()
returns trigger
language plpgsql
set search_path = pg_catalog, lumi
as $$
begin
  if old.status = 'PUBLISHED' then
    if (to_jsonb(new) - 'superseded_at' - 'updated_at') is distinct from
       (to_jsonb(old) - 'superseded_at' - 'updated_at') then
      raise exception 'Published notice is immutable; create a revision instead.';
    end if;
    if old.superseded_at is not null and new.superseded_at is distinct from old.superseded_at then
      raise exception 'A superseded notice cannot be changed.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists public_notices_immutable_after_publish on lumi.public_notices;
create trigger public_notices_immutable_after_publish
before update on lumi.public_notices
for each row execute function lumi.guard_published_notice();

create table if not exists lumi.audit_events (
  id text primary key,
  actor_id text not null references lumi.users(id),
  actor_role text not null check (actor_role in ('DLH', 'BPBD', 'DINKES', 'DISKOMINFO', 'ADMIN_DEMO')),
  action text not null,
  entity text not null check (entity in ('ACTION_BRIEF', 'PUBLIC_NOTICE', 'SIMULATION', 'FIXTURE')),
  entity_id text not null,
  before_summary jsonb,
  after_summary jsonb,
  occurred_at timestamptz not null
);
create index if not exists audit_events_entity_idx on lumi.audit_events (entity, entity_id, occurred_at desc);

-- Simulation rows deliberately have no foreign key to incidents or notices.
create table if not exists lumi.simulation_runs (
  id text primary key,
  preset text not null check (preset in ('MONITOR', 'VERIFY', 'HIGH_PONTIANAK', 'STALE')),
  region_id text not null references lumi.regions(id),
  input jsonb not null,
  output jsonb not null,
  policy_version text not null check (policy_version = 'ruleset-v1'),
  mode text not null check (mode = 'SIMULATION'),
  created_at timestamptz not null
);

commit;
