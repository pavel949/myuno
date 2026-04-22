# myUNO · Data Schema v1.0
## Канонический документ схемы данных платформы

> **Статус:** эталонный. Источник истины для всей схемы данных Supabase — таблицы, enums, индексы, RLS-политики, связи. Любое расхождение между этим документом и реальной БД — это **дефект**, который устраняется PR в этот файл (если изменилась реальность) или миграцией (если изменилась схема).
>
> **Назначение.** Один файл, в который заглядывает любой инженер или AI-агент и получает полный ответ: какие таблицы существуют, какие поля в `users`, какие FK между ними, как настроена RLS для конкретной таблицы, какие naming conventions. Без импровизации, без догадок.
>
> **Философия.** Схема данных — это **самая дорогая в изменении** часть системы. Plot twist в UI стоит час работы. Plot twist в schema может стоить неделю миграции и broken clients. Поэтому: **additive over destructive, append-only where audit matters, RLS by default**.
>
> **Связанные документы:**
> - `PROJECT.md` §14 (Технологический стек — Supabase constraints)
> - `04-implementation-protocol.md` M2 (Lifecycle + Role columns в users)
> - `M8-clearview-integration-protocol.md` M8a (ClearView schema)
> - `07-information-architecture.md` §2.1 (субдомены и access patterns)

---

## 1 · Три принципа схемы данных

Всё в этом документе выводится из трёх принципов. Любое нарушение — красный флаг в PR.

### 1.1 · Один пользователь — одна БД — все домены

Единый `user_id` проходит через **все** 12 субдоменов платформы. Один Supabase `public` schema. Никаких параллельных баз, никаких `v2` схем, никаких отдельных БД для Invest vs Stay.

**Следствие:** вся кросс-доменная логика (lead scoring, lifecycle tracking, cross-sell) работает через FK на единую таблицу `users`. Если появляется искушение завести отдельную таблицу `invest_users` — это дефект дизайна.

### 1.2 · URL описывает задачу, схема описывает реальность

Имена таблиц и полей отражают **предметную область**, а не внутренние названия продуктов.

**Хорошо:** таблица `assessments` с FK на `properties`.
**Плохо:** таблица `clearview_projects_data_v2_new` с встроенными legacy-полями.

**Следствие:** мы не кодируем бренды продуктов в имена таблиц, если таблица реально специфична для домена. `clearview_*` таблицы оправданы, потому что ClearView — это отдельная методология с собственной жизнью. А вот `contractai_analyses` — плохо, правильнее `contract_analyses`.

### 1.3 · Структура всегда обратима

Каждое изменение схемы имеет **написанный rollback-скрипт** в том же PR. Если нельзя откатить — нельзя применить.

**Следствие:** никаких `DROP TABLE` на production без предварительной стадии soft-delete. Никаких `ALTER COLUMN TYPE` без явной миграции данных. Любое destructive изменение делается через **parallel path + cutover**, не через in-place modification.

---

## 2 · Технологические ограничения

Это **фиксированные** архитектурные решения из PROJECT.md §14. Не обсуждаются без явного согласия Павла.

| Ограничение | Значение | Причина |
|---|---|---|
| Database | Supabase PostgreSQL (hosted) | Единственное решение |
| Schema | **Только `public`** | Нет v2, нет других schemas |
| Auth | Supabase Auth | Единый SSO через все субдомены |
| Storage | Supabase Storage | Single source для всех файлов |
| Edge Functions | Deno 2.0 | Runtime для serverless logic |
| Extensions | `pgvector`, `pg_cron`, `pgcrypto` | Разрешены; другие — через одобрение |
| Max single table rows | ~100M (architectural) | Дальше — partitioning или archiving |
| RLS | **Обязательна на всех user-facing таблицах** | PDPA compliance, defense in depth |
| TypeScript types | Auto-generated via `supabase gen types` | Single source от БД |
| Migrations | `/supabase/migrations/` с датированными файлами | Git-versioned, review-able |
| Backup | Supabase daily automated + weekly manual | PITR 7 дней |

---

## 3 · Naming conventions

Железные правила. Нарушение = PR rejected.

### 3.1 · Таблицы

- **snake_case, множественное число:** `users`, `properties`, `clearview_assessments`
- **Префиксы домена** для специфичных таблиц: `clearview_*`, `stripe_*`
- **Не используем** CamelCase, kebab-case, singular
- Максимум 40 символов

### 3.2 · Колонки

- **snake_case:** `created_at`, `lifecycle_stage`, `detected_persona_confidence`
- **Foreign keys:** `<referenced_table_singular>_id` — `user_id`, `property_id`, `assessment_id`
- **Boolean поля** — префикс `is_` или `has_`: `is_active`, `has_kyb_verified`, `is_published`
- **Timestamps** — суффикс `_at`: `created_at`, `published_at`, `last_downloaded_at`
- **Counters** — суффикс `_count`: `visits_count`, `owned_properties_count`
- **Max amounts в THB** — суффикс `_thb`: `amount_thb`, `total_value_thb`
- **JSONB поля** — имя описывает содержимое: `lifecycle_stage_history`, `scoring_rationale`

### 3.3 · Индексы

- **B-tree индексы:** `idx_<table>_<columns>` — `idx_users_lifecycle_stage`
- **GIN для массивов/JSONB:** `idx_<table>_<column>_gin` — `idx_users_active_clusters_gin`
- **Partial индексы:** имя отражает условие — `idx_clearview_projects_public_ranking` (WHERE is_published = TRUE)
- **Unique constraints** на уровне таблицы, не индекса

### 3.4 · Enums

- **snake_case, единственное число:** `lifecycle_stage`, `clearview_grade`
- **Значения enum** — snake_case без префикса: `'scout'`, `'tourist'`, `'AAA'` (для grade — uppercase как convention)
- **Всегда с комментарием** о том, где этот enum используется

### 3.5 · RLS policies

- Имя описывает **кто видит что**: `"Public sees published projects"`, `"Users see own data"`
- На английском (согласно `conventional commits, English` из PROJECT.md)
- Каждая политика имеет `COMMENT ON POLICY` с reference на канонический документ

---

## 4 · Enum reference

Все ENUM-типы, используемые в схеме. **Источник истины.** Добавление значения — миграция + PR.

