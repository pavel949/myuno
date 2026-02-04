

# Аудит связности Vendor Dashboard с каноническими системами суперапа

## Резюме аудита

Проведена полная проверка связности между Vendor Dashboard, Admin Intake, каноническими визардами и профилями. Выявлено **12 критических и средних проблем** синхронизации данных.

---

## Архитектура потоков данных

```text
                    ┌─────────────────────────────────────────┐
                    │           Admin Data Hub                │
                    │  (AIIntakeDialog, IntakeQueue,          │
                    │   IntakeItemEditor)                     │
                    └──────────────┬──────────────────────────┘
                                   │ intake-listing-agent
                                   ▼                          
    ┌──────────────────────────────────────────────────────────┐
    │                    INTAKE_VERTICALS                      │
    │  (intakeVerticals.ts - 15+ вертикалей)                   │
    │  yachts, properties, tours, salons, clinics...           │
    └──────────────────────────────────────────────────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       ▼                           ▼                           ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Vendor Wizard  │     │ Canonical Wizard│     │   User Listing  │
│ (UnifiedVendor  │     │ (6-step strict  │     │    Wizard       │
│  4-step)        │     │  category-lock) │     │ (sell-wizard)   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   useFormDraft          useCanonicalDraft        useFormDraft
   useSupabaseCRUD       useCanonicalSubmit       useUserListings
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │   Supabase Tables      │
                    │  providers             │
                    │  orgs + org_members    │
                    │  marketplace_products  │
                    │  vendor_services       │
                    │  yachts, tours, etc.   │
                    └────────────────────────┘
```

---

## Выявленные проблемы

### P0 — Критические (ломают функционал)

| # | Проблема | Файл | Описание |
|---|----------|------|----------|
| 1 | **Отсутствует связь provider_id ↔ verticals tables** | `useCanonicalSubmit.ts` | `CanonicalListingWizard` использует `providerId`, но не все вертикальные таблицы (yachts, tours) имеют колонку `provider_id` — при создании записи будет ошибка FK |
| 2 | **marketplace_vendor_id vs provider_id путаница** | `VendorProducts.tsx:127` | Products используют `marketplace_vendor_id`, а services — `provider_id`. При onboarding создаётся только `providers` + `orgs`, но не `marketplace_vendors` — товары не могут быть созданы |
| 3 | **INTAKE_VERTICALS не синхронизирован с DB таблицами** | `intakeVerticals.ts` | В `INTAKE_VERTICALS` указаны таблицы (`tours`, `water_activities`), но `useIntakeAgent` передает `item.detectedVertical` напрямую в `bulk-import` без валидации что таблица существует |
| 4 | **Дубликаты профилей при onboarding** | `useVendor.ts:291-358` | `createProfile` создаёт запись в `providers` + `orgs` + `org_members`, но не проверяет существующие записи — возможны дубликаты при повторном onboarding |

### P1 — Средние (нарушают UX)

| # | Проблема | Файл | Описание |
|---|----------|------|----------|
| 5 | **Разные draft-системы** | `useFormDraft.ts` vs `useCanonicalDraft.ts` | `UnifiedVendorWizard` использует `useFormDraft`, а `CanonicalListingWizard` — `useCanonicalDraft`. Разные ключи, разные интервалы автосохранения, несовместимые структуры |
| 6 | **Approval status не унифицирован** | Multiple files | Admin-созданный контент: `is_verified=true, approval_status='approved'`. Vendor-контент: `approval_status='pending'`. Но `useUserListings.ts:137` фильтрует по `moderation_status`, а не `approval_status` |
| 7 | **verticals из onboarding не используются в dashboard** | `VendorOnboarding.tsx:131-132` | Выбранные `verticals` сохраняются в `orgs.metadata.verticals`, но `VendorCategoryGrid` не читает эти данные — показывает hardcoded категории |
| 8 | **LookupValues vs INTAKE_VERTICALS рассинхрон** | `useLookupValues.ts` + `intakeVerticals.ts` | `INTAKE_VERTICALS` содержит `enumValues` для полей (yacht_type, clinic_type), но они не синхронизированы с `lookup_values` таблицей |

### P2 — Минорные (улучшения)

| # | Проблема | Файл | Описание |
|---|----------|------|----------|
| 9 | **Отсутствует валидация category_id в CanonicalSubmit** | `useCanonicalSubmit.ts` | `duplicateCheckFields` включает `category_id`, но для некоторых таблиц это поле называется иначе (`category_slug`, `tour_type`) |
| 10 | **unit_measure не синхронизирован** | `VendorProducts.tsx:284-286` | Products форма использует `unit_measure`, `unit_value`, `pack_quantity`, но эти поля отсутствуют в некоторых витринных карточках |
| 11 | **translations не связаны** | Multiple wizards | `TranslateAllButton` в `UnifiedVendorWizard` и `CanonicalListingWizard` — одинаковые, но не вынесены в общий компонент |
| 12 | **Отсутствует очередь на модерацию в dashboard** | `VendorDashboard.tsx` | Dashboard показывает orders/revenue, но не показывает статус pending items для модерации — вендор не видит что ждёт публикации |

---

## План исправлений

### Фаза 1: Критические исправления (P0)

#### 1.1 Унификация provider_id для всех вертикалей

**Файл:** `useCanonicalSubmit.ts`

