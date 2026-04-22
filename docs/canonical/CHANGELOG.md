# Changelog · Canonical Documents

Все значимые изменения канонического набора документируются здесь.
Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), SemVer.

---

## [1.3.0] — 2026-04-22 (M3 done)

### Added
- **TypeScript canonical layer (M3)**:
  - `src/types/canonical.ts` — `CanonicalRole`, `LifecycleStage`, `HouseholdType`, `ClusterId`, `PersonaCode`, `CanonicalProfile`, метаданные ролей/стадий/кластеров.
  - `src/lib/canonical/profileApi.ts` — типизированный API над `v_profiles_canonical` + RPC канонических ролей. snake_case ↔ camelCase маппинг.
  - `src/hooks/useCanonicalProfile.ts` — React Query хуки: read, update, append-array, has-role.
- `src/types/index.ts` — barrel-экспорт канонических типов.
- `audits/M3-types-and-api-contracts.md` — отчёт по M3 + контракт для будущих миграций.

### Notes
- Запрещено читать M2-колонки `profiles` напрямую — только через `useCanonicalProfile`.
- Lifecycle/household enums приведены к фактическим значениям из БД (`scout/tourist/snowbird/nomad/settler/resident/absentee/returnee` и `solo/couple/family_with_kids/family_extended/group_friends`), а не к ранним черновым вариантам.
- TypeScript-сборка чистая.

---

## [1.2.0] — 2026-04-22 (M2 done)

### Added
- **Schema extension (M2)** — расширение `public.profiles`:
  - 13 новых колонок (lifecycle/persona/modifier/triggers)
  - 3 enum: `lifecycle_stage`, `household_type_enum`, `language_code`
  - 3 SECURITY DEFINER функции: `get_canonical_primary_role`, `get_canonical_secondary_roles`, `has_canonical_role`
  - View `v_profiles_canonical` с `security_invoker=true`
- `audits/M2-schema-extension.md` — отчёт по M2.

### Changed
- `README.md` (canonical) — статус M2 → done.

### Notes
- Smart-additive стратегия: `app_role` enum НЕ изменён (17 значений сохранены), маппинг канон ↔ существующие роли через функции.
- Zero breaking changes. 6 существующих профилей бэкфилены defaults.
- Линтер чистый по M2-изменениям. Pre-existing `Extension in Public` warn — out of scope.

---

## [1.1.0] — 2026-04-22

### Added
- `05-visual-design-system.md` — канонический Visual Design System v1.0 (принципы, цвет, типографика, сетка, компоненты, кластеры). Источник истины для всех визуальных решений.

### Changed
- `README.md` — индекс расширен до 5 канонических документов.

---

## [1.0.0] — 2026-04-22

### Added
- `01-segmentation-framework.md` — 3-осевая сегментация (lifecycle × role × modifier), 25 персон, 10 кластеров жизненных ситуаций, CRM-схема.
- `02-service-catalogue-v2.md` — 16 категорий × 230 услуг с тегами lifecycle/role/cluster и моделями монетизации.
- `03-tone-of-voice.md` — канонический голос бренда: интерфейс, WhatsApp, email, лендинги, AI-консьерж.
- `04-implementation-protocol.md` — operational playbook M1→M7.
- `research/phuket-proptech-market.md` — анализ рынка proptech на Пхукете.
- `research/myuno-taxonomy-canonical.md` — 6-уровневая таксономия (12 ситуаций × 140 микроситуаций × 38 персон × 36 приложений).
- `README.md` — индексный файл и правила работы.

### Notes
- Канонические документы становятся единственным источником правды для продуктовых, контентных и инженерных решений. При расхождении кода/UI с этими документами правится код, а не документ.
- Запущен протокол M1→M7, см. `04-implementation-protocol.md`.
