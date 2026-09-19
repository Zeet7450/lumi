begin;
select plan(45);

select has_table('public', 'regions', 'regions table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'app_sessions', 'app_sessions table exists');
select has_table('public', 'scenario_templates', 'scenario_templates table exists');
select has_table('public', 'scenario_runs', 'scenario_runs table exists');
select has_table('public', 'scenario_events', 'scenario_events table exists');
select has_table('public', 'observations', 'observations table exists');
select has_table('public', 'incidents', 'incidents table exists');
select has_table('public', 'environmental_assessments', 'environmental_assessments table exists');
select has_table('public', 'response_actions', 'response_actions table exists');
select has_table('public', 'public_notices', 'public_notices table exists');
select has_table('public', 'published_notices', 'published_notices table exists');
select has_table('public', 'citizen_reports', 'citizen_reports table exists');
select has_table('public', 'audit_events', 'audit_events table exists');

select results_eq(
  $$
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'regions', 'profiles', 'app_sessions', 'scenario_templates', 'scenario_runs',
        'scenario_events', 'observations', 'incidents', 'environmental_assessments',
        'response_actions', 'public_notices', 'published_notices', 'citizen_reports', 'audit_events'
      )
      and c.relrowsecurity
  $$,
  $$ values (14::bigint) $$,
  'RLS is enabled on every LUMI public table'
);

select results_eq(
  $$
    select count(*)::bigint
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in (
        'regions', 'profiles', 'app_sessions', 'scenario_templates', 'scenario_runs',
        'scenario_events', 'observations', 'incidents', 'environmental_assessments',
        'response_actions', 'public_notices', 'published_notices', 'citizen_reports', 'audit_events'
      )
      and grantee in ('anon', 'authenticated')
  $$,
  $$ values (0::bigint) $$,
  'anon and authenticated have no table grants in the Stage 1 deny-by-default foundation'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'regions', 'profiles', 'app_sessions', 'scenario_templates', 'scenario_runs',
        'scenario_events', 'observations', 'incidents', 'environmental_assessments',
        'response_actions', 'public_notices', 'published_notices', 'citizen_reports', 'audit_events'
      )
  $$,
  $$ values (0::bigint) $$,
  'Stage 1 creates no role policies before Stage 2 RBAC design'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname in ('set_updated_at', 'reject_immutable_change', 'validate_published_notice_snapshot')
      and not p.prosecdef
  $$,
  $$ values (3::bigint) $$,
  'private trigger functions are security invoker'
);
select ok(not has_function_privilege('anon', 'private.set_updated_at()', 'EXECUTE'), 'anon cannot execute updated_at trigger helper');
select ok(not has_function_privilege('anon', 'private.reject_immutable_change()', 'EXECUTE'), 'anon cannot execute immutable trigger helper');
select ok(not has_function_privilege('anon', 'private.validate_published_notice_snapshot()', 'EXECUTE'), 'anon cannot execute snapshot validation helper');

select has_column('public', 'observations', 'aqi', 'AQI is stored separately');
select has_column('public', 'observations', 'pm25', 'PM2.5 is stored separately');
select has_column('public', 'observations', 'source_name', 'observation source_name provenance exists');
select has_column('public', 'observations', 'observed_at', 'observation observed_at provenance exists');
select has_column('public', 'observations', 'received_at', 'observation received_at provenance exists');
select has_column('public', 'observations', 'latitude', 'observation latitude provenance exists');
select has_column('public', 'observations', 'longitude', 'observation longitude provenance exists');
select has_column('public', 'observations', 'is_synthetic', 'observation synthetic provenance exists');

select results_eq(
  $$
    select count(distinct c.relname)::bigint
    from pg_constraint constraint_record
    join pg_class c on c.oid = constraint_record.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'scenario_templates', 'scenario_runs', 'scenario_events', 'observations', 'incidents',
        'environmental_assessments', 'response_actions', 'public_notices', 'published_notices',
        'citizen_reports', 'audit_events'
      )
      and constraint_record.contype = 'c'
      and pg_get_constraintdef(constraint_record.oid) ~ 'is_synthetic.*true'
  $$,
  $$ values (11::bigint) $$,
  'every scenario and domain table has an is_synthetic=true database constraint'
);

