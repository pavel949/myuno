# myUNO · M8 · ClearView Integration Protocol v1.0
## Operational playbook для встраивания ClearView в работающий код платформы

> **Назначение.** Пошаговый протокол для AI-инженера (Claude Code, Cursor, Lovable) для реализации ClearView как функционального продукта на платформе myUNO — без breaking changes, с проверками на каждом шаге и возможностью отката.
>
> **Отношение к `04-implementation-protocol.md`.** Этот документ — **дополнение** к основному протоколу. M1–M7 касаются сегментации, каталога, tone of voice, лендингов. **M8 касается только ClearView.** Может запускаться параллельно с M4–M6 (не блокирует и не блокируется).
>
> **Предпосылки.** M1 выполнен (canonical docs в репо). M2 желательно (чтобы была новая segmentation-схема), но не обязателен — ClearView использует независимую схему.
>
> **Канонические источники:**
> - `06-clearview-methodology.md` — методология, формула, rating bands, процесс оценки
> - `05-visual-design-system.md` — цвета, типографика, компонент Badge
> - `07-information-architecture.md` — субдомен `clearview.myuno.app`, URL conventions
> - `03-tone-of-voice.md` §10.3 + §12.1 файла 06 — как пишем про ClearView
>
> **Константа проекта, которая не нарушается:** один Supabase public schema, один user_id через все субдомены, TypeScript strict, mobile-first 375px, bilingual (RU/EN).

---

## 0 · Философия M8

### 0.1 · Три правила, которым следует AI-инженер

**Правило 1 · Методология — источник истины.** Любое техническое решение по scoring, rating bands, modifiers, процессу — сверяется с `06-clearview-methodology.md`. Если документ и код расходятся — код неправильный, не документ.

**Правило 2 · Публичное vs приватное.** ClearView имеет чёткое разделение: публичный score + grade (все видят бесплатно) и full scoring breakdown (paywall ฿2,900–4,900). Любое сомнение «что показывать» решается в пользу публичности минимума, paywall — максимума.

**Правило 3 · Audit trail как второй продукт.** Каждое изменение score — событие с timestamp, analyst_id, reason. Это не nice-to-have, это **legal requirement** и **investor-trust foundation**. Никаких «UPDATE score SET value = X». Только append-only history.

### 0.2 · Структура 6 под-вех

```
M8a · Data Schema (1 день)
   └─► M8b · Public Score Badge (0.5 дня)
   └─► M8c · Report PDF Generator (2 дня)
   └─► M8d · Developer Submission Flow (2 дня)
         └─► M8e · Payment Flow (1 день)
               └─► M8f · Quarterly Alert System (1 день)
```

**M8a блокирует всё** — схема БД должна быть первой.
**M8b и M8c можно параллелить** после M8a.
**M8d — M8e — M8f** — последовательная цепочка Developer-опыта.

**Суммарный критический путь: 7.5 дней AI-инженера** + контент-работа (сертификат, отчёт, лендинг).

### 0.3 · Константы, которые не меняются

Эти значения фиксированы `06-clearview-methodology.md`. Никакой импровизации в коде.

**Веса категорий** (раздел 3 методологии):
- LRC: 0.20, DCF: 0.20, CQP: 0.15, LMD: 0.15
- FSP: 0.10, IRA: 0.10, LES: 0.05, SME: 0.05

**Rating bands** (раздел 6):
- 90–100 → AAA · 80–89 → AA · 70–79 → A · 60–69 → BBB · <60 → BB

**Modifiers** (раздел 5.2):
- +2 bank guarantee, +1 clean title, +1 ahead of schedule
- −2 legal disputes, −1 high pre-sale dependency, −1 significant delays

**Цены** (раздел 10.1):
- Developer Assessment: ฿350K / ฿500K / ฿600K
- Investor Report: Premium ฿2,900 / Full ฿4,900
- Quarterly Monitoring: ฿15,000/квартал

---

## M8a · Data Schema

### M8a.AUDIT

AI читает:
- `/supabase/migrations/` — все существующие миграции (понять naming convention, style)
- Таблица `properties` или аналог — есть ли связь с застройщиком, проектом
- Таблица `users` — текущие поля (после M2 там должны быть lifecycle, role)
- `/packages/shared/types/database.ts` — TypeScript types
- RLS-политики существующих таблиц

**Цель audit:** понять style миграций, naming, как реализована связь user → project в существующем коде.

### M8a.GAP

Новых таблиц нет. Ни одной. Методология V3 описывает 8 категорий, 5-level maturity, modifiers, — но ничего из этого не отражено в схеме данных.

### M8a.PLAN

Семь миграций, каждая — отдельный файл. **Принцип additive** — новые таблицы добавляются, существующие не трогаются.

1. **Миграция 001 — Enums.** Создать ENUM типы для grade, status, category_code, maturity_level.
2. **Миграция 002 — clearview_projects.** Основная таблица проектов.
3. **Миграция 003 — clearview_assessments.** История оценок — append-only.
4. **Миграция 004 — clearview_scores.** Per-category breakdown для каждой assessment.
5. **Миграция 005 — clearview_modifiers.** Positive/negative modifiers applied.
6. **Миграция 006 — clearview_reports.** Купленные investor reports (paywall tracking).
7. **Миграция 007 — clearview_monitoring.** Quarterly subscriptions.
8. **Миграция 008 — RLS policies.** Политики доступа для всех 6 новых таблиц.
9. **Миграция 009 — Indexes.** B-tree + GIN для производительности.

### M8a.PROMPT

```
ЗАДАЧА M8a · Создание схемы БД для ClearView в Supabase.

ПРЕРЕКВИЗИТЫ. M1 выполнен (/docs/canonical/06-clearview-methodology.md доступен).

КОНСТАНТЫ ПРОЕКТА.
- Supabase public schema — единственная. v2 schema не создаём.
- Все изменения — только через миграции в /supabase/migrations/.
- Один user_id через все субдомены.

AUDIT (обязательно перед кодом).
1. Прочитай все существующие миграции в /supabase/migrations/, зафиксируй naming convention (snake_case? префикс даты?).
2. Найди таблицы, связанные с недвижимостью (properties, developers, projects — как у нас называется).
3. Прочитай /docs/canonical/06-clearview-methodology.md разделы 3, 4, 5 (категории и scoring).
4. Запиши в комментарий PR: "Audit: найдены миграции 20XX_XX_*, naming style: ..., существующие related таблицы: ..."

GAP. В схеме нет таблиц для ClearView. Нужно создать 6 новых таблиц + enums + RLS.

PLAN. Девять миграций, каждая — отдельный файл с префиксом даты.

─────────────────────────────────────────────────
МИГРАЦИЯ 20260422_01_clearview_enums.sql

```sql
-- ClearView grade — 5 bands per methodology §6
CREATE TYPE clearview_grade AS ENUM ('AAA', 'AA', 'A', 'BBB', 'BB', 'DISQUALIFIED');

-- Assessment status — per methodology §7 (7-step process)
CREATE TYPE clearview_assessment_status AS ENUM (
  'submitted',        -- step 1 complete
  'under_review',     -- step 2
  'site_visit',       -- step 3
  'interview',        -- step 4
  'market_analysis',  -- step 5
  'scoring',          -- step 6 (drafting)
  'final_review',     -- peer review in progress
  'published',        -- certificate issued
  'expired',          -- >12 months since publication
  'disqualified'      -- per methodology §5.3
);

