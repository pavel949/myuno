# Developer Module — Техническое задание для myUNO

**Версия:** 1.0
**Дата:** апрель 2026
**Контекст:** расширение существующей платформы myUNO модулем для застройщиков новостроек с публичной витриной, интерактивной картой доступности юнитов, lead-капчей с attribution-защитой и брокерской commission-моделью.

---

## 0. Глоссарий

| Термин | Определение |
|---|---|
| **Platform / myUNO** | Существующее приложение на Next.js + Supabase |
| **Developer / Застройщик** | Юрлицо-строитель (Peylaa, Banyan, Sansiri и т.п.) |
| **Project** | Конкретный объект застройщика (residence complex, villa project) |
| **Unit** | Отдельный юнит внутри проекта (apartment, villa) |
| **Lead** | Анонимный или идентифицированный покупатель, проявивший интерес |
| **Buyer** | Lead, прошедший KYC и вошедший в сделку |
| **Broker** | Ignatev Capital / myUNO как брокер-посредник |
| **Attribution** | Механизм фиксации «этот lead принадлежит Platform» |
| **RLN** | Registered Lead Notice — авто-уведомление девелоперу |
| **Soft Hold** | Временная блокировка юнита на 30 мин без оплаты |
| **Booking Fee** | Депозит для перехода в Reserved (обычно 2% цены) |
| **SPA** | Sales and Purchase Agreement — основной контракт |
| **Foreign Quota** | Тайское ограничение 49% для иностранцев в condo |

---

## 1. Бизнес-модель — что строим и зачем

### 1.1 Суть
Developer Module превращает myUNO в managed brokerage platform для off-plan недвижимости Пхукета. Застройщик получает бесплатный PMS + канал HNW-лидов. Платформа получает 5–8% комиссии с закрытых сделок.

### 1.2 Ключевые правила бизнеса (зашиты в код)

**R1.** Застройщик размещает проект бесплатно. Никакой подписки.
**R2.** Каждый lead, пришедший через Platform, принадлежит Broker на 365 дней с first touch.
**R3.** Commission rate индивидуален для каждого девелопера, хранится в `commission_agreements`.
**R4.** До этапа `booking_fee_paid` девелопер НЕ получает прямой контакт покупателя.
**R5.** Любой платеж buyer-а идёт через Stripe Connect escrow на счёт Broker, комиссия удерживается автоматически.
**R6.** Buyer должен пройти KYC-lite до создания Soft Hold (национальность, паспорт, source of funds).
**R7.** Foreign Quota (49%) tracking — system-enforced, не advisory.
**R8.** Цены на Platform = цены у Developer = цены у любого другого agent (price parity).

---

## 2. Архитектура

### 2.1 Три точки входа

| Зона | Route | Аудитория | Auth |
|---|---|---|---|
| **Public Marketplace** | `/newbuilds/*` | Покупатели (anonymous → registered) | Optional |
| **Developer Portal** | `/developer-portal/*` | Sales/marketing команды девелоперов | Required (role: developer_*) |
| **Broker Console** | `/capital/deals/newbuilds/*` | Ignatev Capital (внутренний) | Required (role: broker, admin) |

### 2.2 Stack (assumed, подтвердить в Cursor)
- Next.js 14 App Router, TypeScript
- Supabase (Postgres + Auth + Storage + Realtime + RLS)
- Tailwind CSS + shadcn/ui
- Stripe Connect (escrow + commission split)
- Twilio (phone masking)
- Resend (transactional email)
- Grammy + Telegram Bot API (notifications)
- Mapbox or Google Maps (project location)
- react-dropzone + Sharp (image handling)

### 2.3 Существующие таблицы (расширяются)
- `property_projects` — добавляются поля
- `project_units` — добавляются поля
- `nb_leads` — остаётся, интегрируется с attribution

### 2.4 Новые таблицы
`developers`, `developer_users`, `floor_plans`, `unit_holds`, `lead_attributions`, `reservations`, `payment_schedules`, `buyers`, `commission_agreements`, `commission_events`, `contact_disclosure_events`, `masked_channels`, `rln_events`.

---

## 3. Data Model — полные миграции

