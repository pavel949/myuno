# M5 · E2E QA Checklist (prod)

**Use:** заполнить вручную перед закрытием M5 в README. Каждый шаг — в проде на myuno.app, не в preview.

**Prereq:** свежий тестовый аккаунт (или logged out browser + новый email).

---

## Сценарий A · Anon → User backfill (H.1 + H.2)

1. **Logout** в проде. Открыть incognito → `https://myuno.app/`.
2. Перейти `/start/v2`. Заполнить Q1 (lifecycle), Q2 (role), Q3 (modifiers). Нажать «Показать рекомендации».
3. Открыть DevTools → Application → Local Storage. Скопировать значение `myuno-anon-session-id` (UUID).
4. Зайти в Result-экран. **Не закрывая вкладку**, перейти на `/auth` → зарегистрироваться (email/Google).
5. После signup и подтверждения email — проверить, что профиль заполнен. Запустить SQL:

```sql
-- Замените '<ANON_UUID>' на скопированный UUID из шага 3
SELECT
  p.id,
  p.email,
  p.lifecycle_stage,
  p.detected_persona,
  p.active_clusters,
  p.special_status
FROM profiles p
WHERE p.email = '<test-email>';
```

**Ожидаем:** `lifecycle_stage`, `detected_persona`, `active_clusters` — НЕ NULL, совпадают с тем, что выбрал в Q1–Q3.

6. Проверить backfill `concierge_sessions`:

```sql
SELECT id, anon_session_id, user_id, raw_answers, created_at
FROM concierge_sessions
WHERE anon_session_id = '<ANON_UUID>';
```

**Ожидаем:** `user_id` = id нового пользователя (не NULL).

7. Проверить лог детекции:

```sql
SELECT id, anon_session_id, user_id, source, applied, confidence, created_at
FROM persona_detection_log
WHERE anon_session_id = '<ANON_UUID>'
ORDER BY created_at DESC;
```

**Ожидаем:** минимум одна запись с `user_id` НЕ NULL и `applied = true`.

---

## Сценарий B · Authed onboarding (без anon)

1. Logged in аккаунт без `detected_persona`. Открыть `/`.
2. **Ожидаем:** на главной виден `PersonaPromptBanner` («Расскажите о себе за 30 секунд»).
3. Клик «Начать» → попадаем на `/start/v2`.
4. Пройти Q1–Q3. После Result проверить SQL:

```sql
SELECT lifecycle_stage, detected_persona, active_clusters
FROM profiles
WHERE id = '<user-id>';
```

**Ожидаем:** все три поля заполнены.

5. Вернуться на `/`. **Ожидаем:** баннер исчез (есть `detected_persona`).

---

## Сценарий C · /account preview + refine loop (H.3–H.5)

1. Logged in аккаунт с заполненной персоной. Открыть `/account`.
2. **Ожидаем:** карточка `Your profile signals` / `Ваш профиль` показывает: lifecycle stage, persona, cluster badges.
3. Клик `Refine answers` / `Уточнить ответы`.
4. **Ожидаем:** URL = `/start/v2?return=%2Faccount`.
5. Пройти Q1–Q3 заново (можно изменить).
6. После Result-экрана через ~1.8s — **автоматический redirect** на `/account`.
7. **Ожидаем:** карточка обновилась с новыми значениями. SQL:

```sql
SELECT detected_persona, active_clusters, updated_at
FROM profiles WHERE id = '<user-id>';
```

`updated_at` свежее последних 2 минут.

---

## Сценарий D · Empty state на /account

1. Свежий аккаунт без персоны. Открыть `/account`.
2. **Ожидаем:** карточка с CTA «Set up in 30 seconds» / «Настроить за 30 секунд».
3. Клик → `/start/v2?return=%2Faccount`.

---

## Tone-of-voice (H.6) — final manual check

Открыть глазами:
- `/start/v2` Q1 → Result step
- Home banner (`PersonaPromptBanner`)
- `/account` → `PersonaDetectionPreview` (empty + filled)

**Запретные слова:** «лучший», «уникальный», «революционный».
**Запретные конструкции:** восклицательные знаки в инфо-копиях, urgency («сейчас же», «не упустите»), пустые обещания («идеально подойдёт»).

Grep уже подтвердил отсутствие — это финальный визуальный sanity check.

---

## Acceptance gate (H.8)

Все 4 сценария прошли + tone-of-voice ОК → bump CHANGELOG → v1.10.1 + статус M5 в README → ✅ done.

*Checklist · v1 · 2026-04-23*
