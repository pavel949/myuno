-- Capital CRM Module — Ignatev Capital
-- Tables for proactive newbuild sales CRM (Phuket)

-- ── Helper: updated_at trigger function (reuse if exists) ──
create or replace function public.capital_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ══════════════════════════════════════════════════════════════
-- 1. capital_contacts
-- ══════════════════════════════════════════════════════════════
create table public.capital_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  telegram_id text,
  whatsapp_phone text,
  preferred_channel text check (preferred_channel in ('whatsapp','telegram','email','phone')) default 'whatsapp',
  budget_min numeric,
  budget_max numeric,
  budget_currency text default 'USD',
  buyer_type text check (buyer_type in ('investor_rental','investor_resale','end_user','mixed')),
  warmth text check (warmth in ('cold','warm','hot','client')) default 'cold',
  source text,
  tags jsonb default '[]'::jsonb,
  notes text,
  last_contact_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

alter table public.capital_contacts enable row level security;

create policy "capital_contacts_select" on public.capital_contacts
  for select to authenticated using (auth.uid() = user_id);
create policy "capital_contacts_insert" on public.capital_contacts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "capital_contacts_update" on public.capital_contacts
  for update to authenticated using (auth.uid() = user_id);
create policy "capital_contacts_delete" on public.capital_contacts
  for delete to authenticated using (auth.uid() = user_id);

create index idx_capital_contacts_warmth on public.capital_contacts(warmth);
create index idx_capital_contacts_buyer_type on public.capital_contacts(buyer_type);
create index idx_capital_contacts_user_id on public.capital_contacts(user_id);

create trigger capital_contacts_updated_at
  before update on public.capital_contacts
  for each row execute function public.capital_set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 2. capital_projects
-- ══════════════════════════════════════════════════════════════
create table public.capital_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  developer text,
  location_area text,
  price_from numeric,
  price_to numeric,
  currency text default 'THB',
  completion_date date,
  construction_status text check (construction_status in ('off_plan','under_construction','completed')),
  target_buyer_types text[] default '{}',
  selling_points jsonb default '[]'::jsonb,
  commission_pct numeric,
  is_active boolean default true,
  materials_url text,
  units_total int,
  units_available int,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

alter table public.capital_projects enable row level security;

create policy "capital_projects_select" on public.capital_projects
  for select to authenticated using (auth.uid() = user_id);
create policy "capital_projects_insert" on public.capital_projects
  for insert to authenticated with check (auth.uid() = user_id);
create policy "capital_projects_update" on public.capital_projects
  for update to authenticated using (auth.uid() = user_id);
create policy "capital_projects_delete" on public.capital_projects
  for delete to authenticated using (auth.uid() = user_id);

create index idx_capital_projects_user_id on public.capital_projects(user_id);
create index idx_capital_projects_is_active on public.capital_projects(is_active);

create trigger capital_projects_updated_at
  before update on public.capital_projects
  for each row execute function public.capital_set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 3. capital_campaigns
-- ══════════════════════════════════════════════════════════════
create table public.capital_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_id uuid references public.capital_projects(id) on delete set null,
  target_criteria jsonb default '{}'::jsonb,
  status text check (status in ('draft','active','paused','completed')) default 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

alter table public.capital_campaigns enable row level security;

create policy "capital_campaigns_select" on public.capital_campaigns
  for select to authenticated using (auth.uid() = user_id);
create policy "capital_campaigns_insert" on public.capital_campaigns
  for insert to authenticated with check (auth.uid() = user_id);
create policy "capital_campaigns_update" on public.capital_campaigns
  for update to authenticated using (auth.uid() = user_id);
create policy "capital_campaigns_delete" on public.capital_campaigns
  for delete to authenticated using (auth.uid() = user_id);

create index idx_capital_campaigns_user_id on public.capital_campaigns(user_id);
create index idx_capital_campaigns_status on public.capital_campaigns(status);

