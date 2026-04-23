# Changelog · Canonical Documents

Все значимые изменения канонического набора документируются здесь.
Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), SemVer.

---

## [1.11.1] — 2026-04-23

### Added (M6 · трек B · шаг B.1)
- **`src/lib/landings/types.ts`** — типы для конфигов лендингов:
  - `LandingClusterCode = 'A'..'J'` + `LANDING_CLUSTER_CODES` + `isLandingClusterCode()`. Это **10 жизненных кластеров** из §5 канона (Arrival/Extension/Settlement/Investment/Transaction/Operations/Compliance/Emergency/Lifestyle/Exit) — отдельная ось от 6 surface-кластеров `ClusterId` в `src/types/canonical.ts` (arrive/live/manage/invest/legal/build). Не смешивать.
  - `BilingualString = { ru, en }` — обязательные RU+EN строки (никаких fallback на render, по `docs/CONTENT_STYLE.md` §9).
  - `PersonaLanding` — конфиг `/for/:slug`: `personaCode: P1..P25`, `slug`, `status: 'live'|'draft'`, `h1`, `subtitle`, `pains[]`, `services[]`, `bundle?`, `faq[]`, `primaryCta`, `secondaryCta?`, `seo?`.
  - `ClusterLanding` — конфиг `/cluster/:slug`: `clusterCode: A..J`, `slug`, `status`, `h1`, `subtitle`, `jobs[]` (lifecycle-фразы из §5), `services[]`, `bundle?`, `faq[]`, `primaryCta`, `relatedPersonas[]`, `seo?`.
  - Сопутствующие: `LandingServiceRef`, `LandingBundle`, `LandingFaqEntry`, `LandingCta`, `LandingSeo`.
  - Helpers: `isLivePersonaLanding()`, `isLiveClusterLanding()` — гарантируют, что `live` лендинг имеет непустые `pains/jobs`, `services`, `faq` и SEO-блок (используется в роутах B.4/B.5 для решения 200 vs 404). `findPersonaLandingBySlug()`, `findClusterLandingBySlug()`.
- **`src/lib/landings/__tests__/types.test.ts`** — **10 тестов зелёные:** проверка `LandingClusterCode` (ровно A..J), guard `isLandingClusterCode`, `isLivePersonaLanding` / `isLiveClusterLanding` (live + draft + missing seo + пустые массивы), find-helpers.

### Changed
- `audits/M6-persona-landings.md` — статус B.1 → ✅ done. B.2 (конфиг 25 personaLandings) → 🔜 next.

### Notes
- B.1 — pure types-pass: ничего не рендерится, ни одного нового роута. UI/контент появятся в B.2–B.4.
- Решение про разделение `LandingClusterCode` vs `ClusterId` зафиксировано в JSDoc файла, чтобы будущие правки не «слили» две оси.

---

## [1.11.0] — 2026-04-23

### Closed (M6 · трек D · шаги D.6 + D.7 — track D complete)
- **D.6 · Tone-of-voice pass §14** — priority-зона (`PersonaPromptBanner` + `ActiveSituation`) проверена по 8-пунктному чек-листу §14 канона. **0 нарушений.** Никаких urgency-слов, восклицаний, «лучший / уникальный», эмодзи в UI-тексте. CTA `Начать` / `Start` — глагол действия. Подробности — в `audits/M6-persona-landings.md` § «D.6 findings».
- **D.7 · Track D closed** — статус трека D в `audits/M6-persona-landings.md` → ✅ closed. Persona-aware Home готов end-to-end за флагом `feature_flag:home_persona_aware_v1` (default OFF), включается одной строкой в `system_settings` без релиза.

### Notes
- Трек D дал инфраструктуру: `prioritizeHomeSections()` + `<PersonaAwareSections />` + DB-флаг + 15 unit-тестов. Видимый эффект включится по решению Павла.
- Следующий рекомендованный трек — **B (Persona + Cluster Landings)**: типы → конфиги (25 + 10) → 2 динамических роута → `<LandingSeoHead />` → 3 live persona + 3 live cluster → sitemap → tone pass.

---

## [1.10.6] — 2026-04-23