### 4.1 · User lifecycle и roles

```sql
-- Lifecycle stage (см. 01-segmentation-framework.md §2.1)
CREATE TYPE lifecycle_stage AS ENUM (
  'scout',      -- первый раз, несколько дней
  'tourist',    -- туристический режим, до 30 дней
  'snowbird',   -- сезонный, 3-6 месяцев каждый год
  'nomad',      -- удалённая работа, 3-12 месяцев
  'settler',    -- недавно переехал, <2 года
  'resident',   -- живёт давно, 2+ года
  'absentee',   -- не живёт, но владеет активом
  'returnee'    -- вернулся после перерыва
);

-- Economic role (см. 01-segmentation-framework.md §2.2)
CREATE TYPE role_type AS ENUM (
  'consumer',         -- потребитель сервисов
  'resident-user',    -- живёт и пользуется платформой
  'investor-passive', -- один-два объекта, удалённое управление
  'investor-active',  -- портфель, активное управление
  'operator',         -- PM, STR оператор
  'provider'          -- партнёр, подрядчик
);

-- Household type
CREATE TYPE household_type AS ENUM (
  'single',
  'couple',
  'family_with_kids',
  'multigenerational',
  'group'
);

-- Language code
CREATE TYPE language_code AS ENUM (
  'ru', 'en', 'cn', 'de', 'mn', 'bn', 'th', 'fr', 'es'
);

-- Visa type (актуально на апрель 2026)
CREATE TYPE visa_type AS ENUM (
  'dtv',        -- Destination Thailand Visa
  'ltr',        -- Long-Term Resident
  'elite',      -- Thailand Privilege (Elite)
  'non_b',      -- Non-immigrant B (business/work)
  'non_o',      -- Non-immigrant O (family/retirement)
  'non_oa',     -- Retirement OA
  'non_ox',     -- Retirement OX
  'metv',       -- Multi-Entry Tourist
  'tr',         -- Tourist
  'smart',      -- Smart Visa
  'other'
);
```

### 4.2 · ClearView enums

Полная спецификация — в `06-clearview-methodology.md` и `M8-clearview-integration-protocol.md` §M8a. Повторяем здесь для полноты реестра.

```sql
-- 5 rating bands + disqualification
CREATE TYPE clearview_grade AS ENUM (
  'AAA', 'AA', 'A', 'BBB', 'BB', 'DISQUALIFIED'
);

-- 10 статусов процесса assessment
CREATE TYPE clearview_assessment_status AS ENUM (
  'submitted', 'under_review', 'site_visit', 'interview',
  'market_analysis', 'scoring', 'final_review',
  'published', 'expired', 'disqualified'
);

-- 8 категорий оценки
CREATE TYPE clearview_category AS ENUM (
  'LRC', 'DCF', 'CQP', 'LMD', 'FSP', 'IRA', 'SME', 'LES'
);

-- 6 типов модификаторов
CREATE TYPE clearview_modifier_type AS ENUM (
  'bank_guarantee',          -- +2
  'clean_land_title',        -- +1
  'ahead_of_schedule',       -- +1
  'legal_disputes',          -- -2
  'high_presale_dependency', -- -1
  'construction_delays'      -- -1
);

-- 3 tier-а для assessment
CREATE TYPE clearview_assessment_tier AS ENUM (
  'standard',   -- ฿350K
  'premium',    -- ฿500K
  'enterprise'  -- ฿600K+
);

-- 2 tier-а для инвесторских отчётов
CREATE TYPE clearview_report_tier AS ENUM (
  'premium',  -- ฿2,900
  'full'      -- ฿4,900
);
```

### 4.3 · Property и transaction enums

```sql
-- Тип собственности
CREATE TYPE ownership_type AS ENUM (
  'freehold',        -- полная собственность (тайская юрисдикция для тайцев)
  'leasehold',       -- 30+30+30
  'company',         -- через тайскую компанию (49% foreign limit)
  'foreign_quota'    -- в foreign quota кондоминиума
);

-- Тип недвижимости
CREATE TYPE property_type AS ENUM (
  'condo', 'villa', 'townhouse', 'apartment', 'land', 'commercial'
);

-- Статус объекта на платформе
CREATE TYPE property_status AS ENUM (
  'draft',           -- создан, не опубликован
  'under_review',    -- на проверке qualification team
  'active',          -- активно отображается
  'paused',          -- временно скрыт
  'sold',            -- продан
  'withdrawn'        -- снят с платформы
);

-- Тип сделки (из PROJECT.md §12)
CREATE TYPE transaction_type AS ENUM (
  'str_booking',               -- STR аренда
  'ltr_lease',                 -- долгосрочная аренда + PM
  'assignment',                -- переуступка
  'resale_purchase',           -- вторичный рынок
  'offplan_purchase',          -- off-plan покупка
  'developer_rating_sub',      -- подписка на рейтинги
  'land_sale',                 -- продажа земли
  'club_deal',                 -- клубная сделка
  'bulk_purchase',             -- оптовая закупка
  'project_packaging',         -- упаковка проекта
  'clearview_assessment',      -- ClearView оценка
  'clearview_report',          -- инвесторский отчёт
  'clearview_monitoring'       -- квартальный мониторинг
);

-- Статус транзакции
CREATE TYPE transaction_status AS ENUM (
  'initiated', 'in_progress', 'pending_payment',
  'completed', 'cancelled', 'refunded', 'disputed'
);

-- Lead temperature (см. PROJECT.md §11)
CREATE TYPE lead_temperature AS ENUM (
  'cold',   -- 0-25
  'warm',   -- 26-60
  'hot',    -- 61-85
  'ready'   -- 86-100 (WhatsApp alert)
);
```

### 4.4 · Partner и KYB

```sql
-- Тир партнёра (см. 02-service-catalogue.md)
CREATE TYPE partner_tier AS ENUM (
  'listed',              -- free, базовый листинг
  'verified',            -- verified badge + escrow
  'ombudsman_endorsed'   -- top-tier, access к HNW
);

-- KYB статус (know-your-business для партнёров)
CREATE TYPE kyb_status AS ENUM (
  'not_started', 'in_progress', 'pending_review',
  'verified', 'rejected', 'suspended'
);
```

### 4.5 · Service catalogue