```sql
-- =========================================================
-- 3.1 DEVELOPERS — юрлица-застройщики
-- =========================================================
create table if not exists developers (
  id                    uuid primary key default gen_random_uuid(),
  legal_name            text not null,
  display_name          text not null,
  registration_number   text,
  country               text default 'TH',
  website               text,
  logo_url              text,
  description_en        text,
  description_ru        text,
  verified              boolean default false,
  verified_at           timestamptz,
  verified_by           uuid references auth.users(id),
  stripe_connect_id     text,                    -- connected account для payout
  status                text default 'pending' check (status in ('pending','active','suspended','archived')),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- =========================================================
-- 3.2 DEVELOPER_USERS — команда девелопера с ролями
-- =========================================================
create table if not exists developer_users (
  id                    uuid primary key default gen_random_uuid(),
  developer_id          uuid not null references developers(id) on delete cascade,
  auth_user_id          uuid references auth.users(id),
  email                 text not null,
  full_name             text,
  phone                 text,
  role                  text not null check (role in ('owner','admin','sales_lead','sales_rep','finance','marketing','readonly')),
  project_access        uuid[] default '{}',     -- пустой = все проекты
  invited_by            uuid references auth.users(id),
  invite_token          text unique,
  invite_expires_at     timestamptz,
  status                text default 'invited' check (status in ('invited','active','disabled')),
  last_login_at         timestamptz,
  created_at            timestamptz default now(),
  unique(developer_id, email)
);

create index on developer_users(developer_id, status);
create index on developer_users(auth_user_id);

-- =========================================================
-- 3.3 PROPERTY_PROJECTS — расширение существующей таблицы
-- =========================================================
alter table property_projects add column if not exists developer_id uuid references developers(id);
alter table property_projects add column if not exists slug text unique;
alter table property_projects add column if not exists public_listing_enabled boolean default false;
alter table property_projects add column if not exists completion_date date;
alter table property_projects add column if not exists construction_phase text check (construction_phase in ('planning','foundation','structure','mep','finishing','handover','completed'));
alter table property_projects add column if not exists total_units integer;
alter table property_projects add column if not exists available_units integer;
alter table property_projects add column if not exists price_from_thb numeric;
alter table property_projects add column if not exists price_to_thb numeric;
alter table property_projects add column if not exists foreign_quota_used_pct numeric default 0;
alter table property_projects add column if not exists foreign_units_sold integer default 0;
alter table property_projects add column if not exists thai_units_sold integer default 0;
alter table property_projects add column if not exists cover_image_url text;
alter table property_projects add column if not exists gallery_urls text[];
alter table property_projects add column if not exists video_url text;
alter table property_projects add column if not exists virtual_tour_url text;
alter table property_projects add column if not exists description_en text;
alter table property_projects add column if not exists description_ru text;
alter table property_projects add column if not exists amenities jsonb;          -- ['pool','gym','kids_club',...]
alter table property_projects add column if not exists location_lat numeric;
alter table property_projects add column if not exists location_lng numeric;
alter table property_projects add column if not exists district text;
alter table property_projects add column if not exists payment_plan_template jsonb;  -- milestone schedule
alter table property_projects add column if not exists documents_urls jsonb;       -- {brochure, eia, permit, chanote}

create index if not exists idx_projects_developer on property_projects(developer_id);
create index if not exists idx_projects_slug on property_projects(slug) where slug is not null;
create index if not exists idx_projects_public on property_projects(public_listing_enabled) where public_listing_enabled = true;

-- =========================================================
-- 3.4 FLOOR_PLANS — этажи/уровни проекта с привязкой к изображению
-- =========================================================
create table if not exists floor_plans (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references property_projects(id) on delete cascade,
  name                  text not null,            -- "Floor 1", "Penthouse Level", "Villa Zone"
  display_order         integer default 0,
  image_url             text not null,
  image_width_px        integer not null,
  image_height_px       integer not null,
  scale_reference       jsonb,                    -- {point_a:{x,y,m}, point_b:{x,y,m}} для пересчёта при rebrand
  version               integer default 1,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index on floor_plans(project_id, display_order);

-- =========================================================
-- 3.5 PROJECT_UNITS — расширение существующей таблицы
-- =========================================================
alter table project_units add column if not exists floor_plan_id uuid references floor_plans(id);
alter table project_units add column if not exists pin_x_pct numeric;            -- 0-100, позиция пина в % от width
alter table project_units add column if not exists pin_y_pct numeric;            -- 0-100, позиция пина в % от height
alter table project_units add column if not exists pin_logical_m jsonb;          -- {x_m, y_m} относительно scale_reference
alter table project_units add column if not exists floor_plan_image_url text;    -- планировка конкретного юнита
alter table project_units add column if not exists unit_status text default 'available' check (unit_status in ('available','soft_hold','reserved','spa_signed','sold','blocked','not_for_sale'));
alter table project_units add column if not exists status_version integer default 1;  -- optimistic concurrency
alter table project_units add column if not exists price_thb numeric;
alter table project_units add column if not exists size_sqm numeric;
alter table project_units add column if not exists bedrooms integer;
alter table project_units add column if not exists bathrooms integer;
alter table project_units add column if not exists floor_number integer;
alter table project_units add column if not exists view_type text;               -- 'sea','mountain','pool','garden','city'
alter table project_units add column if not exists ownership_type text check (ownership_type in ('freehold','leasehold','thai_quota','foreign_quota'));
alter table project_units add column if not exists sold_via_myuno boolean default false;
alter table project_units add column if not exists sold_to_buyer_id uuid;        -- fk buyers
alter table project_units add column if not exists sold_at timestamptz;

create index if not exists idx_units_project on project_units(project_id);
create index if not exists idx_units_floor on project_units(floor_plan_id);
create index if not exists idx_units_status on project_units(unit_status);

-- =========================================================
-- 3.6 UNIT_HOLDS — мягкие/жёсткие холды с state machine
-- =========================================================
create table if not exists unit_holds (
  id                    uuid primary key default gen_random_uuid(),
  unit_id               uuid not null references project_units(id),
  lead_id               uuid references nb_leads(id),
  buyer_id              uuid,                    -- fk buyers, set после KYC
  hold_type             text not null check (hold_type in ('soft_hold','booking_fee','reservation','spa_signed')),
  fee_amount_thb        numeric default 0,
  fee_status            text default 'none' check (fee_status in ('none','pending','paid','refunded','forfeited')),
  stripe_payment_intent_id text,
  expires_at            timestamptz,             -- soft_hold: now()+30min; booking_fee: now()+72h
  created_by_user_id    uuid,                    -- кто создал (broker/developer/buyer)
  notes                 text,
  created_at            timestamptz default now(),
  released_at           timestamptz,
  released_reason       text
);

create index on unit_holds(unit_id, hold_type, released_at);
create index on unit_holds(expires_at) where released_at is null;

-- =========================================================
-- 3.7 LEAD_ATTRIBUTIONS — сердце анти-дезинтермедиации
-- =========================================================
create table if not exists lead_attributions (
  id                      uuid primary key default gen_random_uuid(),
  attribution_cookie_id   text not null,
  project_id              uuid references property_projects(id),
  contact_fingerprint     text,                   -- sha256(lower(email)+digits(phone)+passport)
  email_hash              text,
  phone_hash              text,
  passport_hash           text,
  first_touch_at          timestamptz default now(),
  last_touch_at           timestamptz default now(),
  attribution_days        integer default 365,
  expires_at              timestamptz generated always as (first_touch_at + (attribution_days || ' days')::interval) stored,
  utm_source              text,
  utm_medium              text,
  utm_campaign            text,
  referrer                text,
  touchpoints             jsonb default '[]'::jsonb,  -- [{type, at, metadata}]
  claimed_by_broker       boolean default true,
  disputed                boolean default false,
  dispute_evidence        jsonb,
  linked_lead_id          uuid references nb_leads(id),
  linked_buyer_id         uuid,
  created_at              timestamptz default now()
);

create index on lead_attributions(attribution_cookie_id);
create index on lead_attributions(contact_fingerprint);
create index on lead_attributions(email_hash);
create index on lead_attributions(phone_hash);
create index on lead_attributions(project_id, expires_at) where claimed_by_broker = true;

-- =========================================================
-- 3.8 BUYERS — профиль покупателя, KYC
-- =========================================================
create table if not exists buyers (
  id                    uuid primary key default gen_random_uuid(),
  lead_id               uuid references nb_leads(id),
  first_name            text not null,
  last_name             text not null,
  email                 text not null,
  phone                 text not null,
  date_of_birth         date,
  nationality           text not null,           -- ISO country code, критично для quota
  passport_number       text,
  passport_expiry       date,
  passport_scan_url     text,
  tax_residency         text,
  funds_source_declared text,                    -- 'salary','business','investment','inheritance','sale_of_property'
  funds_source_docs     text[],
  kyc_status            text default 'pending' check (kyc_status in ('pending','submitted','verified','rejected')),
  kyc_verified_at       timestamptz,
  kyc_verified_by       uuid references auth.users(id),
  pep_flag              boolean default false,
  sanctions_flag        boolean default false,
  preferred_language    text default 'ru',
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index on buyers(email);
create index on buyers(phone);
create index on buyers(nationality);

-- =========================================================
-- 3.9 RESERVATIONS — бронирование с депозитом
-- =========================================================
create table if not exists reservations (
  id                    uuid primary key default gen_random_uuid(),
  unit_id               uuid not null references project_units(id),
  buyer_id              uuid not null references buyers(id),
  hold_id               uuid references unit_holds(id),
  project_id            uuid not null references property_projects(id),
  developer_id          uuid not null references developers(id),
  reservation_number    text unique not null,    -- RES-2026-00001
  deposit_amount_thb    numeric not null,
  deposit_paid_at       timestamptz,
  deposit_stripe_pi_id  text,
  reservation_fee_status text default 'pending' check (reservation_fee_status in ('pending','paid','refunded')),
  agreed_price_thb      numeric not null,        -- конечная цена (может отличаться от list на utvrd. скидку)
  discount_pct          numeric default 0,
  discount_approved_by  uuid,
  spa_signed_at         timestamptz,
  spa_document_url      text,
  handover_target_date  date,
  handover_actual_date  date,
  transfer_completed_at timestamptz,
  status                text default 'reserved' check (status in ('reserved','spa_signed','payments_in_progress','handover_scheduled','completed','cancelled')),
  cancellation_reason   text,
  created_by_user_id    uuid,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index on reservations(unit_id);
create index on reservations(buyer_id);
create index on reservations(project_id, status);
create index on reservations(developer_id, status);

-- =========================================================
-- 3.10 PAYMENT_SCHEDULES — план платежей по резервации
-- =========================================================
create table if not exists payment_schedules (
  id                    uuid primary key default gen_random_uuid(),
  reservation_id        uuid not null references reservations(id) on delete cascade,
  milestone             text not null,           -- 'booking_fee','spa_30pct','construction_25pct','finishing_25pct','handover_balance'
  milestone_order       integer not null,
  due_date              date,
  amount_thb            numeric not null,
  amount_pct            numeric,
  paid_date             date,
  paid_amount_thb       numeric,
  receipt_url           text,
  status                text default 'pending' check (status in ('pending','due_soon','overdue','paid','waived')),
  notes                 text,
  created_at            timestamptz default now()
);

create index on payment_schedules(reservation_id, milestone_order);
create index on payment_schedules(status, due_date) where status in ('pending','due_soon','overdue');

-- =========================================================
-- 3.11 COMMISSION_AGREEMENTS — коммерческие условия с каждым devveloper-ом
-- =========================================================
create table if not exists commission_agreements (
  id                        uuid primary key default gen_random_uuid(),
  developer_id              uuid not null references developers(id),
  project_id                uuid references property_projects(id),  -- null = весь девелопер
  effective_from            date not null,
  effective_to              date,
  developer_stated_rate     numeric not null,                       -- то, что dev показывает agent-ам
  myuno_retained_rate       numeric not null,                       -- реально получаем мы
  sub_agent_split           numeric default 0,
  minimum_commission_thb    numeric,
  payment_trigger           text check (payment_trigger in ('on_spa','on_30pct','50_50','on_handover','on_transfer')),
  lead_ownership_days       integer default 365,
  price_parity_enforced     boolean default true,
  exclusive_russian_channel boolean default false,
  mou_document_url          text,
  status                    text default 'draft' check (status in ('draft','active','expired','terminated')),
  signed_by_broker_at       timestamptz,
  signed_by_developer_at    timestamptz,
  created_at                timestamptz default now()
);

create index on commission_agreements(developer_id, status);
create index on commission_agreements(project_id, status);

-- =========================================================
-- 3.12 COMMISSION_EVENTS — ledger: заработано → выставлено → оплачено
-- =========================================================
create table if not exists commission_events (
  id                    uuid primary key default gen_random_uuid(),
  reservation_id        uuid not null references reservations(id),
  agreement_id          uuid not null references commission_agreements(id),
  event_type            text not null check (event_type in ('earned','invoiced','due','paid','reconciled','disputed','written_off')),
  gross_sale_price_thb  numeric not null,
  commission_amount_thb numeric not null,
  commission_rate       numeric not null,
  invoice_number        text,
  invoice_url           text,
  paid_amount_thb       numeric,
  paid_at               timestamptz,
  dispute_reason        text,
  dispute_evidence      jsonb,
  notes                 text,
  created_at            timestamptz default now()
);

create index on commission_events(reservation_id);
create index on commission_events(event_type, created_at);

-- =========================================================
-- 3.13 CONTACT_DISCLOSURE_EVENTS — audit trail раскрытия данных
-- =========================================================
create table if not exists contact_disclosure_events (
  id                    uuid primary key default gen_random_uuid(),
  lead_id               uuid references nb_leads(id),
  buyer_id              uuid references buyers(id),
  reservation_id        uuid references reservations(id),
  stage                 text not null check (stage in ('inquiry','viewing','soft_hold','booking_fee','spa_signed','handover')),
  disclosed_to_type     text not null check (disclosed_to_type in ('developer','agent','third_party')),
  disclosed_to_id       uuid,
  fields_disclosed      text[] not null,         -- ['first_name','masked_email','real_phone','passport']
  disclosed_at          timestamptz default now(),
  disclosed_by_user_id  uuid references auth.users(id)
);

create index on contact_disclosure_events(lead_id);
create index on contact_disclosure_events(buyer_id);

-- =========================================================
-- 3.14 MASKED_CHANNELS — прокси email/phone между buyer и developer
-- =========================================================
create table if not exists masked_channels (
  id                        uuid primary key default gen_random_uuid(),
  lead_id                   uuid references nb_leads(id),
  buyer_id                  uuid references buyers(id),
  reservation_id            uuid references reservations(id),
  developer_user_id         uuid references developer_users(id),
  masked_email              text unique,         -- ivan-a3f9@leads.bymyuno.com
  masked_phone_twilio_sid   text unique,         -- phone pool assignment
  real_email_buyer          text,
  real_phone_buyer          text,
  real_email_developer      text,
  real_phone_developer      text,
  active                    boolean default true,
  created_at                timestamptz default now(),
  expires_at                timestamptz
);

create index on masked_channels(masked_email);
create index on masked_channels(lead_id);

-- =========================================================
-- 3.15 RLN_EVENTS — Registered Lead Notices (аудит для enforcement)
-- =========================================================
create table if not exists rln_events (
  id                    uuid primary key default gen_random_uuid(),
  lead_attribution_id   uuid references lead_attributions(id),
  project_id            uuid references property_projects(id),
  developer_id          uuid references developers(id),
  rln_number            text unique not null,    -- RLN-2026-00001
  sent_to_email         text not null,
  sent_at               timestamptz default now(),
  delivery_status       text,                    -- resend webhook status
  evidence_url          text,                    -- PDF генерируется и хранится
  acknowledged_at       timestamptz,
  acknowledged_by       text
);

create index on rln_events(lead_attribution_id);
create index on rln_events(developer_id, sent_at);
```