-- ══════════════════════════════════════════════════════════════
-- 4. capital_outreach
-- ══════════════════════════════════════════════════════════════
create table public.capital_outreach (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.capital_campaigns(id) on delete cascade,
  contact_id uuid references public.capital_contacts(id) on delete cascade,
  project_id uuid references public.capital_projects(id) on delete set null,
  channel text check (channel in ('whatsapp','telegram','email','phone','meeting')),
  message_text text,
  sent_at timestamptz,
  delivered boolean default false,
  read boolean default false,
  replied boolean default false,
  response_type text check (response_type in ('interested','not_now','declined','no_response')),
  follow_up_date date,
  follow_up_done boolean default false,
  notes text,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

alter table public.capital_outreach enable row level security;

create policy "capital_outreach_select" on public.capital_outreach
  for select to authenticated using (auth.uid() = user_id);
create policy "capital_outreach_insert" on public.capital_outreach
  for insert to authenticated with check (auth.uid() = user_id);
create policy "capital_outreach_update" on public.capital_outreach
  for update to authenticated using (auth.uid() = user_id);
create policy "capital_outreach_delete" on public.capital_outreach
  for delete to authenticated using (auth.uid() = user_id);

create index idx_capital_outreach_campaign_id on public.capital_outreach(campaign_id);
create index idx_capital_outreach_contact_id on public.capital_outreach(contact_id);
create index idx_capital_outreach_follow_up_date on public.capital_outreach(follow_up_date);
create index idx_capital_outreach_user_id on public.capital_outreach(user_id);

-- ══════════════════════════════════════════════════════════════
-- 5. capital_pipeline
-- ══════════════════════════════════════════════════════════════
create table public.capital_pipeline (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.capital_contacts(id) on delete cascade,
  project_id uuid references public.capital_projects(id) on delete set null,
  campaign_id uuid references public.capital_campaigns(id) on delete set null,
  stage text check (stage in ('lead','qualified','viewing','reservation','contract','closed_won','closed_lost')) default 'lead',
  unit_number text,
  price_agreed numeric,
  price_currency text default 'THB',
  commission_expected numeric,
  commission_received numeric,
  stage_changed_at timestamptz default now(),
  lost_reason text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

alter table public.capital_pipeline enable row level security;

create policy "capital_pipeline_select" on public.capital_pipeline
  for select to authenticated using (auth.uid() = user_id);
create policy "capital_pipeline_insert" on public.capital_pipeline
  for insert to authenticated with check (auth.uid() = user_id);
create policy "capital_pipeline_update" on public.capital_pipeline
  for update to authenticated using (auth.uid() = user_id);
create policy "capital_pipeline_delete" on public.capital_pipeline
  for delete to authenticated using (auth.uid() = user_id);

create index idx_capital_pipeline_stage on public.capital_pipeline(stage);
create index idx_capital_pipeline_contact_id on public.capital_pipeline(contact_id);
create index idx_capital_pipeline_user_id on public.capital_pipeline(user_id);

create trigger capital_pipeline_updated_at
  before update on public.capital_pipeline
  for each row execute function public.capital_set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 6. capital_message_templates
-- ══════════════════════════════════════════════════════════════
create table public.capital_message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text check (channel in ('whatsapp','telegram','email')),
  buyer_type text,
  language text default 'ru',
  subject text,
  body text not null,
  variables jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

alter table public.capital_message_templates enable row level security;

create policy "capital_message_templates_select" on public.capital_message_templates
  for select to authenticated using (auth.uid() = user_id);
create policy "capital_message_templates_insert" on public.capital_message_templates
  for insert to authenticated with check (auth.uid() = user_id);
create policy "capital_message_templates_update" on public.capital_message_templates
  for update to authenticated using (auth.uid() = user_id);
create policy "capital_message_templates_delete" on public.capital_message_templates
  for delete to authenticated using (auth.uid() = user_id);

create index idx_capital_message_templates_user_id on public.capital_message_templates(user_id);
create index idx_capital_message_templates_channel on public.capital_message_templates(channel);
