# M5 — UX обвязка детекции персон

**Status:** ✅ Implemented (2026-04-23) — flag `concierge_routing_v2_canonical` default OFF, готово к QA-включению
**Date:** 2026-04-22 (audit) · 2026-04-23 (impl)
**Owner:** Pavel + AI engineer
**Source:** `04-implementation-protocol.md §M5` · `audits/M4-ai-orchestration.md §7`
**Canonical refs:** `01-segmentation-framework.md` §4 (25 personas), §5 (10 clusters), §9.2 (3-question flow), §6 (cluster matrix); `03-tone-of-voice.md`; `08-ai-prompts-library.md` §1 (Concierge)

> **TL;DR.** Реализован `/start/v2` за флагом `concierge_routing_v2_canonical`. 8 lifecycle × 6 ролей × 10 модификаторов → `detectPersona()` (rules_v1, 11 тестов) → AI `canonical-persona-detect` (apply:true для authed, побеждает при confidence ≥ 0.75) → запись в `profiles` + `persona_detection_log` (RLS-защищён). Result-экран показывает 5–7 сервисов через `recommendServices()`. Home получил `<PersonaPromptBanner />` — нудж к онбордингу для authed без `detected_persona`. Старый `/start` не тронут.

---

## 1 · AUDIT — что есть сейчас

### 1.1 Public onboarding `/start` (StartOnboarding.tsx + useStartOnboarding.ts)

| Параметр | Текущее состояние |
|---|---|
| Маршрут | `/start` (см. `routes.ts` → `START_ONBOARDING`) |
| Feature flag | `feature_flag:concierge_routing_v1` (default OFF) |
| Шагов | 3 + результат |
| Q1 «Who» | `tourist` · `relocator` · `investor` · `owner` |
| Q2 «Goal» | `visit` · `live` · `invest` · `manage` |
| Q3 «Intensity» | `short` · `long` · `permanent` |
| Куда пишет | `concierge_sessions` (anon-friendly через `anon_session_id` в localStorage) + `concierge_journeys` |
| AI слой | `concierge-route` Edge Function (existing), fallback — детерминированные правила |
| Anon → user backfill | `anon_session_id` в localStorage, ожидается trigger при signup (не верифицировано в M5) |
| Tone-of-voice | соблюдён — нет запрещённых слов, формулировки нейтральные |
| Mobile-first | да, 375px проверен |

### 1.2 M4 детекция (canonical-persona-detect + useDetectPersona)

- Edge Function принимает `signals` (origin_country, language, household, kids_ages, intent_notes, recent_surfaces, current_roles, recent_events).
- Возвращает proposal `{ lifecycle_stage, detected_persona, active_clusters, triggers, confidence, reasoning }`.
- `apply: true` мержит результат в `public.profiles` без перетирания (Set-объединение массивов).
- Hook `useDetectPersona()` готов, helper `isHighConfidence(>= 0.75)`.
- **Не имеет ни одного UI consumer'а** (`grep useDetectPersona src/` → 1 файл — сам hook).

### 1.3 Канонические колонки в `profiles` (M2)

Применены и доступны: `lifecycle_stage`, `lifecycle_stage_history` (jsonb), `primary_role`, `secondary_roles[]`, `language`, `household_type`, `special_status[]`, `kids_ages[]`, `detected_persona`, `detected_persona_confidence`, `active_clusters[]`, `triggers_active[]`, `first_visit_at`, `total_days_in_thailand`, `visits_count`, `visa_type`, `visa_expires_at`.

### 1.4 Прочие точки онбординга

- `/welcome` — guest welcome flow (post-booking), отдельный сценарий.
- `/welcome-landing` — лендинг для неавторизованных.
- `/mc/onboarding`, `/vendor/onboarding`, `/provider/onboarding`, `/developer-portal/onboarding` — **профессиональные** сценарии (B2B), вне scope M5.
- `OnboardingModal` — упоминается в нескольких местах, но как ecosystem-discovery виджет, не персонификация.