### Added (M6 · трек D · шаг D.4)
- **`src/pages/Index.tsx`** — интеграция `<PersonaAwareSections />` в Home за флагом `feature_flag:home_persona_aware_v1` (default OFF). Priority-зона: `PersonaPromptBanner` + `ActiveSituation`. Hero, tasks-блок, RealEstateEntry/TrustAsAService, AllSectionsAccordion остаются на фиксированных позициях (вне priority-зоны).
- **DB seed** — `INSERT INTO system_settings (key='feature_flag:home_persona_aware_v1', value='false')` (idempotent через `ON CONFLICT DO NOTHING`).

### Changed
- `audits/M6-persona-landings.md` — статус D.4 → ✅ done. Трек D · шаг D.6 (tone-of-voice pass) → 🔜 next.

### Notes
- **Регрессия безопасна:** при флаге OFF, loading-состоянии профиля или anon-юзере `<PersonaAwareSections />` рендерит `defaultOrder` 1:1 — порядок блоков идентичен пред-D.4 поведению.
- **Включение после QA** — одна строка в `system_settings` (`UPDATE … SET value='true'`), без релиза.
- **Откат** — обратное `UPDATE … SET value='false'`. Никакого кода править не нужно.
- Track D вышел в продакшн-готовое состояние; видимый persona-aware эффект включится по решению Павла.

---

## [1.10.5] — 2026-04-23

### Added (M6 · трек D · шаг D.3)
- **`src/components/home/PersonaAwareSections.tsx`** — обёртка-перестановщик Home-секций. Принимает `defaultOrder: HomeSectionKey[]` + `sections: Partial<Record<HomeSectionKey, ReactNode>>` (готовые JSX-элементы со своими props) и рендерит их в приоритетном порядке через `prioritizeHomeSections()`. Loading и `disabled=true` → дефолтный порядок (regression-safe). Отсутствующие в `sections` ключи тихо пропускаются. Сам компонент не управляет flag'ом — это делает родитель в шаге D.4 (упрощает A/B и rollback).
- **`src/components/home/PersonaAwareSections.test.tsx`** — 5 render-тестов (`disabled` → default, loading → default, P9 поднимает FeaturedPropertiesCarousel, missing keys, anon → default). **Все 5 зелёные.**

### Changed
- `audits/M6-persona-landings.md` — статус D.3 → ✅ done. D.4 → 🔜 next.

### Notes
- Компонент намеренно не владеет JSX отдельных блоков — родитель передаёт готовые elements. Это сохраняет lazy-loading, текущие props и не требует синхронизации сигнатур всех Home-блоков.
- UI пока не виден: `<PersonaAwareSections />` создан, но в `Home.tsx` не интегрирован — это шаг D.4 за флагом `home_persona_aware_v1`.

---

## [1.10.4] — 2026-04-23

### Added (M6 · трек D · шаги D.1 + D.2 + D.5)
- **`src/lib/segmentation/prioritizeHomeSections.ts`** — чистая детерминированная функция `prioritizeHomeSections(profile, defaultOrder, options?)`. Boost-score по 3 каналам: `active_clusters` (×3), `lifecycle_stage` (×2), `detected_persona` (×2). Особый случай: `PersonaPromptBanner` пинится в топ для authed без persona. Permutation-invariant (никогда не добавляет/удаляет ключи). Опциональный `maxJump` ограничивает прыжок секции вверх для anti-layout-shift защиты.
- **D.2 · Маппинги в том же файле**:
  - `CLUSTER_TO_SECTIONS` — 6 канонических кластеров (`arrive | live | manage | invest | legal | build`) → home-секции.
  - `LIFECYCLE_TO_SECTIONS` — 8 lifecycle-фаз → home-секции.
  - `PERSONA_TO_SECTIONS` — точечные boost'ы для 10 ключевых персон (P1, P4, P5, P7, P8, P9, P10, P13, P14, P20).
- **`src/lib/segmentation/__tests__/prioritizeHomeSections.test.ts`** — 10 unit-тестов (anon → default, authed без сигналов → default, P1 tourist, P9 HNW, P10 operator, P13 pet-owner, PersonaPromptBanner-pin для authed без persona, permutation invariant, maxJump=1, стабильная сортировка). **Все 10 зелёные.**

### Changed
- `audits/M6-persona-landings.md` — статусы D.1 / D.2 / D.5 → ✅ done. D.3 → 🔜 next.

### Notes
- UI пока не затронут — это backend-логика. Видимый эффект появится на шаге D.3 (`<PersonaAwareSections />`) и D.4 (интеграция за флагом `home_persona_aware_v1`).
- Все остальные секции (Hero, HomeTopBar, Footer) фиксированы вне priority-зоны и не участвуют в перестановке.

