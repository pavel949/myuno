
# Системный аудит: Канонические элементы и Sources of Truth

## ✅ РЕАЛИЗАЦИЯ ЗАВЕРШЕНА: Фазы 1-2

Проведен глубокий технический аудит платформы myUNO. Фазы 1 и 2 полностью реализованы.

### Созданные Sources of Truth:
| Домен | Файл | Версия |
|-------|------|--------|
| Вертикали | `src/lib/verticals.ts` | v3.4.0 |
| Ценообразование | `src/lib/pricing.ts` | v3.4.0 |
| Валюты | `src/lib/config/currencies.ts` | v3.4.0 |
| Роли | `src/types/auth.ts` | v3.4.0 |
| Статусы заказов | `src/types/orders.ts` | v3.4.0 |

### Миграции:
- ✅ `order_status` ENUM расширен: `checked_in`, `checked_out`, `no_show`, `pending_deposit`, `deposit_paid`
- ✅ `CurrencyContext` мигрирован на `currencies.ts`
- ✅ Адаптеры (`contentAdapters`, `vehicleAdapters`) используют `getCurrencySymbol()`
- ✅ Hooks (`useUserRoles`, `useUserContext`) используют канонический `AppRole`
- ✅ `CURRENCY.SYMBOLS` помечен как deprecated

---

## Часть 1: Критические проблемы (P0-P1)

### 1.1 Статусы транзакций — РАСХОЖДЕНИЕ

**Проблема:** Две конкурирующие системы статусов для заказов.

| Источник | Расположение | Статусы |
|----------|--------------|---------|
| `OrderStatus` | `src/types/orders.ts` | `draft`, `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `refunded`, `disputed` |
| `BOOKING_STATUS` | `src/lib/constants.ts` | `pending`, `pending_deposit`, `deposit_paid`, `confirmed`, `checked_in`, `checked_out`, `completed`, `cancelled`, `cancelled_by_guest`, `cancelled_by_host`, `no_show` |
| DB Enum | `public.order_status` | Включает дополнительно: `pending_advance`, `awaiting_client_payment` |
| DB Enum | `public.booking_status` | `draft`, `submitted`, `confirmed`, `in_progress`, `completed`, `cancelled_by_user`, `cancelled_by_provider`, `expired` |

**Риск:** Несовместимость между фронтендом и БД, невозможность отследить реальный статус бронирования.

**Решение:**
```text
┌─────────────────────────────────────────────────────────────┐
│                 CANONICAL ORDER STATUS                       │
├─────────────────────────────────────────────────────────────┤
│ draft → pending → confirmed → in_progress → completed       │
│                  ↓            ↓                              │
│              cancelled    checked_in → checked_out          │
│                  ↓                                          │
│         refunded / disputed / no_show                       │
└─────────────────────────────────────────────────────────────┘
```
- Расширить `order_status` ENUM в БД
- Удалить `BOOKING_STATUS` из `constants.ts`
- Добавить `metadata.cancellation_reason` для детализации (`by_guest`, `by_host`)

---

### 1.2 Идентификаторы вертикалей — ФРАГМЕНТАЦИЯ

**Проблема:** 5 разных списков вертикалей с несогласованным именованием.

| Система | Singular | Plural | Примеры расхождений |
|---------|----------|--------|---------------------|
| Orders (`OrderType`) | ✓ | - | `property`, `vehicle`, `cleaning` |
| Taxonomy | ✓ | - | `property`, `transport`, `home_services` |
| Team Permissions | - | ✓ | `properties`, `vehicles`, `cleaning` |
| Lead Config | - | ✓ | `properties`, `vehicles` |
| AI Intake | Mixed | - | `properties`, `legal_services` |

**Риск:** Ошибки маппинга между формами лидов, заказами и правами доступа.

**Решение:**
- Создать `src/lib/verticals.ts` как единый реестр:
```typescript
export const VERTICALS = {
  PROPERTY: { id: 'property', plural: 'properties', table: 'properties', icon: '🏠' },
  YACHT: { id: 'yacht', plural: 'yachts', table: 'yachts', icon: '🚤' },
  VEHICLE: { id: 'vehicle', plural: 'vehicles', table: 'vehicles', icon: '🚗' },
  CLEANING: { id: 'cleaning', plural: 'cleaning', table: 'cleaning_providers', icon: '🧹' },
  // ... 15+ verticals
} as const;
```
- Мигрировать все файлы на импорт из этого единого источника

---

### 1.3 Модели ценообразования — ДУБЛИРОВАНИЕ

**Проблема:** Pricing models определены в 4+ местах с разным набором значений.

| Компонент | Значения |
|-----------|----------|
| Admin Taxonomy Editor | `fixed`, `per_hour`, `per_day`, `per_night`, `per_km`, `negotiable` |
| Vendor Wizard | `fixed`, `per_hour`, `per_day`, `per_person` |
| DB Fields | `price_per_hour`, `price_per_day`, `price_per_night`, `price_per_km`, `price_per_course` |

**Риск:** Провайдер не может выбрать нужную модель; данные сохраняются некорректно.

**Решение:**
- Создать каноническое перечисление:
```typescript
// src/lib/pricing.ts
export const PRICING_MODELS = {
  FIXED: { id: 'fixed', labelEn: 'Fixed Price', labelRu: 'Фикс. цена' },
  HOURLY: { id: 'per_hour', labelEn: 'Per Hour', labelRu: 'За час' },
  DAILY: { id: 'per_day', labelEn: 'Per Day', labelRu: 'За день' },
  NIGHTLY: { id: 'per_night', labelEn: 'Per Night', labelRu: 'За ночь' },
  PER_PERSON: { id: 'per_person', labelEn: 'Per Person', labelRu: 'За человека' },
  PER_KM: { id: 'per_km', labelEn: 'Per KM', labelRu: 'За км' },
  NEGOTIABLE: { id: 'negotiable', labelEn: 'Negotiable', labelRu: 'По договорённости' },
} as const;
```
- Унифицировать схему: `base_price` + `pricing_model` вместо множества полей `price_per_*`

---

## Часть 2: Высокий приоритет (P1)

### 2.1 Валюты — ХАРДКОД

**Текущее состояние:**
- Символ `฿` встречается в **100+ файлах** напрямую
- Метаданные валют дублируются в 3 местах:
  - `src/contexts/CurrencyContext.tsx`
  - `src/types/marketing.ts`
  - `src/lib/constants.ts`

**Решение:**
- Создать `src/lib/config/currencies.ts`:
```typescript
export const CURRENCIES = {
  THB: { code: 'THB', symbol: '฿', flag: '🇹🇭', nameEn: 'Thai Baht', nameRu: 'Тайский бат' },
  USD: { code: 'USD', symbol: '$', flag: '🇺🇸', nameEn: 'US Dollar', nameRu: 'Доллар США' },
  // ...
} as const;
```
- Запретить хардкод символов в JSX (через линтер или code review)
- Все компоненты должны использовать `formatPrice()` из `useCurrency()`

---

### 2.2 Роли пользователей — НЕСОГЛАСОВАННОСТЬ

**Текущее состояние:**
- DB Enum `app_role`: 16 значений (включая `ombudsman`, `investor`)
- Frontend `AppRole` (useUserRoles): 12 значений (не включает `ombudsman`)
- Frontend `AppRole` (useUserContext): 10 значений (другой набор)

**Решение:**
- Вынести в `src/types/auth.ts`:
```typescript
// Синхронизировано с public.app_role ENUM
export type AppRole = 
  | 'guest' | 'user' | 'tourist' | 'resident'
  | 'partner' | 'owner' | 'property_owner' | 'vendor'
  | 'staff' | 'admin' | 'ombudsman' | 'uno_team'
  | 'finance' | 'support' | 'sales' | 'investor';