```sql
-- 16 категорий каталога (см. 02-service-catalogue.md)
CREATE TYPE service_category AS ENUM (
  'emergency',        -- 01
  'home',             -- 02
  'food',             -- 03
  'health',           -- 04
  'family',           -- 05
  'transport',        -- 06
  'legal',            -- 07
  'finance',          -- 08
  'tourism',          -- 09
  'real_estate',      -- 10
  'pets',             -- 11
  'weddings',         -- 12
  'halal',            -- 13
  'sports',           -- 14
  'community',        -- 15
  'partners'          -- 16
);
```

---

## 5 · Core tables

**Центральные таблицы**, на которые ссылаются все остальные. Изменения здесь — с максимальной осторожностью.

### 5.1 · `users` (центральная таблица)

Расширение Supabase Auth users через triggers. Содержит все поля сегментации из M2 протокола внедрения.

```sql
CREATE TABLE users (
  -- Identity (управляется Supabase Auth)
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE,
  phone           TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Profile basics
  full_name       TEXT,
  avatar_url      TEXT,
  language        language_code NOT NULL DEFAULT 'en',
  country_of_origin TEXT,          -- ISO 3166-1 alpha-2

  -- Lifecycle (M2 миграция 002)
  lifecycle_stage         lifecycle_stage,
  lifecycle_stage_history JSONB NOT NULL DEFAULT '[]',
    -- [{stage, entered_at, left_at}, ...]
  first_visit_at          TIMESTAMPTZ,
  total_days_in_thailand  INT NOT NULL DEFAULT 0,
  visits_count            INT NOT NULL DEFAULT 0,
  visa_type               visa_type,
  visa_expires_at         DATE,

  -- Economic role (M2 миграция 003)
  primary_role              role_type NOT NULL DEFAULT 'consumer',
  secondary_roles           role_type[] NOT NULL DEFAULT '{}',
  owned_properties_count    INT NOT NULL DEFAULT 0,
  operated_properties_count INT NOT NULL DEFAULT 0,

  -- Household modifiers (M2 миграция 004)
  household_type            household_type,
  special_status            TEXT[] NOT NULL DEFAULT '{}',
    -- ['family', 'pet', 'halal', 'medical', 'accessibility', 'lgbtq',
    --  'athlete', 'wedding', 'kosher']
  kids_ages                 INT[] DEFAULT NULL,

  -- Detected persona (M2 миграция 005)
  detected_persona              TEXT,  -- формат 'P1'..'P25'
  detected_persona_confidence   NUMERIC(3,2),
  active_clusters               TEXT[] NOT NULL DEFAULT '{}',
    -- values: 'A'..'J' per segmentation framework §3
  triggers_active               TEXT[] NOT NULL DEFAULT '{}',
  next_lifecycle_stage_eta      DATE,

  -- Internal flags (ops-only)
  is_test_user              BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned                 BOOLEAN NOT NULL DEFAULT FALSE,
  internal_notes            TEXT  -- admin-only, RLS заблокирован для user-а

  -- Consent flags (PDPA)
  marketing_opt_in          BOOLEAN NOT NULL DEFAULT FALSE,
  tos_accepted_at           TIMESTAMPTZ,
  privacy_accepted_at       TIMESTAMPTZ
);

-- Индексы
CREATE INDEX idx_users_lifecycle_stage ON users(lifecycle_stage);
CREATE INDEX idx_users_primary_role ON users(primary_role);
CREATE INDEX idx_users_detected_persona ON users(detected_persona);
CREATE INDEX idx_users_special_status_gin ON users USING GIN(special_status);
CREATE INDEX idx_users_active_clusters_gin ON users USING GIN(active_clusters);
CREATE INDEX idx_users_secondary_roles_gin ON users USING GIN(secondary_roles);

-- Автообновление updated_at
CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE users IS
  'Core user identity + lifecycle + economic role. Single source through all 12 subdomains. See /docs/canonical/01-segmentation-framework.md for segmentation logic.';
```

**Правила изменений:**

- Добавление nullable колонки → safe, через миграцию
- Добавление NOT NULL → требует `DEFAULT` + backfill + две миграции (сначала добавить с default, потом сделать NOT NULL)
- Удаление колонки → **запрещено** в production. Сначала deprecate в коде, дождаться 30 дней без чтения, потом удалить
- Изменение типа колонки → запрещено. Создаём новую колонку с правильным типом, мигрируем данные, удаляем старую

### 5.2 · `properties`

Центральный реестр объектов. Включает как собственные (Ignatev Estate), так и партнёрские.

```sql
CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Owner / partner relationship
  owner_id        UUID REFERENCES users(id),  -- физический/юридический владелец
  partner_id      UUID REFERENCES partners(id), -- если управляется partner-ом
  is_myuno_managed BOOLEAN NOT NULL DEFAULT FALSE,
    -- TRUE для 5 own condos + 35 partner + готовых к загрузке

  -- Identity
  property_type   property_type NOT NULL,
  ownership_type  ownership_type NOT NULL,
  title_number    TEXT,  -- Chanote / Nor Sor 3 Gor number
  title_type      TEXT,  -- 'chanote' | 'nor_sor_3_gor' | 'other'

  -- Location
  district        TEXT NOT NULL,  -- нормализованный код ('bang_tao', 'laguna', ...)
  address_line1   TEXT,
  address_line2   TEXT,
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),
  province        TEXT NOT NULL DEFAULT 'Phuket',

  -- Physical specs
  size_sqm                  NUMERIC(8,2),
  bedrooms                  SMALLINT,
  bathrooms                 SMALLINT,
  year_built                SMALLINT,
  year_renovated            SMALLINT,

  -- Listing info
  title                     TEXT NOT NULL,
  description               TEXT,
  status                    property_status NOT NULL DEFAULT 'draft',

  -- Pricing
  price_sale_thb            BIGINT,
  price_rent_ltr_monthly_thb INT,
  price_rent_str_daily_thb  INT,

  -- Linked assessments
  latest_clearview_assessment_id UUID REFERENCES clearview_assessments(id),

  -- Project reference (для units в off-plan проектах)
  project_id                UUID REFERENCES clearview_projects(id),

  -- Amenities (JSONB для гибкости)
  amenities                 JSONB DEFAULT '{}',
    -- {pool: true, gym: true, pet_friendly: true, ...}

  -- Marketing
  photos_urls               TEXT[] DEFAULT '{}',
  virtual_tour_url          TEXT,
  floorplan_url             TEXT,

  -- Internal
  featured                  BOOLEAN NOT NULL DEFAULT FALSE,
  internal_notes            TEXT
);

CREATE INDEX idx_properties_district ON properties(district) WHERE status = 'active';
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_partner ON properties(partner_id);
CREATE INDEX idx_properties_project ON properties(project_id);
CREATE INDEX idx_properties_amenities_gin ON properties USING GIN(amenities);

-- Полнотекстовый поиск по заголовку
CREATE INDEX idx_properties_title_fts ON properties USING GIN(to_tsvector('simple', title));
```