insert into public.regions (
  id, slug, province_slug, province_name, administrative_name, display_name, latitude, longitude
) values (
  '10000000-0000-4000-8000-000000000001', 'pgtap-region', 'kalteng', 'Kalimantan Tengah',
  'Kota Uji', 'Wilayah Uji', -2.21, 113.92
);

insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '90000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
  'pgtap.approver@demo.lumi.invalid', now(), '{"role":"DISKOMINFO"}'::jsonb, '{}'::jsonb, now(), now()
);
insert into public.profiles (
  id, email, display_name, organization, job_title, role, region_id
) values (
  '90000000-0000-4000-8000-000000000001', 'pgtap.approver@demo.lumi.invalid', 'pgTAP Approver',
  'LUMI Transaction Test', 'Test Fixture', 'DISKOMINFO', '10000000-0000-4000-8000-000000000001'
);

insert into public.scenario_templates (
  id, slug, name, scenario_type, description, default_parameters, timeline, is_synthetic
) values (
  '20000000-0000-4000-8000-000000000001', 'pgtap-template', 'Template Uji', 'LAND_FIRE_HAZE',
  'Template test transaction only', '{}'::jsonb, '[]'::jsonb, true
);

insert into public.scenario_runs (
  id, template_id, region_id, status, active_parameters, is_synthetic
) values (
  '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001', 'READY', '{}'::jsonb, true
);

insert into public.observations (
  id, scenario_run_id, region_id, source_name, source_type, observed_at, received_at,
  latitude, longitude, observation_type, confidence, validation_status, is_synthetic
) values (
  '40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001', 'pgTAP', 'SIMULATOR', '2026-01-01T00:00:00Z',
  '2026-01-01T00:00:01Z', -2.21, 113.92, 'HOTSPOT', 0.9, 'SYNTHETIC_RECEIVED', true
);

insert into public.incidents (
  id, scenario_run_id, primary_observation_id, region_id, incident_type, title,
  latitude, longitude, verification_status, severity, operational_priority, is_synthetic
) values (
  '50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
  'LAND_FIRE_HAZE', 'Insiden Uji', -2.21, 113.92, 'INDICATION', 'HIGH', 'VERIFY', true
);

select throws_ok(
  $$ insert into public.scenario_templates (slug, name, scenario_type, description, default_parameters, timeline, is_synthetic) values ('not-synthetic', 'Invalid', 'LAND_FIRE_HAZE', 'Invalid', '{}', '[]', false) $$,
  '23514', null, 'scenario template rejects is_synthetic=false'
);
select throws_ok(
  $$ insert into public.observations (region_id, source_name, source_type, observed_at, received_at, latitude, longitude, observation_type, confidence, is_synthetic) values ('10000000-0000-4000-8000-000000000001', 'invalid', 'SIMULATOR', now(), now(), 0, 110, 'HOTSPOT', 1, false) $$,
  '23514', null, 'observation rejects is_synthetic=false'
);

insert into public.scenario_events (
  scenario_run_id, event_id, actor_type, event_type, event_timestamp, is_synthetic
) values (
  '30000000-0000-4000-8000-000000000001', 'duplicate-event', 'admin_simulator', 'TEST', now(), true
);
select throws_ok(
  $$ insert into public.scenario_events (scenario_run_id, event_id, actor_type, event_type, event_timestamp, is_synthetic) values ('30000000-0000-4000-8000-000000000001', 'duplicate-event', 'agent', 'TEST_REPLAY', now(), true) $$,
  '23505', null, 'duplicate event_id is rejected within one scenario run'
);

