# myUNO · No-Budget Growth Playbook v1.0

## Операционный плейбук органического роста — первые 90 дней + путь к Y1

> **Назначение.** Этот документ отвечает на один вопрос: **как быстро сделать myUNO популярной без рекламного бюджета.** Он не пересматривает стратегию — стратегический закон зафиксирован в [`/PROJECT.md`](../../../PROJECT.md) §19 и в [`research/phuket-proptech-market.md`](./phuket-proptech-market.md). Здесь — операционка: что делать руками сегодня, по каким каналам, под какую персону, опираясь на механики роста, **которые уже написаны в коде** и которые нужно не строить, а включить.
>
> **Главный принцип.** «Come for the free tool, stay for the platform» (Zillow-wedge, см. `phuket-proptech-market.md` §63). Один CAC = четыре revenue-события по флайвилу **TOURIST → ARENDENT → BUYER → OWNER → REFERRER**. Бюджет на привлечение заменяется бесплатными инструментами высокой ценности + дистрибуцией в комьюнити + органическим SEO + реферальной петлёй.
>
> **Аудитория документа:** Павел, маркетинг-операторы, AI-ассистенты. **Язык:** русский (внутренний канон).

---

## §0 · Почему no-budget здесь работает

Рынок уникален тем, что главная боль клиента — **не «дёшево», а «безопасно и понятно»**: 0% листингов лицензированы, профессия агента не регулируется (135 человек арестованы в 2024), 6+ типов титулов с разной юридической силой, нет публичной базы foreign-quota (`phuket-proptech-market.md` §23, §57, §59). Где высокая тревога и асимметрия информации — там бесплатный инструмент, снимающий тревогу, шерится сам. Это и есть наш канал привлечения вместо платной рекламы.

Второй фактор: **инфраструктура роста уже построена** (см. §1). Маркетинг не должен заказывать разработку — 80% рычагов уже в репозитории, выключены или недозагружены контентом. Активация стоит времени, не денег.

---

## §1 · Карта активов роста (что уже в коде)

> Перед запросом «постройте» — проверь эту таблицу. Колонка «Статус»: **live** = работает; **built** = код есть, нужен контент/включение; **gap** = требует разработки (вне no-budget-фазы, см. §7).

| Левер | Где в коде | Статус |
|---|---|---|
| Рефералы (коды + бонусы 100/50 ₽) — **петля полностью замкнута** | RPC `generate_referral_code` / `apply_referral_code`, триггер на `bookings`, `/ref/:code` → `/auth?ref=`, apply через edge `apply-referral`, дашборд `/profile/referral` (`ReferralCard`/`ReferralList`) | live |
| Шеринг объекта (WhatsApp/Telegram/Email/copy, pre-filled RU/EN) | `src/components/property/PropertyShareSheet.tsx` | live |
| **Referral-aware ShareCTA** (мультиканальный шер с `?ref=` + UTM для любого контента) | `src/components/share/ShareCTA.tsx` (флаг `SHARE_CTA`), вшит в `ReferralCard` | live (added) |
| OG / Twitter-карточки для превью ссылок | `index.html` | live |
| SEO-движок (sitemap-генератор, hreflang ru/en/th) | `public/sitemap*.xml`, `scripts/generate-landings-sitemap.mjs`, `src/components/seo/SEOHead.tsx` | live |
| Schema.org (Organization/Article/RealEstate/Service/Place/FAQ/Review) | `src/lib/seo/schemaBuilders.ts` | live |
| Persona/cluster лендинги (17 шт.) | `src/pages/landings/`, конфиги `src/content/landings/` | built (нужен контент) |
| Lead-магниты (clearview_report, guide_pdf, area_report, prelaunch_alert, viewing_request, resale_weekly, newsletter…) | таблицы `lead_magnets` / `lead_magnet_submissions`, `src/hooks/useLeadMagnets.ts` | live |
| No-code лендинг-билдер → публичный роут `/l/:slug` | `MCCLandingBuilderTab.tsx`, `src/pages/landings/MagnetLandingPage.tsx` | live |
| Marketing Dashboard (воронки, магниты, лендинги) | `src/pages/admin/marketing/MarketingDashboard.tsx` + `MCCFunnelsTab` / `MCCMagnetsTab` / `MCCLandingControlTab` | live |
| WhatsApp/Telegram (UltraMSG) — роутинг лидов, посты | `_shared/whatsapp.ts`, `notify-lead-whatsapp`, `publish-telegram-post`, `magnet-submit` | live |
| Exit-intent захват | `src/components/leads/ExitIntentModal.tsx` | live |
| Feature-flags (постепенный rollout) | `src/lib/featureFlags.ts` | live |
| Аффилиат-программа с трекингом комиссий | — | **gap** |
| Viral-loop (share-to-unlock, геймификация рефералов) | — | **gap** |
| Web-push | — | **gap** |
| Явные acquisition-страницы `/for/*` | частично (persona-конфиги есть) | **gap** |

