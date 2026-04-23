# M7 — Tone of Voice в продукте

**Status:** ✅ Tracks A–C closed (v1.14.0)
**Date:** 2026-04-23
**Owner:** Pavel + AI engineer
**Source:** `04-implementation-protocol.md §M7` · `03-tone-of-voice.md §14` (forbidden words)

> **TL;DR.** Канон §14 запрещает три слова — «лучший», «уникальный», «революционный» — и набор urgency-паттернов. Sweep по `src/` нашёл 17 файлов с нарушениями (в основном маркетинговые CTA и описания). Этот документ:
> 1. Фиксирует базлайн (grep-аудит).
> 2. Внедряет канонический i18n-словарь `src/i18n/uiStrings.ts` для CTA/empty/errors/success.
> 3. Включает ESLint-правило `no-restricted-syntax`, ругающееся на forbidden tone строки.
> 4. Зачищает 17 найденных нарушений по приоритетным экранам.
> 5. Backlog для остальных категорий — отдельные PR'ы.

---

## 1 · AUDIT — базлайн

### 1.1 Запретные слова §14

| Категория | Регэксп | Файлов | Найдено |
|---|---|---|---|
| «лучший/best» | `лучш(ий\|ая\|ие\|ее)` + `\bbest\b` (RU/EN) | 14 | 17 строк |
| «уникальный/unique» | `уникальн(ый\|ая\|ое\|ые)` + `\bunique\b` | 1 | 1 (комментарий, OK) |
| «революционный/revolutionary» | `революцион` + `revolutionary` | 0 | 0 |
| Urgency: «срочно/только сегодня/не упустите/hurry/don't miss» | regex | 0 | 0 |
| «Упс/Oops» | `Упс\b` + `Oops\b` | 0 | 0 |
| Эмодзи ⭐⭐⭐ (3+) | `⭐⭐⭐` | 1 | 1 (`medicalTaxonomy.ts` — внутренний tier label, оставляем) |

### 1.2 17 файлов с нарушениями

| # | Файл | Контекст | Действие |
|---|---|---|---|
| 1 | `src/components/home/LifecycleSmartTip.tsx` | 2× «лучшие залы», «лучшие салоны» | заменить на «проверенные» |
| 2 | `src/components/leads/VerticalCTA.tsx` | «подберём лучшие варианты» | «подберём подходящие варианты» |
| 3 | `src/components/market/MarketComingSoonOverlay.tsx` | «лучший выбор товаров» | «отобранные товары» |
| 4 | `src/components/reviews/PostOrderReviewPrompt.tsx` | «выбрать лучший сервис» | «выбрать сервис» |
| 5 | `src/components/trip-planner/TripPositioningHero.tsx` | «лучшие маршруты» | «оптимальные маршруты» |
| 6 | `src/components/vertical/VerticalInsightPanel.tsx` | «best season» / «лучший сезон» (FAQ-вопрос) | «оптимальный сезон» / «best time» |
| 7 | `src/content/landings/personaLandings.ts` | комментарий + одно вхождение в FAQ-вопросе | контент: переформулировать |
| 8 | `src/hooks/useConsultationRequests.ts` | toast «подберём лучшие варианты» | «подберём подходящие варианты» |
| 9 | `src/lib/config/phuketAreas.ts` | 3× «лучшая гастрономическая сцена», «лучшие пляжи» | «развитая гастро-сцена», «известные пляжи» |
| 10 | `src/lib/nav/clusterCatalog.ts` | «лучшее на Пхукете» (cluster I value) | «избранное на Пхукете» |
| 11 | `src/lib/segmentation/prioritizeHomeSections.ts` | комментарий «уникальный приоритет» | оставить (комментарий — не UI) |
| 12 | `src/lib/taxonomies/medicalTaxonomy.ts` | `⭐⭐⭐` icon | оставить (системная метка tier) |
| 13 | `src/pages/Support.tsx` | 2× «только лучшее», «лучшие варианты» | «проверенное», «подходящие варианты» |
| 14 | `src/pages/arrive/ExchangeBotPage.tsx` | «SuperRich и K79 — лучшие курсы» / «best rates» | «выгодные курсы» / «competitive rates» |
| 15 | `src/pages/arrive/SIMStartPage.tsx` | meta «лучшие цены» / «best prices» | «выгодные цены» / «competitive prices» |
| 16 | `src/pages/guest/WelcomeFlow.tsx` | «лучшие сервисы» | «проверенные сервисы» |
| 17 | `src/pages/property/PropertyConsultation.tsx` | 2× «подберём лучшие варианты» | «подберём подходящие варианты» |

