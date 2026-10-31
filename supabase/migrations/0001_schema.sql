-- azentio.ai portal schema
-- Security model: every table has RLS enabled with NO policies for anon/authenticated,
-- and table privileges are revoked from those roles. The browser's anon key therefore
-- cannot read or write anything through PostgREST. All access goes through the Next.js
-- server, which checks identity, membership, role grant, audience and entitlement
-- (src/lib/authz) before using the service role.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ───────────────────────── enums ─────────────────────────
create type org_kind as enum ('internal', 'client');
create type membership_status as enum ('pending', 'active', 'suspended', 'revoked');
create type app_role as enum (
  'employee', 'product_owner', 'learning_moderator', 'content_publisher',
  'portal_admin', 'fl_coordinator',
  'client_member', 'client_admin'
);
-- Audience is always explicit. There is no implicit fallback to 'public'.
create type audience as enum (
  'public',            -- anyone, including anonymous visitors
  'community',         -- any active member (employee or client) of the learning community
  'employees',         -- active employee membership only
  'all_clients',       -- any active client membership (plus employees)
  'entitled_clients',  -- clients whose org is entitled to offering_id (plus employees)
  'org'                -- members of org_id only
);
create type obs_category as enum (
  'market_observation', 'emerging_trend', 'product_gap',
  'operational_challenge', 'successful_practice', 'improvement_suggestion'
);
create type obs_status as enum (
  'draft', 'submitted', 'in_review', 'returned', 'published', 'rejected', 'withdrawn', 'unpublished'
);
create type obs_visibility as enum ('private', 'org');
create type evidence_type as enum (
  'anecdotal', 'client_interactions', 'aggregated_internal_data', 'market_report', 'regulatory_update', 'other'
);
create type confidence_level as enum ('low', 'medium', 'high');
create type shared_status as enum ('published', 'unpublished', 'withdrawn');
create type idea_status as enum ('proposed', 'under_review', 'planned', 'in_progress', 'released', 'not_proceeding');
create type priority_level as enum ('low', 'medium', 'high', 'critical');

-- ───────────────────────── helpers ─────────────────────────
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function forbid_mutation() returns trigger language plpgsql as $$
begin raise exception '% is append-only', tg_table_name; end $$;

-- ───────────────────────── identity & tenancy ─────────────────────────
create table organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind org_kind not null,
  industry text,
  region text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext unique not null,
  display_name text not null,
  title text,
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  status membership_status not null default 'pending',
  terms_accepted_at timestamptz,
  approved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, org_id)
);
create trigger memberships_touch before update on memberships for each row execute function touch_updated_at();