-- Category codes — exact 8 per methodology §3
CREATE TYPE clearview_category AS ENUM (
  'LRC',  -- Legal & Regulatory Compliance (20%)
  'DCF',  -- Developer Credibility & Financial Stability (20%)
  'CQP',  -- Construction Quality & Progress (15%)
  'LMD',  -- Location & Market Dynamics (15%)
  'FSP',  -- Financial Structure & Payment Protection (10%)
  'IRA',  -- Investment Return & Appreciation (10%)
  'SME',  -- Sales & Marketing Effectiveness (5%)
  'LES'   -- Liquidity & Exit Strategy (5%)
);

-- Modifier types — per methodology §5.2
CREATE TYPE clearview_modifier_type AS ENUM (
  'bank_guarantee',          -- +2
  'clean_land_title',        -- +1
  'ahead_of_schedule',       -- +1
  'legal_disputes',          -- -2
  'high_presale_dependency', -- -1
  'construction_delays'      -- -1
);

-- Assessment tier — per §10.1
CREATE TYPE clearview_assessment_tier AS ENUM (
  'standard',    -- ฿350K, ≤80 units
  'premium',     -- ฿500K, 80-200 units
  'enterprise'   -- ฿600K+, 200+ units
);

-- Report tier — per §9.2
CREATE TYPE clearview_report_tier AS ENUM (
  'premium',  -- ฿2,900
  'full'      -- ฿4,900
);
```

─────────────────────────────────────────────────
МИГРАЦИЯ 20260422_02_clearview_projects.sql

```sql
-- Central registry of projects that go through ClearView assessment.
-- One row per physical project (e.g., "Rhom Bho Marina Phase 1").
-- Link to existing properties table is OPTIONAL — a project may be assessed
-- before any units are listed.

CREATE TABLE clearview_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity
  project_name    TEXT NOT NULL,
  developer_id    UUID REFERENCES users(id),  -- developer who submitted
  developer_name  TEXT NOT NULL,              -- denormalized for display
  location        TEXT NOT NULL,              -- "Bang Tao, Phuket"
  district        TEXT,                       -- normalized district code

  -- Project basics
  total_units     INT,
  unit_size_min   INT,                        -- sqm
  unit_size_max   INT,
  price_min_thb   BIGINT,
  price_max_thb   BIGINT,
  total_value_thb BIGINT,

  -- Timeline
  construction_start_date DATE,
  expected_completion_date DATE,

  -- Current status
  latest_assessment_id UUID,                  -- points to clearview_assessments
  latest_grade    clearview_grade,
  latest_score    NUMERIC(5,2),               -- 0.00 to 100.00
  latest_published_at TIMESTAMPTZ,
  expiration_date DATE,                       -- certificate valid for 12 months

  -- Flags
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  is_disqualified BOOLEAN NOT NULL DEFAULT FALSE,
  disqualification_reason TEXT,

  -- Relationship to existing properties (optional)
  property_id     UUID                        -- REFERENCES properties(id) if exists
);

COMMENT ON TABLE clearview_projects IS
  'Canonical registry of projects assessed via ClearView methodology. See /docs/canonical/06-clearview-methodology.md';
```

─────────────────────────────────────────────────
МИГРАЦИЯ 20260422_03_clearview_assessments.sql

```sql
-- APPEND-ONLY history of all assessments for a project.
-- A project may be re-assessed annually or on material changes.
-- Each row represents one complete assessment cycle.

CREATE TABLE clearview_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES clearview_projects(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Process tracking
  status          clearview_assessment_status NOT NULL DEFAULT 'submitted',
  tier            clearview_assessment_tier NOT NULL,
  analyst_id      UUID REFERENCES users(id),
  peer_reviewer_id UUID REFERENCES users(id),

  -- Dates of each step
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  doc_review_completed_at TIMESTAMPTZ,
  site_visit_completed_at TIMESTAMPTZ,
  interview_completed_at  TIMESTAMPTZ,
  market_analysis_completed_at TIMESTAMPTZ,
  scoring_drafted_at      TIMESTAMPTZ,
  peer_reviewed_at        TIMESTAMPTZ,
  developer_reviewed_at   TIMESTAMPTZ,       -- developer's 48h factual check
  published_at            TIMESTAMPTZ,

  -- Final outputs
  raw_score       NUMERIC(5,2),              -- before modifiers
  modifier_sum    NUMERIC(3,1) DEFAULT 0,    -- net modifier points
  final_score     NUMERIC(5,2),              -- raw + modifiers, capped at 0-100
  grade           clearview_grade,

  -- Documents
  certificate_url TEXT,                      -- signed URL in Supabase Storage
  executive_summary_url TEXT,
  full_report_url TEXT,

  -- Audit trail
  scoring_rationale JSONB,                   -- structured notes per category
  notes           TEXT,

  -- Append-only enforcement
  is_superseded   BOOLEAN NOT NULL DEFAULT FALSE,
  superseded_by   UUID REFERENCES clearview_assessments(id)
);

CREATE INDEX idx_clearview_assessments_project ON clearview_assessments(project_id);
CREATE INDEX idx_clearview_assessments_status ON clearview_assessments(status);
CREATE INDEX idx_clearview_assessments_published ON clearview_assessments(published_at DESC)
  WHERE status = 'published';

COMMENT ON TABLE clearview_assessments IS
  'Append-only assessment history. Never UPDATE score after publication — create new assessment and mark old as superseded.';
```

─────────────────────────────────────────────────
МИГРАЦИЯ 20260422_04_clearview_scores.sql

```sql
-- Per-category score breakdown for each assessment.
-- 8 rows per assessment (one per category in clearview_category enum).

CREATE TABLE clearview_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   UUID NOT NULL REFERENCES clearview_assessments(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  category        clearview_category NOT NULL,

  -- Raw score for this category (0.00 to 10.00 normalized)
  raw_score       NUMERIC(4,2) NOT NULL CHECK (raw_score >= 0 AND raw_score <= 10),

  -- Weight per methodology §3 (0.20 for LRC, 0.05 for LES, etc.)
  weight          NUMERIC(3,2) NOT NULL CHECK (weight > 0 AND weight <= 1),

  -- Weighted contribution: raw_score * weight * 10 (to normalize to 0-100 scale)
  weighted_score  NUMERIC(5,2) GENERATED ALWAYS AS (raw_score * weight * 10) STORED,

  -- Maturity level (1-5 per methodology §4)
  maturity_level  SMALLINT CHECK (maturity_level BETWEEN 1 AND 5),

  -- Rationale for this score
  rationale       TEXT,
  strengths       TEXT[],
  concerns        TEXT[],

  UNIQUE(assessment_id, category)  -- one score per category per assessment
);

CREATE INDEX idx_clearview_scores_assessment ON clearview_scores(assessment_id);

COMMENT ON TABLE clearview_scores IS
  '8 rows per assessment, one per category. Weights fixed by methodology and cannot be changed per-assessment.';
```

─────────────────────────────────────────────────
МИГРАЦИЯ 20260422_05_clearview_modifiers.sql

```sql
-- Modifiers applied to a specific assessment.
-- Per methodology §5.2 — 3 positive and 3 negative possible types.

