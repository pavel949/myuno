

## Оценка готовности текущей архитектуры myUNO к модели «Comprehensive Product Document v2.0»

### TL;DR

**Готовность к целевой модели — ~55–65%.** Текущая платформа покрывает 4 из 5 слоёв документа на уровне «есть данные и UI», но **критически не хватает 4 архитектурных компонентов** для перехода в режим «Госуслуг дестинации»: единого `myUNO ID` (consolidated profile), интеграционного слоя (SSO+Notifications+AI-консьерж как фундамент), Compliance-слоя как самостоятельной MRR-вертикали и рублёвого платёжного контура. Структура данных в целом совместима, но нужны 8–12 новых таблиц + объединение/декомпозиция ~6 существующих.

---

### 1. Маппинг 5 слоёв документа на текущую архитектуру

| Слой документа | Текущее покрытие | Таблицы (есть) | Что отсутствует |
|---|---|---|---|
| **REC · Real Estate Core** (6 продуктов: PropertySearch, DueDiligence AI, Transaction Suite, PM, Owner Portal, Liquidity L1–L5) | **75%** | `properties`, `property_projects`, `developers`, `resale_properties`, `quick_listings`, `property_*` (15+ таблиц), `agent_deals`, `capital_*` (4 таблицы), `unit_holds`, `nb_*` (newbuilds) | DueDiligence AI как продукт (только методика ClearView); Transaction Suite (FET wizard, ContractAI, POA, TorTor 3); Liquidity L3–L5 (First Look Network, Yield Floor, Buy-back); AVM-движок |
| **Слой 1 · Compliance & Legal** (TM30, PND, FET, Hotel Act, DTT, КИК, Visa, BOI) | **20%** | `visa_records`, `visa_services`, `legal_services`, `tax_filings` (минимально) | Главный gap. Нет `compliance_obligations`, `compliance_deadlines`, `tm30_filings`, `hotel_act_track`, `pnd_filings`, `fet_documents`, `tax_returns`, `cfc_reports`. Нет MRR-подписки на compliance |
| **Слой 2 · Financial Infrastructure** (escrow, рубли, FX, банки, переводы) | **45%** | `orders`, `payment_intents`, `ledger_entries`, `vendor_payouts`, `wallets`, `wallet_transactions`, `currency_rates`, `commission_agreements`, `trust_accounts`, `trust_account_movements` | Рублёвый контур (3 варианта A/B/C); FX-spread monetization; HNW mandate management; Insurance brokerage; BankPass/TransferRu/THB↔MNT/BDT |
| **Слой 3 · Service Ecosystem** (16 вертикалей через партнёров, 3 уровня партнёрства) | **80%** | `providers`, `vendor_*` (15+ таблиц), `services`, `service_orders`, `bookings`, 22 vertical-таблиц (`yachts`, `restaurants`, `salons`, `clinics`, `gyms`, `cleaning_services`, `babysitters`, `pet_services`, `flower_shops`, `pharmacies`, `airport_*`, etc.) | Формальная 3-уровневая модель партнёрства (Listed/Verified/Ombudsman-endorsed) — есть `provider_badges`, но нет правил эскалации; SLA-мониторинг; partner self-service portal; единый escrow-routing для всех 16 вертикалей |
| **Слой 4 · Data & AI** (AI-консьерж, AVM, агенты, индексы) | **40%** | `ai_agents`, `ai_agent_knowledge`, `ai_agent_logs`, `ai_artifacts`, `ai_intake_sessions`, `analytics_events`, `user_personas` | AI-консьерж как **точка входа** (3 вопроса → персонализированный путь из 5–7 сервисов) — текущий концирж проактивный, а не routing-first; AVM как продукт; Phuket Residential Price Index; DueDiligence AI продакшн-агент; ContractAI |
| **Интеграционный слой** (SSO, myUNO ID, Notifications, Emergency, Analytics) | **55%** | `profiles`, `user_roles`, `user_addresses`, `user_documents`, `user_personas`, `push_subscriptions`, `analytics_events`, есть Hero SOS Button | **Главный архитектурный gap.** `profiles` плоский, без `passport_*`, `visa_status`, `tax_residency`, `tm30_status`, `documents_vault`. Нет единого Notification Center с правилами доставки (compliance deadlines → WhatsApp/Telegram/email). Нет «3-вопросного» AI-роутера |