---

## [1.10.3] — 2026-04-23

### Added (M6 audit — старт следующей вехи)
- **`audits/M6-persona-landings.md`** — draft v0.1 (awaiting approval). AUDIT текущего Home (нет persona-aware перестановки) + лендингов (0 из 25 канонических persona-маршрутов, 0 из 10 cluster-маршрутов; существующие `/relocate`, `/wedding`, `/kids`, `/nomad-guide`, `/pets` — ситуационные, не привязаны к канону §4); GAP против §M6; PLAN на 3 трека (D · Persona-aware Home → B · Landings → C · Lifecycle automation) с атомарными шагами, acceptance, rollback, anti-scope; обоснование порядка треков.

### Changed
- `README.md` — статус M6 → 📋 audit (draft v0.1).

### Notes
- Рекомендуемый порядок треков: D (Home) → B (Landings) → C (Cron lifecycle). Обоснование в §3 audit-документа: M5 даёт данные, D первым материализует ценность, B без D угадывает приоритет, C — producer для consumer'а из D.
- M6 формально не блокирован M5 prod-прогоном (`M5-e2e-qa-checklist.md` опционален), но рекомендуется до старта трека C.

---

## [1.10.2] — 2026-04-23

### Added (M5 H.7 — Playwright-автоматизация e2e чек-листа)
- **Playwright specs** под `e2e/tests/onboarding/`:
  - `account-persona-preview.spec.ts` — Сценарии C+D из `M5-e2e-qa-checklist.md` (empty state с CTA `/start/v2?return=/account`, refine loop с авто-возвратом).
  - `persona-prompt-banner.spec.ts` — Сценарий B (баннер появляется для authed без персоны, dismiss держится в session).
  - `anon-to-user-backfill.spec.ts` — Сценарий A (smoke). Авто-skip, если окружение требует email-подтверждение (signup без активной сессии).
- **Test utilities** `e2e/utils/personaTestHelpers.ts` — `resetSeedAdminPersona()` (PATCH через REST под seed-токеном), `loginAsSeedAdmin`, `signupFreshUser`, `completeCanonicalOnboarding` (детерминированный прогон Q1→Q3).
- **Stable selectors** — `data-testid` на `PersonaDetectionPreview`, `PersonaPromptBanner`, `LifecycleStep`, `RoleStep`, `ResultStep`. UI без визуальных изменений.

### Notes
- Автоматизация покрывает 3 из 4 ручных сценариев M5 без service-role ключа. Backfill-spec (A) скипается под политикой email-confirmation — flip auto-confirm в Lovable Cloud разблокирует его.
- Ручной прогон чек-листа `M5-e2e-qa-checklist.md` всё ещё рекомендован перед v1.11 (M6) для финальной верификации в проде.

---

## [1.10.1] — 2026-04-23

### Added (M5 hardening — закрытие остатков перед M6)
- **H.1 · Backfill trigger anon→user.** Миграция расширила `handle_new_user()`: при наличии `raw_user_meta_data ->> 'anon_session_id'` триггер переносит `concierge_sessions` и `persona_detection_log` на нового `user_id`, бэкофилит канонические колонки `profiles` (lifecycle_stage / detected_persona / active_clusters / special_status) из последнего `proposal`. Все шаги обёрнуты в `EXCEPTION WHEN OTHERS THEN NULL` — signup не падает.
- **H.2 · Frontend pass-through anon_session_id.** `src/lib/segmentation/anonSession.ts` — единая утилита для `myuno-anon-session-id`. `AuthContext.signUp` передаёт его в `options.data` для всех точек входа (email, Google, phone). Рефакторинг `useCanonicalOnboarding`, `useStartOnboarding`, `MyJourneyRecommendations` на новую утилиту.
- **H.3 · `<PersonaDetectionPreview />`** в `src/components/account/`. Три состояния (loading / empty / filled) на канонической read-модели `useCanonicalProfile`. CTA → `/start/v2?return=/account`. Скрывается при `feature_flag:concierge_routing_v2_canonical = false`.
- **H.4 · Интеграция в `/account`.** Карточка `<PersonaDetectionPreview />` встроена в `UserAccountDashboard.tsx` под `AccountActiveStay`.
- **H.5 · `?return=` redirect в `StartOnboardingV2`.** Добавлена `sanitizeReturnPath()` (защита от open-redirect: только internal `/`-paths). После Result-шага через 1.8s — `navigate(returnTo)`. Skip / Go Home кнопки тоже уважают `returnTo`.
- **H.6 · Tone-of-voice pass.** Прогон `ResultStep`, `PersonaPromptBanner`, `PersonaDetectionPreview` через §14: 0 совпадений «лучший / уникальный / революционный», 0 «!» в инфо-копиях. Смягчён primary CTA (`Open the first one` → `Open · {service title}`) — конкретика вместо обещания.
- **H.7 · `audits/M5-e2e-qa-checklist.md`** — 4 сценария (anon→user backfill, authed-only, /account refine loop, empty state) + готовые SQL-запросы для верификации в проде.
- **Тест.** `src/components/account/PersonaDetectionPreview.test.tsx` — 3 unit-теста (loading skeleton, empty state CTA, filled state с refine CTA). Все проходят.