CREATE TABLE clearview_modifiers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   UUID NOT NULL REFERENCES clearview_assessments(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  modifier_type   clearview_modifier_type NOT NULL,

  -- Value follows methodology §5.2 exactly:
  -- bank_guarantee: +2, clean_land_title: +1, ahead_of_schedule: +1
  -- legal_disputes: -2, high_presale_dependency: -1, construction_delays: -1
  points          NUMERIC(3,1) NOT NULL,

  evidence        TEXT,                      -- why this modifier applies
  applied_by      UUID REFERENCES users(id), -- analyst who applied

  UNIQUE(assessment_id, modifier_type)       -- a modifier applies at most once
);

CREATE INDEX idx_clearview_modifiers_assessment ON clearview_modifiers(assessment_id);

COMMENT ON TABLE clearview_modifiers IS
  'Modifiers per methodology §5.2. Point values are fixed by type and validated at app layer.';
```

─────────────────────────────────────────────────
МИГРАЦИЯ 20260422_06_clearview_reports.sql

```sql
-- Tracks purchased investor reports (Premium ฿2,900 or Full ฿4,900).
-- One row per purchase; a user may purchase the same report multiple times
-- (different dates = different report versions).

CREATE TABLE clearview_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Who purchased
  user_id         UUID NOT NULL REFERENCES users(id),

  -- What
  assessment_id   UUID NOT NULL REFERENCES clearview_assessments(id),
  project_id      UUID NOT NULL REFERENCES clearview_projects(id), -- denormalized

  -- Tier
  tier            clearview_report_tier NOT NULL,

  -- Payment
  stripe_payment_intent_id TEXT,
  amount_thb      INT NOT NULL,              -- 2900 or 4900
  paid_at         TIMESTAMPTZ,

  -- Delivery
  pdf_url         TEXT,                      -- Supabase Storage signed URL
  delivered_at    TIMESTAMPTZ,

  -- Access tracking
  downloaded_count INT NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ
);

CREATE INDEX idx_clearview_reports_user ON clearview_reports(user_id);
CREATE INDEX idx_clearview_reports_assessment ON clearview_reports(assessment_id);

COMMENT ON TABLE clearview_reports IS
  'Paywalled investor reports. Premium = executive summary, Full = complete breakdown.';
```

─────────────────────────────────────────────────
МИГРАЦИЯ 20260422_07_clearview_monitoring.sql

```sql
-- Quarterly monitoring subscriptions — retainer service for developers.
-- Per methodology §10.1 — ฿15K/quarter per project.

CREATE TABLE clearview_monitoring (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  project_id      UUID NOT NULL REFERENCES clearview_projects(id),
  developer_id    UUID NOT NULL REFERENCES users(id),

  -- Subscription lifecycle
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  auto_renew      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Billing
  stripe_subscription_id TEXT,
  quarterly_rate_thb INT NOT NULL DEFAULT 15000,

  -- Quarterly reviews log
  last_review_at  TIMESTAMPTZ,
  next_review_due DATE,

  -- Alert preferences
  alert_on_score_change BOOLEAN NOT NULL DEFAULT TRUE,
  alert_email     TEXT,
  alert_whatsapp  TEXT
);

CREATE INDEX idx_clearview_monitoring_project ON clearview_monitoring(project_id);
CREATE INDEX idx_clearview_monitoring_active_expiry ON clearview_monitoring(expires_at)
  WHERE is_active = TRUE;

COMMENT ON TABLE clearview_monitoring IS
  'Quarterly monitoring retainer. ฿15K/quarter per methodology §10.1.';
```

─────────────────────────────────────────────────
МИГРАЦИЯ 20260422_08_clearview_rls.sql

```sql
-- RLS policies per methodology §11.2 and §13.2 (PDPA compliance).

ALTER TABLE clearview_projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearview_assessments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearview_scores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearview_modifiers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearview_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearview_monitoring    ENABLE ROW LEVEL SECURITY;

-- PROJECTS: public sees published, developers see their own, analysts/admin see all.
CREATE POLICY "Public sees published projects"
  ON clearview_projects FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Developers see their projects"
  ON clearview_projects FOR SELECT
  USING (developer_id = auth.uid());

CREATE POLICY "Analysts and admins see all projects"
  ON clearview_projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.primary_role IN ('analyst', 'admin')
    )
  );

-- ASSESSMENTS: published ones visible, drafts only to involved parties.
CREATE POLICY "Public sees published assessments"
  ON clearview_assessments FOR SELECT
  USING (status = 'published');

CREATE POLICY "Developers see their assessments"
  ON clearview_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clearview_projects cp
      WHERE cp.id = clearview_assessments.project_id
        AND cp.developer_id = auth.uid()
    )
  );

CREATE POLICY "Analysts see assigned assessments"
  ON clearview_assessments FOR ALL
  USING (
    analyst_id = auth.uid()
    OR peer_reviewer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND primary_role = 'admin')
  );

-- SCORES: visible with parent assessment policy (same user can see scores if can see assessment).
CREATE POLICY "Scores follow assessment visibility"
  ON clearview_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clearview_assessments ca
      WHERE ca.id = clearview_scores.assessment_id
    )
  );

-- MODIFIERS: same as scores.
CREATE POLICY "Modifiers follow assessment visibility"
  ON clearview_modifiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clearview_assessments ca
      WHERE ca.id = clearview_modifiers.assessment_id
    )
  );

-- REPORTS: only the purchaser can see their purchased reports.
CREATE POLICY "Users see their own reports"
  ON clearview_reports FOR SELECT
  USING (user_id = auth.uid());

-- MONITORING: only the subscribing developer + admin.
CREATE POLICY "Developers see their monitoring"
  ON clearview_monitoring FOR SELECT
  USING (developer_id = auth.uid());
```

─────────────────────────────────────────────────
МИГРАЦИЯ 20260422_09_clearview_indexes.sql

```sql
-- Performance indexes for common query patterns.

-- Public dashboard: list all published projects sorted by score desc
CREATE INDEX idx_clearview_projects_public_ranking
  ON clearview_projects(latest_score DESC NULLS LAST, latest_published_at DESC)
  WHERE is_published = TRUE;

-- Filter projects by grade
CREATE INDEX idx_clearview_projects_grade
  ON clearview_projects(latest_grade)
  WHERE is_published = TRUE;

-- Filter by district (for /clearview?district=bang-tao)
CREATE INDEX idx_clearview_projects_district
  ON clearview_projects(district)
  WHERE is_published = TRUE;

-- Developer view: all my assessments, newest first
CREATE INDEX idx_clearview_assessments_by_project_date
  ON clearview_assessments(project_id, created_at DESC);

-- User view: my purchased reports
CREATE INDEX idx_clearview_reports_user_date
  ON clearview_reports(user_id, created_at DESC);

-- Monitoring: upcoming quarterly reviews
CREATE INDEX idx_clearview_monitoring_upcoming_reviews
  ON clearview_monitoring(next_review_due)
  WHERE is_active = TRUE;
```

─────────────────────────────────────────────────

ЧТО НЕ ДЕЛАТЬ.
- Не менять таблицы properties, users, projects — все связи через FK, не изменения существующего.
- Не хардкодить веса категорий или modifier-values в БД — они живут в application layer (packages/shared/clearview/).
- Не разрешать UPDATE на опубликованных assessment. Only superseding (новый assessment со ссылкой на предыдущий через superseded_by).
- Не хранить PII застройщика без явного consent-флага (PDPA §13.2).

ТЕСТИРОВАНИЕ.
1. `supabase db reset` — все 9 миграций применяются без ошибок.
2. `\d clearview_projects` в psql — все поля на месте.
3. Insert test project → test assessment → test scores (все 8 категорий) → test modifiers → test final_score.
4. Проверить что RLS блокирует неавторизованный доступ: с auth.uid = NULL вижу только published.
5. Проверить каскад: DELETE assessment → scores и modifiers удаляются (ON DELETE CASCADE).

АКЦЕПТ.
- 9 миграций, каждая в отдельном коммите.
- PR содержит результат audit в комментарии.
- Rollback-скрипты подготовлены в /supabase/rollbacks/20260422_*_rollback.sql (DROP TABLE в обратном порядке).
- Локальный seed script создаёт 1 тестовый проект с полным assessment для dev.

ROLLBACK. Применить rollback-скрипты в обратном порядке (09 → 01).
```