---

### 2. Критические gaps по приоритету

**🔴 P0 · Блокирующие переход к модели «Госуслуг»:**

1. **`myUNO ID` (consolidated profile).** Текущий `profiles` — 32 поля плоских данных. Документ требует единый профиль с: passport (паспорта пользователя и членов семьи), visa_status (текущая виза + history), tax_residency (RU/TH/dual), tm30_status (последняя подача + дедлайн), property_ownership (FK на `properties`), tax_obligations (подписки на PND/3-НДФЛ/КИК), language, documents_vault (зашифрованное хранилище). **Решение:** новые таблицы `user_passports`, `user_visa_status`, `user_tax_profile`, `user_compliance_obligations`, `user_documents_vault` + расширение `profiles`.

2. **Compliance-слой как продукт.** Нет ни одной таблицы для трекинга периодических обязательств. **Решение:** `compliance_obligations` (тип, дедлайн, юзер, статус), `compliance_filings` (TM30/PND/FET/CFC), `hotel_act_tracks` (A/B/C), `visa_renewals_pipeline`. Подписочная MRR-модель через расширение `subscription_plans`.

3. **AI-консьерж как routing-first точка входа.** Сейчас концирж — proactive helper на главной. Документ требует: WhatsApp/Telegram/landing-бот → 3 вопроса (кто/зачем/насколько) → персонализированный путь. **Решение:** `concierge_sessions` (intake answers), `concierge_journeys` (рекомендованные сервисы), интеграция с существующими `ai_intake_sessions` + расширение flow на onboarding.

4. **Notification Center с compliance-deadlines.** Сейчас уведомления распылены. **Решение:** `notification_rules` (триггер: дедлайн TM30 −7 дней), `notification_deliveries` (канал: WhatsApp/Telegram/email), единый dispatcher на базе существующего `lifecycle-processor`.

**🟡 P1 · Нужны для масштабирования модели:**

5. **Liquidity Layer L1–L5.** Есть `resale_properties` и `agent_deals`, нет: First Look Network (HNW invitation-only access), Yield Floor Guarantee (insurance-style obligation), Developer Buy-back agreements. **Решение:** `liquidity_tier` enum в `properties`, новая таблица `first_look_invitations`, `yield_guarantees`, `buyback_agreements`.

6. **Рублёвый платёжный контур.** Нет интеграций. **Решение:** `payment_rails` (RU юрлицо / партнёр-процессор / USDT), `ruble_transactions`, `fx_spreads`, расширение `commission_agreements` для FX-маржи. Edge functions: `ruble-payment-processor`, `ruble-payout-processor`.

7. **Партнёрская 3-уровневая модель.** Есть `provider_badges`, нет автоматики эскалации Listed → Verified → Ombudsman-endorsed. **Решение:** `partner_tier` enum + `partner_tier_history` + `partner_sla_metrics` (SLA-мониторинг с автоматической конверсией).

8. **AVM (Automated Valuation Model).** Нет. **Решение:** `property_avm_estimates` (цена + confidence + factors), edge function `avm-calculator` с квартальным cron, публичный API endpoint.

**🟢 P2 · Доработки по существующему:**

9. **Hotel Act tracks A/B/C** — расширение `properties` + новая `hotel_act_compliance`.
10. **Insurance Marketplace** — `insurance_brokerage_partners`, `insurance_policies`.
11. **HNW Financial Suite** — `hnw_mandates`, `mandate_performance`, `carry_calculations`.
12. **Phuket Residential Price Index** — материализованное представление + публичный feed.

---

### 3. Что уже хорошо легло на модель

- **Real Estate Core (75%)** — PropertySearch, PM Platform, Owner Portal в значительной мере реализованы. PMS/Channel Manager (Rentals United + iCal) уже работает.
- **Service Ecosystem (80%)** — 22 вертикали + `providers` + `vendor_subscriptions` + escrow через `commission_agreements` уже есть. Нужна только переупаковка под 3 уровня партнёрства.
- **CRM-инфраструктура** — мощная (`crm_*` 22 таблицы, pipelines, sequences, workflows). Это редкое преимущество — у конкурентов нет.
- **Capital/Investment Hub** — `capital_contacts`, `capital_pipeline`, `capital_intro_requests`, `agent_deals` — фундамент для First Look Network готов.
- **Newbuilds (`nb_*`)** — отдельный B2B2C lead magnet с Developer Portal — соответствует слою REC.
- **ClearView v3** в памяти — методика готова, нужна только продуктизация в DueDiligence AI.

