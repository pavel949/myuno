
# План: превратить платформу в машину входящих по недвижимости

Цель — не «продавать в лоб», а формировать доверие и желание работать с нами. Два рычага: (1) сеть **магнитов** по платформе, которые забирают контакт в обмен на ценность; (2) **intake-конвейеры** для объектов — Newbuilds как SSOT рынка и Resale как курируемая витрина «интересного».

---

## Часть 1. Магниты — сеть точек захвата

Принцип: каждый магнит = бесплатная ценность (PDF/доступ/расчёт) → мягкий запрос email/WhatsApp → тёплый лид в CRM с тегом источника + персоной.

### 1.1 ClearView Reports (главный магнит для newbuilds)
- Полные AAA-CCC отчёты по всем off-plan проектам — публичный teaser (рейтинг + 2-3 параметра), полная версия по email-gate.
- На карточке проекта: кнопка **«Получить полный ClearView отчёт PDF»** → форма (email + WhatsApp + персона) → авто-отправка PDF + создание лида с тегом `magnet:clearview-report:{slug}`.
- Уже есть `ClearViewReport.tsx`, `ClearViewLanding.tsx` — нужно: gating + PDF generator + CRM hook.

### 1.2 Калькуляторы и инструменты (мягкий захват)
- `NewbuildsCalculator.tsx` уже есть — добавить «Сохранить расчёт по email» + «Сравнить с похожими» (gate).
- Новые: **ROI-калькулятор аренды** (по конкретному проекту), **Cost-of-ownership** (налоги + комм + управление), **Mortgage/Rassrochka сравнение** по застройщикам.
- Каждый расчёт сохраняется → PDF в почту → лид с расчётом видим в CRM.

### 1.3 Гайды и due-diligence материалы
- «Гайд покупателя off-plan на Пхукете 2026» (PDF, 30 стр) — gated.
- «Чёрный список застройщиков и красные флаги» — gated, обновляемый.
- Area Guides (`NewbuildsAreaGuides`, `NewbuildsAreaDetail`) — добавить gated блок «Полный отчёт по району: цены, доходность, инфраструктура».
- Due Diligence чек-лист (`NewbuildsDueDiligence`) — расширить до интерактивного чек-листа с сохранением прогресса (требует email).

### 1.4 Персональные подборки (Saved Search → Lead)
- `SavedSearches.tsx` уже есть. Усилить: при сохранении поиска — **email-дайджест** новых матчей раз в неделю + WhatsApp-нотификации о горячих лотах.
- Это превращает «посмотрел и ушёл» в долгий nurture.

### 1.5 «Skin in the game» магниты
- **Off-plan Watchlist**: пользователь добавляет 3+ проекта → получает уведомления о повышении цен / распроданности фаз / новых акциях застройщика.
- **Pre-launch alerts**: «Узнавайте о запусках за 2 недели до публики» — gated подписка.
- **Виртуальные туры по записи**: запрос на тур = лид с высокой готовностью.

### 1.6 Resale-магниты
- **«Интересные предложения недели»** (3-5 объектов с дисконтом/exclusive mandate) — email-рассылка, gated архив.
- **Assignment Market Tracker** (`ResaleAssignmentLanding` уже есть) — алерты по новым переуступкам.
- **Off-market доступ**: «10+ объектов вне публичной выдачи» — только по запросу через форму.

### 1.7 Контентные магниты
- Market Reports квартальные (PDF) — gated.
- ClearView Methodology White Paper — gated.
- Webinars / Q&A с ClearView командой — регистрация через email.

### 1.8 Точки размещения магнитов (где «расставлены»)
- Карточка каждого off-plan проекта (sticky CTA внизу + блок ClearView).
- Карточка каждого resale-объекта («запросить полный пакет документов»).
- Index/Hub страницы недвижимости — баннер «Гайд покупателя 2026».
- Area pages — «Полный отчёт по району».
- После закрытия модалки/выхода — exit-intent с самым релевантным магнитом по контексту страницы.
- Home (`/`) — один первичный магнит для холодного трафика.
- Footer — постоянный «Newsletter + ClearView digest».

Все магниты пишут в единую таблицу `leads` с полями: `magnet_id`, `magnet_context` (slug проекта/района), `persona`, `utm_*`, `score` (по типу магнита).

---

## Часть 2. Intake — удобное внесение объектов

### 2.1 Newbuilds → SSOT рынка

Цель: каждый off-plan проект Пхукета у нас, с актуальными ценами/availability/документами. Тогда мы — естественная точка входа для покупателя и для застройщика.

**Каналы наполнения:**
1. **Developer Portal** (уже есть `/developer-portal/*`): улучшить онбординг — мастер из 5 шагов (компания → проект → юниты → медиа → ClearView заявка). Добавить bulk-загрузку CSV/Excel юнитов и галерей.
2. **Авто-парсер** (Firecrawl pipeline уже в memory): расписание раз в неделю проходит по сайтам ТОП-50 застройщиков, апдейтит цены/наличие, помечает изменения. Админ ревьюит дельту.
3. **Claim listing**: по каждому проекту, который мы создали парсером, — кнопка для застройщика «Это наш проект» → flow подтверждения → передача в Developer Portal.
4. **Admin intake**: внутренний редактор с теми же полями, для команды (когда застройщик не на портале).

**Поля проекта** (минимум для SSOT): developer, location (lat/lng + район), status, completion date, unit types + price ranges, availability %, payment plans, freehold/leasehold, ClearView grade, документы (DD pack), медиа, виртуальный тур.

**ClearView-первый принцип**: проект публикуется только с draft-рейтингом (даже если CCC). Это и есть наш моат — больше данных, чем у конкурентов.