### M8a.ACCEPTANCE

- [ ] 9 миграций применяются без ошибок
- [ ] 6 новых таблиц + 6 enums + RLS + индексы
- [ ] Rollback-скрипты есть для каждой миграции
- [ ] Существующие таблицы не тронуты
- [ ] Seed-скрипт создаёт тестовый проект для dev-проверки
- [ ] RLS проверен: anonymous видит только published

### M8a.ROLLBACK

`supabase/rollbacks/20260422_0*_rollback.sql` в обратном порядке. Существующие данные проекта не затрагиваются.

---

## M8b · Public Score Badge

### M8b.AUDIT

AI читает:
- `/packages/ui/` — существующие компоненты из design system (Button, Badge, Card)
- `/docs/canonical/05-visual-design-system.md` — разделы 2.5 (semantic colors), 2.6 (category colors), 8.4 (Badge component spec)
- `/apps/web/app/buy/` или аналог — PropertySearch / project cards (куда встраивать)
- `/apps/web/components/PropertyCard.tsx` или аналог

**Цель audit:** найти точное место размещения Badge в существующей карточке проекта.

### M8b.GAP

Badge-компонента ClearView нет. В карточке проекта в PropertySearch нет секции для отображения рейтинга. Публичная summary-страница `/buy/[id]/clearview` не существует.

### M8b.PLAN

1. Создать `<ClearViewBadge>` компонент в `/packages/ui/clearview/`
2. Интегрировать в PropertyCard
3. Создать public summary route `/buy/[id]/clearview`
4. Добавить cross-domain link на `clearview.myuno.app/projects/[id]`

### M8b.PROMPT

```
ЗАДАЧА M8b · Создать компонент ClearView Badge и встроить в карточку проекта.

ПРЕРЕКВИЗИТЫ. M8a выполнен (схема БД).

AUDIT.
1. Открой /packages/ui/ — найди существующий Badge-компонент (должен быть из M1/M7).
2. Открой /docs/canonical/05-visual-design-system.md §8.4 — спецификация Badge.
3. Открой /docs/canonical/06-clearview-methodology.md §6 — rating bands (AAA/AA/A/BBB/BB).
4. Найди PropertyCard.tsx (или как называется карточка проекта в витрине /buy).
5. Напиши audit в комментарий PR.

PLAN.

Шаг 1. Создай компонент /packages/ui/clearview/ClearViewBadge.tsx:

```tsx
import { Grade } from '@myuno/shared/clearview';

interface ClearViewBadgeProps {
  grade: Grade;                    // 'AAA' | 'AA' | 'A' | 'BBB' | 'BB'
  score?: number;                  // 0-100, optional
  size?: 'sm' | 'md' | 'lg';       // default 'md'
  showLabel?: boolean;             // show "ClearView" text
  href?: string;                   // click destination
  className?: string;
}

// Colors follow design system §2.5 semantic palette
const GRADE_COLORS: Record<Grade, { bg: string; text: string; border: string }> = {
  AAA: { bg: '#DCFCE7', text: '#166534', border: '#166534' },  // success
  AA:  { bg: '#EBF4FF', text: '#1B4F8A', border: '#1B4F8A' },  // info (navy-100 / navy-700)
  A:   { bg: '#F4F8FD', text: '#2B6CB0', border: '#2B6CB0' },  // lighter navy
  BBB: { bg: '#FEF3C7', text: '#92400E', border: '#92400E' },  // warning
  BB:  { bg: '#FEE2E2', text: '#991B1B', border: '#991B1B' },  // danger
};

export function ClearViewBadge({
  grade, score, size = 'md', showLabel = true, href, className
}: ClearViewBadgeProps) {
  const colors = GRADE_COLORS[grade];
  const content = (
    <div className={clsx(
      'inline-flex items-center gap-2 font-mono font-medium',
      size === 'sm' && 'text-xs px-2 py-1',
      size === 'md' && 'text-sm px-3 py-1.5',
      size === 'lg' && 'text-base px-4 py-2',
      'border-l-2',  // no radius per design system §5
    )} style={{
      backgroundColor: colors.bg,
      color: colors.text,
      borderLeftColor: colors.border,
    }}>
      {showLabel && (
        <span className="text-xs uppercase tracking-wider opacity-70">
          ClearView
        </span>
      )}
      <span className="font-semibold">{grade}</span>
      {score !== undefined && (
        <span className="opacity-60">· {score.toFixed(0)}</span>
      )}
    </div>
  );

  if (href) {
    return <a href={href} className={className}>{content}</a>;
  }
  return <div className={className}>{content}</div>;
}
```

Шаг 2. Добавь типы в /packages/shared/clearview/types.ts:

```ts
export type Grade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB';

export type CategoryCode = 'LRC' | 'DCF' | 'CQP' | 'LMD' | 'FSP' | 'IRA' | 'SME' | 'LES';

export const CATEGORY_WEIGHTS: Record<CategoryCode, number> = {
  LRC: 0.20, DCF: 0.20, CQP: 0.15, LMD: 0.15,
  FSP: 0.10, IRA: 0.10, SME: 0.05, LES: 0.05,
} as const;

export const CATEGORY_NAMES: Record<CategoryCode, string> = {
  LRC: 'Legal & Regulatory Compliance',
  DCF: 'Developer Credibility & Financial Stability',
  CQP: 'Construction Quality & Progress',
  LMD: 'Location & Market Dynamics',
  FSP: 'Financial Structure & Payment Protection',
  IRA: 'Investment Return & Appreciation',
  SME: 'Sales & Marketing Effectiveness',
  LES: 'Liquidity & Exit Strategy',
} as const;

export function scoreToGrade(score: number): Grade {
  if (score >= 90) return 'AAA';
  if (score >= 80) return 'AA';
  if (score >= 70) return 'A';
  if (score >= 60) return 'BBB';
  return 'BB';
}
```

Шаг 3. Встрой в PropertyCard.tsx.
Найди место, где в карточке показывается цена или status. Добавь справа от title:

```tsx
{property.clearViewGrade && (
  <ClearViewBadge
    grade={property.clearViewGrade}
    score={property.clearViewScore}
    size="sm"
    href={`/buy/${property.id}/clearview`}
  />
)}
```

Шаг 4. Создай public summary route /apps/web/app/buy/[id]/clearview/page.tsx.
Страница показывает:
- Project name + ClearView Badge (size=lg)
- Radar chart 8 категорий (используй recharts)
- Top 3 strengths + Top 3 concerns (из clearview_scores)
- Expiration date
- CTA «Premium Report ฿2,900» и «Full Report ฿4,900»
- Link «Full methodology» → /clearview (public methodology landing)

Должна работать на mobile 375px. Tone of voice — §12.1 файла 06.

Шаг 5. Cross-domain link.
В карточке на `clearview.myuno.app/projects/[id]` сделать link обратно на `/buy/[id]` (smooth cross-subdomain navigation).

ЧТО НЕ ДЕЛАТЬ.
- Не использовать восклицания или маркетинг-язык в badge.
- Не скрывать low grade (BB/BBB) — показываем честно, это и есть ценность.
- Не делать анимацию появления badge > 200ms.
- Не создавать размеры выше 'lg' или ниже 'sm'.
- Не использовать градиенты в фоне badge.

АКЦЕПТ.
- <ClearViewBadge> рендерится для всех 5 grades.
- Storybook story (если есть Storybook) с примерами всех комбинаций.
- PropertyCard показывает badge для проектов с assessment.
- Public summary route /buy/[id]/clearview работает.
- Mobile 375px проверен.
- Tone of voice прошёл (без "лучший", "уникальный").
- Accessibility: contrast ratio проверен (WCAG AA).
```

