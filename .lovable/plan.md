
# Trust Stack × myUNO — Аудит §3–7 + P0-план

Источник данных: четыре параллельных read-only прохода по `src/`, `supabase/functions/`, `vercel.json`, `index.html`, `sitemap*.xml`, ClearView, Newbuilds, Order-First, messenger pipeline.

---

## A. Архитектурные принципы §1 (фильтр-блокер)

| # | Принцип | Вердикт | Killer |
|---|---|---|---|
| A1 | Один домен, директории | **PARTIAL** | `vercel.json:45–67` держит `crm.bymyuno.com` как host-match; параллельно живут `bymyuno.com` и `myuno.app` (capacitor + canonical). Раздвоение бренда |
| A2 | Page = query (SSR/prerender) | **FAIL** | 447/529 страниц (~84.5%) **без** `SEOHead`/Helmet. Vite SPA без SSR/prerender. `Index.tsx`, `PricingPage`, `HowItWorks`, `Search` — без head. Googlebot для не-управляемых маршрутов получает один статический title из `index.html` |
| A3 | RU+EN + hreflang | **PARTIAL** | hreflang отдаётся через `?lang=en` query param — на SPA без prerender оба URL возвращают тот же HTML. `hrefLang="th"` фиктивный (нет тайского контента) |
| A4 | Pay before result | **PARTIAL** | Order-First соблюдён в e-commerce; **нарушения**: `VisaQuizPage.tsx:217` показывает полный результат бесплатно, `InvestorQuiz.tsx:156` редиректит без оплаты |
| A5 | Messenger AI router | **FAIL** | Telegram incoming webhook **не существует**. `whatsapp-incoming-webhook` создаёт лид, но НЕ вызывает `concierge-intent`/`concierge-route` (роутеры готовы, но не подключены к мессенджерам) |
| A6 | Schema + sitemap + GBP | **PARTIAL** | Нет `LocalBusiness` JSON-LD нигде. `sitemap.xml` смешивает `www.myuno.app` + `supabase.co` cross-domain. `Organization` schema без `address`/`telephone` |

**Вывод:** A2 и A5 — критические блокеры. Без SSR/prerender любой новый GUARD-лендинг — мёртвый для Google в день один. Без messenger-роутера у P0-продуктов нет дешёвого канала привлечения.

---

## B. §3 — карта болей: что есть, чего нет

### Cluster A — GUARD

| ID | Status | Что есть | Что строить |
|---|---|---|---|
| A-1 Build monitoring ฿990/mo | **build** | `nb-process-alerts` cron (только email favorites) | Подписка на проект, milestone-фото с geo, Stripe sub |
| A-2 Contract risk report ฿4,900 | **build** | `useClearViewPurchase` → `create-clearview-checkout` (**функция не существует**), цена в коде `290000` (฿2,900 ≠ ฿4,900). `generate-due-diligence` только admin | Edge-fn, upload контракта PDF/DOCX, AI risk parser RU/EN, paywall перед загрузкой |
| A-3 Deposit Vault + Dispute Pack ฿1,490 | **build** | 0 (только `create-property-deposit-checkout` про залог покупки) | Vault: timestamp+geo фото; Dispute Pack: OCPB-letter generator + Stripe |
| A-4 Scam check ฿990 | **build** | 0 (только тикет `fraud`) | Listing/owner check flow |
| A-5 FET/quota wizard | **build** | Упоминания в персонах. `dueDiligenceChecklist.ts` содержит куски. **Файл `/services/finance/fet` прописан в 3 местах, но НЕ существует — 404** | Free check + ฿1,500 full report |
| A-6 Developer certification ฿25–60K/mo | **refine** | `/clearview/for-developers` landing, `ClearViewBadge`/`Gauge`, `generate-due-diligence` (admin) | Self-serve Stripe subscription per-project + badge endpoint |
| Project Cards `/p/:slug` | **refine** | `ProjectMicrosite.tsx` живёт, Helmet есть | SSR/prerender, `RealEstateListing` JSON-LD, CTA «проверить контракт ฿4,900», fill 100 проектов |

### Cluster B — OPERATE

| B-1 PM ฿2,900/5,900/9,900 | **partial** | `OwnerAutoMessaging` + `execute-booking-message-rules` cron, `ai-translate`. Нет cleaning dispatch | Пакеты + AI-генерация ответов + триггер уборки |
| B-2 STR license audit + alerts | **build** | 0 | Полностью с нуля |
| B-3 Multilang AI handover concierge | **build** | `VipConcierge` ≠ handover; `concierge-intent` маршрутизация гостей | B2B concierge для застройщика |
| B-4 JP automation | **partial** | `JuristicRequestsPage` — ручной CRUD | Автоматизация + per-unit billing |

### Cluster C — WATCH