**Diff-трекинг**: история цен, изменения availability — публично «прозрачность рынка», внутри — сигналы для лидов (цена выросла → пушим watchlist).

### 2.2 Resale → курируемая витрина

Цель: не помойка Bazaar/Avito, а 100-300 «интересных» объектов с прозрачной историей.

**Каналы:**
1. **Owner Direct intake** — короткая форма (5 минут): адрес, тип, фото, цена, документы. Внутри: модератор за 24ч либо публикует, либо отказывает с причиной. Бесплатно.
2. **Agent/MC intake** — для риэлторов с проверенным мандатом: bulk-форма + загрузка mandate doc. Помечается «Exclusive mandate» = высший приоритет в выдаче.
3. **Assignment intake** — отдельный flow для переуступок (есть `ResaleAssignmentLanding`): проект, юнит, оплачено, остаток, цена переуступки.
4. **Внутренний скаут-режим** — команда добавляет «интересные» off-market лоты через админку с пометкой «по запросу».

**Curation-фильтр** (не публикуем всё подряд):
- Verified документы (chanote/freehold proof или эквивалент).
- Минимум 5 фото (или мы сами снимаем).
- Цена в рынке ±15% от ClearView median по локации (иначе предупреждение).
- Бейджи: «Exclusive», «Verified docs», «Below market», «Assignment», «Furnished».

**Ранжирование выдачи**: exclusive mandates → verified → свежие → остальные.

### 2.3 Единый CMS-шар
- Общий медиа-аплоадер (`UnifiedMediaUploader` уже есть) — WebP, drag-n-drop, до 30 фото.
- Общий location-picker (Google Places + Geocoder fallback — уже стандарт).
- Авто-сохранение draft каждые 10 сек — критично для длинных форм.
- Multi-step с прогресс-баром, можно вернуться позже (по email-ссылке).

---

## Часть 3. Замыкание петли (магнит → лид → сделка)

1. **CRM enrichment**: каждый лид по магниту → автоматически тегируется persona + interest (off-plan/resale/area/budget) на базе магнита и контекста.
2. **Lead scoring**: ClearView download = 30, calculator save = 20, viewing request = 80, watchlist 3+ projects = 50.
3. **Auto-nurture**: 5-step email/WhatsApp последовательность по интересу (off-plan vs resale vs area).
4. **Hand-off в Capital advisory**: при score ≥ 70 — автоалерт Павлу в Telegram + карточка лида в MC Founder Mode CRM.
5. **Аттрибуция**: dashboard «Магнит → Лид → Viewing → Deal» по каждой точке захвата → выключаем неработающие, масштабируем работающие.

---

## Технические детали (для разработки)

**Новые/расширяемые таблицы:**
- `lead_magnets` (id, slug, type, title, asset_url, gated_fields)
- `lead_magnet_submissions` (lead_id, magnet_id, context_slug, payload jsonb, score)
- `newbuild_price_history` (project_id, unit_type, price, availability, captured_at)
- `resale_listings` улучшение: `mandate_type` (exclusive/open), `verification_status`, `curation_badges[]`
- `saved_search_alerts` (frequency, channel)

**Edge Functions:**
- `generate-clearview-pdf` (PDF из шаблона + данные проекта)
- `magnet-submit` (валидация, лид-создание, асинхронный nurture)
- `newbuilds-scraper` (cron weekly, Firecrawl)
- `resale-curation-checker` (auto-flag вне рынка)
- `nurture-sequence-runner` (cron daily)

**Frontend:**
- `<MagnetCTA variant="..." context={...} />` — единый компонент-хук, расставляется по карточкам/индексам.
- `<ExitIntentMagnet />` — глобальный, выбирает релевантный магнит по route.
- `/developer-portal/onboarding` — расширить мастер.
- `/list-property` (новая) — единая точка для owner/agent intake (resale).

**Метрики (admin dashboard):**
- Conversion magnet → lead, lead → viewing, viewing → deal — по каждому магниту.
- Newbuilds coverage: % проектов Пхукета, у которых полный ClearView и актуальная цена < 30 дней.
- Resale curation rate: % одобренных vs отклонённых, медианный time-to-publish.

---

## Этапность (предлагаемая последовательность)

```text
Wave 1 (магниты-минимум, 1-2 недели)
  ├─ MagnetCTA компонент + leads таблица расширение
  ├─ ClearView PDF gate на карточках off-plan
  ├─ Saved Search → email digest (cron)
  └─ Exit-intent с контекстным магнитом

Wave 2 (intake newbuilds, 2-3 недели)
  ├─ Developer Portal онбординг-мастер v2 + bulk CSV
  ├─ Newbuilds scraper (Firecrawl, cron)
  ├─ Claim listing flow
  └─ Price history + публичный diff

Wave 3 (intake resale + курирование, 2 недели)
  ├─ /list-property unified intake
  ├─ Curation queue в admin
  ├─ Mandate verification (agent flow)
  └─ Assignment intake-форма

Wave 4 (nurture + scoring, 1-2 недели)
  ├─ Lead scoring engine
  ├─ Auto-nurture sequences (5-step)
  ├─ Hand-off → Telegram alert + CRM card
  └─ Attribution dashboard
```

---

## Что прошу подтвердить перед стартом

1. **Согласны с принципом «ClearView — главный магнит» для newbuilds?** (Если да — все off-plan карточки получат email-gate на полный PDF.)
2. **Resale = курируем (отказываем плохим), а не «принимаем всех»?** Это ключевое решение по позиционированию.
3. **С какой Wave начинаем?** Рекомендую: **Wave 1 (магниты-минимум)** — даёт измеримый рост лидов за 1-2 недели и валидирует, какие магниты работают, до того как вкладываться в большой intake-конвейер Wave 2/3.
