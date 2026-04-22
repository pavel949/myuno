# M4 — AI-orchestration · Persona & Lifecycle Detection

**Status:** ✅ Done
**Date:** 2026-04-22
**Version bump:** Canonical CHANGELOG → v1.5.0

---

## 1. Цель

Дать AI-агенту возможность **предлагать** каноническую сегментацию пользователя
(lifecycle stage + persona P1..P25 + clusters + triggers) на основе сигналов
поведения и (опционально) **применять** её к `public.profiles` через тот же
аддитивный контракт, что и M3 (`updateCanonicalProfile`).

Это закрывает оркестрационный слой между фронтом (M3) и схемой (M2):

```
UI / chat / forms ──signals──▶ canonical-persona-detect (Edge)
                                        │
                                        ├─▶ Lovable AI Gateway (tool-calling)
                                        │      model: google/gemini-3-flash-preview
                                        │
                                        ├─▶ proposal { lifecycle, persona, clusters, triggers, confidence, reasoning }
                                        │
                                        └─▶ (опц.) merge в public.profiles
                                                    с инвалидацией useCanonicalProfile
```

---

## 2. Что добавили

### 2.1 Edge Function — `supabase/functions/canonical-persona-detect/index.ts`

- **Auth:** Bearer JWT обязателен. Вызывающий может детектить персону:
  - для **себя** (`callerId === user_id`), либо
  - для **любого** пользователя, если у него `app_role = 'admin'` (через `has_role` RPC).
- **Контракт ввода:**
  ```ts
  {
    user_id: string,
    signals: {
      origin_country?, preferred_language?, visits_count?,
      total_days_in_thailand?, household_type?, kids_ages?,
      intent_notes?, recent_surfaces?, current_roles?, recent_events?
    },
    apply?: boolean,        // default false — dry-run
    model?: string          // default google/gemini-3-flash-preview
  }
  ```
- **Контракт вывода:**
  ```ts
  {
    proposal: {
      lifecycle_stage: 'scout'|'tourist'|'snowbird'|'nomad'|'settler'|'resident'|'absentee'|'returnee',
      detected_persona: 'P1'..'P25',
      active_clusters: ('arrive'|'live'|'manage'|'invest'|'legal'|'build')[],
      triggers: string[],   // открытый словарь, ≤ 4
      confidence: number,   // 0..1
      reasoning: string     // 1-2 предложения RU
    },
    applied: boolean
  }
  ```
- **AI:** Lovable AI Gateway, structured output через **tool-calling**
  (`submit_segmentation`) — без свободного JSON, без галлюцинаций enum-значений.
- **Apply (опционально):** при `apply: true` функция через service-role
  - читает текущие `active_clusters` / `triggers_active`,
  - merge'ит без перетирания (Set-объединение),
  - пишет `lifecycle_stage`, `detected_persona`, `detected_persona_confidence`,
    `active_clusters`, `triggers_active` в `profiles`.
- **Ошибки:** маппит 429 (rate limit) и 402 (credits exhausted) от Lovable AI
  в соответствующие HTTP-статусы — фронт может показывать понятный toast.
- **Защитный слой:** валидирует enum-значения `lifecycle_stage` / `persona` /
  `cluster` после ответа модели, normaliz'ит `confidence` в [0,1].

### 2.2 React hook — `src/hooks/useDetectPersona.ts`

- `useDetectPersona()` — `useMutation` обёртка над Edge Function.
- Возвращает proposal (всегда), при `apply:true` — инвалидация
  `['canonical-profile', userId]`.
- Helper `isHighConfidence(proposal)` — порог `0.75` для UX-решения
  «авто-применить vs показать кнопку».

### 2.3 Канонический контракт (документация)

- AI **никогда не применяет автоматически** без явного `apply:true` на стороне
  вызывающего. Решение — UX-слой.
- Auto-apply разрешён только при `confidence ≥ 0.75` **и** действии пользователя
  над собой. Админ всегда видит preview.
- AI не может назначать роли (`primary_role` остаётся через `app_role` мэппинг
  M2). AI работает только с lifecycle / persona / clusters / triggers.

---

## 3. Зависимости и предусловия

| Источник | Что нужно | Статус |
|---|---|---|
| M2 schema | `lifecycle_stage`, `detected_persona`, `detected_persona_confidence`, `active_clusters`, `triggers_active` columns на `profiles` | ✅ Применено |
| M3 types  | `CanonicalRole`, `LifecycleStage`, `PersonaCode`, `ClusterId` | ✅ Готово |
| Lovable AI | `LOVABLE_API_KEY` в edge-окружении | ✅ Auto-provisioned |
| `has_role` RPC | Для admin-impersonation проверки | ✅ Уже существует в проекте |

---

## 4. Без изменений / out-of-scope для M4

- Нет UI-страницы для preview/apply — это задача M5 (UX-обвязка).
- Нет фоновых cron'ов для авто-перерасчёта lifecycle (планируется M6).
- Нет хранения истории детекций (`persona_detection_log` таблица) —
  если потребуется аудит-трейл, добавим в M5/M6.
- Нет batch-API («детектируй всех нерешённых пользователей») — добавим
  при необходимости в M6.

---

## 5. Verification

- TypeScript build: чистый.
- Lovable AI: используется default `google/gemini-3-flash-preview`, structured
  tool-calling — формат гарантирован схемой.
- RBAC: непривилегированный пользователь не сможет вызвать детекцию для
  чужого `user_id` (403).
- Аддитивность: `apply:true` мержит массивы, не перетирает существующие
  кластеры/триггеры — соответствует M3 контракту `appendCanonicalArray`.

---

## 6. Rollback

Удаление функции:
```bash
supabase functions delete canonical-persona-detect
rm src/hooks/useDetectPersona.ts
```

Никаких изменений схемы M4 не вносил — `profiles` остаётся в состоянии M2.

---

## 7. Что дальше — M5 (proposed)

- UI-компонент `<PersonaDetectionPreview />` для админа и self-service.
- Авто-вызов детекции при ключевых событиях (`booking.confirmed`,
  `intake.submitted`, `chat.first_meaningful_message`).
- Логирование детекций в `persona_detection_log` для аудита и обучения.