| C-1 Manager benchmark ฿2,900 | **build** | `OwnerRevenueDashboard` свои данные, без market overlay | Upload + benchmark |
| C-2 Sinking-fund red-flag ฿2,900 | **build** | 0 | Полностью |
| C-3 Vital-signs ฿590/mo | **partial** | `InspectionRequest`, `MaintenancePlan.healthScore` | Live meters/anomaly |
| C-4 White-label PM dashboard ฿150–250/unit | **partial** | `OwnerTransparencyDashboard` (полный, без gate) | White-label + paywall |

### Cluster D — KNOW (архитектурное нарушение)

`ClearView` живёт как самостоятельный продукт `/clearview/*`, а не как платный раздел GUARD. Standalone «market analytics» НЕ найден — правильно. **GUARD-shell/бренда в коде нет вообще** (`rg "GUARD"` → 0 hits).

---

## C. §4–6 — Находимость / Удобство / Монетизация

**§4 Внешняя:** 0/9 контрольных запросов (RU/EN: депозит, off-plan delay, FET, quota, contract) имеют dedicated landing с собственным `<title>/<meta>/<h1>`. Все живут как FAQ-куски внутри `clusterLandings`.

**§4 Внутренняя:** Trust-боли достижимы с `/index` за **3–4 клика** (через AppDrawer → Legal → подкатегория). Требование ≤2 не выполнено.

**§4 Magnet tools:** есть только `/visa/quiz`. Нет `/tools/deposit-risk`, `/tools/fet-calc`, `/tools/quota-checker`.

**§5 Usable:** Legal booking — 4-step, без progress bar, ≤3 мин при auth. RU+EN везде, ZH только в персона-лендингах, **нет ZH в GUARD reports**. **Нет PDF-артефакта** ни на одном Trust-флоу success-экране. Subscription cancel: MC/Vendor PASS (Stripe Customer Portal), Owner Pro FAIL.

**§5 Cross-sell:** есть в Events/Beauty/Delivery, **отсутствует в Legal/Property success-экранах**. Паттерн one-shot→subscription не реализован.

**§6 Pay:** Stripe ✅. **PromptPay через Stripe API НЕ интегрирован** — только manual offline form. USDT упомянут в landing, не реализован. **Thai tax invoice + 7% VAT + 3% WHT — отсутствуют** (juristic поля в БД есть, генератора инвойса нет). Revenue lines: модель R1–R5 описана в коде, admin-дашборд показывает только 2 линии.

---

## D. Заполненная таблица §7 (свёрнутая)

```
ID                Closed  Findable           Usable     Monetized        Verdict
A-1               no      Google: no         —          no               build
A-2               no      no SSR             —          BROKEN fn        build (P0)
A-3               no      no                 —          no               build (P0)
A-4               no      no                 —          no               build
A-5               no      404 на /fet        —          no               build
A-6               partial SPA no SSR         lead-form  no self-serve    refine
Project Cards     partial canonical=client   ok         no CTA           refine (P1)
B-1               partial /owner             ok         flat $25/slot    refine
B-2               no      no                 —          no               build
B-3               no      no                 —          no               build
B-4               partial /owner/:id/juristic CRUD      no               refine
C-1               no      /owner/reports     own data   no               build
C-2               no      no                 —          no               build
C-3               partial /owner             form       no               refine
C-4               partial /owner             ok         no gate          refine
D-1               arch violation: ClearView standalone, не внутри GUARD
A1–A6 архитект.   A1 part / A2 FAIL / A3 part / A4 part / A5 FAIL / A6 part
```

---

## E. Три обязательных списка

**Удалить / заморозить:**
- `hrefLang="th"` в `SEOHead.tsx:92` (нет тайского контента → SEO penalty)
- `src/supabase/functions/_archive/ai-orchestrator/` — мёртвый код, либо вернуть в строй для A5, либо удалить
- Cross-domain entries в `sitemap.xml:11–30` (ссылки на `kakkwibljrjsawxgnupk.supabase.co`) — заменить на Vercel rewrite

**Критический тех. долг:**
1. **SSR/prerender** (vite-plugin-prerender или `@prerenderer/plugin-vite`) — без него A2/A3/A6 не работают
2. `crm.bymyuno.com` subdomain → редирект на `myuno.app/crm/`; выбрать ОДИН canonical (`www.myuno.app` vs `myuno.app`)
3. **Сломанный `create-clearview-checkout`** (вызывается из `useClearViewPurchase.ts:46`, edge-fn не существует) — весь ClearView purchase flow сломан
4. **404 на `/services/finance/fet`** — href в 3 местах кода, файла нет
5. Цена ClearView в коде `290000` ≠ spec `฿4,900` — рассинхрон бизнес/код
6. Cleaning auto-dispatch в `execute-booking-message-rules` отсутствует
7. `OwnerTransparencyDashboard` без paywall — белый-лейбл-продукт раздаётся бесплатно