---

### 4. План перехода (3 фазы, 6–9 месяцев)

**Фаза A · Фундамент (2 мес.) — P0**
- A1. Миграция `profiles` → `myUNO ID` (5 новых таблиц, RLS, compatibility-views для текущего кода).
- A2. Compliance-слой v0: `compliance_obligations` + `compliance_filings` + Owner subscription tier «Compliance Pro».
- A3. AI-консьерж как routing-first: расширение `ai_intake_sessions` + новый flow `/onboarding` с 3 вопросами.
- A4. Notification Center: `notification_rules` + dispatcher.

**Фаза B · Финансовая инфраструктура и Liquidity (2–3 мес.) — P1**
- B1. Рублёвый контур (вариант B — партнёр-процессор) + edge functions.
- B2. Liquidity L1–L3 (Базовый листинг + Verified history + First Look Network).
- B3. AVM v0 (на базе `property_projects` + market data + Claude reasoning).
- B4. Партнёрская 3-уровневая модель с автоматической эскалацией.

**Фаза C · Расширение (2–3 мес.) — P2**
- C1. DueDiligence AI как продакшн-агент.
- C2. Hotel Act tracks + Insurance Marketplace.
- C3. HNW Financial Suite + Phuket Residential Price Index.
- C4. Liquidity L4–L5 (Yield Floor + Buy-back) — пилот на 2–3 проектах Sansiri/Rhom Bho.

---

### 5. Архитектурные риски и оговорки

- **378 таблиц уже в проде.** Любая миграция профиля требует backward-compatible views и поэтапный rollout с feature flags (`feature_flag:myuno_id_v2`).
- **Compliance-слой требует human-in-the-loop первые 6 месяцев.** Документ это признаёт. Не пытаемся автоматизировать TM30 на 100% сразу — ставим интерфейс + ручную обработку партнёром.
- **Рублёвый контур = регуляторный риск.** Вариант B (партнёр-процессор) безопаснее всего на старте.
- **AI-консьерж как точка входа = breaking UX change.** Текущая главная — RE-first блок (только что внедрён). Меняем не главную, а добавляем `/start` flow для новых пользователей. Существующие пользователи опционально проходят через «3 вопроса» при следующем визите.
- **Объём:** 8–12 новых таблиц + 6 расширенных + ~30 RPC + ~8 edge functions. Это 3 крупные миграции, которые нужно планировать через `supabase--read_query` и согласование пользователя.
- **Документ — стратегия, не спецификация.** На фазе A нужно превратить в детальные ER-диаграммы и user stories. Это часть работы фазы A1.

---

### 6. Что НЕ входит в план

- Капитализация $150–280M, прогноз ARR — это бизнес-метрики, не для архитектуры.
- Репликация на Самуи/Краби/Бали — только после валидации на Пхукете (год 2+).
- Замена существующего стека (React/Supabase/Stripe) — документ полностью совместим с текущим стеком.
- Найм CTO / реструктуризация команды — операционная задача, не код.
- Полный rewrite — текущая архитектура не требует rewrite, только аккуратные расширения.

---

### Вердикт

**Текущая структура данных подходит для эволюции в модель документа на 55–65%.** Главные блокеры — не технические, а архитектурные: нужно сделать `myUNO ID` единым профилем, добавить Compliance как продукт, превратить AI-консьерж в routing-first точку входа и достроить Liquidity L3–L5. Все четыре gap'а решаются аддитивно, без rewrite. Текущая инвестиция в `properties`, `providers`, `crm_*`, `capital_*`, `ai_*`, `commission_agreements`, `ledger_entries` — полностью переиспользуется.

Если согласуешь — могу начать Фазу A: предложить детальную ER-схему для `myUNO ID` + 3 миграции с feature flags.