```
- Все хуки (`useUserRoles`, `useUserContext`, `useIsAdmin`) должны импортировать этот тип

---

### 2.3 UI Бейджи — ВИЗУАЛЬНАЯ ФРАГМЕНТАЦИЯ

**Проблема:** Разные иконки и стили для одних и тех же статусов:
- Verified: `CheckCircle2` vs `Shield` vs `ShieldCheck`
- Featured: `Star` vs `⭐ Featured` (текст) vs градиент

**Решение:**
- Использовать `BADGE_SYSTEM` из `src/lib/designTokens.ts` как единственный источник
- Создать `<StatusBadge status="verified" />` компонент для унификации
- Обязательное использование `UnifiedContentCard` для всех карточек

---

## Часть 3: Средний приоритет (P2)

### 3.1 Таксономии по вертикалям

**Статус:** Частично канонизировано, но разрознено по папкам.

| Вертикаль | Файл таксономии | Статус |
|-----------|-----------------|--------|
| Property | `src/lib/propertyTaxonomy.ts` | ✓ Полный |
| Transport | `src/lib/config/transportTaxonomy.ts` | ✓ Полный |
| Home Services | `src/lib/config/homeServicesTaxonomy.ts` | ✓ Полный |
| Experiences | `src/lib/taxonomies/experiencesTaxonomy.ts` | ✓ Полный |
| Beauty | `src/lib/taxonomies/beautyTaxonomy.ts` | ✓ Полный |
| Restaurants | Отсутствует | ✗ Нужен |
| Medical | Отсутствует | ✗ Нужен |
| Education | Отсутствует | ✗ Нужен |

**Решение:**
- Консолидировать все таксономии в `src/lib/taxonomies/`
- Создать недостающие файлы по шаблону существующих

---

### 3.2 Provider ID Mapping

**Статус:** Уже канонизировано в `src/lib/providerIdMapping.ts`.

**Рекомендация:** Добавить недостающие таблицы:
- `events` → `provider_id`
- `water_activities` → `provider_id`
- `experiences` → `provider_id`

---

## Часть 4: Регламенты системы

### 4.1 Обязательные правила разработки

| Правило | Описание |
|---------|----------|
| **SoT-001** | Все новые статусы добавляются ТОЛЬКО через DB ENUM с последующей синхронизацией типов |
| **SoT-002** | Вертикали используют singular ID (`property`, не `properties`) во всех внутренних системах |
| **SoT-003** | Цены форматируются ТОЛЬКО через `formatPrice()`, хардкод символов запрещен |
| **SoT-004** | Новые роли добавляются в ENUM `app_role` и синхронизируются с `AppRole` type |
| **SoT-005** | Любой boolean-флаг маркетинга (`is_featured`, `is_hot`) управляется только админами |

### 4.2 Структура Sources of Truth

```text
src/
├── lib/
│   ├── constants.ts          # STORAGE_KEYS, VALIDATION, CASHBACK (immutable)
│   ├── verticals.ts          # NEW: Master vertical registry
│   ├── pricing.ts            # NEW: Pricing models
│   ├── config/
│   │   └── currencies.ts     # NEW: Currency metadata
│   └── taxonomies/
│       ├── index.ts          # Re-exports all taxonomies
│       ├── taxonomyTypes.ts  # Taxonomy type keys
│       └── [vertical].ts     # Per-vertical taxonomy
├── types/
│   ├── auth.ts               # NEW: AppRole, Permission types
│   └── orders.ts             # OrderType, OrderStatus (sync with DB)
└── contexts/
    └── CurrencyContext.tsx   # Uses currencies.ts config
