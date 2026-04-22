# Changelog · Canonical Documents

Все значимые изменения канонического набора документируются здесь.
Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), SemVer.

---

## [1.4.0] — 2026-04-22

### Added
- **`/PROJECT.md`** в корне репозитория — стратегический источник истины (v2.3, апрель 2026). Отменяет все предыдущие версии, драфты и роадмапы. Содержит: позиционирование, 8 моатов (включая ClearView), монетизацию, 13-строчную таблицу сделок, Y1 target $1M net revenue, 5-тест для новых фич.
- **`06-clearview-methodology.md`** — каноническая методология ClearView™ V3 (March 2025), адаптированная для canonical system (April 2026). 8 взвешенных категорий, рейтинги AAA–BB, 5-ступенчатая maturity progression, audited score modifiers. Источник истины для UI-бейджей, RAG-базы AI-консьержа, pitch застройщикам, PR.
- **`07-information-architecture.md`** — каноническая информационная архитектура v1.0. URL-структура, субдомены (myuno.app, invest., app., clearview.), cross-domain SSO, навигация, SEO-маршрутизация.

### Changed
- `.cursorrules`, `CLAUDE.md`, `.cursor/rules/myuno-project.mdc` — порядок чтения для AI-агентов: сначала `/PROJECT.md`, затем canonical docs 01–07 по номерам.
- `docs/canonical/README.md` — индекс расширен до 7 канонических документов.

### Notes
- PROJECT.md живёт в **корне репозитория**, а не в `docs/canonical/`, потому что это стратегический документ верхнего уровня (объединяет позиционирование, экономику, моаты, дизайн-стандарты и AI-инструкции).
- Canonical docs 01–07 остаются операционными — они отвечают на конкретные «как сделать», PROJECT.md отвечает на «что строим и почему».

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