**Категоризация:**
- ❌ Нарушает (требует фикса): 15 строк
- ⚠️ Edge (комментарий/системная метка, не UI): 3 строки — оставлены с пометкой

### 1.3 Что покрывается этим спринтом vs остаётся в backlog

| Категория §M7.AUDIT | Этот спринт | Backlog |
|---|---|---|
| CTA-кнопки (forbidden words) | ✅ зачищено | — |
| Empty states | dictionary заведён, миграция точечно | широкий sweep — отдельный PR |
| Toast/notifications | dictionary заведён, ключевые места заменены | — |
| Error messages | dictionary заведён, схема готова | sweep `throw new Error` — отдельный PR |
| Email templates | — | M7b: edge functions (`send-order-email`, `notify-*`) |
| WhatsApp/Telegram templates | — | M7b: vendor-acquisition outreach |
| Alt text | — | M7c: accessibility sweep |

---

## 2 · PLAN

### Track A · Lint guard (защита от регресса)
- A.1 ESLint правило `no-restricted-syntax` в `eslint.config.js` блокирует литералы с forbidden словами в `src/**/*.{ts,tsx}`. Уровень `warn` (CI следит, но не падает на legacy) — подняли позже отдельным PR.

### Track B · Dictionary (фундамент для миграции)
- B.1 `src/i18n/uiStrings.ts` — типизированный словарь {ru, en} для:
  - `cta` (primary, submit, details, contact, learnMore, retry, cancel, save, close)
  - `empty` (noProperties, noTransactions, noResults, noNotifications)
  - `errors` (network, generic, validation, unauthorized, notFound, paymentFailed)
  - `success` (paymentSent, profileSaved, requestSent, copied)
- B.2 Совместим с существующим `src/i18n/{ru,en,th}.ts` (не пересекается).
- B.3 Канонические формулировки строго по §13 tone-of-voice.

### Track C · Cleanup нарушений
- C.1 Применить замены к 15 строкам (см. §1.2).
- C.2 `npx tsc --noEmit` clean.
- C.3 Пере-grep — 0 нарушений в production коде.

### Backlog (M7b/M7c)
- Email/WhatsApp templates — sweep по `supabase/functions/notify-*` и `supabase/functions/send-*`.
- Empty states sweep — компоненты `EmptyState.tsx`, `NoData.tsx`.
- Error sweep — все `throw new Error("...")` → каноническая формула.
- Alt text sweep — `<img alt>` / `<Image alt>`.
- Storybook story «Tone of Voice · Examples» — отложено (Storybook в проекте нет).

---

## 3 · ACCEPTANCE

- [x] Аудит-документ создан с категоризацией
- [x] `src/i18n/uiStrings.ts` подключён, типизирован, экспортирует `uiStrings.ru` и `uiStrings.en`
- [x] ESLint rule `no-restricted-syntax` активен на forbidden tone words (warn)
- [x] 15 production-нарушений зачищены, 0 в re-grep
- [x] `npx tsc --noEmit` clean
- [x] Backlog (email/WhatsApp/empty/error sweep) задокументирован в §2

---

## 4 · ROLLBACK

- ESLint rule → удалить блок из `eslint.config.js`.
- Словарь → удалить `src/i18n/uiStrings.ts` (никто пока не импортирует напрямую — внедрение постепенное).
- Текстовые правки → revert по коммиту.

---

## 5 · Anti-scope

- Не переписывать всё подряд — только §14 forbidden words.
- Не трогать legal-документы (`/terms`, `/privacy`).
- Не менять регистр HNW-сегмента (Ignatev Capital) — отдельный backlog.
- Storybook не подключаем (его нет; альтернатива — `tone-of-voice.md` §13 как референс).

---

*Audit · v1.0 · 2026-04-23*