### 5.3 · `partners`

Партнёры платформы: провайдеры услуг, операторы, застройщики.

```sql
CREATE TABLE partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Principal contact (user who manages this partner)
  owner_user_id   UUID NOT NULL REFERENCES users(id),

  -- Identity
  company_name    TEXT NOT NULL,
  legal_name      TEXT,
  tax_id          TEXT,  -- тайский TIN
  registration_country TEXT,

  -- Platform relationship
  tier            partner_tier NOT NULL DEFAULT 'listed',
  kyb_status      kyb_status NOT NULL DEFAULT 'not_started',
  kyb_completed_at TIMESTAMPTZ,

  -- Business category
  primary_service_category service_category,
  secondary_categories     service_category[] DEFAULT '{}',

  -- Contact
  contact_email   TEXT,
  contact_phone   TEXT,
  website_url     TEXT,
  whatsapp        TEXT,

  -- Commercial terms
  commission_rate_pct NUMERIC(5,2),
    -- стандартный commission rate для escrow транзакций
  subscription_tier_thb_monthly INT,
    -- ฿2,000 / ฿5,000 / ฿10,000 / ฿25,000

  -- Status
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  suspended_reason TEXT,

  -- Ratings
  avg_rating      NUMERIC(3,2),
  ratings_count   INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_partners_owner ON partners(owner_user_id);
CREATE INDEX idx_partners_tier ON partners(tier) WHERE is_active = TRUE;
CREATE INDEX idx_partners_category ON partners(primary_service_category);
```

### 5.4 · `services`

Каталог услуг. Соответствует 16 категориям × 230+ услугам из `02-service-catalogue.md`.

```sql
CREATE TABLE services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Catalogue hierarchy
  category        service_category NOT NULL,
  subcategory     TEXT,  -- e.g., 'visa_dtv', 'medical_emergency'

  -- Identity
  slug            TEXT UNIQUE NOT NULL,  -- 'dtv-visa-application'
  name_en         TEXT NOT NULL,
  name_ru         TEXT,
  description_en  TEXT,
  description_ru  TEXT,

  -- Segmentation (из segmentation framework)
  lifecycle_stages  lifecycle_stage[] NOT NULL DEFAULT '{}',
  roles             role_type[] NOT NULL DEFAULT '{}',
  clusters          TEXT[] NOT NULL DEFAULT '{}',
    -- values 'A'..'J'

  -- Pricing
  pricing_model   TEXT,  -- 'fixed' | 'hourly' | 'commission' | 'subscription'
  price_from_thb  INT,
  price_to_thb    INT,
  commission_pct  NUMERIC(5,2),

  -- Availability
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,

  -- Delivery
  primary_partner_id UUID REFERENCES partners(id),
  delivery_sla_hours INT,

  -- Content
  icon_name       TEXT,  -- lucide icon name
  photos_urls     TEXT[] DEFAULT '{}'
);

CREATE INDEX idx_services_category ON services(category) WHERE is_active = TRUE;
CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_lifecycle_gin ON services USING GIN(lifecycle_stages);
CREATE INDEX idx_services_roles_gin ON services USING GIN(roles);
CREATE INDEX idx_services_clusters_gin ON services USING GIN(clusters);
```

---

## 6 · Transaction tables

Любое платное взаимодействие на платформе. **Append-only where payment involved.**

### 6.1 · `transactions` (центральная таблица сделок)

```sql
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Parties
  buyer_id        UUID REFERENCES users(id),
  seller_id       UUID REFERENCES users(id),
  partner_id      UUID REFERENCES partners(id),

  -- Classification
  transaction_type transaction_type NOT NULL,
  status          transaction_status NOT NULL DEFAULT 'initiated',

  -- Linked entities
  property_id     UUID REFERENCES properties(id),
  service_id     UUID REFERENCES services(id),
  booking_id      UUID REFERENCES bookings(id),
  assessment_id   UUID REFERENCES clearview_assessments(id),

  -- Amounts
  gross_amount_thb BIGINT NOT NULL,
  platform_commission_thb BIGINT NOT NULL DEFAULT 0,
  partner_share_thb BIGINT NOT NULL DEFAULT 0,
  net_to_seller_thb BIGINT NOT NULL DEFAULT 0,

  -- Payment
  stripe_payment_intent_id TEXT,
  payment_method  TEXT,
  paid_at         TIMESTAMPTZ,

  -- Audit
  closed_by_user_id UUID REFERENCES users(id),
  closed_at       TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_property ON transactions(property_id);
CREATE INDEX idx_transactions_type_status ON transactions(transaction_type, status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_stripe ON transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

COMMENT ON TABLE transactions IS
  'Canonical transaction log. Append-only for status=completed (audit). Links to properties, services, assessments.';
```

### 6.2 · `bookings` (STR + LTR бронирования)