---

## 4. RLS Policies (Supabase)

```sql
-- property_projects
alter table property_projects enable row level security;

create policy "public read of listed projects" on property_projects
  for select using (public_listing_enabled = true);

create policy "developer users see own projects" on property_projects
  for all using (
    developer_id in (
      select developer_id from developer_users
      where auth_user_id = auth.uid() and status = 'active'
    )
  );

create policy "broker/admin full access" on property_projects
  for all using (
    exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' in ('broker','admin'))
  );

-- project_units — аналогично
-- unit_holds: developer видит свои; broker видит все; buyer видит свои
-- buyers: broker only (персональные данные)
-- lead_attributions: broker only
-- commission_*: broker only
-- developer_users: self + developer admins
```

Полные политики — в файле `supabase/migrations/YYYYMMDD_developer_module_rls.sql`.

---

## 5. State Machines

### 5.1 Unit Status

```
  available ──(create soft_hold)──> soft_hold
    ▲                                   │
    │                                   │(expire OR release)
    │                                   ▼
    └──────────────────────────── (back to available)
                                        │
                                        │(pay booking_fee)
                                        ▼
                                    reserved
                                        │
                                        │(sign SPA)
                                        ▼
                                    spa_signed
                                        │
                                        │(complete handover)
                                        ▼
                                      sold
```

