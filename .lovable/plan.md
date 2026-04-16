

# Аудит блока недвижимости — Результаты и план улучшений

## Текущая архитектура

```text
developers (39)
    └── property_projects (157) ← "Проекты/Новостройки"
            ├── offplan (49), completed (107), under_construction (1)
            └── [НЕТ FK на properties]

properties (32) ← "Объекты/Юниты" (PMS)
    ├── owner_id → auth.users
    ├── management_company_id → management_companies
    ├── project_id → property_projects [ЕСТЬ, но 0 записей привязаны]
    └── listing_type = всегда 'rent', listing_modes = ['rent']

property_owners (0 записей) ← создана, но пуста, НЕТ FK constraint в DB
inventory_listings (0 записей) ← создана, но пуста
agent_deals (1 запись) ← property_id всегда NULL

nb_leads (отдельная таблица) ← лиды новостроек, не связаны с CRM
```

---

## Критические проблемы

### 1. Разрыв между Проектами и Объектами
- **property_projects (157)** и **properties (32)** живут в изоляции
- `properties.project_id` существует, но **ни один объект не привязан к проекту**
- Невозможно: посмотреть юниты проекта, трекать продажи по проекту, видеть inventory grid

### 2. properties = только аренда
- Все 32 объекта: `listing_type = 'rent'`, `listing_modes = ['rent']`
- `sale_price` = NULL у всех. Нет ни одного объекта на продажу
- Таблица заточена под PMS (аренда), но не используется для продаж/resale

### 3. property_projects не имеет данных для CRM-продаж
Отсутствуют колонки:
- `commission_pct` — нет комиссии застройщика
- `payment_plan` (JSONB) — нет планов рассрочки
- `marketing_materials` (text[]) — нет маркетинговых материалов
- `exclusive` — эксклюзивность мандата
- `management_company_id` — кто продаёт

### 4. nb_leads не связана с CRM
- `nb_leads` — отдельная таблица лидов, не интегрирована с `crm_contacts` и `agent_deals`
- Невозможно: трекать лид от новостройки через пайплайн до сделки

### 5. Нет unit inventory для проектов
- `property_projects` имеет `total_units`, `units_available`, `units_sold` — но это просто числа
- Нет таблицы unit-level inventory (тип, площадь, цена, статус, этаж, план) для offplan

### 6. inventory_listings — не подключена к UI
- Таблица создана, хук написан, компонент есть, но **нигде не встроена в property detail page**
- 0 записей = никто не пользовался

---

## План улучшений

### Phase 1 — Schema: property_projects enrichment + project_units

**Миграция 1: Расширение property_projects**
```sql
ALTER TABLE property_projects
  ADD COLUMN IF NOT EXISTS commission_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_plan JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS marketing_materials TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclusive BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS management_company_id UUID,
  ADD COLUMN IF NOT EXISTS contact_id UUID,  -- FK to crm_contacts (developer contact)
  ADD COLUMN IF NOT EXISTS min_price_per_sqm NUMERIC,
  ADD COLUMN IF NOT EXISTS ownership_types TEXT[] DEFAULT '{}'; -- freehold, leasehold
```

**Миграция 2: project_units — inventory grid**
```sql
CREATE TABLE public.project_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES property_projects(id) ON DELETE CASCADE,
  unit_code TEXT,          -- e.g. "A-301"
  unit_type TEXT NOT NULL,  -- studio, 1br, 2br, 3br, penthouse, villa
  floor INT,
  area_sqm NUMERIC,
  bedrooms INT,
  bathrooms INT,
  price NUMERIC,
  currency TEXT DEFAULT 'THB',
  price_per_sqm NUMERIC,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','reserved','sold','held')),
  view_type TEXT,
  floor_plan_url TEXT,
  property_id UUID REFERENCES properties(id),  -- links to PMS property after handover
  buyer_contact_id UUID REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
RLS: authenticated users can read; company members can write.

### Phase 2 — nb_leads → CRM integration

- Add `crm_contact_id UUID` to `nb_leads` — link to CRM contact
- On lead creation: auto-create `crm_contacts` record (source = 'newbuild_lead')
- On lead qualification: auto-create `agent_deals` (deal_type = 'offplan_sale', property_project_id set)

### Phase 3 — Property detail: integrate tabs

Wire the existing `PropertyOwnersTab`, `PropertyListingsTab`, `PropertyDealsTab` into the property detail page. Currently created but not mounted.

### Phase 4 — Project detail: units grid + deals tab

- **Units grid**: visual table (unit_code, type, floor, area, price, status badge) with inline status change
- **Deals tab**: `agent_deals WHERE property_project_id = X`
- **Quick actions**: "Create Deal from Project" (pre-fills project, pipeline = offplan)
- **Marketing tab**: upload/view marketing materials, payment plan display

### Phase 5 — Unified property search for CRM

Enhance `PropertySearchInput` to also search `property_projects` (not just `properties`), so deals can be linked to either a specific unit OR a project.

### Phase 6 — agent_deals: project ↔ unit linking

- When deal links to a project + unit: `property_project_id` + `property_id` (unit's linked property)
- On deal Won: auto-update `project_units.status = 'sold'`, set `buyer_contact_id`
- Cascade: update `property_projects.units_sold` / `units_available` via trigger

---

## Files to Create/Edit

**Migrations**: 2 SQL (project enrichment + project_units table)

**New files:**
- `src/hooks/useProjectUnits.ts` — CRUD for project_units
- `src/components/newbuilds/ProjectUnitsGrid.tsx` — inventory grid UI
- `src/components/newbuilds/ProjectDealsTab.tsx` — deals linked to project
- `src/components/newbuilds/ProjectMarketingTab.tsx` — materials + payment plan

**Edit files:**
- `src/hooks/useNewbuildProjects.ts` — add new columns to interface
- `src/hooks/useNewbuildLeads.ts` — add crm_contact_id, auto-creation logic
- `src/components/owner/sales/PropertySearchInput.tsx` — search projects too
- `src/components/owner/sales/CreateDealSheet.tsx` — project unit selector
- Property detail page — mount Owners/Listings/Deals tabs
- Newbuild project detail page — mount Units/Deals/Marketing tabs