```sql
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Parties
  guest_id        UUID NOT NULL REFERENCES users(id),
  property_id     UUID NOT NULL REFERENCES properties(id),
  host_partner_id UUID REFERENCES partners(id),

  -- Type
  booking_type    TEXT NOT NULL,  -- 'str' | 'ltr'

  -- Dates
  check_in_date   DATE NOT NULL,
  check_out_date  DATE NOT NULL,
  nights_count    INT GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,

  -- Guests
  adults_count    INT NOT NULL DEFAULT 1,
  kids_count      INT NOT NULL DEFAULT 0,
  infants_count   INT NOT NULL DEFAULT 0,

  -- Pricing
  nightly_rate_thb INT NOT NULL,
  subtotal_thb     BIGINT NOT NULL,
  cleaning_fee_thb INT DEFAULT 0,
  service_fee_thb  INT DEFAULT 0,
  taxes_thb        INT DEFAULT 0,
  total_thb        BIGINT NOT NULL,

  -- Status
  status          TEXT NOT NULL DEFAULT 'pending',
    -- 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  cancelled_at    TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Channel
  source_channel  TEXT DEFAULT 'direct',
    -- 'direct' | 'airbnb' | 'booking' | 'vrbo' | 'agoda'

  -- Guest messaging
  special_requests TEXT,
  internal_notes   TEXT
);

CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_property_dates ON bookings(property_id, check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_check_in ON bookings(check_in_date)
  WHERE status IN ('pending', 'confirmed');
```

---

## 7 · Lead intelligence tables

Центральный механизм tracking-а движения пользователя к сделке.

### 7.1 · `lead_events`

Append-only лог всех событий, которые влияют на lead scoring (PROJECT.md §11).

```sql
CREATE TABLE lead_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  user_id         UUID NOT NULL REFERENCES users(id),

  -- Event classification
  event_type      TEXT NOT NULL,
    -- e.g., 'article_read', 'property_viewed', 'clearview_report_viewed',
    --       'contract_uploaded', 'dd_started', 'calculator_used',
    --       'concierge_message', 'clearview_full_report_purchased'
  event_category  TEXT,
  points          INT NOT NULL,  -- позитивные или негативные

  -- Context
  property_id     UUID REFERENCES properties(id),
  service_id      UUID REFERENCES services(id),
  assessment_id   UUID REFERENCES clearview_assessments(id),
  subdomain       TEXT,  -- 'myuno' | 'invest' | 'clearview' | ...
  url             TEXT,

  -- Metadata
  metadata        JSONB DEFAULT '{}',
    -- {session_id, device, user_agent, referrer, ...}

  -- Append-only enforcement
  CHECK (points BETWEEN -100 AND 100)
);

CREATE INDEX idx_lead_events_user_time ON lead_events(user_id, created_at DESC);
CREATE INDEX idx_lead_events_type ON lead_events(event_type, created_at DESC);
CREATE INDEX idx_lead_events_property ON lead_events(property_id)
  WHERE property_id IS NOT NULL;

COMMENT ON TABLE lead_events IS
  'Append-only lead scoring events. Never UPDATE or DELETE. Aggregated into users.lead_score via trigger.';
```

### 7.2 · `lead_scores`

Denormalized aggregate score per user, обновляется триггером при insert в `lead_events`.

```sql
CREATE TABLE lead_scores (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scores
  current_score   INT NOT NULL DEFAULT 0,
  peak_score      INT NOT NULL DEFAULT 0,
  temperature     lead_temperature NOT NULL DEFAULT 'cold',

  -- Activity tracking
  last_event_at   TIMESTAMPTZ,
  last_event_type TEXT,
  events_count_30d INT NOT NULL DEFAULT 0,

  -- Alert state
  pavel_alerted_at TIMESTAMPTZ,  -- last time WhatsApp alert sent
  alert_cooldown_until TIMESTAMPTZ  -- anti-spam
);

CREATE INDEX idx_lead_scores_temperature ON lead_scores(temperature, updated_at DESC);
CREATE INDEX idx_lead_scores_peak ON lead_scores(peak_score DESC);
```

### 7.3 · Триггер lead scoring

```sql
-- Aggregates lead_events into lead_scores on insert
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lead_scores (user_id, current_score, peak_score, temperature, last_event_at, last_event_type, updated_at)
  VALUES (
    NEW.user_id,
    NEW.points,
    GREATEST(NEW.points, 0),
    CASE
      WHEN NEW.points >= 86 THEN 'ready'::lead_temperature
      WHEN NEW.points >= 61 THEN 'hot'::lead_temperature
      WHEN NEW.points >= 26 THEN 'warm'::lead_temperature
      ELSE 'cold'::lead_temperature
    END,
    NEW.created_at,
    NEW.event_type,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_score = lead_scores.current_score + NEW.points,
    peak_score = GREATEST(lead_scores.peak_score, lead_scores.current_score + NEW.points),
    temperature = CASE
      WHEN (lead_scores.current_score + NEW.points) >= 86 THEN 'ready'::lead_temperature
      WHEN (lead_scores.current_score + NEW.points) >= 61 THEN 'hot'::lead_temperature
      WHEN (lead_scores.current_score + NEW.points) >= 26 THEN 'warm'::lead_temperature
      ELSE 'cold'::lead_temperature
    END,
    last_event_at = NEW.created_at,
    last_event_type = NEW.event_type,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_events_update_score
  AFTER INSERT ON lead_events
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score();
```

---

## 8 · ClearView tables

Полная спецификация — в `M8-clearview-integration-protocol.md` §M8a. Здесь — краткий реестр для ориентирования.

### 8.1 Список таблиц

| Таблица | Строк на entity | Append-only? | Ключевая особенность |
|---|---|---|---|
| `clearview_projects` | 1 на проект | нет | Latest-grade кэш в main row |
| `clearview_assessments` | N (история) | **да** | `superseded_by` chain |
| `clearview_scores` | 8 на assessment | нет | UNIQUE(assessment_id, category) |
| `clearview_modifiers` | 0-6 на assessment | нет | UNIQUE(assessment_id, modifier_type) |
| `clearview_reports` | N на user | нет | Покупки Premium / Full отчётов |
| `clearview_monitoring` | 1 на project | нет | Quarterly subscriptions |

### 8.2 Append-only enforcement для assessments

```sql
-- Запрещаем UPDATE/DELETE на published assessments
CREATE OR REPLACE FUNCTION prevent_published_assessment_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published' AND TG_OP IN ('UPDATE', 'DELETE') THEN
    -- Только superseding разрешён (через отдельный endpoint, который INSERT-ит новый assessment)
    IF TG_OP = 'UPDATE' AND NEW.is_superseded = TRUE AND NEW.superseded_by IS NOT NULL THEN
      RETURN NEW;  -- разрешаем только пометку superseded
    END IF;
    RAISE EXCEPTION 'Cannot modify published assessment. Create new assessment instead.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clearview_assessments_protect_published
  BEFORE UPDATE OR DELETE ON clearview_assessments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_published_assessment_modification();
```