---

## 2 · GAP — расхождение с §M5

| Требование §M5 | Сейчас | Зазор |
|---|---|---|
| Q1 — lifecycle_stage (8 значений) | Q1 в `/start` — 4 значения (who) | **Полный mismatch таксономии**: `tourist/relocator/investor/owner` смешивает lifecycle и role. Канонический Q1 даёт 7 lifecycle-вариантов: scout, tourist, snowbird, nomad, settler, resident, absentee, returnee |
| Q2 — primary_role (6 значений) | Q2 в `/start` — 4 значения goal | Goal — это намерение, не роль. Каноническая Q2: consumer · resident-user · investor-passive · investor-active · operator · provider |
| Q3 — modifiers[] (multi-select) | Q3 в `/start` — single-select intensity | Intensity (short/long/permanent) — это часть lifecycle, а не модификаторы. Каноническая Q3: pet-owner, medical, halal, kosher, accessibility, lgbtq, athlete, wedding, family-young, family-school |
| Запись в `profiles.lifecycle_stage / primary_role / special_status / detected_persona / active_clusters` | Не пишется (только в `concierge_sessions`) | Канонические колонки M2 не заполняются |
| Использование M4 `canonical-persona-detect` | Не подключён | Frontend дублирует логику в `concierge-route`, обе несовместимы по таксономии |
| Persona-aware рекомендации (5–7 сервисов из каталога v2 по active_clusters) | Жёстко зашиты в `recommend()` | Нет связи с `02-service-catalogue-v2.md` тегами |
| Лог истории детекций | Только `concierge_sessions` (узкая таксономия) | Нет аудит-трейла канонических детекций (`persona_detection_log` упомянут как опц. в M4 §7) |

---

## 3 · PLAN — атомарные шаги

### Принцип
**Additive over replacement.** Старый `/start` остаётся работать (за тем же флагом). Параллельно поднимается `/start/v2` с канонической таксономией. После 14 дней в проде — переключение по флагу, затем удаление v1.

### Шаги

| # | Шаг | Файлы | Зависимости |
|---|---|---|---|
| 5.1 | Создать таблицу `persona_detection_log` (миграция) | новая | Нет |
| 5.2 | Расширить `useStartOnboarding` или создать `useCanonicalOnboarding` под канонические оси (lifecycle, role, modifiers[]) | `src/hooks/useCanonicalOnboarding.ts` | M3 типы |
| 5.3 | Добавить `detectPersona(lifecycle, role, modifiers[])` локальную утилиту-fallback по матрице из §M5 PROMPT (878 строки протокола) | `src/lib/segmentation/detectPersona.ts` | M3 типы |
| 5.4 | Создать страницу `/start/v2` (3 канонических вопроса, mobile-first) | `src/pages/StartOnboardingV2.tsx` + `src/components/onboarding/v2/*` | 5.2, 5.3 |
| 5.5 | После Q3 — вызвать `useDetectPersona({ apply: true })` (если authed) или сохранить в `concierge_sessions` (если anon) | использует существующий hook | 5.4 |
| 5.6 | Persona-aware результат: 5–7 сервисов из каталога v2 по `active_clusters` через `02-service-catalogue-v2.md` маппинг | `src/lib/segmentation/recommendServices.ts` | 5.4 |
| 5.7 | Компонент `<PersonaDetectionPreview />` (видим на result-экране и в `/account` для self-service переопределения) | `src/components/persona/PersonaDetectionPreview.tsx` | 5.5 |
| 5.8 | Добавить роут `/start/v2` в `AnimatedRoutes.tsx` за тем же флагом `concierge_routing_v1` (новый sub-flag `concierge_routing_v2_canonical`) | `AnimatedRoutes.tsx`, `routes.ts` | 5.4 |
| 5.9 | Backfill anon → user: trigger на `auth.users` insert копирует последнюю completed-сессию по `anon_session_id` в `profiles` + вызывает детекцию | миграция | 5.1, 5.5 |
| 5.10 | Тесты: 10 комбинаций ответов → ожидаемая persona (snapshot) | `src/lib/segmentation/__tests__/detectPersona.test.ts` | 5.3 |
| 5.11 | Микро-баннер на Home для authed без `detected_persona` — «Подскажем, с чего начать → /start/v2» | `src/components/home/PersonaPromptBanner.tsx` | 5.8 |
| 5.12 | CHANGELOG + обновить статус M5 в `README.md` и `OVERVIEW.md` | docs | все |