### M8b.ACCEPTANCE

- [ ] Badge рендерится для всех 5 grades с правильными цветами
- [ ] Типы в shared package + CATEGORY_WEIGHTS как source of truth
- [ ] PropertyCard интегрирован
- [ ] Public summary route работает
- [ ] Mobile + accessibility checked

### M8b.ROLLBACK

Git revert. Badge-компонент изолирован, не ломает существующий UI.

---

## M8c · Report PDF Generator

### M8c.AUDIT

AI читает:
- `/supabase/functions/` — существующие Edge Functions, их стиль
- Если уже есть PDF-generator — использовать его (не дублировать)
- `/docs/canonical/06-clearview-methodology.md` §9 (Deliverables) и §12 (Tone of voice)

### M8c.GAP

Нет инфраструктуры для генерации PDF ClearView-отчётов (Executive Summary, Full Report, Certificate).

### M8c.PLAN

1. Edge Function `generate-clearview-report`
2. Template на React (react-pdf) с брендингом из design system
3. Storage в Supabase Storage с signed URLs
4. Три типа: Premium (2–3 стр), Full (25–40 стр), Certificate (1 стр с QR)

### M8c.PROMPT

```
ЗАДАЧА M8c · PDF-генератор для ClearView Reports и Certificates.

ПРЕРЕКВИЗИТЫ. M8a.

AUDIT.
1. Проверь наличие существующих PDF-generation tools в проекте.
2. Прочитай /docs/canonical/05-visual-design-system.md (цвета, шрифты).
3. Прочитай /docs/canonical/06-clearview-methodology.md §9 (что именно в отчётах).

PLAN.

Шаг 1. Установить зависимости:
```
pnpm add @react-pdf/renderer qrcode
```

Шаг 2. Создать Edge Function в /supabase/functions/generate-clearview-report/index.ts.

Function принимает:
```ts
interface GenerateReportRequest {
  assessment_id: string;
  report_type: 'premium' | 'full' | 'certificate';
  user_id?: string;  // for paid reports; certificates are developer-linked
}
```

Функция:
1. Проверяет авторизацию (reports — platform auth, certificates — public).
2. Fetch assessment с scores и modifiers из БД.
3. Рендерит React-PDF template.
4. Загружает в Supabase Storage bucket `clearview-reports/` с path `{assessment_id}/{report_type}-{timestamp}.pdf`.
5. Возвращает signed URL с expiry 7 дней.

Шаг 3. Создать PDF templates в /packages/clearview/pdf-templates/.

**Template 1 — ExecutiveSummary.tsx (Premium ฿2,900):**
- Page 1: Cover — project name, large ClearView badge, score, date
- Page 2: Executive summary — 3 paragraphs, top 3 strengths, top 3 concerns
- Page 3: Full disclaimer

**Template 2 — FullReport.tsx (Full ฿4,900):**
- Cover page (same as Premium)
- Executive summary (1 page)
- Project overview (2 pages)
- **8 category sections** (2–3 pages each):
  - Category name + weight
  - Score X.X/10 with visualization
  - Maturity level 1–5 description
  - Rationale paragraph
  - Strengths list
  - Concerns list
- Modifiers applied (1 page)
- Benchmark comparison with 3 similar projects (optional, 1 page)
- Methodology appendix (link to public methodology page)
- Full disclaimer

**Template 3 — Certificate.tsx (free, for developers):**
- Single page A4 portrait
- myUNO logo top
- Subheader «ClearView™ Certified Project»
- Project name (large)
- Grade badge (very large, centered)
- Score
- Assessment date + expiration date
- QR-code linking to https://clearview.myuno.app/projects/[id]/certificate
- Signature from Pavel Ignatev + title
- Bottom: disclaimer, certificate ID

**Обязательные стилевые константы (импорт из design system):**
```ts
import { COLORS, FONTS } from '@myuno/ui/tokens';
// navy-800: #0A2240
// orange-600: #D96B1A
// cream: #F7F5F1
// fonts: Noto Serif (headings), Noto Sans (body), JetBrains Mono (numbers)
```

Шаг 4. Tone of voice для отчётов — строго §12 файла 06-clearview-methodology.md.

Эталонная формулировка для Executive Summary:
```
Rhom Bho Marina. ClearView Score: 84 (AA).

Strengths:
- Verified Chanote title with clean 10-year ownership history
- Developer track record: 5 completed Phuket projects, all delivered on time
- Bank guarantee from Bangkok Bank covering 100% of buyer deposits (+2 modifier)

Concerns:
- Pre-sale dependency currently at 72% — risk of delay if sales pace slows (-1 modifier)
- EIA approval received only in Q3 2025 — limited post-approval track record
- Secondary market depth in Bang Tao reduced since 2024 downturn

Recommendation: suitable for passive investors seeking AA-grade off-plan exposure
with accepted modifier risks. Not appropriate for buyers requiring guaranteed
construction timeline.
```

НЕ ТАК:
```
Amazing project! Revolutionary returns! Best investment opportunity in Phuket!
```

Шаг 5. Certificate QR-flow.
- Certificate имеет permanent URL: clearview.myuno.app/projects/[id]/certificate
- Эта страница публично доступна (без auth)
- Показывает: текущий статус (active/expired), дату выдачи, grade, score, verification
- Если assessment superseded → показать «This certificate has been superseded» + ссылка на актуальное

ЧТО НЕ ДЕЛАТЬ.
- Не использовать stock-фотографии.
- Не добавлять декоративные графические элементы (только функциональные: radar chart, score bar).
- Не хранить PDF без expiration на signed URL (security).
- Не делать watermark «DRAFT» на published reports.
- Не добавлять ads / upsell внутри отчёта.

АКЦЕПТ.
- Edge Function генерирует все 3 типа PDF без ошибок.
- Test-fixture assessment → валидный PDF для каждого типа.
- Certificate QR ведёт на корректный verification URL.
- Все шрифты embedded (PDF открывается без subst).
- File size: Premium ≤ 500KB, Full ≤ 3MB, Certificate ≤ 200KB.
- Tone of voice соблюдён.
```

### M8c.ACCEPTANCE

- [ ] Edge Function `generate-clearview-report` работает
- [ ] 3 PDF templates (Premium, Full, Certificate)
- [ ] QR-код в сертификате ведёт на рабочий verification URL
- [ ] Шрифты embedded, корректный рендеринг
- [ ] Tone of voice проверен

### M8c.ROLLBACK

Удалить Edge Function. PDF-шаблоны изолированы, не влияют на main app.

---