create table role_grants (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references memberships(id) on delete cascade,
  role app_role not null,
  granted_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index role_grants_active on role_grants (membership_id, role) where revoked_at is null;

-- Platform roles only exist on the internal org; client roles only on client orgs.
create or replace function check_role_scope() returns trigger language plpgsql as $$
declare k org_kind;
begin
  select o.kind into k from memberships m join organizations o on o.id = m.org_id where m.id = new.membership_id;
  if new.role in ('client_member', 'client_admin') and k <> 'client' then
    raise exception 'client roles can only be granted on client organisations';
  end if;
  if new.role not in ('client_member', 'client_admin') and k <> 'internal' then
    raise exception 'platform role % cannot be granted on a client organisation', new.role;
  end if;
  return new;
end $$;
create trigger role_grants_scope before insert or update on role_grants for each row execute function check_role_scope();

create table invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email citext not null,
  role app_role not null check (role in ('client_member', 'client_admin', 'employee')),
  token_hash text unique not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  invited_by uuid references profiles(id),
  accepted_by uuid references profiles(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Explicit, time-boxed authorisation for a portal admin to view one tenant's private content.
create table support_grants (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles(id),
  org_id uuid not null references organizations(id),
  reason text not null,
  approved_by uuid references profiles(id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- ───────────────────────── catalogue & content ─────────────────────────
create table offerings (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kicker text,
  tagline text not null,
  category text not null,
  summary text not null,
  description text not null,
  capabilities jsonb not null default '[]',
  outcomes jsonb not null default '[]',
  audience audience not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table entitlements (
  org_id uuid not null references organizations(id) on delete cascade,
  offering_id uuid not null references offerings(id) on delete cascade,
  sandbox boolean not null default true,
  granted_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  primary key (org_id, offering_id)
);

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  storage_path text,          -- object in the private 'media' bucket
  external_url text,          -- or an approved external embed
  mime text,
  audience audience not null,
  org_id uuid references organizations(id),
  offering_id uuid references offerings(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check (storage_path is not null or external_url is not null),
  check (audience <> 'org' or org_id is not null),
  check (audience <> 'entitled_clients' or offering_id is not null)
);

create table content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'banner', 'insight', 'media', 'release_note', 'knowledge', 'briefing',
    'experiment', 'prototype_note', 'resource', 'broadcast'
  )),
  slug text unique,
  title text not null,
  summary text,
  body text,
  audience audience not null,
  org_id uuid references organizations(id),
  offering_id uuid references offerings(id),
  media_asset_id uuid references media_assets(id),
  owner_id uuid references profiles(id),
  review_due date,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  tags text[] not null default '{}',
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (audience <> 'org' or org_id is not null),
  check (audience <> 'entitled_clients' or offering_id is not null),
  -- Internal-only kinds can never be made public or client-visible.
  check (kind not in ('experiment', 'prototype_note', 'knowledge', 'broadcast') or audience = 'employees')
);
create trigger content_items_touch before update on content_items for each row execute function touch_updated_at();

create table content_feedback (
  content_id uuid not null references content_items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating int check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  primary key (content_id, user_id)
);

create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null check (kind in ('live', 'recording', 'webinar')),
  audience audience not null,
  org_id uuid references organizations(id),
  offering_id uuid references offerings(id),
  starts_at timestamptz,
  duration_min int,
  stream_url text,
  recording_asset_id uuid references media_assets(id),
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended', 'cancelled')),
  created_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  check (audience <> 'org' or org_id is not null),
  check (audience <> 'entitled_clients' or offering_id is not null)
);
create trigger live_sessions_touch before update on live_sessions for each row execute function touch_updated_at();

create table session_registrations (
  session_id uuid not null references live_sessions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

-- Public forms (anonymous visitors)
create table demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email citext not null,
  company text not null check (char_length(company) between 2 and 160),
  job_title text,
  offering_slug text,
  message text check (char_length(message) <= 2000),
  consent_contact boolean not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create table event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null,
  name text not null,
  email citext not null,
  organisation text,
  team_name text,
  idea text check (char_length(idea) <= 2000),
  consent_contact boolean not null,
  created_at timestamptz not null default now(),
  unique (event_slug, email)
);

-- ───────────────────────── employee innovation ─────────────────────────
create table hackathon_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  challenge text not null,
  offering_id uuid references offerings(id),
  status text not null default 'forming' check (status in ('forming', 'building', 'submitted', 'judged')),
  repo_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create table hackathon_team_members (
  team_id uuid not null references hackathon_teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',
  primary key (team_id, user_id)
);

create table playground_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  scenario_key text not null,
  offering_slug text not null,
  inputs jsonb not null,
  outputs jsonb not null,
  feedback jsonb,
  saved boolean not null default false,
  created_at timestamptz not null default now()
);

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  created_by uuid not null references profiles(id),
  subject text not null check (char_length(subject) between 4 and 160),
  body text not null check (char_length(body) <= 4000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority priority_level not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger support_tickets_touch before update on support_tickets for each row execute function touch_updated_at();

-- ───────────────────────── collective learning ─────────────────────────
create table observations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  author_id uuid not null references profiles(id),
  title text not null check (char_length(title) between 8 and 140),
  category obs_category not null,
  body text not null check (char_length(body) between 40 and 4000),
  offering_id uuid references offerings(id),
  industry text,
  region text,
  period_start date not null,
  period_end date not null,
  evidence_type evidence_type not null,
  confidence confidence_level not null,
  links text[] not null default '{}',
  visibility obs_visibility not null default 'private',
  status obs_status not null default 'draft',
  sensitive_flags jsonb not null default '[]',
  version int not null default 1,
  moderator_id uuid references profiles(id),
  return_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  withdrawn_at timestamptz,
  check (period_end >= period_start),
  check (cardinality(links) <= 5)
);
create trigger observations_touch before update on observations for each row execute function touch_updated_at();
create index observations_org on observations (org_id, status);
create index observations_author on observations (author_id);