**Вывод:** все каналы из §3 опираются на статус **live/built**. Ни один шаг 90-дневного спринта не требует gap-фич.

---

## §2 · Barbell-таргетинг: 4 аудитории, 4 разных движка

Не выбираем одну аудиторию — запускаем **штангу (barbell)**: объём на одном конце, выручка на другом, плюс sticky и B2B как стабилизаторы. У каждой — свой бесплатный инструмент-приманка и свой канал. Персоны — по [`01-segmentation-framework.md`](../01-segmentation-framework.md).

| Аудитория | Персоны / JTBD | Free-tool (приманка) | Канал дистрибуции | Главный KPI |
|---|---|---|---|---|
| **Туристы / номады** (объём) | P01·P02·P04 / A·B·I | Arrival-гайд, DTV-visa чекер-квиз, SOS-виджет, ежедневный weather/beach-бот | FB-группы рус-туристов и expat, Telegram-каналы, Reddit r/Phuket, Nomad List | Трафик, wishlist/save |
| **Инвесторы / HNW** (выручка) | P20·P21·P10 / D·E | **ContractAI** («проверь SPA до подписи»), **ClearView** AAA–CCC, **FloodScore / DueDiligence** | Инвест-Telegram, агентские FB-группы, PR в Bangkok Post (ombudsman) | Lead-score 80+ → WhatsApp Павлу |
| **Релокант-семьи** (sticky) | P05·P08 / C | **SchoolFinder** (единственная база школ Пхукета: цены, отзывы, спец-нужды) | Expat-mom FB / Instagram, школьные чаты | Referral-coefficient (peer-to-peer) |
| **Девелоперы / провайдеры** (B2B-контент) | P22·P25 / F | «Первый ClearView бесплатно», бесплатный листинг | Прямой outreach, отношения с Sansiri / Rhom Bho (моат #5) | # листингов и рейтингов → indexed-страниц |

**Логика штанги:** туристы дают объём верха воронки и со временем перетекают в покупателей (флайвил); инвесторы дают почти всю выручку Y1; семьи дают sticky-удержание и самый высокий referral-коэффициент; девелоперы/провайдеры **производят контент и листинги, которые сами генерят SEO-трафик** — то есть работают как канал, а не только как клиент.

**Вирусная механика (общая):** инструмент выдаёт результат, которым хочется поделиться → пользователь жмёт share (паттерн `PropertyShareSheet`) с pre-filled текстом:
- *«Проверил SPA через myUNO ContractAI — нашёл 3 проблемы до подписи: [ссылка]»*
- *«Этот проект в зоне затопления ฿X — показал FloodScore: [рейтинг]»*
- *«ClearView дал проекту рейтинг A — вот почему он безопасен: [сертификат]»*

Каждый шер несёт реферальный код (`referral_codes`), замыкая петлю на CAC≈0.

---

## §3 · No-budget каналы (по приоритету)

### 3.1 · SEO-движок (главный долгосрочный актив)
Матрица контента **персона × JTBD** = ~50 статей в Knowledge Hub. Опора — уже-живые 17 лендингов + `schemaBuilders.ts` (FAQ/Article JSON-LD даёт rich snippets). Целимся в **low-competition high-intent** запросы:
- `transfer from phuket airport`, `phuket SIM tourist`, `DTV visa eligibility` (туристы/номады)
- `phuket international schools fees`, `relocate family phuket` (семьи)
- `off-plan flood risk phuket`, `phuket condo foreign quota`, `check SPA contract thailand` (инвесторы)

Каждая статья заканчивается двумя CTA: **share** + **referral-link**. Sitemap пересобирается `generate-landings-sitemap.mjs` — новые страницы попадают в индекс автоматически. Контент должен следовать тону [`03-tone-of-voice.md`](../03-tone-of-voice.md) и семантике [`10-semantic-core.md`](../10-semantic-core.md): факты, без хайпа («Штраф TM30 = 800–1,600 THB», не «лучший сервис»).

### 3.2 · Community-distribution (быстрый верх воронки)
Правило **«give value first»**: не постим ссылку-спам, а отвечаем на реальные вопросы и прикладываем бесплатный инструмент. Площадки под персоны:
- **Туристы/номады:** FB «Русские на Пхукете», «Phuket Expats», Telegram-каналы аренды/визаранов, Reddit r/phuket, r/digitalnomad, Nomad List.
- **Инвесторы:** закрытые инвест-Telegram, агентские FB-группы (демо free-tier ContractAI/FloodScore).
- **Семьи:** expat-mom FB-группы, школьные родительские чаты, Instagram.

### 3.3 · Viral free-tools (вместо платного привлечения)
Выставить в **free-tier** инструменты с высокой тревогой/FOMO: ContractAI (free upload → топ-5 рисков, детальный отчёт — платный upsell), FloodScore/DueDiligence (драматичная визуализация зоны затопления), DTV-чекер, SchoolFinder, SOS-виджет. Каждый оборачиваем в share-петлю (§2).

### 3.4 · Referral-петля
Включить уже-существующие `referral_codes` + бонусы 100/50 THB в UI: блок «Решил проблему? Поделись ссылкой — другу скидка, тебе бонус» в конце каждого инструмента и статьи. Для закрытых HNW-сделок — отдельный «bring a friend» (share комиссии/скидка на следующую сделку); высокий referral-rate из-за ombudsman-доверия и отсутствия конкурентов.

### 3.5 · WhatsApp / Telegram habit-loop
Ежедневный полезный бот (weather + beach safety + события) через `publish-telegram-post` + UltraMSG → формирует привычку открывать myUNO → мягкий upsell («бронируй водный спорт безопасно у партнёров»). Удержание стоит $0.

### 3.6 · PR / earned media (zero-cost)
Press-angle: **ombudsman-статус Павла + ClearView как market standard**. Релиз в foreign-RE медиа (Bangkok Post уже цитирует ClearView — `PROJECT.md` §105). Цель — превратить ClearView в цитируемый стандарт, на который ссылаются банки и инвесторы при due diligence.

### 3.7 · Partner co-op
«Рекомендуй myUNO — 5% реферал» для агентов, юристов, школ, клиник; «листинг бесплатно» для провайдеров. ⚠️ Полноценный трекинг комиссий — **gap** (§7); на старте ведём вручную через `referral_codes` + CRM.

---

## §4 · 90-дневный спринт (beachhead)

Чек-лист по фазам. Каждый пункт привязан к KPI, который виден в Marketing Dashboard (`MCCFunnelsTab`).

### День 1–30 · Включить движок
- [ ] Выставить free-tier для ContractAI, FloodScore/DueDiligence, DTV-чекера, SchoolFinder, SOS (через `featureFlags.ts`).
- [ ] Написать первые **15–20 SEO-статей** (персона × JTBD, §3.1), прогнать через sitemap-генератор.
- [ ] Включить referral-блок (§3.4) и share-CTA с pre-filled текстами на всех free-tools.
- [ ] Засеять **5–8 community-площадок** (§3.2) в режиме «give value first».
- **KPI:** трафик, magnet-submissions, первые referral-коды активированы.

### День 31–60 · Построить доверие инвестора
- [ ] **ClearView go-live:** опубликовать 5 рейтингов (микс AAA→CCC) — даёт цитируемый контент и SEO-страницы.
- [ ] PR-релиз (§3.6) в foreign-RE медиа.
- [ ] ContractAI free-tier в агентских FB-группах + инвест-Telegram.
- [ ] Запустить ежедневный WhatsApp/Telegram-бот (§3.5).
- **KPI:** indexed-страницы ClearView, share-rate инвест-инструментов, рост lead-score.

### День 61–90 · Монетизация и петля
- [ ] Lead-scoring → при score 80+ авто-WhatsApp Павлу (`notify-lead-whatsapp`) → персональный outreach HNW.
- [ ] Первые brokered-сделки из существующих контактов + отношений с девелоперами (моат #5).
- [ ] Замкнуть «bring a friend» на закрытых сделках.
- [ ] Довести контент до **50 статей**; первые 2–3 девелопера/провайдера с бесплатным листингом/ClearView.
- **KPI:** первые сделки, referral-coefficient > 1 на хотя бы одной аудитории, CAC≈0 подтверждён по органическим лидам.

---

## §5 · Путь к Y1 (связка с PROJECT.md §19)

90-дневный beachhead перетекает в годовую воронку: **investor-trust → ClearView как market standard → PM-масштабирование → referral-closure**. Цифры — из `PROJECT.md` §19 (не выдумываем новые):

| Поток | Модель | Y1 вклад |
|---|---|---|
| Real estate сделки (ряды 1–10) | 5–10% комиссия девелопера / 3% resale; 20–25 сделок, avg ticket $22K | **$550–650K** |
| Estate PM | 20% от валовой ренты; цель 60+ объектов | **$120–180K** |
| ClearView direct | 8–12 assessments (฿350–600K каждый) + ~380 investor reports + monitoring | **$143–213K** |
| **Итого Y1 net revenue** | ~70% real estate/Invest · ~30% сервисы | **$800K–1M** |

Условие Seed-раунда (месяц 10–12, цель $1.5–3M): живые метрики + 5+ paid ClearView assessments. То есть 90-дневный спринт напрямую готовит инвест-раунд: органический трафик и free-tools наполняют верх воронки, ClearView-сделки дают proof-of-revenue.

---

## §6 · Метрики и петля обучения

Мерим в уже-существующем Marketing Dashboard (`MCCFunnelsTab`) сквозную воронку:

**traffic → magnet-submission → lead-score → deal**

Ключевые показатели:
- **Conversion calculator-based** (бенчмарк `phuket-proptech-market.md` §83: 12–25% vs 1–8% у обычных форм) — валидируем, что free-tools реально конвертят.
- **Viral-coefficient** (шеров на пользователя × конверсия шера) — цель > 1 хотя бы у семей/инвесторов.
- **CAC ≈ 0** по органическим лидам — главный тезис плейбука; если канал требует денег, он выпадает.
- **Free-to-paid** (бенчмарк 3–5%, в SE Asia ниже) — для платных отчётов ContractAI/DueDiligence.

Петля: еженедельно смотрим, какой free-tool и какая площадка дали лучший viral-coefficient → туда удваиваем контент, остальное режем (Kill/Fold/Defer, `PROJECT.md` §15).

---

## §7 · Build-later (явные пробелы)

Вне no-budget-фазы — требует разработки, не блокирует §4:

1. **Аффилиат-программа с трекингом комиссий** — для масштабирования partner co-op (§3.7) за пределы ручного учёта.
2. **Viral-loop механики** — share-to-unlock, геймификация рефералов поверх существующих `referral_codes`.
3. **Web-push** — второй канал удержания помимо WhatsApp/Telegram.
4. **Явные `/for/*` acquisition-страницы** — persona-конфиги есть, нужны выделенные посадочные под платный/органический трафик (пересекается с M6 persona-landings, см. `README.md` audits).

> При переходе любого пункта в работу — гейтить за `feature_flag:*` (ARCHITECTURE_V2 §13 rule 7) и обновить этот документ.

---

*v1.0 — 2026-06-22. Опирается на `PROJECT.md` §19, `research/phuket-proptech-market.md`, `01-segmentation-framework.md`. При расхождении цифр — истина в `PROJECT.md`.*