select throws_ok(
  $$ update public.scenario_runs set status = 'INVALID' where id = '30000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'scenario run status is constrained'
);
select throws_ok(
  $$ update public.observations set validation_status = 'INVALID' where id = '40000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'observation status is constrained'
);
select throws_ok(
  $$ update public.incidents set verification_status = 'INVALID' where id = '50000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'incident status is constrained'
);
select throws_ok(
  $$ insert into public.response_actions (incident_id, title, description, status, created_by) values ('50000000-0000-4000-8000-000000000001', 'Invalid', 'Invalid', 'INVALID', '90000000-0000-4000-8000-000000000001') $$,
  '23514', null, 'response action status is constrained'
);
select throws_ok(
  $$ insert into public.public_notices (incident_id, target_region_id, title, body, status, created_by) values ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Invalid', 'Invalid', 'INVALID', (select id from public.profiles where role = 'DISKOMINFO' limit 1)) $$,
  '23514', null, 'publication status is constrained'
);
select throws_ok(
  $$ insert into public.public_notices (incident_id, target_region_id, title, body, status, created_by, published_at) values ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Unapproved', 'Must fail', 'PUBLISHED', (select id from public.profiles where role = 'DISKOMINFO' limit 1), now()) $$,
  '23514', null, 'published notice requires an approving user and approval timestamp'
);

insert into public.public_notices (
  id, incident_id, target_region_id, title, body, status, created_by, approved_by, approved_at
) values (
  '60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001', 'Draf Uji', 'Belum diterbitkan', 'DRAFT',
  '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', now()
);
select throws_ok(
  $$ insert into public.published_notices (source_notice_id, incident_public_id, region_slug, region_name, title, body, severity, published_at) values ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', 'pgtap-region', 'Wilayah Uji', 'Invalid snapshot', 'Draft source', 'HIGH', now()) $$,
  '23514', 'published notice snapshot requires an approved published source notice',
  'citizen snapshot rejects a source notice that is not PUBLISHED or EXPIRED'
);

insert into public.public_notices (
  id, incident_id, target_region_id, title, body, status, created_by, approved_by, approved_at, published_at
) values (
  '60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001', 'Pemberitahuan Uji', 'Data sintetis', 'PUBLISHED',
  (select id from public.profiles where role = 'DISKOMINFO' limit 1),
  (select id from public.profiles where role = 'DISKOMINFO' limit 1), now(), now()
);
insert into public.published_notices (
  id, source_notice_id, incident_public_id, region_slug, region_name, title, body, severity, published_at
) values (
  '70000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001', 'pgtap-region', 'Wilayah Uji',
  'Pemberitahuan Uji', 'Data sintetis', 'HIGH', now()
);
select results_eq(
  $$ select synthetic_label from public.published_notices where id = '70000000-0000-4000-8000-000000000001' $$,
  $$ values ('SIMULATION MODE — Data uji, bukan kondisi nyata.'::text) $$,
  'citizen snapshot uses the canonical simulation label'
);
insert into public.audit_events (
  id, actor_type, actor_role, action, entity_type, entity_id, is_synthetic
) values (
  '80000000-0000-4000-8000-000000000001', 'SYSTEM', 'SYSTEM', 'TEST', 'INCIDENT',
  '50000000-0000-4000-8000-000000000001', true
);

select throws_ok(
  $$ update public.published_notices set title = 'Mutated' where id = '70000000-0000-4000-8000-000000000001' $$,
  '55000', 'published_notices rows are append-only', 'published notices cannot be updated'
);
select throws_ok(
  $$ delete from public.published_notices where id = '70000000-0000-4000-8000-000000000001' $$,
  '55000', 'published_notices rows are append-only', 'published notices cannot be deleted'
);
select throws_ok(
  $$ update public.audit_events set action = 'MUTATED' where id = '80000000-0000-4000-8000-000000000001' $$,
  '55000', 'audit_events rows are append-only', 'audit events cannot be updated'
);
select throws_ok(
  $$ delete from public.audit_events where id = '80000000-0000-4000-8000-000000000001' $$,
  '55000', 'audit_events rows are append-only', 'audit events cannot be deleted'
);

select * from finish();
rollback;