Правила:
- Soft hold: TTL = 30 мин. Cron раз в минуту освобождает expired.
- Booking fee paid → TTL для SPA = 72 часа, иначе возврат депозита и release.
- Все переходы атомарны через `select ... for update` на `project_units` + bump `status_version`.
- При optimistic lock conflict — возврат 409 и UI просит reload.

### 5.2 Reservation Status

```
reserved → spa_signed → payments_in_progress → handover_scheduled → completed
    │         │                 │                      │
    └─────────┴─────────────────┴──────────────────────┴──> cancelled
```

### 5.3 Commission Event Sequence

```
earned (SPA signed) → invoiced (счёт выставлен, +7d) → due (по trigger) → paid → reconciled
                                                            │
                                                            └─> disputed → paid / written_off
```

---

## 6. API Endpoints

### 6.1 Public (`/api/public/*`)

| Method | Route | Описание |
|---|---|---|
| GET | `/api/public/projects` | Список публичных проектов с фильтрами |
| GET | `/api/public/projects/:slug` | Детали проекта |
| GET | `/api/public/projects/:slug/availability` | Live статусы всех юнитов |
| GET | `/api/public/projects/:slug/floor-plans` | Флорпланы с пинами |
| POST | `/api/public/leads` | Создание нового lead + attribution |
| POST | `/api/public/viewings` | Запрос viewing |
| POST | `/api/public/soft-hold` | Создание soft hold (требует auth buyer-а) |