-- Explicit lifecycle. Any other transition is rejected by the database.
create or replace function enforce_observation_transition() returns trigger language plpgsql as $$
begin
  if new.status = old.status then return new; end if;
  if not (
    (old.status = 'draft'       and new.status in ('submitted')) or
    (old.status = 'submitted'   and new.status in ('in_review', 'returned', 'rejected', 'published', 'withdrawn')) or
    (old.status = 'in_review'   and new.status in ('returned', 'rejected', 'published', 'withdrawn', 'submitted')) or
    (old.status = 'returned'    and new.status in ('submitted', 'withdrawn')) or
    (old.status = 'published'   and new.status in ('unpublished', 'withdrawn', 'submitted')) or
    (old.status = 'unpublished' and new.status in ('published', 'withdrawn', 'rejected')) or
    (old.status = 'rejected'    and new.status in ('draft'))
  ) then
    raise exception 'illegal observation transition % -> %', old.status, new.status;
  end if;
  return new;
end $$;
create trigger observations_transition before update of status on observations
  for each row execute function enforce_observation_transition();

create table observation_versions (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references observations(id) on delete cascade,
  version int not null,
  snapshot jsonb not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (observation_id, version)
);

-- Four separate permissions, recorded as an append-only history.
create table consent_records (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references observations(id) on delete cascade,
  store_process boolean not null,
  publish_shared boolean not null,
  attribution boolean not null,
  training boolean not null,
  recorded_by uuid not null references profiles(id),
  note text,
  created_at timestamptz not null default now()
);
create trigger consent_records_immutable before update or delete on consent_records
  for each row execute function forbid_mutation();

