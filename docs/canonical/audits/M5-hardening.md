# M5 — Hardening (закрытие остатков перед M6)

**Status:** ✅ done (2026-04-23, v1.10.2) — H.1–H.7 закрыты (E2E автоматизированы под Playwright, ручной prod-прогон по `M5-e2e-qa-checklist.md` опционален перед M6)
**Owner:** Pavel + AI engineer
**Parent milestone:** [M5 · UX Persona Detection](./M5-ux-persona-detection.md) v1.10.0
**Canonical refs:** `04-implementation-protocol.md §M5`, `01-segmentation-framework.md §6`, `09-data-schema.md`

> **TL;DR.** M5 v1.10.0 закрыл основной flow `/start/v2`, но три пункта acceptance остались открытыми: backfill anon→user trigger (5.9), `<PersonaDetectionPreview />` в `/account` (5.7), и end-to-end QA в проде. Хардненинг закрывает их минимально-аддитивно, без новых таблиц и без изменения публичного API. После хардненинга M5 формально получает ✅ done и разблокирует M6.

---

## 1 · AUDIT — что осталось не закрытым

| Acceptance bullet | Статус | Доказательство |
|---|---|---|
| `/start/v2` работает за флагом | ✅ done | флаг = `true` в prod, route в `AnimatedRoutes.tsx` |
| Q1=8 lifecycle / Q2=6 role / Q3=10 modifiers | ✅ done | `LifecycleStep.tsx`, `RoleStep.tsx`, `ModifiersStep.tsx` |
| `detectPersona()` ≥ 10 unit-тестов | ✅ done | 11 тестов в `__tests__/detectPersona.test.ts` |
| Authed → запись канонических колонок в `profiles` | ✅ done | `useCanonicalOnboarding` → `useDetectPersona({apply:true})` |
| Anon → запись в `concierge_sessions` + `anon_session_id` в localStorage | ✅ done | `useCanonicalOnboarding` lines 121–132 |
| Result показывает 5–7 сервисов из v2 | ✅ done | `recommendServices()` в `ResultStep.tsx` |
| **`<PersonaDetectionPreview />` в `/account`** | ❌ **missing** | поиск по репо: 0 совпадений вне docs |
| Tone-of-voice: нет «лучший / уникальный / революционный / !» | 🟡 partial | проверены onboarding/v2/* и баннер; не проверен Result CTA |
| `persona_detection_log` пишется при каждом вызове M4 | ✅ done | hook lines 134–150 |
| **Backfill trigger anon→user** | ❌ **missing** | `handle_new_user()` сейчас не читает `anon_session_id` |
| Старый `/start` не сломан | ✅ done | v1-флаг = `true`, route не тронут |
| CHANGELOG bump | ✅ done | v1.10.0 |

**Реальные пробелы:** `5.7` (PersonaDetectionPreview), `5.9` (backfill trigger), tone-of-voice review Result-экрана, e2e-прогон.

---

## 2 · GAP

### 2.1 · Backfill anon → user

Сценарий: незалогиненный пользователь проходит `/start/v2` → ответы пишутся в `concierge_sessions(anon_session_id, raw_answers)` и `persona_detection_log(anon_session_id, ...)`. После регистрации (Email/Google/Phone) `auth.users` insert вызывает `handle_new_user()`, но та **не знает про `anon_session_id`** — создаёт пустой профиль. Анонимная сессия осиротевшая, persona теряется → пользователь видит баннер «Расскажите о себе» и проходит онбординг повторно.

**Источник `anon_session_id` после signup:**
- Frontend кладёт `anon_session_id` в `auth.signUp({ options: { data: { anon_session_id } } })` → попадает в `NEW.raw_user_meta_data` доступном в trigger.
- Альтернатива: post-signup RPC `claim_anon_session(anon_id)`. Менее надёжно (race с UI).

**Решение:** доработать `handle_new_user()` так, чтобы при наличии `raw_user_meta_data ->> 'anon_session_id'` он:
1. Перенёс последнюю completed `concierge_sessions` (и обновил `user_id`, `converted_to_user_id`).
2. Вытащил `proposal` из последнего `persona_detection_log` по этому `anon_session_id` и записал канонические колонки в `profiles` (lifecycle_stage, detected_persona, active_clusters, modifiers→special_status).
3. Обновил `persona_detection_log.user_id = NEW.id` и `applied = true`.
4. Никогда не падал — все шаги в `EXCEPTION WHEN OTHERS THEN ... NULL` чтобы не блокировать signup.

### 2.2 · `<PersonaDetectionPreview />` в `/account`

Self-service экран: пользователь видит свою текущую персону + lifecycle + clusters, может **переопределить вручную** через тот же 3-вопросный flow (или быстрый «Изменить» → переход на `/start/v2`). Manual override пишет запись в `persona_detection_log` с `source='manual_override'`.

**Минимальная реализация:** карточка в `/account` со статусом + кнопка «Уточнить». Полное переопределение через `/start/v2?return=/account`. Без отдельного inline-редактора (это M5+, не v1).

### 2.3 · Tone-of-voice review

Прогнать ResultStep.tsx, PersonaPromptBanner.tsx, новый PersonaDetectionPreview через чек-лист `03-tone-of-voice.md §14`: убрать «!», «лучший», «уникальный», urgency.

### 2.4 · E2E QA в проде

Авторизованный smoke-аккаунт: `/start/v2` → Q1→Q3 → проверить что в `profiles` появились `lifecycle_stage`, `detected_persona`, `active_clusters`, и в `persona_detection_log` есть запись с `applied=true`.

---

## 3 · PLAN (атомарные шаги)

| # | Задача | Файлы | Зависимости |
|---|---|---|---|
| H.1 | Миграция: расширить `handle_new_user()` — обработка `anon_session_id` из `raw_user_meta_data`. Аддитивно, идемпотентно, без падений | новая миграция | — |
| H.2 | Frontend: при `auth.signUp` передавать `anon_session_id` из localStorage в `options.data` | `useAuth*`, signup-формы | H.1 |
| H.3 | Компонент `<PersonaDetectionPreview />`: показ текущей персоны + cluster chips + CTA «Уточнить» (link на `/start/v2?return=/account`) | `src/components/persona/PersonaDetectionPreview.tsx` | — |
| H.4 | Встроить `<PersonaDetectionPreview />` в `UserAccountDashboard.tsx` — отдельная карточка над `PersonalRecommendations` | `src/pages/account/UserAccountDashboard.tsx` | H.3 |
| H.5 | Поддержать `?return=` redirect в `StartOnboardingV2.tsx` Result-экране (после успеха → возврат) | `StartOnboardingV2.tsx`, `ResultStep.tsx` | H.3 |
| H.6 | Tone-of-voice pass по 3 файлам (Result, Banner, Preview): убрать запретные слова | те же 3 файла | H.3 |
| H.7 | E2E QA: создать тестовый authed-аккаунт, пройти `/start/v2`, верифицировать `profiles` + `persona_detection_log` SQL-запросом | manual + `read_query` | все выше |
| H.8 | CHANGELOG → v1.10.1, M5 audit → ✅ done, README статус M5 → ✅ done | docs | H.7 |

**Чего не делаем (anti-scope):**
- Inline-редактор персоны в `/account` (без перехода на `/start/v2`) → M5+.
- Удаление v1 `/start` → по плану через 14 дней prod-soak.
- Авто-перерасчёт lifecycle на cron / `booking.confirmed` → M6.
- Persona-aware Home rearrangement → M6.

---

## 4 · ACCEPTANCE — критерии приёмки

- [ ] `handle_new_user()` корректно бэкофилит `profiles` + `concierge_sessions` + `persona_detection_log` при наличии `anon_session_id` (проверено вручную)
- [ ] При signup без `anon_session_id` поведение `handle_new_user()` идентично текущему (regression)
- [ ] `signUp` во всех точках входа (email, Google, phone OTP) передаёт `anon_session_id` если есть
- [ ] Карточка `<PersonaDetectionPreview />` видна в `/account`, корректно показывает «персона не определена» fallback
- [ ] CTA «Уточнить» ведёт на `/start/v2?return=/account` и после Result возвращает обратно
- [ ] Tone-of-voice: 0 совпадений «лучший|уникальный|революционный|!» в ResultStep / Banner / Preview
- [ ] E2E SQL: после прогона `SELECT detected_persona, lifecycle_stage, active_clusters FROM profiles WHERE id=...` возвращает не-NULL
- [ ] CHANGELOG bumped → v1.10.1, M5 README статус → ✅ done

---

## 5 · ROLLBACK

1. **Trigger backfill (H.1):** revert `handle_new_user()` к версии из `20260422021325_*.sql`. Данные не теряются — только перестаёт работать backfill для будущих signup.
2. **PersonaDetectionPreview (H.3–H.5):** удалить компонент + строку из `UserAccountDashboard.tsx`. Остальной экран не страдает.
3. **Tone-of-voice (H.6):** revert по конкретным строкам.

**Эстимация отката:** ≤ 15 минут.

---

## 6 · Связанные документы

- Parent: [`audits/M5-ux-persona-detection.md`](./M5-ux-persona-detection.md)
- Канонический протокол: `04-implementation-protocol.md §M5` (lines 503–656)
- Hook логики: `src/hooks/useCanonicalOnboarding.ts`
- Существующий `handle_new_user`: `supabase/migrations/20260422021325_*.sql`
- Tone of voice: `03-tone-of-voice.md §14` (запретные слова)

---

*M5 hardening · v0.1 · 2026-04-23*