### 6.2 Buyer (`/api/buyer/*`, auth required)

| Method | Route | Описание |
|---|---|---|
| POST | `/api/buyer/kyc` | Submit KYC данных + passport scan |
| POST | `/api/buyer/booking-fee` | Инициировать Stripe Payment Intent |
| GET | `/api/buyer/reservations` | Мои бронирования |
| GET | `/api/buyer/reservations/:id/payments` | План платежей |

### 6.3 Developer Portal (`/api/developer/*`, auth + role check)

| Method | Route | Описание |
|---|---|---|
| GET | `/api/developer/overview` | KPI dashboard |
| GET | `/api/developer/projects` | Свои проекты |
| POST | `/api/developer/projects` | Создать проект |
| PATCH | `/api/developer/projects/:id` | Редактировать |
| POST | `/api/developer/projects/:id/floor-plans` | Загрузить флорплан |
| PATCH | `/api/developer/units/:id/pin` | Обновить позицию пина |
| GET | `/api/developer/leads` | Свои лиды (masked контакты) |
| GET | `/api/developer/reservations` | Свои резервации |
| GET | `/api/developer/payments` | Платежи по проектам |
| GET | `/api/developer/analytics` | Funnel, absorption, conversion |
| GET | `/api/developer/team` | Members of developer org |
| POST | `/api/developer/team/invite` | Invite member |

### 6.4 Broker Console (`/api/capital/*`, role: broker|admin)

| Method | Route | Описание |
|---|---|---|
| GET | `/api/capital/pipeline` | Cross-developer pipeline |
| GET | `/api/capital/leads/:id` | Full lead profile (unmasked) |
| POST | `/api/capital/leads/:id/assign` | Закрепить за broker |
| POST | `/api/capital/holds` | Создать hold от имени buyer-а |
| GET | `/api/capital/commissions` | Commission forecast + ledger |
| POST | `/api/capital/commissions/:id/invoice` | Выставить счёт |
| POST | `/api/capital/rln/send` | Manual RLN send |
| GET | `/api/capital/audit/disclosures` | Audit log раскрытий |

### 6.5 Webhooks (`/api/webhooks/*`)

| Route | Назначение |
|---|---|
| `/api/webhooks/stripe` | Payment events от Stripe |
| `/api/webhooks/twilio/sms` | Входящие SMS через masked numbers |
| `/api/webhooks/resend` | Email delivery status |

---

## 7. Attribution Engine — как работает защита lead-ов

### 7.1 Cookie

При первом заходе на любой `/newbuilds/*` — set cookie `myuno_attr_id` (UUID, 365 days, HttpOnly). Это `attribution_cookie_id`.

### 7.2 Fingerprinting

При submit любой формы:
```typescript
const fingerprint = sha256(
  normalize(email).toLowerCase() + 
  digitsOnly(phone) + 
  (passport || '')
);
```

`normalize()` учитывает `+7 / 8`, `.com / .ru`, регистр. Passport — optional на ранних стадиях.

### 7.3 Match logic

Новый submit ищет существующий `lead_attributions` record по:
1. `attribution_cookie_id` exact match
2. Любой из `email_hash / phone_hash / passport_hash` match

Если найден — обновляется `last_touch_at`, добавляется touchpoint. Если нет — создаётся новый.

### 7.4 RLN Trigger

Первый качественный touchpoint на проекте (form_submit, viewing_booked, calc_run с email) триггерит:
1. Создание `rln_events` record
2. Генерация PDF с привязкой: lead ID + projecte + commission agreement
3. Auto-email на `developer.notifications@[developer_domain]` + broker

Юридическая ценность: сам факт отправки — evidence о lead registration.

### 7.5 Dispute flow

Если developer утверждает «buyer пришёл напрямую», он может dispute конкретный `lead_attribution`:
- Загружает evidence (email переписки, timestamp первого контакта)
- Broker ревьюит в `/capital/disputes`
- Arbitration per MOU — 14 дней

---

## 8. Masked Communications

### 8.1 Email proxy

Требуется: wildcard DNS `*.leads.bymyuno.com` → inbound email service (Resend Inbound, Mailgun Routes, или self-hosted Postal).

Flow:
1. На Stage `viewing` создаётся `masked_channels` record с `masked_email = ivan-{hash8}@leads.bymyuno.com`
2. Developer пишет на masked → forward на real buyer email + CC broker
3. Buyer reply → reverse-forward to developer

Headers trimmed, attachments proxied.

### 8.2 Phone proxy (Twilio)

Twilio number pool, 20–50 номеров. Assignment на `masked_channels`:
- Developer звонит на masked → routed to real buyer
- Call recording → S3 → linked to `masked_channels.id`
- SMS two-way

### 8.3 WhatsApp (Phase 2)

WhatsApp Business API с myUNO как intermediary. Всё общение через WhatsApp Web UI для broker.

### 8.4 Stage-gated disclosure