### Changed
- `audits/M5-ux-persona-detection.md` — статус acceptance bullets 5.7 (PersonaDetectionPreview) и 5.9 (backfill trigger) переведены из ❌ в ✅.
- `audits/M5-hardening.md` — статус → ✅ done (H.1–H.6, H.8 готовы; H.7 ждёт ручного прогона в проде).

### Notes
- M5 формально готов к закрытию после прогона `M5-e2e-qa-checklist.md` в проде. После этого README статус M5 → ✅ done и разблокируется M6 (persona-aware Home, авто-перерасчёт lifecycle).
- Anon-to-user backfill идемпотентен: повторный signup с тем же `anon_session_id` (теоретически невозможно, но defensive) не задублирует данные — все UPDATE имеют `WHERE user_id IS NULL`.

---

## [1.10.0] — 2026-04-23

### Added
- **M5 · UX Persona Detection — реализация.**
  - Миграция: таблица `persona_detection_log` (RLS: owner read/insert, anon insert, admin read-all) + регистрация `feature_flag:concierge_routing_v2_canonical` (default OFF).
  - `src/lib/segmentation/detectPersona.ts` — детерминированный fallback `rules_v1` (8 lifecycle × 6 role × 10 modifiers → P1..P25, clusters, triggers, confidence). 11 unit-тестов проходят.
  - `src/lib/segmentation/recommendServices.ts` — 5–7 сервисов из каталога v2 по `active_clusters` + modifiers.
  - `src/hooks/useCanonicalOnboarding.ts` — оркестрация: local rules_v1 → AI `useDetectPersona({apply:true})` (если authed и confidence ≥ 0.75 — побеждает AI) → запись в `concierge_sessions` + `persona_detection_log`.
  - `src/pages/StartOnboardingV2.tsx` + `src/components/onboarding/v2/{LifecycleStep,RoleStep,ModifiersStep,ResultStep}.tsx` — 3-вопросный канонический онбординг, mobile-first.
  - `src/components/home/PersonaPromptBanner.tsx` — нудж на Home для authed без `detected_persona` → `/start/v2` (или fallback `/start` если v2-флаг OFF).
  - Роут `/start/v2` зарегистрирован в `AnimatedRoutes.tsx` за флагом `concierge_routing_v2_canonical`.

### Out of scope (отложено в M6/M7)
- Backfill trigger anon→user (5.9) — требует отдельной миграции с привязкой к `auth.users` insert; перенесено в M6.
- Авто-перерасчёт lifecycle на cron / `booking.confirmed` — M6.
- Удаление v1 `/start` — через 14 дней после prod-включения v2.

### Notes
- v1 `/start` не тронут — работает за старым флагом `concierge_routing_v1`.
- AI-детекция остаётся advisory: при confidence < 0.75 показываем rules_v1 результат.

---

## [1.9.2] — 2026-04-22

### Added
- **`audits/M5-ux-persona-detection.md`** — M5 audit & sprint plan (draft v0.1, awaiting approval). AUDIT текущего `/start` онбординга, GAP против §M5 (таксономия Q1–Q3 не каноническая, M4-детекция не подключена, канонические колонки `profiles` не заполняются), 12-шаговый PLAN на аддитивный `/start/v2` за новым флагом `concierge_routing_v2_canonical`, 11 критериев приёмки, rollback ≤30 мин.

### Notes
- M5 не блокирует M8 (ClearView, parallel track) и не блокируется им.

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