## M8d · Developer Submission Flow

### M8d.AUDIT

AI читает:
- `/apps/developers/` если уже существует субдомен (иначе создать в monorepo)
- `/docs/canonical/07-information-architecture.md` §7 (sitemap developers.myuno.app)
- `/docs/canonical/06-clearview-methodology.md` §8 (documentation checklist)

### M8d.GAP

Нет Developer Portal. Нет submission flow. Нет secure document upload с verification.

### M8d.PLAN

1. Создать app `/apps/developers/` если не существует
2. Intake form (project basics → tier selection → document upload)
3. Admin review interface (internal)
4. Status tracking в Developer Dashboard

### M8d.PROMPT

```
ЗАДАЧА M8d · Developer submission flow на developers.myuno.app.

ПРЕРЕКВИЗИТЫ. M8a, M8b, M8c.

AUDIT.
1. Проверь, существует ли /apps/developers/ в monorepo.
2. Прочитай /docs/canonical/07-information-architecture.md §7 (sitemap developers).
3. Прочитай /docs/canonical/06-clearview-methodology.md §8 (полный documentation checklist).
4. Проверь Supabase Storage setup — есть ли настроенный bucket для secure documents.

PLAN.

Шаг 1. Настроить app developers в monorepo.

Если не существует:
- Создать /apps/developers/
- Next.js app
- package.json с зависимостями от /packages/ui, /packages/shared
- Vercel config для routing developers.myuno.app → этот app

Шаг 2. Routes (из 07-IA раздел 7):

```
/apps/developers/app/
├── page.tsx                                    // developer lounge home
├── projects/
│   ├── page.tsx                                // my projects list
│   ├── submit/
│   │   └── page.tsx                            // intake form
│   └── [id]/
│       ├── page.tsx                            // project status
│       ├── docs/
│       │   └── page.tsx                        // document upload
│       └── certificate/
│           └── page.tsx                        // view certificate (post-published)
├── monitoring/
│   └── page.tsx                                // quarterly monitoring subscriptions
└── billing/
    └── page.tsx
```

Шаг 3. Intake form `/projects/submit`.

Multi-step form (4 шага), каждый — отдельный экран с progress indicator.

**Шаг 1/4 — Project basics:**
- Project name
- Developer company name (pre-filled from user.company)
- Location: province, district, coordinates
- Total units
- Unit size range (min–max sqm)
- Price range (min–max THB)
- Construction start date + expected completion

**Шаг 2/4 — Tier selection:**
- Show pricing table:
  - Standard ฿350,000 (≤80 units)
  - Premium ฿500,000 (80–200 units)
  - Enterprise ฿600,000+ (200+ units)
- Auto-suggest tier based on total_units
- Explain what's included (link to /docs/canonical/06-clearview-methodology.md §9.1)

**Шаг 3/4 — Document checklist (preview):**
- Display full checklist from methodology §8
- User checks what they have ready
- NOT uploading here — just confirming readiness
- Warning if critical docs missing: "Submission will proceed, but missing documents may result in disqualification (§5.3)"

**Шаг 4/4 — Confirmation + payment:**
- Review all data
- T&C acceptance
- NDA acceptance
- Payment: 50% upfront via Stripe (redirect to M8e)
- On success: create clearview_projects row, create initial clearview_assessments row (status: submitted)

Шаг 4. Document upload `/projects/[id]/docs`.

После payment разблокировать upload UI:
- Render full checklist from methodology §8 (категории LRC, DCF, CQP, LMD, FSP, IRA, SME, LES)
- Для каждого пункта — upload button + status (missing / uploaded / verified)
- Use Supabase Storage bucket `clearview-submissions/` с path `{assessment_id}/{category}/{filename}`
- File types: PDF, DOCX, JPG, PNG (max 50MB each)
- Encrypted at rest (default Supabase Storage)
- RLS: only developer_id owner + analyst can read

После upload каждого документа:
- Trigger Edge Function `verify-document-metadata` (basic sanity check: file not corrupt, not empty)
- Status: uploaded
- Analyst manually marks как verified после review

Шаг 5. Status tracking.

На `/projects/[id]` показать:
- Current status из clearview_assessments.status
- Progress bar по 7 шагам (submitted / under_review / site_visit / interview / market_analysis / scoring / final_review / published)
- Timeline with dates
- Next action required (если что-то нужно от developer)
- Contact: assigned analyst name + WhatsApp link

Шаг 6. Notifications.

После изменения статуса → WhatsApp Cloud API + email (Resend) to developer.
Шаблоны в /packages/ai/messages/clearview-notifications/:
- assessment-submitted.md
- under-review.md
- site-visit-scheduled.md (+ дата)
- scoring-drafted.md + 48h factual review window
- published.md + certificate URL

Tone of voice — §12 файла 06.

ЧТО НЕ ДЕЛАТЬ.
- Не позволять submit без payment (payment → project creation).
- Не показывать published score до final_review + peer review.
- Не разрешать developer-у изменять документы после status = scoring.
- Не хранить незашифрованные PII documents.
- Не отправлять отчёты до подтверждения developer factual review (48h window из методологии §7 шаг 6).

АКЦЕПТ.
- developers.myuno.app работает.
- Intake form проходит без ошибок.
- Document upload сохраняет в Storage с правильными RLS.
- Статус-tracking обновляется в реальном времени (Supabase realtime).
- Notifications приходят на каждое изменение статуса.
- Mobile 375px работает.
```

### M8d.ACCEPTANCE

- [ ] Developer Portal запущен на developers.myuno.app
- [ ] Intake form работает end-to-end
- [ ] Document upload с RLS
- [ ] Status tracking с realtime updates
- [ ] WhatsApp + email notifications
- [ ] Mobile проверен

### M8d.ROLLBACK

Отключить routes на developers.myuno.app. Созданные записи в БД сохраняются для audit.

---

## M8e · Payment Flow

### M8e.AUDIT

AI читает:
- `/apps/*/lib/stripe.ts` — существующая Stripe integration (если есть)
- Supabase Stripe tables (если используется Stripe webhook sync)
- `/docs/canonical/06-clearview-methodology.md` §10 (цены, структура платежей)

### M8e.GAP

Нет payment flow для трёх продуктов ClearView:
- Developer Assessment (split payment 50/50)
- Investor Report (instant checkout)
- Quarterly Monitoring (subscription)

### M8e.PLAN

1. Stripe product setup (Assessment × 3 tiers, Reports × 2 tiers, Monitoring subscription)
2. Checkout flow для каждого типа
3. Webhook handlers для payment events
4. Refund flow для disqualified projects

### M8e.PROMPT