Полная схема для каждой таблицы — в M8 протоколе.

---

## 9 · Content tables

### 9.1 · `articles` (Knowledge Hub)

```sql
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity
  slug            TEXT UNIQUE NOT NULL,
  category        TEXT NOT NULL,  -- 'life' | 'legal' | 'finance' | 'investment' | 'daily'
  subcategory     TEXT,

  -- Content
  title           TEXT NOT NULL,
  subtitle        TEXT,
  content_md      TEXT NOT NULL,  -- markdown
  toc             JSONB DEFAULT '[]',  -- table of contents auto-generated

  -- Metadata
  author_name     TEXT,
  language        language_code NOT NULL DEFAULT 'ru',
  read_time_minutes INT,
  word_count      INT,

  -- Status
  status          TEXT NOT NULL DEFAULT 'draft',
    -- 'draft' | 'review' | 'published' | 'archived'
  published_at    TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,

  -- SEO
  meta_title      TEXT,
  meta_description TEXT,
  hero_image_url  TEXT,

  -- Linked next step (из tone of voice §6)
  next_step_cta   TEXT,  -- e.g., 'Проверить ваш DTV eligibility'
  next_step_url   TEXT,

  -- Segmentation
  relevant_lifecycle_stages lifecycle_stage[] DEFAULT '{}',
  relevant_roles            role_type[] DEFAULT '{}',
  relevant_clusters         TEXT[] DEFAULT '{}',
  relevant_modifiers        TEXT[] DEFAULT '{}',

  -- Analytics
  views_count     INT NOT NULL DEFAULT 0,
  avg_time_on_page_seconds INT
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category_published ON articles(category, published_at DESC)
  WHERE status = 'published';
CREATE INDEX idx_articles_fts ON articles USING GIN(
  to_tsvector('simple', title || ' ' || COALESCE(subtitle, '') || ' ' || content_md)
);
```

### 9.2 · `favorites`

User-selected properties / articles / services.

```sql
CREATE TABLE favorites (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL,  -- 'property' | 'article' | 'service' | 'clearview_project'
  entity_id       UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alert_on_change BOOLEAN NOT NULL DEFAULT FALSE,

  PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE INDEX idx_favorites_entity ON favorites(entity_type, entity_id);
```

---

## 10 · Notification и communication tables

### 10.1 · `notifications`

In-app уведомления.

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  notification_type TEXT NOT NULL,
    -- 'booking_confirmed' | 'clearview_score_change' | 'lead_alert' | ...
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  action_url      TEXT,

  -- Status
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,

  -- Priority
  priority        TEXT NOT NULL DEFAULT 'normal',
    -- 'low' | 'normal' | 'high' | 'urgent' (urgent = SOS)

  -- Delivery channels
  sent_email      BOOLEAN NOT NULL DEFAULT FALSE,
  sent_whatsapp   BOOLEAN NOT NULL DEFAULT FALSE,
  sent_push       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
  WHERE is_read = FALSE;
```

### 10.2 · `messages` (AI-консьерж и поддержка)

Логи разговоров с AI-агентами.

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Thread
  conversation_id UUID NOT NULL,  -- все сообщения в одной ветке
  user_id         UUID REFERENCES users(id),

  -- Message
  role            TEXT NOT NULL,  -- 'user' | 'assistant' | 'system' | 'human_agent'
  agent_id        TEXT,
    -- 'concierge' | 'legal-parser' | 'tax-advisor' | ...
    -- NULL для human_agent и user messages
  content         TEXT NOT NULL,

  -- Context
  channel         TEXT NOT NULL,  -- 'web' | 'whatsapp' | 'telegram' | 'in_app'
  language        language_code,

  -- AI metadata (если role = 'assistant')
  model           TEXT,
  tokens_prompt   INT,
  tokens_completion INT,
  cost_usd_cents  INT,
  rag_sources     TEXT[] DEFAULT '{}',

  -- Escalation
  escalated_to    TEXT,  -- 'pavel' | 'olga' | 'lawyer' | NULL
  escalated_at    TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation_time ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_user ON messages(user_id, created_at DESC);
CREATE INDEX idx_messages_agent ON messages(agent_id, created_at DESC)
  WHERE agent_id IS NOT NULL;
```

---

## 11 · RLS patterns

Row-Level Security — **обязательна на всех user-facing таблицах**. Три базовых паттерна.

### 11.1 · Паттерн «Own data only»

Пользователь видит только свои записи.

```sql
-- Пример: favorites, notifications, transactions (buyer_id)
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own data"
  ON <table> FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users modify own data"
  ON <table> FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 11.2 · Паттерн «Public + own»

Все видят published, владелец видит drafts.

```sql
-- Пример: articles, properties, clearview_projects
CREATE POLICY "Public sees published"
  ON <table> FOR SELECT
  USING (status = 'published' OR is_published = TRUE);

CREATE POLICY "Owners see own data"
  ON <table> FOR SELECT
  USING (owner_user_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Owners modify own drafts"
  ON <table> FOR UPDATE
  USING (
    (owner_user_id = auth.uid() OR owner_id = auth.uid())
    AND status != 'published'
  );
```

### 11.3 · Паттерн «Role-based»

Определённые роли видят больше.

```sql
-- Пример: admin, analyst, peer_reviewer
CREATE POLICY "Analysts see assigned"
  ON <table> FOR ALL
  USING (
    analyst_id = auth.uid()
    OR peer_reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.primary_role IN ('operator', 'provider')
        AND users.internal_notes ILIKE '%admin%'  -- не для прода!
    )
  );