```

---

## Часть 5: План реализации

### Фаза 1 (Критическое) — 1 день
1. Расширить `order_status` ENUM в БД, добавив `checked_in`, `checked_out`, `no_show`
2. Удалить `BOOKING_STATUS` из `constants.ts`, мигрировать все использования
3. Создать `src/lib/verticals.ts` с мастер-реестром

### Фаза 2 (Высокий приоритет) — 2 дня
4. Создать `src/lib/pricing.ts` с каноническими моделями
5. Создать `src/lib/config/currencies.ts`
6. Унифицировать `AppRole` в `src/types/auth.ts`

### Фаза 3 (Рефакторинг) — 3 дня
7. Массовая замена хардкода `฿` на `formatPrice()`
8. Консолидация таксономий в единую папку
9. Добавление недостающих таксономий (Restaurants, Medical, Education)

---

## Техническое приложение: Файлы для изменения

### Создать новые файлы:
- `src/lib/verticals.ts`
- `src/lib/pricing.ts`
- `src/lib/config/currencies.ts`
- `src/types/auth.ts`
- `src/lib/taxonomies/restaurantTaxonomy.ts`
- `src/lib/taxonomies/medicalTaxonomy.ts`
- `src/lib/taxonomies/educationTaxonomy.ts`

### Обновить существующие:
- `src/lib/constants.ts` — удалить `BOOKING_STATUS`, `CURRENCY.SYMBOLS`
- `src/types/orders.ts` — синхронизировать с расширенным ENUM
- `src/hooks/useUserRoles.ts` — импорт `AppRole` из `auth.ts`
- `src/hooks/useUserContext.ts` — импорт `AppRole` из `auth.ts`
- `src/contexts/CurrencyContext.tsx` — использовать `currencies.ts`
- `src/lib/leadVerticalConfig.ts` — использовать singular IDs
- `src/hooks/useUnoTeamPermissions.ts` — использовать singular IDs

### Миграция БД:
- Расширить `public.order_status` ENUM
- Опционально: удалить устаревший `booking_status` ENUM после полной миграции

---

## Фаза 3 (Рефакторинг) — TODO

### Оставшиеся задачи:
1. 🔲 Массовая замена хардкода `฿` (~200+ файлов)
2. 🔲 Создать недостающие таксономии:
   - `restaurantTaxonomy.ts`
   - `medicalTaxonomy.ts`
   - `educationTaxonomy.ts`
3. 🔲 Обновить `providerIdMapping.ts`
4. 🔲 Создать унифицированный `<StatusBadge />` компонент

---

## История версий

- **v3.4.1** - Фаза 2: Миграция валют, обновление экспортов
- **v3.4.0** - Фаза 1: Создание core SoT файлов
- **v3.3.2** - Оптимизация масштабируемости: лимиты запросов, индексы