```
ЗАДАЧА M8e · Payment flow для ClearView (Assessment, Report, Monitoring).

ПРЕРЕКВИЗИТЫ. M8a, M8d (submission flow создан).

AUDIT.
1. Проверь существующую Stripe integration — какая версия SDK, какой webhook endpoint.
2. Прочитай /docs/canonical/06-clearview-methodology.md §10 (цены).
3. Проверь Stripe Connect setup (для split payments, если требуется).

PLAN.

Шаг 1. Stripe Products setup (через Stripe CLI или dashboard).

Products:
1. ClearView Assessment — Standard (฿350,000, one-time, split 50/50)
2. ClearView Assessment — Premium (฿500,000)
3. ClearView Assessment — Enterprise (฿600,000, base; +custom line items)
4. ClearView Report — Premium (฿2,900, one-time)
5. ClearView Report — Full (฿4,900, one-time)
6. ClearView Monitoring — Quarterly (฿15,000, recurring monthly-billed/quarterly or annual)
7. ClearView Monitoring — Annual (฿60,000, recurring, 1 month discount)

Сохрани price_ids в /packages/shared/clearview/stripe.ts:
```ts
export const STRIPE_PRICES = {
  assessment: {
    standard: 'price_...',
    premium: 'price_...',
    enterprise: 'price_...',
  },
  report: {
    premium: 'price_...',
    full: 'price_...',
  },
  monitoring: {
    quarterly: 'price_...',
    annual: 'price_...',
  },
} as const;
```

Шаг 2. Assessment split payment (50% upfront / 50% at delivery).

Flow:
1. Developer выбирает tier → Stripe Checkout с 50% amount (custom line item based on tier × 0.5).
2. Metadata: `{ product: 'clearview_assessment', tier: 'standard|premium|enterprise', assessment_id, phase: 'upfront' }`
3. On success webhook: create record в clearview_assessments (status: submitted), trigger M8d status notifications.
4. При published status → generate invoice for remaining 50% (Stripe Invoice API with same metadata, phase: 'delivery').
5. Developer получает email с payment link, оплачивает.
6. Final certificate доступен только после delivery payment settled.

Шаг 3. Investor Report (instant checkout).

Flow:
1. On /buy/[id]/clearview user clicks «Premium ฿2,900» или «Full ฿4,900».
2. Stripe Checkout с соответствующим price_id.
3. Metadata: `{ product: 'clearview_report', assessment_id, tier, buyer_id: user_id }`
4. On success webhook:
   - INSERT INTO clearview_reports
   - Call M8c Edge Function to generate PDF
   - Upload to Storage
   - Update pdf_url + delivered_at
   - Send email с download link (signed URL, 7 days expiry)
   - Lead scoring: +35 (просмотр) или +50 (покупка Full) — per PROJECT.md §11

Шаг 4. Monitoring subscription.

Flow:
1. Developer в `/monitoring/subscribe?project=[id]` выбирает Quarterly или Annual.
2. Stripe Subscription с interval (3 months / 12 months).
3. On subscription.created:
   - INSERT INTO clearview_monitoring
   - is_active = TRUE
   - expires_at = +3 или +12 месяцев
4. On invoice.paid (renewal):
   - Extend expires_at
   - Trigger quarterly review process (M8f)
5. On subscription.deleted:
   - is_active = FALSE
   - auto_renew = FALSE
   - Сохраняется в БД для audit

Шаг 5. Webhook handler /apps/developers/api/stripe/webhook.ts.

Handle events:
- checkout.session.completed (assessment upfront, report purchase)
- invoice.paid (assessment delivery, monitoring renewal)
- customer.subscription.created (monitoring start)
- customer.subscription.deleted (monitoring cancel)
- charge.refunded (disqualification refund)

Правила:
- Всегда verify webhook signature
- Idempotency через `stripe_event_id` UNIQUE check
- Write-only — webhook никогда не читает из existing code логику

Шаг 6. Refund flow (for disqualified projects).

Если assessment дисквалифицирован на любом шаге (methodology §5.3):
- Analyst отмечает status = 'disqualified'
- Trigger refund через Stripe Refunds API (50% upfront)
- Email developer с объяснением причины
- Appeal process link (methodology allows re-submission after fix)

ЧТО НЕ ДЕЛАТЬ.
- Не делать payment от имени user-а без явного checkout session (PCI).
- Не хранить card details никогда и нигде.
- Не активировать delivered status до confirmed payment.
- Не отправлять refund без explicit analyst action (защита от fraud).

АКЦЕПТ.
- 7 Stripe products созданы.
- Split payment assessment работает.
- Instant checkout reports работает.
- Subscription monitoring работает.
- Webhook обрабатывает все события идемпотентно.
- Refund flow работает.
- Все payment events пишутся в audit log.
```

### M8e.ACCEPTANCE

- [ ] 7 Stripe products + price_ids в коде
- [ ] Assessment split payment (50/50)
- [ ] Report instant checkout
- [ ] Monitoring subscription
- [ ] Webhook idempotent
- [ ] Refund flow для disqualified
- [ ] Audit log всех payment events

### M8e.ROLLBACK

Деактивировать webhook endpoint. Stripe products остаются (не удаляем). Существующие subscriptions продолжают billing до cancel.

---

## M8f · Quarterly Alert System

### M8f.AUDIT

AI читает:
- `/supabase/functions/` — существующие cron-triggered edge functions (pattern)
- `/packages/ai/messages/` — шаблоны уведомлений
- `/docs/canonical/06-clearview-methodology.md` §7 шаг 7 (Post-Assessment Monitoring)

### M8f.GAP

Нет механизма автоматических алертов о:
- Приближении expiration сертификата
- Due date quarterly review
- Material changes в score (upgrade / downgrade)
- Milestone misses (delay, missed pre-sale target)

### M8f.PLAN

1. Supabase cron job (pg_cron) для daily check
2. Edge Function `clearview-daily-alerts`
3. Шаблоны уведомлений (email + WhatsApp)
4. Opt-in механизм для investors (alerts на projects в favorites)

### M8f.PROMPT

```
ЗАДАЧА M8f · Quarterly Alert System для ClearView.

ПРЕРЕКВИЗИТЫ. M8a-M8e.

AUDIT.
1. Проверь установлен ли pg_cron в Supabase (Dashboard → Database → Extensions).
2. Найди существующие scheduled edge functions как reference.
3. Прочитай /docs/canonical/06-clearview-methodology.md §7 шаг 7.

PLAN.

Шаг 1. Установить pg_cron extension (если не установлен).

Шаг 2. Создать Edge Function /supabase/functions/clearview-daily-alerts/index.ts.

Функция запускается ежедневно в 09:00 Bangkok time (UTC+7 → 02:00 UTC).

```ts
serve(async () => {
  await Promise.all([
    processExpirationAlerts(),
    processQuarterlyReviewDue(),
    processScoreChangeAlerts(),
    processMilestoneAlerts(),
  ]);
});

async function processExpirationAlerts() {
  // 30 days before expiration — remind developer
  // 7 days — urgent
  // expired — final notice
  const projects = await supabase
    .from('clearview_projects')
    .select('*')
    .eq('is_published', true)
    .lte('expiration_date', addDays(today, 30));

  for (const project of projects) {
    const daysUntilExpiry = diffDays(project.expiration_date, today);
    if (daysUntilExpiry === 30 || daysUntilExpiry === 7 || daysUntilExpiry <= 0) {
      await sendExpirationAlert(project, daysUntilExpiry);
    }
  }
}

async function processQuarterlyReviewDue() {
  // monitoring subscribers — review due
  const monitoring = await supabase
    .from('clearview_monitoring')
    .select('*, project:clearview_projects(*)')
    .eq('is_active', true)
    .lte('next_review_due', today);

  for (const sub of monitoring) {
    await triggerQuarterlyReview(sub);
    await sendReviewDueNotification(sub);
  }
}

async function processScoreChangeAlerts() {
  // Check for assessments published in last 24h where project had previous score
  // → alert all investors who have this project in favorites
  // → alert monitoring subscribers (developer-side)
}