```

**Для production используем** отдельную таблицу `user_roles` с правами (не hardcoded в internal_notes).

### 11.4 · RLS для admin.myuno.app

Admin-субдомен (`admin.myuno.app`) использует **service role key**, который bypass-ит RLS. Это OK для backend-операций, но **никогда** не должен быть exposed клиенту.

```typescript
// /apps/admin/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // bypass RLS
  { auth: { persistSession: false } }
);
```

---

## 12 · Helper functions и triggers

### 12.1 · `set_updated_at()`

Универсальный trigger для автообновления `updated_at`.

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем ко всем таблицам с updated_at
-- (повторяется для каждой таблицы)
CREATE TRIGGER <table>_updated_at_trigger
  BEFORE UPDATE ON <table>
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

### 12.2 · Lifecycle stage tracking

При изменении `lifecycle_stage` записывается в `lifecycle_stage_history`.

```sql
CREATE OR REPLACE FUNCTION track_lifecycle_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lifecycle_stage IS DISTINCT FROM NEW.lifecycle_stage THEN
    NEW.lifecycle_stage_history = NEW.lifecycle_stage_history ||
      jsonb_build_object(
        'from_stage', OLD.lifecycle_stage,
        'to_stage', NEW.lifecycle_stage,
        'changed_at', NOW()
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_lifecycle_change
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.lifecycle_stage IS DISTINCT FROM NEW.lifecycle_stage)
  EXECUTE FUNCTION track_lifecycle_change();
```

### 12.3 · Property owner property count sync

```sql
CREATE OR REPLACE FUNCTION sync_owned_properties_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement old owner
  IF OLD.owner_id IS NOT NULL THEN
    UPDATE users
    SET owned_properties_count = GREATEST(0, owned_properties_count - 1)
    WHERE id = OLD.owner_id;
  END IF;

  -- Increment new owner
  IF NEW.owner_id IS NOT NULL AND TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE users
    SET owned_properties_count = owned_properties_count + 1
    WHERE id = NEW.owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_sync_owner_count
  AFTER INSERT OR UPDATE OF owner_id OR DELETE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION sync_owned_properties_count();
```

---

## 13 · Миграционные правила

### 13.1 · Naming convention миграций

```
<YYYYMMDD>_<NN>_<descriptive_name>.sql
```

Примеры:
- `20260422_01_create_users_enum_lifecycle_stage.sql`
- `20260422_02_add_lifecycle_columns_to_users.sql`
- `20260501_01_clearview_projects_table.sql`

### 13.2 · Правила миграций

**Обязательно:**
1. Каждая миграция — **один atomic change**
2. Все миграции additive по умолчанию (`IF NOT EXISTS`, `IF EXISTS`)
3. Rollback-скрипт **в том же PR** в `/supabase/rollbacks/`
4. Backfill для новых NOT NULL колонок — отдельная миграция
5. Изменение типа колонки — через новую колонку + backfill + deprecate старую

**Запрещено:**
1. `DROP TABLE` на production без 30-day deprecation
2. `DROP COLUMN` без проверки отсутствия читателей
3. `ALTER COLUMN TYPE` in-place
4. Изменение enum values (только добавление новых)
5. Удаление индекса без проверки query plans

### 13.3 · Шаблон rollback-скрипта

```sql
-- /supabase/rollbacks/20260422_02_rollback.sql
-- Rolls back: 20260422_02_add_lifecycle_columns_to_users.sql

-- Удаляем индексы
DROP INDEX IF EXISTS idx_users_lifecycle_stage;

-- Удаляем колонки (ВНИМАНИЕ: данные будут потеряны)
ALTER TABLE users
  DROP COLUMN IF EXISTS lifecycle_stage,
  DROP COLUMN IF EXISTS lifecycle_stage_history,
  DROP COLUMN IF EXISTS first_visit_at,
  DROP COLUMN IF EXISTS total_days_in_thailand,
  DROP COLUMN IF EXISTS visits_count,
  DROP COLUMN IF EXISTS visa_type,
  DROP COLUMN IF EXISTS visa_expires_at;
```

### 13.4 · Миграции в CI/CD

- Все миграции проверяются в CI через `supabase db reset --linked` на staging БД
- PR не мёрджится, если миграция не проходит
- После merge — автоматический deploy на staging
- На production — manual trigger с Pavel approval

---

## 14 · Soft delete vs hard delete

### 14.1 · Что требует soft delete

**Обязательно soft delete** (добавляем `deleted_at TIMESTAMPTZ`):
- `users` — GDPR/PDPA требует сохранение 7 лет для financial records
- `transactions` — финансовые записи, audit trail
- `properties` — могли участвовать в сделках
- `clearview_assessments` — институциональный audit
- `articles` — SEO history (301 redirects)

**Паттерн:**
```sql
-- Добавление soft delete
ALTER TABLE <table> ADD COLUMN deleted_at TIMESTAMPTZ;

-- RLS учитывает
CREATE POLICY "Hide soft-deleted"
  ON <table> FOR SELECT
  USING (deleted_at IS NULL);

-- Query helper
CREATE VIEW <table>_active AS
  SELECT * FROM <table> WHERE deleted_at IS NULL;
