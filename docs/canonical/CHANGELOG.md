# Changelog · Canonical Documents

Все значимые изменения канонического набора документируются здесь.
Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), SemVer.

---

## [1.9.1] — 2026-04-22

### Changed
- **`README.md`** — переписан как «один экран»: сверху таблица быстрой навигации (12 типовых задач → точный документ), затем компактные блоки 01–09, architecture, research, audits с версиями и статусом вех. Цель: всё находится с первого экрана, без скролла.

---

## [1.9.0] — 2026-04-22

### Added
- **`architecture/OVERVIEW.md`** — единый обзор архитектуры. Навигатор по канону, схема зависимостей (Mermaid), decision tree «куда положить новый код», слои L0–L6, hard rules, статус вех M1–M8, поиск нужного документа за 1–2 клика.

### Changed
- `architecture/README.md` переписан как точка входа в подпапку; OVERVIEW.md помечен как ⭐ entry point.
- `docs/canonical/README.md` — раздел «Архитектура» обновлён, OVERVIEW.md выведен на верх списка.

### Notes
- Принцип OVERVIEW.md: навигатор, не источник истины. Контент живёт в первоисточниках; карта обновляется при добавлении канон-документа, завершении вехи или изменении hard rules.

---

## [1.8.0] — 2026-04-22

### Added
- **`docs/canonical/architecture/`** — новая подпапка канона. Содержит `ARCHITECTURE_V2.md`, `FEASIBILITY.md`, `CLAUDE_PATCH.md`, `README.md`. Перенесено из устаревшей корневой `/handoff` для централизации источника истины.

### Changed
- `CLAUDE.md` § 1.5 — пути обновлены на `docs/canonical/architecture/*`.
- `README.md` — карта документации обновлена.
- `docs/canonical/README.md` — добавлен раздел «Архитектура (architecture/)».

### Removed (moved to `archive/2026-04-cleanup/`)
- **`/handoff`** (папка целиком, 4 файла) → перенесена в `docs/canonical/architecture/`.
- **`/myuno-design`** (HTML/JSX дизайн-сnapshot) → `archive/2026-04-cleanup/myuno-design-snapshot/`. Заменён `05-visual-design-system.md` + `DESIGN.md`.
- **`/archive/{docs,lovable,myuno-design}`** (старый архив) → `archive/2026-04-cleanup/old-archive/`.
- **12 устаревших audit/report MD из `/docs`** (ADMIN_PANEL_DEEP_AUDIT, AUDIT-MC-BLOCK, AUDIT_CYCLE_2, CONTACT_IMPORT_AUDIT, FIX_SPRINT_CYCLE2_REPORT, MC_DASHBOARD_CORE_AUDIT, MC_MODULE_DEEP_AUDIT, MC_SCOPING_FIXES_REPORT, PROPERTY_CARD_UX_AUDIT, TECHNICAL_AUDIT_REPORT, UNICORN_ANALYSIS, USER_PROCESS_AUDIT_REPORT) → `archive/2026-04-cleanup/docs-audits/`. Заменены живыми документами в `docs/canonical/audits/`.
- **5 дубликатов в корне репо** (`_AUDIT.md`, `project.md` lowercase, `ARCHITECTURE_AUDIT.md`, `OS_system_prompt.md`, `DEVELOPER_MODULE_SPEC.md`) → `archive/2026-04-cleanup/root-duplicates/`. Заменены `PROJECT.md` + canonical 07/08 + architecture/ARCHITECTURE_V2.md.

### Notes
- Полный реестр перенесённого: см. [`archive/2026-04-cleanup/INDEX.md`](../../archive/2026-04-cleanup/INDEX.md).
- Правило: файлы из `archive/2026-04-cleanup/` нельзя возвращать в активное дерево; полезный контент поднимается в канон, источник цитируется.

---

## [1.7.1] — 2026-04-22