async function processMilestoneAlerts() {
  // Check projects for missed milestones
  // (construction delay detected via external data source or manual analyst input)
}
```

Шаг 3. Schedule cron.

```sql
SELECT cron.schedule(
  'clearview-daily-alerts',
  '0 2 * * *',  -- 09:00 Bangkok time
  $$ SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/clearview-daily-alerts',
    headers := jsonb_build_object('Authorization', 'Bearer <service_role>')
  ) $$
);
```

Шаг 4. Шаблоны уведомлений в /packages/ai/messages/clearview-alerts/.

**expiration-30days.md** (developer):
```
Ваш ClearView Certificate для проекта [Project Name] истекает через 30 дней.

Для продолжения использования certificate в marketing-материалах — пройдите renewal:
[Renew Assessment]

Упрощённая процедура renewal (2 недели vs 4 для первичной оценки):
- Submission существующих документов + updates
- Site inspection
- Quick scoring

Стоимость: 70% от первичной оценки (per methodology §11).
```

**expiration-7days.md** (developer) — срочнее, короче.

**review-due.md** (developer с monitoring subscription):
```
Время квартального review для [Project Name].

Пожалуйста, пришлите:
- Current construction progress (photos + % completion)
- Sales velocity (units sold this quarter)
- Any material changes (permits, legal, contractor)

Срок: 7 дней. Analyst свяжется для подтверждения.
```

**score-upgrade.md** (investors who favorited):
```
[Project Name] получил upgrade ClearView рейтинга: [OLD] → [NEW].

Причина: [reason from scoring_rationale]

Это может быть хорошим моментом для review инвестиционного кейса.
[View updated assessment]
```

**score-downgrade.md** — тот же паттерн, но с осторожной формулировкой:
```
[Project Name] получил изменение ClearView рейтинга: [OLD] → [NEW].

Причина: [reason]

Рекомендуем ознакомиться с обновлённым scoring breakdown.
[View updated assessment]

Если у вас уже открыта reservation на этот проект — рекомендуем обсудить
ситуацию с вашим consultant.
```

Tone of voice — §12 файла 06. Никакой паники, никакого маркетинг-хайпа.

Шаг 5. Opt-in для investors.

На `/buy/[id]` добавить checkbox «Alert me on ClearView score changes» (default unchecked).
Сохранять в таблице user_favorites с полем alert_on_clearview_change.

На каждое score change → query всех users с alert_on_clearview_change = true для данного project → отправить email/WhatsApp.

Шаг 6. Lead scoring integration.

Каждое alert event логируется в lead_events. Открытие alert email → +5 очков. Клик на «View updated assessment» → +15. Смотри PROJECT.md §11.

ЧТО НЕ ДЕЛАТЬ.
- Не спамить — макс 1 alert per project per week (throttling).
- Не отправлять alerts на не-opted-in investors.
- Не использовать urgency-язык («СРОЧНО!») — tone of voice запрещает.
- Не добавлять аффилиат-promotion в alert emails.
- Не удалять historical alerts — они audit trail.

АКЦЕПТ.
- pg_cron job работает (daily).
- 4 типа alerts (expiration / review due / score upgrade / downgrade) работают.
- Opt-in flow для investors работает.
- Lead scoring integration работает.
- Throttling предотвращает spam.
- Tone of voice проверен на всех шаблонах.
```

### M8f.ACCEPTANCE

- [ ] pg_cron job scheduled
- [ ] Edge Function обрабатывает 4 типа alerts
- [ ] Шаблоны уведомлений на RU/EN
- [ ] Opt-in механизм для investors
- [ ] Lead scoring integration
- [ ] Throttling работает

### M8f.ROLLBACK

Unschedule cron job. Edge Function остаётся, но не вызывается. Historical alerts сохраняются.

---

## Общий мастер-промпт для M8

Если Павел хочет дать AI-агенту **одну команду**, которая запустит весь M8:

```
Ты AI-инженер на проекте myUNO. У нас есть M8-протокол для интеграции ClearView
(/docs/canonical/M8-clearview-integration-protocol.md) и методология ClearView
(/docs/canonical/06-clearview-methodology.md).

ЗАДАНИЕ. Выполнить M8a → M8f в последовательности.

ПРАВИЛА.
1. Каждая под-веха — отдельный PR.
2. Перед началом — AUDIT (читаешь существующий код + canonical docs).
3. Следуешь PLAN пошагово.
4. Каждый шаг — отдельный коммит с conventional commit message.
5. После всех шагов — проверяешь ACCEPTANCE чек-лист.
6. Если противоречие с методологией — ОСТАНАВЛИВАЕШЬСЯ и пишешь вопрос.
7. Между под-вехами — ждёшь merge.

ПОСЛЕДОВАТЕЛЬНОСТЬ.
- M8a (data schema) — первым, блокирует остальные
- M8b + M8c — можно параллелить после M8a
- M8d — после M8a
- M8e — после M8d
- M8f — после M8e

ЖЁСТКИЕ ПРАВИЛА.
- Веса категорий фиксированы методологией (§3). Hardcoded в /packages/shared/clearview/.
- Rating bands фиксированы методологией (§6). Tests покрывают граничные случаи.
- Modifier values фиксированы (§5.2). Не допускать custom modifier values.
- Assessment append-only после публикации. Никаких UPDATE на published.
- Tone of voice строго §12 в любых генерируемых текстах.
- Mobile-first (375px). Все UI компоненты проверены.

Старт с M8a.
```

---

## Сводная таблица M8

| Под-веха | Название | Зависит от | Сложность | Время |
|---|---|---|---|---|
| M8a | Data Schema | M1 | ⭐⭐⭐ medium | 1 день |
| M8b | Public Badge | M8a | ⭐⭐ low-medium | 0.5 дня |
| M8c | Report PDF Generator | M8a | ⭐⭐⭐⭐ high | 2 дня |
| M8d | Developer Submission Flow | M8a | ⭐⭐⭐⭐ high | 2 дня |
| M8e | Payment Flow | M8d | ⭐⭐⭐ medium | 1 день |
| M8f | Alert System | M8e | ⭐⭐ medium | 1 день |

**Критический путь:** M8a (1) → M8d (2) → M8e (1) → M8f (1) = **5 дней**.
**Параллельно** M8b (0.5) + M8c (2) = **2 дня**.
**Суммарно при оптимальной параллелизации: 7 дней AI-инженера.**

---

## Что делать прямо сейчас

1. Убедись, что M1 выполнен (canonical docs в репо).
2. Скачай этот протокол + `06-clearview-methodology.md` + `07-information-architecture.md`.
3. Открой Claude Code или Cursor в репозитории myUNO.
4. Прикрепи 3 документа.
5. Вставь мастер-промпт выше.
6. Проверь первый PR на соответствие M8a.ACCEPTANCE.
7. Смёрдж → AI переходит к M8b.

AI-инженер завершит M8a за день. Это даст тебе базу для первого demo ClearView Павлу через неделю.

---

## Связанные документы

- `/docs/canonical/06-clearview-methodology.md` — методология (константы, формула, процесс)
- `/docs/canonical/07-information-architecture.md` — sitemap, URL conventions
- `/docs/canonical/05-visual-design-system.md` — design tokens для Badge, PDF
- `/docs/canonical/04-implementation-protocol.md` — общий протокол внедрения (M1–M7)
- `/docs/canonical/03-tone-of-voice.md` §10.3 — голос для ClearView-коммуникаций

---

*M8 Protocol · v1.0 · Апрель 2026 · Owner: Pavel + CTO*

*Принцип: методология определяет что считать, код — только как считать и показывать. Расхождение между ними недопустимо.*