```

### 14.2 · Что может hard delete

**Разрешён hard delete** через `ON DELETE CASCADE`:
- `favorites` — пользовательские выборы
- `notifications` — ephemeral
- `messages` — после 90 дней retention
- `lead_events` — после 2 лет (через pg_cron job)

---

## 15 · Backup и disaster recovery

### 15.1 · Backup strategy

| Уровень | Частота | Retention |
|---|---|---|
| Supabase automated daily | Daily | 7 days (PITR) |
| Manual dump weekly | Weekly | 90 days (S3 glacier) |
| Schema-only dump | On every migration | Forever (git) |
| ClearView documents | Real-time replication | Forever (legal requirement) |

### 15.2 · Recovery objectives

- **RPO (Recovery Point Objective):** 1 hour — максимум 1 час потери данных
- **RTO (Recovery Time Objective):** 4 hours — восстановление за 4 часа
- **Critical systems:** payments, clearview assessments, transactions → 0 tolerance для data loss

### 15.3 · Testing

- Quarterly disaster recovery drill
- Monthly schema diff check (production vs migrations)
- Weekly automated backup verification

---

## 16 · Indexing strategy

### 16.1 · Обязательные индексы

Для каждой таблицы:
- Primary key (автоматически)
- Foreign keys (PostgreSQL **не создаёт** автоматически — мы должны)
- `created_at DESC` для read-heavy таблиц
- Составные индексы для distinct query patterns

### 16.2 · Типы индексов

| Тип | Когда использовать |
|---|---|
| B-tree (default) | Равенство, range queries |
| GIN | Arrays, JSONB, full-text search |
| GiST | Geometry, specialized types |
| Partial (`WHERE ...`) | Queries с filter condition |
| Expression indexes | `LOWER(email)`, computed |

### 16.3 · Анализ производительности

**Раз в месяц:**
- Проверка `pg_stat_user_tables` — scan patterns
- Проверка `pg_stat_user_indexes` — unused indexes
- `EXPLAIN ANALYZE` на топ-20 slow queries из PostHog/Sentry

**Правило:** если индекс не используется 90 дней → dropping candidate.

---

## 17 · Чек-лист для новой таблицы

Перед merge миграции с новой таблицей — пройти:

**Структура**
- [ ] Имя в snake_case, plural
- [ ] Primary key UUID с `DEFAULT gen_random_uuid()`
- [ ] `created_at` и `updated_at` TIMESTAMPTZ NOT NULL
- [ ] Все FK имеют соответствующие индексы
- [ ] `COMMENT ON TABLE` с reference на канонический документ

**Безопасность**
- [ ] RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Минимум 2 политики: SELECT + INSERT/UPDATE
- [ ] Нет PII без consent flag
- [ ] Нет hardcoded admin emails или IDs

**Целостность**
- [ ] FK constraints на все references
- [ ] CHECK constraints для бизнес-правил
- [ ] UNIQUE constraints где применимо
- [ ] Default values для NOT NULL колонок

**Производительность**
- [ ] Индексы на все FK
- [ ] Индексы на поля в WHERE clauses основных queries
- [ ] `EXPLAIN ANALYZE` на типичных queries < 50ms

**Операции**
- [ ] Trigger `set_updated_at` применён
- [ ] Soft delete подключён если требуется
- [ ] Rollback-скрипт в `/supabase/rollbacks/`
- [ ] TypeScript types регенерированы (`supabase gen types`)

**Документация**
- [ ] Таблица добавлена в этот документ (§5-10)
- [ ] Naming соответствует conventions (§3)
- [ ] Связанные документы обновлены

---

## 18 · Anti-patterns — чего не делать

### 18.1 · Структурные

- ❌ Schema per subdomain (все в `public`)
- ❌ JSONB для данных, которые должны быть колонками (query-ability ↓)
- ❌ String поля вместо enum для fixed sets
- ❌ `serial` / `bigserial` вместо UUID для PK
- ❌ Denormalization без reason (eventual consistency проблемы)

### 18.2 · Performance

- ❌ Индексы на каждую колонку (write amplification)
- ❌ `SELECT *` в коде без явной необходимости
- ❌ Query в циклах (N+1)
- ❌ Missing FK indexes (PostgreSQL не делает автоматически)
- ❌ Partitioning без profiling

### 18.3 · Безопасность

- ❌ RLS отключённая «временно» для debugging
- ❌ Service role key в frontend
- ❌ PII в URL (GET params)
- ❌ Passwords / secrets в миграциях
- ❌ Hardcoded admin IDs

### 18.4 · Операционные

- ❌ Миграции без rollback
- ❌ `DROP TABLE` на prod без deprecation
- ❌ Migrations run manually на prod
- ❌ Backup без regular recovery test
- ❌ Schema changes outside migrations

---

## 19 · Эволюция и управление

### 19.1 · Review cycle

- **Weekly** — migration PR review (CTO + Pavel)
- **Monthly** — query performance review, slow queries audit
- **Quarterly** — full schema audit, unused indexes cleanup
- **Annually** — major version consideration (PG upgrade, pgvector model updates)

### 19.2 · Кто владеет

- **Schema document** (этот файл) — Pavel + CTO
- **Migration reviews** — CTO с final sign-off от Pavel для production
- **RLS policies** — security-focused peer review обязателен
- **ClearView tables** — ClearView methodology owner + CTO

### 19.3 · Когда major schema change оправдан

5 из 5 «да»:
1. Текущая схема блокирует > 30% новых features?
2. Performance проблемы не решаются индексами/queries?
3. Есть downtime window?
4. Rollback plan протестирован на staging?
5. Пользователи уведомлены за 2 недели?

Если хотя бы одно «нет» — ищем alternative через additive changes.

---

## 20 · Промпт для AI-инженера

Когда даёшь AI-агенту задачу создать таблицу / миграцию — прикрепи этот документ и используй шаблон:

```
Создай миграцию для myUNO Supabase.

КОНТЕКСТ. Схема данных в /docs/canonical/09-data-schema.md.
Ты ОБЯЗАН следовать:
- Naming conventions (раздел 3) — snake_case, plural tables
- Enum reference (раздел 4) — не создавай новые enum если есть подходящий
- RLS patterns (раздел 11) — минимум 2 policies
- Миграционным правилам (раздел 13)
- Чек-листу (раздел 17) перед финализацией

ЗАДАЧА.
[описание таблицы / изменения и её назначение]

ПЕРЕД КОДОМ опиши:
1. Назначение таблицы (предметная область)
2. Связи с существующими таблицами (FK)
3. RLS-паттерн (один из трёх из раздела 11)
4. Индексы (какие поля и почему)
5. Rollback script

Только после одобрения — напиши SQL.

ЧТО НЕ ДЕЛАТЬ.
— Не создавай новую schema (только public)
— Не используй string вместо enum для fixed values
— Не забудь FK indexes (PostgreSQL их не создаёт сам)
— Не делай destructive migration без rollback
— Не используй CamelCase или plural columns
```

---

## 21 · Связанные документы

- `PROJECT.md` §14 — технологический стек, ограничения
- `01-segmentation-framework.md` — определения lifecycle_stage, role_type, кластеров
- `02-service-catalogue.md` — 16 категорий для `services.category`
- `04-implementation-protocol.md` M2 — лайфцикл колонок в users
- `06-clearview-methodology.md` — бизнес-логика для ClearView enums и weights
- `07-information-architecture.md` — которые субдомены используют какие таблицы
- `M8-clearview-integration-protocol.md` M8a — полный SQL для 6 ClearView таблиц

---

*Data Schema · v1.0 · Апрель 2026 · Owner: Pavel + CTO*

*Принцип: схема — это контракт между прошлым и будущим. Прошлое (existing queries) и будущее (new features) оба должны работать. Additive migrations защищают оба направления.*