### Changed
- **`09-data-schema.md`** — обновлён до полноценной редакции v1.0 (21 раздел). Добавлены: три принципа схемы (§1), технологические ограничения (§2), полный enum reference (§4 — lifecycle, roles, ClearView, property/transaction, partner/KYB, service catalogue), детальные DDL для core tables `users`/`properties`/`partners`/`services` (§5), transaction tables (§6), lead intelligence с триггером scoring (§7), ClearView реестр (§8), content tables (§9), notifications/messages (§10), три RLS-паттерна (§11), helper triggers (§12), миграционные правила и rollback-шаблоны (§13), soft vs hard delete (§14), backup/DR (§15), indexing strategy (§16), чек-лист новой таблицы (§17), anti-patterns (§18), governance (§19), AI-prompt шаблон (§20), cross-references (§21).

### Notes
- Структура документа осталась обратно совместимой: все ссылки на разделы из PROJECT.md, M2, M8a продолжают работать.
- Источник истины по схеме данных Supabase — этот файл; расхождение с реальной БД считается дефектом.

---

## [1.7.0] — 2026-04-22

### Added
- **`09-data-schema.md`** — Canonical Data Schema v1.0. Единый источник истины по схеме данных Supabase: таблицы, enums, индексы, RLS-политики, FK, naming conventions. Любое расхождение между документом и реальной БД считается дефектом и устраняется PR в документ или миграцией. Связан с `PROJECT.md` §14, M2 (lifecycle/role columns), M8a (ClearView schema), `07-information-architecture.md` §2.1.

### Changed
- `docs/canonical/README.md` — индекс расширен до 9 канонических документов.

### Notes
- Принципы документа: один пользователь — одна БД — все домены; additive over destructive; RLS by default.
- Документ дополняет M2 (фактическая схема `profiles` после миграций) и служит контрактом для будущих миграций (M5+).

---

## [1.6.0] — 2026-04-22

### Added
- **`08-ai-prompts-library.md`** — AI Prompts Library v1.0. Канонический документ системы промптов для всех AI-агентов платформы (консьерж, ClearView scoring draft, Tax Advisor, support и др.). Единая структура, общая база знаний, специфичные инструкции. Источник истины — промпты живут в markdown, не в коде.
- **`audits/M8-clearview-integration-protocol.md`** — M8 ClearView Integration Protocol v1.0. Operational playbook для встраивания ClearView в работающий код платформы без breaking changes. Дополнение к `04-implementation-protocol.md` — может запускаться параллельно с M4–M6.

### Changed
- `docs/canonical/README.md` — индекс расширен до 8 канонических документов; M8 добавлен в раздел аудитов.

### Notes
- Документ 08 — контракт между AI-агентами в продакшене (Tax Advisor в ContractAI = Tax Advisor в TaxNav).
- M8 — независим от M2-сегментации, использует свою схему ClearView; не блокирует и не блокируется M4–M6.

---

## [1.5.0] — 2026-04-22 (M4 done)

### Added
- **AI-orchestration (M4)** — детекция lifecycle / persona / clusters / triggers через Lovable AI:
  - `supabase/functions/canonical-persona-detect/index.ts` — Edge Function с tool-calling structured output (`submit_segmentation`), enum-валидацией, RBAC (self или admin), опциональным аддитивным `apply` в `profiles`.
  - `src/hooks/useDetectPersona.ts` — React Query mutation hook + `isHighConfidence` helper (порог 0.75).
  - `audits/M4-ai-orchestration.md` — отчёт по M4 + контракты.

### Notes
- AI **никогда не применяет автоматически** — решение принимает UX-слой.
- AI не управляет `primary_role` (только app_role-маппинг M2). Работает с lifecycle / persona / clusters / triggers.
- Default-модель: `google/gemini-3-flash-preview`. 429 / 402 от Lovable AI пробрасываются на фронт с понятными кодами.
- Schema не менялась — M4 чисто оркестрационный слой над M2/M3.

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