- Добавить mapping `tableName → providerIdField`:
```typescript
const PROVIDER_ID_MAPPING: Record<string, string> = {
  'marketplace_products': 'vendor_id',
  'vendor_services': 'provider_id',
  'yachts': 'provider_id',
  'tours': 'provider_id',
  // ... all verticals
};
```
- Использовать mapping при вставке данных

#### 1.2 Автоматическое создание marketplace_vendor при onboarding

**Файл:** `useVendor.ts` → `createProfile()`

Добавить шаг 1.5:
```typescript
// After creating provider, also create marketplace_vendor
const { data: vendorData } = await supabase
  .from('marketplace_vendors')
  .insert({
    user_id: user.id,
    name: profileData.business_name,
    is_active: true,
  })
  .select()
  .single();

// Link to provider
await supabase
  .from('providers')
  .update({ marketplace_vendor_id: vendorData.id })
  .eq('id', providerData.id);
```

#### 1.3 Валидация таблиц в IntakeAgent

**Файл:** `useIntakeAgent.ts`

Добавить whitelist валидных таблиц:
```typescript
const VALID_TABLES = ['yachts', 'properties', 'tours', 'salons', ...];

if (!VALID_TABLES.includes(item.detectedVertical)) {
  throw new Error(`Unknown vertical table: ${item.detectedVertical}`);
}
```

#### 1.4 Защита от дубликатов профилей

**Файл:** `useVendor.ts` → `createProfile()`

Добавить проверку:
```typescript
// Check existing provider
const { data: existing } = await supabase
  .from('providers')
  .select('id')
  .eq('user_id', user.id)
  .maybeSingle();

if (existing) {
  return { error: new Error('Profile already exists') };
}
```

---

### Фаза 2: UX исправления (P1)

#### 2.1 Унификация Draft-системы

Создать единый `useUnifiedDraft` хук с поддержкой:
- Auto-save с визуальным индикатором
- Conflict resolution
- Key-based storage с миграцией старых ключей

#### 2.2 Синхронизация approval_status

Создать константы:
```typescript
// src/lib/approvalStatus.ts
export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const MODERATION_TO_APPROVAL_MAP = {
  'pending': APPROVAL_STATUSES.PENDING,
  'approved': APPROVAL_STATUSES.APPROVED,
  ...
};
```

#### 2.3 Динамический VendorCategoryGrid

**Файл:** `VendorCategoryGrid.tsx`

Читать verticals из `useUserContext().activeOrg.metadata.verticals`:
```typescript
const { activeOrg } = useUserContext();
const allowedVerticals = activeOrg?.metadata?.verticals || [];
// Filter categories by allowedVerticals
```

#### 2.4 Синхронизация LookupValues с INTAKE_VERTICALS

Создать миграцию для заполнения `lookup_values` из `INTAKE_VERTICALS.fieldLabels.enumValues`

---

### Фаза 3: Улучшения (P2)

#### 3.1 Модерация в Dashboard

Добавить `VendorModerationQueue` виджет:
- Показывает pending items по всем вертикалям
- Статус: pending / approved / rejected
- Rejection reason если есть

#### 3.2 Унификация карточек

Обновить `contentAdapters.ts` для поддержки `unit_value`, `unit_measure`, `pack_quantity`

---

## Схема данных для синхронизации

```text
providers (legacy)
├── id (UUID)
├── user_id → auth.users
├── marketplace_vendor_id → marketplace_vendors  ← ДОБАВИТЬ СВЯЗЬ
├── business_category
└── metadata: { verticals: [...] }

orgs (Clean Core)
├── id (UUID)  
├── org_type: 'vendor'
├── name, name_ru
└── metadata: { legacy_provider_id, verticals: [...] }

org_members
├── org_id → orgs
├── user_id → auth.users
└── role: 'owner' | 'admin' | 'member'

marketplace_vendors  
├── id (UUID)
├── user_id
└── linked via providers.marketplace_vendor_id

marketplace_products
└── vendor_id → marketplace_vendors (NOT providers!)

vendor_services
└── provider_id → providers

yachts, tours, salons...
└── provider_id → providers
```

---

## Технический итог

| Область | Текущий статус | После исправлений |
|---------|----------------|-------------------|
| Onboarding → Provider | ✅ Работает | ✅ + marketplace_vendor |
| Vendor → Products | ⚠️ Ломается если нет mv_id | ✅ Auto-create mv |
| Vendor → Services | ✅ Работает | ✅ Без изменений |
| Vendor → Verticals | ⚠️ Частичная поддержка | ✅ Полная через mapping |
| Admin Intake → Tables | ⚠️ Без валидации | ✅ С whitelist |
| Draft persistence | ⚠️ 2 разные системы | ✅ Унифицирован |
| Moderation flow | ⚠️ Скрыт от vendor | ✅ Widget в dashboard |

---

## Файлы для изменения

1. `src/hooks/useVendor.ts` — onboarding с marketplace_vendor
2. `src/hooks/useCanonicalSubmit.ts` — provider_id mapping
3. `src/hooks/useIntakeAgent.ts` — table validation
4. `src/components/vendor/VendorCategoryGrid.tsx` — dynamic verticals
5. `src/pages/vendor/VendorDashboard.tsx` — moderation widget
6. `src/lib/approvalStatus.ts` — новый файл с константами
7. `src/hooks/useUnifiedDraft.ts` — новый унифицированный draft hook

