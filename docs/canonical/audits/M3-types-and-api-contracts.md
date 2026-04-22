# M3 — TypeScript Types + API Contracts

**Дата:** 2026-04-22
**Статус:** ✅ done
**Версия canonical:** v1.3.0

## Что сделано

M3 закрывает разрыв между расширенной в M2 БД-схемой и приложением:
TypeScript-слой канонической сегментации, типизированный API над
`v_profiles_canonical`, React Query-хуки.

### 1. Канонические типы — `src/types/canonical.ts`

Единый source-of-truth для:

| Концепт | Источник в БД | Тип в коде |
|---|---|---|
| 6 канонических ролей | mapping-функция `get_canonical_primary_role` | `CanonicalRole` |
| Маппинг канон ↔ `app_role` | SQL-функции (M2) | `CANONICAL_TO_APP_ROLE` |
| Lifecycle (8 стадий) | enum `lifecycle_stage` | `LifecycleStage` |
| Household (5 типов) | enum `household_type_enum` | `HouseholdType` |
| Языки UI (3) | enum `language_code` | `LanguageCode` |
| Кластеры (6) | text[] `active_clusters` | `ClusterId` |
| Персоны P1..P25 | text `detected_persona` | `PersonaCode` |
| Triggers / special_status | text[] | seeds + open vocab |

DTO `CanonicalProfile` агрегирует view `v_profiles_canonical` +
вторичные роли через RPC. Patch `CanonicalProfilePatch` — additive,
`'field' in patch` semantics (можно явно записать `null`).

### 2. API-контракт — `src/lib/canonical/profileApi.ts`

| Функция | Назначение |
|---|---|
| `fetchCanonicalProfile(userId)` | Read из view + RPC `get_canonical_secondary_roles`, параллельно. |
| `hasCanonicalRole(userId, role)` | Server-side authoritative check (RPC). |
| `updateCanonicalProfile(userId, patch)` | Additive UPDATE по 11 каноническим колонкам. |
| `appendCanonicalArray(userId, field, values)` | Дедуплицированный append для `activeClusters` / `triggersActive` / `specialStatus`. |

**Важно:** все маппинги snake_case ↔ camelCase сосредоточены здесь.
UI запрещено читать `profiles.lifecycle_stage`/`detected_persona`/etc.
напрямую — всегда через `fetchCanonicalProfile`.

### 3. React Query-хуки — `src/hooks/useCanonicalProfile.ts`

| Хук | Кэш-ключ | Назначение |
|---|---|---|
| `useCanonicalProfile()` | `['canonical-profile', userId]` | Read-model канона. |
| `useUpdateCanonicalProfile()` | invalidates выше | Write patch. |
| `useAppendCanonicalArray()` | invalidates выше | Безопасный append. |
| `useHasCanonicalRole(role)` | `['canonical-has-role', userId, role]` | Серверная проверка роли (5 мин cache). |

`staleTime` = 60s для основной выборки — канон-сегментация меняется
редко, а персона/триггеры обновляются батчами агентами.

### 4. Barrel-экспорт

`src/types/index.ts` теперь реэкспортирует `./canonical`. Все
канонические типы доступны через `import { CanonicalRole, LifecycleStage } from '@/types'`.

## Что НЕ сделано (out of scope M3)

- ❌ Edge function для пересчёта `detected_persona` на основе сигналов — M4 (AI-orchestration).
- ❌ UI-компоненты, потребляющие `useCanonicalProfile` (PersonaBadge, LifecycleProgressBar) — M5.
- ❌ Server-side merge RPC для array-полей — пока read-modify-write на клиенте; вынесем в M4 если будет race.
- ❌ Миграция старых хуков (`useUserPersonas`, `useRoleSignals`) на канонический API — M5/M6.

## Контракт для будущих миграций

1. **Никогда не читать `profiles.{lifecycle_stage,detected_persona,active_clusters,triggers_active,special_status,kids_ages,visits_count,total_days_in_thailand,household_type,detected_persona_confidence,next_lifecycle_stage_eta}` напрямую.** Только через `fetchCanonicalProfile` / `useCanonicalProfile`.
2. **Никогда не делать `update profiles set <канон-колонка>`** мимо `updateCanonicalProfile` — иначе обходим типизацию и легко записать «грязные» строки в `detected_persona`.
3. **Расширение enum** (lifecycle_stage / household_type_enum) — миграция + регенерация `types.ts` + обновление `LIFECYCLE_STAGE_LABELS` / `HOUSEHOLD_TYPE_LABELS` в одном PR.
4. **Новые поля сегментации** добавляются по той же схеме: миграция → колонка во view → поле в `CanonicalProfile` + маппинг в `profileApi.ts`.

## Verification

- ✅ `npx tsc --noEmit -p tsconfig.app.json` — нет ошибок в новых файлах.
- ✅ Read-path использует view `v_profiles_canonical` (не сырой `profiles`) → RLS унаследовано.
- ✅ Write-path использует `profiles` напрямую с `eq('id', user.id)` → существующие RLS-политики (`Users can update own profile`) применяются.
- ✅ `appendCanonicalArray` идемпотентна (set-семантика).

## Файлы

- `src/types/canonical.ts` (new)
- `src/lib/canonical/profileApi.ts` (new)
- `src/hooks/useCanonicalProfile.ts` (new)
- `src/types/index.ts` (edit — barrel)