-- The approved, de-identified shared representation. Deliberately has NO org_id,
-- author_id, attachments or reviewer notes, so a shared payload cannot leak them.
create table shared_contributions (
  id uuid primary key default gen_random_uuid(),
  version int not null default 1,
  title text not null,
  summary text not null,
  category obs_category not null,
  offering_id uuid references offerings(id),
  industry text,
  region text,              -- coarsened (e.g. 'South Asia', not a city)
  period_label text not null, -- coarsened (e.g. 'H1 2026')
  evidence_type evidence_type not null,
  confidence confidence_level not null,
  attribution_label text,   -- only when the author opted in AND a moderator approved
  status shared_status not null default 'published',
  useful_count int not null default 0,
  needs_evidence_count int not null default 0,
  evidence_quality text check (evidence_quality in ('limited', 'moderate', 'strong')),
  published_by uuid references profiles(id),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger shared_touch before update on shared_contributions for each row execute function touch_updated_at();

-- Private link from shared copy to source. Never selected into shared payloads.
create table shared_sources (
  shared_id uuid primary key references shared_contributions(id) on delete cascade,
  observation_id uuid unique not null references observations(id) on delete cascade,
  org_id uuid not null references organizations(id)
);

create table moderation_events (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid references observations(id) on delete cascade,
  shared_id uuid references shared_contributions(id) on delete set null,
  action text not null,
  from_status obs_status,
  to_status obs_status,
  reason_public text,   -- shown to the contributor
  internal_note text,   -- moderators only, never in shared payloads
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);
create trigger moderation_events_immutable before update or delete on moderation_events
  for each row execute function forbid_mutation();

create table reports (
  id uuid primary key default gen_random_uuid(),
  shared_id uuid not null references shared_contributions(id) on delete cascade,
  reporter_id uuid not null references profiles(id),
  reason text not null check (reason in ('misleading', 'confidential', 'inappropriate', 'duplicate', 'other')),
  details text check (char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved')),
  decision text,
  resolved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table themes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  limitations text not null,
  offering_ids uuid[] not null default '{}',
  period_label text,
  status text not null default 'emerging' check (status in ('emerging', 'active', 'archived')),
  generated_by text not null default 'human' check (generated_by in ('human', 'assisted')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger themes_touch before update on themes for each row execute function touch_updated_at();

create table theme_contributions (
  theme_id uuid not null references themes(id) on delete cascade,
  shared_id uuid not null references shared_contributions(id) on delete cascade,
  primary key (theme_id, shared_id)
);

create table improvement_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 6 and 160),
  problem_statement text not null,
  offering_id uuid references offerings(id),
  proposed_outcome text not null,
  owner_id uuid references profiles(id),
  team text,
  priority priority_level not null default 'medium',
  status idea_status not null default 'proposed',
  theme_id uuid references themes(id),
  shared_update text,      -- audience-appropriate status message clients may see
  internal_notes text,     -- never leaves the employee surface
  client_visible boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger ideas_touch before update on improvement_ideas for each row execute function touch_updated_at();

create table idea_evidence (
  idea_id uuid not null references improvement_ideas(id) on delete cascade,
  shared_id uuid not null references shared_contributions(id) on delete cascade,
  primary key (idea_id, shared_id)
);
create table idea_assignments (
  idea_id uuid not null references improvement_ideas(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (idea_id, user_id)
);
create table idea_status_history (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references improvement_ideas(id) on delete cascade,
  from_status idea_status,
  to_status idea_status not null,
  note text,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);
create trigger idea_history_immutable before update or delete on idea_status_history
  for each row execute function forbid_mutation();

create table comments (
  id uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('shared_contribution', 'idea', 'content', 'observation')),
  parent_id uuid not null,
  author_id uuid not null references profiles(id),
  body text not null check (char_length(body) between 2 and 2000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);
create index comments_parent on comments (parent_type, parent_id);

create table bookmarks (
  user_id uuid not null references profiles(id) on delete cascade,
  shared_id uuid not null references shared_contributions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, shared_id)
);
create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  query jsonb not null,
  notify boolean not null default false,
  created_at timestamptz not null default now()
);
create table contribution_feedback (
  shared_id uuid not null references shared_contributions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  value text not null check (value in ('useful', 'needs_evidence')),
  created_at timestamptz not null default now(),
  primary key (shared_id, user_id)
);

-- ───────────────────────── notifications, outbox, audit ─────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user on notifications (user_id, read_at);

create table email_outbox (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique not null,
  to_email citext not null,
  template text not null,
  subject text not null,
  payload jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed')),
  attempts int not null default 0,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table audit_log (
  id bigserial primary key,
  actor_id uuid references profiles(id),
  actor_label text,
  action text not null,
  resource_type text not null,
  resource_id text,
  org_id uuid references organizations(id),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_log_resource on audit_log (resource_type, resource_id);
create trigger audit_log_immutable before update or delete on audit_log
  for each row execute function forbid_mutation();

create table platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── search index ─────────────────────────
-- One index for site search and AIRA retrieval. Every row carries its audience, so
-- search, counts, suggestions and AI retrieval all apply the same visibility filter.
create table search_documents (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('shared_contribution', 'content', 'offering', 'theme', 'session')),
  source_id uuid not null,
  audience audience not null,
  org_id uuid references organizations(id),
  offering_id uuid references offerings(id),
  title text not null,
  body text not null,
  url text not null,
  tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) stored,
  updated_at timestamptz not null default now(),
  unique (source_type, source_id)
);
create index search_documents_tsv on search_documents using gin (tsv);

-- Withdrawal / unpublish removes the index entry in the SAME transaction, so search and
-- AIRA retrieval stop returning it immediately (synchronous invalidation).
create or replace function sync_shared_search() returns trigger language plpgsql as $$
begin
  if new.status = 'published' then
    insert into search_documents (source_type, source_id, audience, offering_id, title, body, url)
    values ('shared_contribution', new.id, 'community', new.offering_id, new.title, new.summary,
            '/portal/learning/' || new.id)
    on conflict (source_type, source_id) do update
      set title = excluded.title, body = excluded.body, offering_id = excluded.offering_id,
          audience = excluded.audience, updated_at = now();
  else
    delete from search_documents where source_type = 'shared_contribution' and source_id = new.id;
  end if;
  return new;
end $$;
create trigger shared_search_sync after insert or update of status, title, summary, offering_id
  on shared_contributions for each row execute function sync_shared_search();

create or replace function sync_content_search() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    delete from search_documents where source_type = 'content' and source_id = old.id;
    return old;
  end if;
  if new.status = 'published' and new.kind <> 'banner' then
    insert into search_documents (source_type, source_id, audience, org_id, offering_id, title, body, url)
    values ('content', new.id, new.audience, new.org_id, new.offering_id, new.title,
            coalesce(new.summary, '') || ' ' || coalesce(new.body, ''),
            case when new.audience = 'public' then '/insights/' || coalesce(new.slug, new.id::text)
                 else '/portal/library/' || new.id end)
    on conflict (source_type, source_id) do update
      set audience = excluded.audience, org_id = excluded.org_id, offering_id = excluded.offering_id,
          title = excluded.title, body = excluded.body, url = excluded.url, updated_at = now();
  else
    delete from search_documents where source_type = 'content' and source_id = new.id;
  end if;
  return new;
end $$;
create trigger content_search_sync after insert or update or delete on content_items
  for each row execute function sync_content_search();

-- Distinct contributing organisations behind a theme. Only callable by the server.
create or replace function theme_org_count(p_theme uuid) returns int language sql stable as $$
  select count(distinct s.org_id)::int
  from theme_contributions tc
  join shared_contributions sc on sc.id = tc.shared_id and sc.status = 'published'
  join shared_sources s on s.shared_id = sc.id
  where tc.theme_id = p_theme
$$;

-- ───────────────────────── federated learning (P2) ─────────────────────────
create table fl_programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  task text not null,
  model text not null,
  feature_schema jsonb not null,
  min_participants int not null default 3,
  clip_norm numeric,
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'closed')),
  created_at timestamptz not null default now()
);
create table fl_participants (
  program_id uuid not null references fl_programs(id) on delete cascade,
  org_id uuid not null references organizations(id),
  status text not null default 'consented' check (status in ('invited', 'consented', 'withdrawn')),
  consent_by uuid references profiles(id),
  consented_at timestamptz,
  withdrawn_at timestamptz,
  primary key (program_id, org_id)
);
create table fl_rounds (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references fl_programs(id) on delete cascade,
  round_no int not null,
  aggregation text not null,
  config jsonb not null default '{}',
  status text not null check (status in ('completed', 'aborted')),
  started_at timestamptz not null,
  completed_at timestamptz,
  unique (program_id, round_no)
);
-- Update metadata only. Training examples and raw weights never reach the coordinator log.
create table fl_update_log (
  round_id uuid not null references fl_rounds(id) on delete cascade,
  participant_label text not null,
  org_id uuid references organizations(id),
  num_examples int,
  update_norm numeric,
  clipped boolean,
  accepted boolean not null,
  reason text,
  primary key (round_id, participant_label)
);
create table fl_model_versions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references fl_programs(id) on delete cascade,
  version text not null,
  parent_version text,
  round_id uuid references fl_rounds(id),
  metrics jsonb not null,
  baseline jsonb not null,
  report jsonb not null default '{}',
  status text not null default 'candidate' check (status in ('candidate', 'approved', 'rejected', 'deployed', 'rolled_back')),
  decided_by uuid references profiles(id),
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (program_id, version)
);

-- ───────────────────────── lock it down ─────────────────────────
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
-- Functions are executable by PUBLIC by default; close that, then allow only the server role.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Private storage bucket for media and attachments. No storage policies are created,
-- so objects are only reachable through the server's audience-checked /api/media route.
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do update set public = false;