```
Stage          | Buyer видит о Dev | Dev видит о Buyer
---------------|-------------------|------------------------
browse         | brand, project    | (ничего, anonymous)
inquiry        | masked email      | first_name + country + masked email
viewing_booked | masked phone      | + masked phone
soft_hold      | masked phone      | + interest summary
booking_paid   | real phone/email  | + real phone + first_name (partial unlock)
spa_signed     | full              | full + passport для SPA
```

Каждая транзакция логируется в `contact_disclosure_events`.

---

## 9. Escrow & Commission Flow (Stripe Connect)

### 9.1 Developer onboarding в Stripe

1. Developer signup → redirect на Stripe Connect Express onboarding
2. После verification — сохраняем `developers.stripe_connect_id`
3. Без этого — ставить развернуть проект публично нельзя

### 9.2 Booking Fee payment

```typescript
// /api/buyer/booking-fee
async function createBookingFee(unitId, buyerId) {
  const unit = await getUnit(unitId);
  const agreement = await getActiveAgreement(unit.project_id);
  const feeTHB = unit.price_thb * 0.02;  // 2% стандарт, конфигурируемо
  const myunoCommissionTHB = feeTHB * (agreement.myuno_retained_rate);
  const developerPayoutTHB = feeTHB - myunoCommissionTHB;
  
  const pi = await stripe.paymentIntents.create({
    amount: Math.round(feeTHB * 100),
    currency: 'thb',
    transfer_data: {
      destination: developer.stripe_connect_id,
      amount: Math.round(developerPayoutTHB * 100),
    },
    application_fee_amount: Math.round(myunoCommissionTHB * 100),
    metadata: {
      unit_id: unitId,
      buyer_id: buyerId,
      agreement_id: agreement.id,
      type: 'booking_fee'
    }
  });
  
  return { clientSecret: pi.client_secret };
}
```

### 9.3 Commission recognition

Webhook `payment_intent.succeeded` → создаёт:
1. `unit_holds` record с `hold_type='booking_fee'`, `fee_status='paid'`
2. `commission_events` с `event_type='earned'`

SPA signed → `commission_events` с `event_type='invoiced'` на full deal price.

---

## 10. Buyer KYC & Foreign Quota

### 10.1 KYC Lite — обязателен до Soft Hold

Форма на странице юнита при клике `[Request this unit]`:
- first_name, last_name
- email, phone (с verification OTP)
- nationality (ISO country dropdown, default RU)
- date_of_birth
- (Optional at этой стадии) passport_number
- funds_source_declared (dropdown)

`kyc_status = 'submitted'` → можно создать `soft_hold`.

### 10.2 KYC Full — обязателен до Booking Fee

- Passport scan upload → Supabase Storage (bucket `kyc-documents`, RLS: только broker + self)
- Claude Vision OCR: извлечение passport_number, expiry, DOB для cross-check
- PEP/sanctions screening (через external API, Phase 2; Phase 1 — manual check broker-ом)
- `kyc_status = 'verified'` → можно делать booking

### 10.3 Foreign Quota Tracking

При изменении `unit_status → 'sold'`:
```sql
update property_projects p
set 
  foreign_units_sold = (
    select count(*) from project_units u
    join reservations r on r.unit_id = u.id
    join buyers b on b.id = r.buyer_id
    where u.project_id = p.id 
      and u.unit_status = 'sold'
      and b.nationality != 'TH'
  ),
  foreign_quota_used_pct = (foreign_units_sold::numeric / total_units) * 100
where id = unit.project_id;
```

**Enforcement:** при попытке создать reservation для foreign buyer, когда `foreign_quota_used_pct >= 45%` — возврат warning; `>= 49%` — hard block с сообщением "Foreign quota reached, only Thai nationals can reserve this unit".

---

## 11. UI — Developer Portal

### 11.1 Structure

```
/developer-portal
├── page.tsx                        # Overview dashboard
├── projects/
│   ├── page.tsx                    # Список проектов
│   ├── new/page.tsx                # Создание
│   └── [id]/
│       ├── page.tsx                # Табы: основное / медиа / описание
│       ├── master-plan/page.tsx    # ГЛАВНОЕ: редактор Digital Master Plan
│       ├── inventory/page.tsx      # Таблица юнитов
│       ├── reservations/page.tsx   # Бронирования
│       ├── payments/page.tsx       # Платежи
│       ├── documents/page.tsx      # Docs library
│       ├── progress/page.tsx       # Construction updates
│       └── preview/page.tsx        # Public preview link
├── leads/page.tsx                  # Лиды (masked)
├── buyers/page.tsx                 # Buyers registry (только свои)
├── finance/page.tsx                # Revenue + commission tracker
├── analytics/page.tsx              # Funnel + sources
├── team/page.tsx                   # Members + roles
└── company/page.tsx                # Profile, logo, verification
```

### 11.2 Master Plan Editor — главный компонент

Компонент: `<FloorPlanEditor />`

Возможности:
- Upload PNG/JPG флорплана → Supabase Storage
- Set scale reference (два клика на плане → ввод реальных метров)
- Add pin: click на план → появляется unit picker → привязка к `project_units`
- Drag pin → обновление `pin_x_pct, pin_y_pct`
- Multi-floor: tabs по `floor_plans.name`
- Bulk import: CSV с unit data + auto-positioning по grid

Dependencies: `react-zoom-pan-pinch`, `react-dnd`, `canvas` API.

### 11.3 Public Master Plan — buyer-facing

Компонент: `<PublicFloorPlan />`

