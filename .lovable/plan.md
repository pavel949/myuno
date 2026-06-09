## Что меняем

### 1. Стартовая страница (WelcomeLanding) — добавить self-identification для всех 3 сегментов

Сейчас: один primary CTA («Sign up») + один вторичный «Я инвестор → /discover?cluster=invest». Все остальные сегменты остаются без точки входа.

Заменяем секцию CTA на **3 segment-pickerа**, соответствующих каноническим сегментам бизнеса (Master Taxonomy v1.0):

```text
┌────────────────────────────────────────┐
│ I'm coming to live          → Relocator │  → /discover?cluster=arrive
│ I'm buying a second home    → 2nd-home  │  → /discover?cluster=live
│ I'm investing in property   → Investor  │  → /discover?cluster=invest
└────────────────────────────────────────┘
+ маленькая ссылка «Just exploring» → /discover
+ persistent primary «Sign up» сверху
```

- RU/EN копирайт + микро-описание под каждым (1 строка)
- При клике: сохраняем `localStorage.intent_segment` + ведём в нужный кластер
- `data-testid=welcome-cta-{relocator|secondhome|investor|explore}` для трекинга

### 2. Онбординг — приводим к best practices

Сейчас есть `StartOnboarding.tsx` (432 строки) и `StartOnboardingV2.tsx` (265 строк) — два варианта без явного active-флага. Аудит и приведение к стандарту:

- **Установить SSOT**: V2 как канон, legacy скрыть за feature_flag (один файл — один путь)
- **3 шага вместо 5+** (best practice: ≤3 для conversion):
  1. Сегмент (с pre-fill из landing intent)
  2. Цель/таймлайн (1–2 поля, не больше)
  3. Контакт (email **или** WhatsApp, не оба обязательно)
- **Progress bar** + **back-кнопка** на каждом шаге
- **Inline-валидация** + чёткие error states (вместо silent fail)
- **Skip-link** на каждом шаге («сделаю позже»)
- **Локализация** RU/EN всех строк (сейчас часть hardcoded)
- **Single submit**: при успехе один тост + редирект, без двойных запросов

### 3. Бэкенд-аудит лида онбординга

Проверка, что данные реально сохраняются и приходят админу:

- Куда сейчас пишутся лиды онбординга (`consultation_requests`? `crm_contacts`? `lead_magnet_submissions`?) — найти точку записи
- Проверить RLS: anonymous insert разрешён?
- Проверить триггер/edge function для уведомлений (Telegram + email через Resend)
- Запустить тестовый лид и подтвердить:
  - Запись появилась в БД
  - Админ получил уведомление (Telegram + email)
  - `lead_attributions` заполнен (источник, UTM, intent_segment)
- При обнаружении разрывов — починить (RLS / триггер / edge function)

### 4. Найденные баги — фиксим по пути

- Если onboarding пишет в несколько таблиц — консолидировать в одну (CRM)
- Если уведомления админу не уходят — починить webhook/edge function
- Если intent_segment с landing теряется — пробросить через URL/session

## Что НЕ трогаем в этой итерации

- Главную (`IndexSimplified`) — она уже корректно роутится по персоне (default = tourist → travel). Investor-only бага там нет, проблема была только на WelcomeLanding.
- Auth/RBAC — отдельная зона.
- Существующие top-level routes — grandfathered.

## Технические детали

**Файлы под правку:**
- `src/pages/WelcomeLanding.tsx` — секция CTA + i18n ключи
- `src/i18n/locales/{ru,en}.json` — новые ключи `welcome.hero.cta.*`
- `src/pages/StartOnboarding{,V2}.tsx` — выбрать SSOT, упростить флоу
- `src/components/onboarding/*` — Progress / SegmentPicker / SkipLink
- `supabase/functions/notify-new-lead` (если нет — создать) — Telegram + Resend
- Возможные миграции RLS на таблице лидов (если insert закрыт для anon)

**Проверка:**
- E2E руками через preview: landing → segment → onboarding → submit → проверка БД через `supabase--read_query` + проверка лога edge-функции
- Скриншот на mobile 384px каждого шага

## Объём

~3–4 часа работы, разбито на 3 коммита: (a) landing CTAs, (b) onboarding rewrite, (c) backend flow + notification.

**Рекомендую:** идём по плану в указанном порядке — landing сразу даёт визуальный win, онбординг чинит conversion, бэкенд-аудит гарантирует, что лиды доходят. Без шага (c) первые два бесполезны, потому что лиды могут теряться молча.