**Quick wins ≤1 недели:**
- Починить `create-clearview-checkout` edge-fn (или переименовать вызов на существующую) + выровнять цену
- Создать заглушку `src/pages/services/finance/FET.tsx` с Helmet + free-чекером → убрать 404
- Добавить `SEOHead` на `Index.tsx`, `HowItWorks`, `PricingPage`, `Search` (4 файла, 30 минут)
- Убрать `hrefLang="th"` (1 строка)
- Подключить `CrossSellRecommendations` к `BookingConfirmation` в `LegalBooking` (повторить паттерн EventSuccess)
- В `whatsapp-incoming-webhook` после создания лида вызвать `concierge-intent` и добавить deep-link в ответ
- Добавить `LocalBusiness` JSON-LD в `SEOHead.createOrganizationSchema`

---

## F. Предлагаемый P0-спринт (2 недели, по правилу §8)

Цель §8: **40 платных отчётов ИЛИ 60 dispute-паков за 30 дней**. Под это — три рельсы.

### Рельс 1 — Архитектурный фундамент (без него P0 не индексируется)

1. Внедрить `vite-plugin-prerender` для маршрутов `/p/:slug`, `/clearview/*`, `/legal/*`, `/tools/*`, `/services/finance/fet` (статический список из ~150 URL)
2. Унифицировать canonical на `myuno.app` (без www), убрать cross-domain sitemap entries
3. Quick wins из списка E (≤1 день суммарно)

### Рельс 2 — A-2 Contract Risk Report (главный платный продукт)

4. Создать edge-fn `create-clearview-checkout` (если отсутствует) ИЛИ переключить `useClearViewPurchase` на `create-checkout` с правильным `price_id`. Поднять цену до `฿4,900` в `methodology.ts`
5. Новый flow: `/legal/contract-check` (mobile-first, RU+EN):
   - Free шаг: тип документа + автодиагностика 5 риск-флагов из имени/размера/preview
   - Paywall → Stripe → upload PDF/DOCX в storage
   - Edge-fn `analyze-contract` (Lovable AI Gemini): по 9 доменам ClearView, output JSON → render risk-by-risk RU/EN
   - PDF-экспорт через существующий `pdfFonts.ts`
   - Success → CrossSell на A-1 monitoring subscription

### Рельс 3 — A-3 Deposit Vault + Dispute Pack

6. Таблицы `deposit_vaults` (free, RLS owner-only) + `dispute_packs` (paid). Storage bucket с photo timestamp + EXIF geo
7. UI `/legal/deposit-vault`: загрузка фото въезда/выезда, бесплатно (магнит)
8. Триггер «через 15 дней без возврата депозита» → CTA «купить Dispute Pack ฿1,490» → Stripe → AI-генерация OCPB-letter (RU/EN + tieup на ст. ЗоЗПП Таиланда, дисклеймер из §9)

### Рельс 4 — Магнит + messenger router

9. `/tools/deposit-risk` (5-вопросов квиз, мгновенный free вердикт + CTA на Vault)
10. Подключить `whatsapp-incoming-webhook` → `concierge-intent` → ответ с deep-link на `/legal/contract-check` или `/legal/deposit-vault` в зависимости от классификации

### Что НЕ входит в P0 (откладываем)

- A-1 monitoring (нужен после того, как Vault и Contract привели трафик — будет CrossSell-целью)
- A-4, A-5 (build после A-2/A-3)
- A-6 self-serve subscription (B2B продаётся вручную через лид)
- Project Cards SSR-генератор всех 700 проектов (P1, после prerender инфраструктуры)
- Весь cluster B/C/D
- ZH-контент (после доказательства unit-экономики на RU+EN)
- B2B tax invoice/VAT/WHT (после первых B2B-чеков)

### Соответствие 4-тест фильтру и memory-правилам

- **Тест 1** (сегменты A/B/C: Investor/Relocator/Second-home): ✅ A-2 и A-3 покрывают все три
- **Тест 4** (Russian customer trust): ✅ RU-first, дисклеймеры §9 обязательны
- Master Taxonomy v1.0: всё кладём под Surface **legal** + JTBD-теги (без новых top-level роутов)
- ClearView V3 AAA-CCC — используется как scoring rubric в A-2 (не дублировать)
- Order-First + Stripe-webhook → ledger entries (mem://features/marketplace/transaction-and-trust-loop)
- Каждый платный артефакт за `feature_flag:trust_stack_*`

### Что подтвердить перед стартом

Перед переходом в build mode подтвердите три развилки:

1. **Prerender vs SSR vs Astro-migration** для рельса 1 — Рекомендую: `@prerenderer/plugin-vite` (минимальный риск, статический snapshot per route, работает в текущем Vite-стеке, держит SPA-runtime)
2. **AI-провайдер для contract analysis** — Рекомендую: Lovable AI Gateway / Gemini 2.5 Flash (без отдельных секретов, дёшево, длинный контекст для PDF)
3. **Цена A-2: ฿4,900 (spec) vs ฿2,900 (текущий код)** — Рекомендую: ฿4,900 по спецификации (бизнес-сигнал важнее backwards-compatibility — pre-launch продукт)