### Out of scope (отложено в M6/M7)
- Cron auto-перерасчёт lifecycle (M6).
- Авто-вызов детекции на `booking.confirmed` / `intake.submitted` (M6).
- 25 persona-лендингов (M6).
- Tone-of-voice review pass по всем error/empty states (M7).
- Удаление v1 онбординга (через 14 дней после prod).

---

## 4 · ACCEPTANCE — критерии приёмки

- [ ] `/start/v2` доступен за `feature_flag:concierge_routing_v2_canonical`, mobile 375px чистый
- [ ] Q1 = 7 lifecycle вариантов, Q2 = 6 ролей, Q3 = multi-select modifiers (10 вариантов + «ничего»)
- [ ] Локальная `detectPersona()` покрыта тестами на ≥ 10 комбинаций ответов
- [ ] Для authed user: после Q3 — вызов `canonical-persona-detect` с `apply: true`; в `profiles` появляются `lifecycle_stage`, `primary_role`, `special_status`, `detected_persona`, `detected_persona_confidence`, `active_clusters`
- [ ] Для anon user: запись в `concierge_sessions` с каноническими ключами + `anon_session_id` в localStorage
- [ ] Result-экран показывает 5–7 сервисов из каталога v2 (по `active_clusters`) с CTA, без cluster-overflow
- [ ] `<PersonaDetectionPreview />` видим в `/account`, поддерживает manual override
- [ ] Tone-of-voice: проверено отсутствие слов «лучший / уникальный / революционный / ! »
- [ ] `persona_detection_log` пишется при каждом вызове M4 (timestamp, user_id, signals, proposal, applied)
- [ ] Backfill trigger anon→user протестирован
- [ ] Старый `/start` не сломан (regression тест: feature flag v1 ON, v2 OFF → работает старый flow)
- [ ] CHANGELOG bump → v1.10.0, README/OVERVIEW обновлены

---

## 5 · ROLLBACK

1. Выключить `feature_flag:concierge_routing_v2_canonical` в `system_settings` → `/start/v2` показывает coming-soon placeholder.
2. Удалить роут `/start/v2` из `AnimatedRoutes.tsx`.
3. Удалить компоненты `src/components/onboarding/v2/*` и `src/pages/StartOnboardingV2.tsx`.
4. Откатить миграцию `persona_detection_log` (DROP TABLE — таблица append-only, потери данных не критичны).
5. Колонки в `profiles` остаются (M2-additive), просто перестают заполняться.
6. v1 `/start` продолжает работать без изменений.

**Эстимация отката:** ≤ 30 минут, без downtime.

---

## 6 · Связанные документы

- Канонический протокол: `04-implementation-protocol.md §M5` (lines 503–656)
- Что готово к использованию: `audits/M4-ai-orchestration.md §2`
- Источник таксономии: `01-segmentation-framework.md` §4–§6, §9.2
- Каталог сервисов для рекомендаций: `02-service-catalogue-v2.md`
- AI промпт концьержа: `08-ai-prompts-library.md` §1
- Голос интерфейса: `03-tone-of-voice.md`
- Hard rules архитектуры: `architecture/ARCHITECTURE_V2.md` §13 (особенно: feature flag gating, аддитивность, никакого нового top-level routа)

---

*M5 · v0.1 draft · awaiting approval to start implementation*