Возможности:
- Same canvas, но read-only pins
- Цвет пина по статусу (green/yellow/red/gray)
- Hover pin → tooltip (unit #, size, price)
- Click pin → bottom sheet (mobile) / side panel (desktop):
  - Photos юнита
  - Специфика (площадь, вид, этаж, планировка)
  - Цена
  - CTA: `[Запросить этот юнит]` → lead form
  - CTA: `[Soft Hold 30 min]` (требует KYC-lite)
- Фильтры: [All / Available / Reserved / Sold]
- Legend + counter "14 available · 4 reserved · 12 sold"

---

## 12. UI — Public Marketplace

### 12.1 Structure

```
/newbuilds
├── page.tsx                        # Каталог проектов с фильтрами
├── projects/[slug]/
│   ├── page.tsx                    # Проект, табы ниже
│   ├── layout.tsx                  # Tab nav
│   ├── overview/page.tsx
│   ├── availability/page.tsx       # ★ Digital Master Plan
│   ├── floor-plans/page.tsx        # Планировки юнитов
│   ├── terms/page.tsx              # Payment terms, ownership
│   ├── updates/page.tsx            # Construction progress
│   └── developer/page.tsx          # О застройщике
├── calculator/page.tsx             # Встроенный InvestCalc
└── compare/page.tsx                # Сравнение до 3 юнитов
```

### 12.2 Таб Availability — центральный UX

Top: счётчик статусов + фильтры.
Center: `<PublicFloorPlan />` с tabs по этажам.
Bottom: CTA block.

Mobile-first дизайн. Touch-friendly пины (min 44x44 tap area).

### 12.3 Lead forms

Два варианта:
- Quick: email + country + message (→ `nb_leads` с minimal data)
- Full: полный KYC-lite (если хочет Soft Hold)

Обе формы пишут `lead_attributions` touchpoint.

---

## 13. Notifications

### 13.1 Telegram (внутренние)

Бот `@myuno_broker_bot` (grammy). События:
- Новый lead на проекте → в канал `#leads-[project_slug]`
- Soft hold создан → alert брокеру
- Booking fee paid → alert broker + CEO
- Dispute opened → alert admin
- Payment overdue → daily digest

### 13.2 Email (Resend)

Transactional templates:
- `lead_welcome` — после первого submit
- `kyc_required` — когда buyer хочет hold, но KYC incomplete
- `soft_hold_expiring` — 5 мин до expiry
- `booking_fee_confirmation` — после paid
- `rln_notification` — для developer (авто)
- `payment_due_reminder` — за 7 дней

### 13.3 WhatsApp (Phase 2)

Через Cloud API, те же события для buyer и developer.

---

## 14. Anti-disintermediation Controls

### 14.1 Hardcoded в продукте
- Masked communications до `booking_fee_paid` ✓
- Escrow через Stripe Connect ✓
- Stage-gated contact disclosure ✓
- Price parity badge на UI у buyer: "Цена гарантирована такая же, как у застройщика"

### 14.2 Юридические (в MOU, не код)
- Lead ownership 365 days
- No direct discount clause
- Audit right quarterly
- Liquidated damages 2x commission

### 14.3 Operational
- Honeypot leads (вручную раз в 2 мес)
- Purchase data audit query (раз в квартал)
- Buyer post-handover survey

---

## 15. Phase-based Build Plan

### Phase 1 — MVP (6–8 недель)

**Цель:** Запустить с Peylaa, первая сделка через систему.

- [ ] Миграции 3.1–3.6 (developers, developer_users, floor_plans, unit_holds, расширения projects/units)
- [ ] RLS policies для listed tables
- [ ] Developer onboarding flow (signup, verification, Stripe Connect)
- [ ] Developer Portal: Overview + Projects list + Project edit + Master Plan Editor + Inventory table
- [ ] Public Marketplace: каталог + project page + Availability tab с Public Floor Plan
- [ ] Lead capture + `lead_attributions` engine + cookie logic
- [ ] RLN auto-generation + email
- [ ] Telegram bot notifications
- [ ] Basic Broker Console: pipeline, leads view, commission forecast

**Exit criteria:** Peylaa в system, публичная витрина работает, первый lead attribution создан.

### Phase 2 — Reservations & Payments (4 недели)

- [ ] Миграции 3.7–3.12 (buyers, reservations, payments, commissions)
- [ ] KYC-lite форма + Supabase Storage для passport
- [ ] Unit status state machine + cron для expiry
- [ ] Soft Hold UX (public + portal views)
- [ ] Stripe Connect integration + escrow flow
- [ ] Booking Fee payment UI
- [ ] Payment Schedules auto-generation from template
- [ ] Commission events ledger

**Exit criteria:** Первая реальная сделка закрыта, commission получена.

### Phase 3 — Communications & Compliance (3 недели)

- [ ] Миграции 3.13–3.15 (disclosures, masked, RLN)
- [ ] Email proxy через Resend Inbound
- [ ] Twilio phone pool setup
- [ ] Stage-gated disclosure logic
- [ ] Foreign Quota enforcement
- [ ] KYC Full flow + Claude Vision OCR
- [ ] Document room для проектов
- [ ] ContractAI integration для SPA

**Exit criteria:** Полная anti-disintermediation защита, compliance с тайским законом.

### Phase 4 — Scale & Analytics (3 недели)

- [ ] Agent channel (отдельная роль, commission split)
- [ ] Finance Dashboard для developer
- [ ] Analytics: funnel, absorption, source attribution
- [ ] Construction progress module с photo timeline
- [ ] Compare units + buyer favorites
- [ ] Multi-language UI (EN/RU)

**Exit criteria:** 3–5 девелоперов в системе, self-service onboarding работает.

---

## 16. Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_POOL=  # JSON array

# Resend
RESEND_API_KEY=
RESEND_INBOUND_DOMAIN=leads.bymyuno.com

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_BROKER_CHAT_ID=

# Claude (для SPA gen + OCR)
ANTHROPIC_API_KEY=

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=
```

---

## 17. Cursor Task Sequence — для пошагового выполнения

Передавать Cursor в этом порядке, каждый — отдельный prompt.

**Task 1 — Schema + RLS**
> Читай `DEVELOPER_MODULE_SPEC.md` разделы 3 и 4. Создай Supabase миграции в `supabase/migrations/` по порядку: сначала новые таблицы, потом ALTER существующих. Каждая миграция — отдельный файл с timestamp. Создай RLS policies в отдельной миграции. Запусти `supabase db reset` и покажи итоговую схему.

**Task 2 — Developer onboarding**
> Читай раздел 11. Создай роут `/developer-portal` с auth middleware. Построй signup flow: email → OTP → developer org создаётся → Stripe Connect onboarding redirect. Используй shadcn/ui компоненты. После onboarding — redirect на Overview dashboard.

**Task 3 — Developer Portal: Project CRUD**
> Читай разделы 11.1, 11.2. Создай CRUD для projects в `/developer-portal/projects/*`. Форма создания проекта: basic info, media upload (Supabase Storage), description EN/RU. Страница проекта с табами: Overview / Media / Master Plan / Inventory / Reservations / Payments / Documents / Progress / Preview.

**Task 4 — Master Plan Editor**
> Читай раздел 11.2. Построй `<FloorPlanEditor />` компонент. Upload PNG → сохранить в Storage → создать `floor_plans` record. Set scale: UI для двух кликов + input реальных метров. Add pin workflow: click на canvas → popup с unit picker → создать pin с позицией. Drag pins для перемещения. Multi-floor tabs. Use react-zoom-pan-pinch.

**Task 5 — Public Marketplace: catalog + project page**
> Читай раздел 12. Построй `/newbuilds/*` routes. Каталог с фильтрами (район, цена, bedrooms, статус строительства). Project page с табами. SEO meta tags для каждого проекта.

**Task 6 — Public Floor Plan (Availability tab)**
> Читай раздел 11.3, 12.2. Построй `<PublicFloorPlan />`. Загрузка floor_plans + units для проекта. Пины с цветом по status. Click pin → bottom sheet с данными юнита и CTA. Легенда и фильтры. Mobile-first.

**Task 7 — Lead capture + Attribution engine**
> Читай разделы 7, 12.3. Установи cookie `myuno_attr_id` при первом заходе на `/newbuilds/*`. Построй lead forms (quick + full). На submit — создай/обнови `lead_attributions`, создай `nb_leads`. Реализуй fingerprinting функцию. Triggered RLN: создай `rln_events` + отправь email через Resend + Telegram alert.

**Task 8 — Unit Status State Machine + Soft Hold**
> Читай разделы 5.1, 9. Реализуй transitions функцию с optimistic concurrency (status_version). Create soft_hold endpoint с TTL=30min. Cron job раз в минуту освобождает expired. UI для buyer: кнопка Soft Hold на bottom sheet (требует KYC-lite).

**Task 9 — Stripe Connect + Booking Fee**
> Читай раздел 9. Developer Stripe Connect Express onboarding. Buyer booking fee flow: create PaymentIntent с application_fee_amount. Stripe webhook handler: on succeeded — create unit_hold с booking_fee, create commission_event earned, update unit status. UI: Stripe Elements для карты.

**Task 10 — KYC + Buyers + Foreign Quota**
> Читай разделы 10. KYC-lite форма (required для soft hold). Passport upload с Claude Vision OCR для extract. Foreign quota tracker: triggered update на sale. Enforcement на создании reservation: 49% hard block.

**Task 11 — Broker Console**
> Читай раздел 6.4, 15 (Phase 1). Построй `/capital/deals/newbuilds/*`. Pipeline view (кросс-девелоперский). Lead detail (unmasked). Commission forecast + ledger. Manual RLN send. Audit log.

**Task 12 — Masked Communications (Phase 3)**
> Читай раздел 8. Настрой Resend Inbound Webhook для `*.leads.bymyuno.com`. Создай `masked_channels` на stage viewing. Forward логика: parse incoming → lookup masked_email → forward to real. Twilio phone pool: REST API для assign/release. Audit в `contact_disclosure_events`.

Каждый task — commit в отдельную ветку `feature/devmod-task-N`, merge через PR в `main` после smoke test.

---

## 18. Definition of Done (per task)

- [ ] Код написан
- [ ] TypeScript strict, 0 errors
- [ ] RLS policies покрывают все таблицы
- [ ] Unit test для критичного business logic (state machine, attribution match, commission calc)
- [ ] E2E test для happy path в Phase 1 (signup → create project → public view → lead submit → RLN sent)
- [ ] Mobile responsive (375px минимум)
- [ ] EN + RU translations для public-facing UI
- [ ] README в `/docs/developer-module/` с API + usage
- [ ] Smoke tested с dummy Peylaa data
- [ ] Deployed на staging → approved by Pavel → deployed на prod

---

## 19. Open Questions (решить до старта Task 1)

1. Структура `developers.stripe_connect_id` — Express или Standard account?
2. Какой домен для masked email: `leads.bymyuno.com` или `leads.myuno.app`?
3. Twilio phone numbers: TH numbers или +1 US pool?
4. Будет ли публичная витрина `/newbuilds` на основном `myuno.app` или отдельный subdomain `newbuilds.myuno.app`?
5. Commission MOU template — есть ли уже подписанная версия с Peylaa для референса?
6. Какой ID формат для reservation_number, rln_number? Предложение: `RES-YYYY-NNNNN` и `RLN-YYYY-NNNNN`.

---

**Конец спецификации.**

Документ — source of truth. Любые расхождения в коде с этим документом — баг.
