-- Investment Hub core graph and workflow tables
-- Plan alignment: entities, opportunities, rounds, matches, intro requests, DD rooms

create table if not exists public.investment_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('company', 'fund', 'project', 'person')),
  name text not null,
  country_code text not null default 'TH',
  city text,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  reliability_score integer check (reliability_score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_opportunities (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.investment_entities(id) on delete cascade,
  title text not null,
  summary text,
  asset_class text not null,
  stage text not null default 'screening' check (stage in ('screening', 'qualified', 'intro', 'dd', 'closed', 'lost')),
  zone text not null default 'market' check (zone in ('market', 'deals', 'network', 'execution')),
  fit_score integer check (fit_score between 0 and 100),
  reliability_score integer check (reliability_score between 0 and 100),
  execution_score integer check (execution_score between 0 and 100),
  target_raise_usd numeric(14,2),
  min_ticket_usd numeric(14,2),
  currency text not null default 'USD',
  country_code text not null default 'TH',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funding_rounds (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.investment_opportunities(id) on delete cascade,
  round_name text not null,
  target_amount_usd numeric(14,2),
  raised_amount_usd numeric(14,2) default 0,
  valuation_usd numeric(14,2),
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  close_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.co_investment_matches (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.investment_opportunities(id) on delete cascade,
  investor_entity_id uuid not null references public.investment_entities(id) on delete cascade,
  partner_entity_id uuid references public.investment_entities(id) on delete set null,
  fit_score integer check (fit_score between 0 and 100),
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'declined', 'converted')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intro_requests (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.investment_opportunities(id) on delete cascade,
  investor_entity_id uuid not null references public.investment_entities(id) on delete cascade,
  project_entity_id uuid not null references public.investment_entities(id) on delete cascade,
  intro_status text not null default 'new' check (intro_status in ('new', 'qualified', 'scheduled', 'declined', 'completed')),
  fee_type text not null default 'intro_fee' check (fee_type in ('intro_fee', 'success_fee')),
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.due_diligence_rooms (
  id uuid primary key default gen_random_uuid(),
  intro_request_id uuid not null references public.intro_requests(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'in_review', 'completed', 'archived')),
  checklist jsonb not null default '[]'::jsonb,
  data_provenance jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.investment_entities enable row level security;
alter table public.investment_opportunities enable row level security;
alter table public.funding_rounds enable row level security;
alter table public.co_investment_matches enable row level security;
alter table public.intro_requests enable row level security;
alter table public.due_diligence_rooms enable row level security;

drop policy if exists "investment_entities_select_authenticated" on public.investment_entities;
create policy "investment_entities_select_authenticated"
on public.investment_entities for select
to authenticated
using (true);

drop policy if exists "investment_entities_mutation_creator" on public.investment_entities;
create policy "investment_entities_mutation_creator"
on public.investment_entities for all
to authenticated
using (created_by = auth.uid() or created_by is null)
with check (created_by = auth.uid() or created_by is null);

drop policy if exists "investment_opportunities_select_authenticated" on public.investment_opportunities;
create policy "investment_opportunities_select_authenticated"
on public.investment_opportunities for select
to authenticated
using (true);

drop policy if exists "investment_opportunities_mutation_creator" on public.investment_opportunities;
create policy "investment_opportunities_mutation_creator"
on public.investment_opportunities for all
to authenticated
using (created_by = auth.uid() or created_by is null)
with check (created_by = auth.uid() or created_by is null);

drop policy if exists "funding_rounds_select_authenticated" on public.funding_rounds;
create policy "funding_rounds_select_authenticated"
on public.funding_rounds for select
to authenticated
using (true);

drop policy if exists "funding_rounds_insert_authenticated" on public.funding_rounds;
create policy "funding_rounds_insert_authenticated"
on public.funding_rounds for insert
to authenticated
with check (true);

drop policy if exists "co_investment_matches_select_authenticated" on public.co_investment_matches;
create policy "co_investment_matches_select_authenticated"
on public.co_investment_matches for select
to authenticated
using (true);

drop policy if exists "co_investment_matches_insert_authenticated" on public.co_investment_matches;
create policy "co_investment_matches_insert_authenticated"
on public.co_investment_matches for insert
to authenticated
with check (true);

drop policy if exists "intro_requests_select_authenticated" on public.intro_requests;
create policy "intro_requests_select_authenticated"
on public.intro_requests for select
to authenticated
using (true);

drop policy if exists "intro_requests_insert_authenticated" on public.intro_requests;
create policy "intro_requests_insert_authenticated"
on public.intro_requests for insert
to authenticated
with check (requested_by = auth.uid() or requested_by is null);

drop policy if exists "due_diligence_rooms_select_authenticated" on public.due_diligence_rooms;
create policy "due_diligence_rooms_select_authenticated"
on public.due_diligence_rooms for select
to authenticated
using (true);

drop policy if exists "due_diligence_rooms_insert_authenticated" on public.due_diligence_rooms;
create policy "due_diligence_rooms_insert_authenticated"
on public.due_diligence_rooms for insert
to authenticated
with check (created_by = auth.uid() or created_by is null);
