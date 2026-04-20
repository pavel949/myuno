

## Монетизация v2: недвижимость как ядро, всё остальное — поддерживающая инфраструктура

### Что меняется в стратегии

Предыдущий план распределял выручку по 5 равноправным потокам (R1–R5). Но реальность маховика: **70%+ дохода придёт из недвижимости** (resale + new-build + investment deals). Услуги, подписки, лиды — это **вспомогательные слои**, удерживающие пользователя в экосистеме до и после крупной сделки.

Перепаковываю под три приоритета:

```text
ЯДРО (70-80% выручки):     Недвижимость — продажа и сделки
АКСЕЛЕРАТОР (15-20%):      Trust-as-a-Service — ClearView, оценки, due diligence
УДЕРЖАНИЕ (5-10%):         STR/Live/Operate/Partner — частые транзакции, LTV, лиды
```

Это синтез: **Дом.РФ** даёт инфраструктуру доверия, **Циан** — листинги и лиды, **Airbnb** — частоту и удержание. Деньги делает Дом.РФ-слой; Циан-слой генерирует пайплайн; Airbnb-слой удерживает аудиторию.

---

### Часть 1. Reframe: «Real Estate Revenue Engine» (RERE)

Заменяю модель «5 равных рентов» на **воронку RE с 4 этапами**, где каждый этап монетизируется явно:

**Этап 1 · Discovery (бесплатно, аккумулирует аудиторию)**
- Каталоги `/property/rent`, `/property/resale`, `/newbuilds`
- Фильтры, сравнение, карта, AI-поиск
- Цель: затащить 100% русскоязычного трафика по теме SEA real estate
- Монетизация: 0₽. Это top-of-funnel.

**Этап 2 · Trust (платная верификация, маржа 80%+)**
- ClearView Project Rating — ฿120 000 (платит застройщик, отчёт публичен)
- Fair-Price Assessment — ฿9 900 (платит покупатель)
- Investment ROI Report — ฿14 900
- Legal Due Diligence — ฿35 000
- WorldCheck KYC для сделок $200K+ — ฿4 900
- **Это ключевая отстройка от Циана.** Циан — это листинг, мы — листинг + проверка.

**Этап 3 · Transaction (основные деньги)**
| Поток | Ставка | Кто платит | Средний чек |
|---|---|---|---|
| **New-build / Off-plan** | 5–7% от застройщика | застройщик | ฿7M = ฿350–490K комиссия |
| **Resale** | 3% (мин. ฿120 000) | продавец | ฿8M = ฿240K |
| **Investment deal $200K+** | 2% + эскроу-фи 0.5% | покупатель | $300K = $7 500 |
| **Long-term rent / зимовка 30+** | 50% первого мес. | арендодатель | ฿60K = ฿30K |
| **STR booking** | 12% guest + 3% host | оба | ฿15K = ฿2 250 |

**Главный фокус:** new-build commission — самые крупные чеки и есть рычаг через ClearView (отчёт → лиды → сделка).

**Этап 4 · Post-transaction (LTV)**
- Property Care 10% сервисов
- Full Management 70/30
- Owner Pro $19/мес или MC Studio $99/мес
- Concierge / Operate / Lifestyle apps
- Вторая сделка через 2–4 года (повторный resale цикл)

---

### Часть 2. Конкретные изменения в продукте

**2.1 Главная (`/`) — RE-first**
Вместо равноправных 5 пакетов L1, главная фокусируется на недвижимости:

```text
HomeTopBar
HeroIntro                    — «Недвижимость на Пхукете с проверкой ClearView»
RealEstateEntry              — БОЛЬШОЙ блок: 3 трека (Аренда / Покупка / Инвестиции)
                                с явными trust-плашками и средними чеками
TrustAsAService              — 4 платные услуги (ClearView/FairPrice/ROI/DueDil)
                                с ценами и сроками
LifeCycleNavigator           — 5 этапов жизненного цикла (компактнее)
AudienceServiceHub           — 9 хабов (компактные карточки, не доминируют)
ProofAndOperator             — оператор, лицензии, цифры доверия
TrustFooter
```

Всё остальное (Live, Operate, Partner, Concierge) — **под главным RE-блоком**, как контекст для удержания.

**2.2 Новая страница `/property/why-myuno` — продающая логика без продаж**
Спокойное объяснение в gov-tone:
- Чем мы отличаемся от Циана: проверка проектов
- Чем от Airbnb: long-term, инвест-режим, ClearView
- Чем от частных агентов: открытая методика, фиксированные ставки, эскроу
- Сколько стоит и кто платит на каждом этапе
- Кейсы (3 анонимизированных, без пафоса)

**2.3 ClearView как продукт, а не как ярлык**
Сейчас ClearView в памяти — методика. Превращаем в продаваемый сервис:
- Лендинг `/clearview` для застройщиков (сейчас фрагментировано)
- Pricing: ฿120 000 за проект
- Sample Report (PDF, открытый)
- Self-service заявка → CRM `clearview_application`
- В каталоге new-builds — бейдж «Rated AAA / AA / A / BBB / BB» либо «Not ClearView rated» (правило из памяти: Y1 только non-brokered)

**2.4 Investment Deal Flow `/invest/deal/:id`**
Новая воронка для $200K+ сделок:
- Страница с ROI-моделью, эскроу-схемой, WorldCheck-чекаут
- Явная разбивка fee: 2% сделка + 0.5% эскроу + опц. ฿14 900 ROI report
- Form → CRM `investment_lead` с тегом сегмента (Investor по `operating-model-v2`)
- Москвичам — отдельная плашка: «Защита через омбудсмена Москвы» → существующая форма из v1 плана

**2.5 Lead Quality Engine (для застройщиков)**
- Verified Lead = KYC прошёл + бюджет подтверждён + intent score ≥ 60
- Цена: ฿1 500 за verified lead, ฿500 за raw lead
- Self-service для застройщиков: личный кабинет `/developer/leads` с фильтрами
- Это монетизирует discovery-трафик, который не дошёл до transaction

**2.6 Pricing Page `/pricing` — RE-first**
Перепаковываю в 3 секции:
- **Для покупателей и инвесторов** — Trust services (всё прозрачно: что входит, цена, срок)
- **Для застройщиков** — ClearView, Lead Quality, Editorial slots, комиссии
- **Для собственников и УК** — Owner Pro / MC Studio / Vendor SaaS / Property Care

---

### Часть 3. Что делаю в коде (на этой итерации)

**Новые (~10):**
- `src/lib/monetization/realEstateEngine.ts` — каноническая модель RERE (4 этапа, ставки, чеки)
- `src/lib/monetization/revenueStreams.ts` — обновлённая версия с RE-приоритетом
- `src/components/home/RealEstateEntry.tsx` — главный блок главной (3 трека)
- `src/components/home/TrustAsAService.tsx` — 4 платные верификации
- `src/components/monetization/MonetizationDisclosure.tsx` — gov-tone плашка комиссий
- `src/components/monetization/AuditMarker.tsx` — tx + ledger + поток (правило §13.6)
- `src/pages/property/WhyMyUno.tsx` — `/property/why-myuno`
- `src/pages/clearview/ClearViewLanding.tsx` — `/clearview` для застройщиков
- `src/pages/PricingPage.tsx` — `/pricing` (3 секции, RE-first)
- `src/hooks/useRevenueRates.ts` — чтение `system_settings` с дефолтами

**Изменяемые (~7):**
- `src/pages/Index.tsx` — RE-first компоновка
- `src/lib/copy/govStyle.ts` — `MONETIZATION_LABELS`, `RE_TRUST_LABELS`, `CLEARVIEW_LABELS`
- `src/lib/config/routes.ts` — ключи `PRICING`, `WHY_MYUNO`, `CLEARVIEW`, `INVEST_DEAL`
- `src/components/layout/AnimatedRoutes.tsx` + `pageRegistry.ts` — новые роуты
- `src/lib/services/servicePassports.ts` — добавить поля `revenueStream`, `takeRate`, `whoPays` на 22 вертикали
- `src/components/services/ServicePassport.tsx` — рендер revenue-блока
- `src/hooks/usePromotedListings.ts` — переименование «Спонсорское размещение», читать ставки из `useRevenueRates`

**Опц. БД-миграция (спрошу отдельно перед применением):**
- INSERT в `system_settings` 12 ключей `revenue:*` (resale_commission=3, newbuild_commission=6, longterm_commission=50, str_guest_fee=12, str_host_fee=3, investment_deal_fee=2, escrow_fee=0.5, trust_clearview=120000, trust_fairprice=9900, trust_roi=14900, trust_duediligence=35000, trust_worldcheck=4900)
- INSERT 3 feature flags: `feature_flag:re_revenue_engine`, `feature_flag:trust_as_service`, `feature_flag:lead_quality_engine`

**НЕ трогаю на этой итерации:**
- Stripe / checkout / orders / webhooks (отдельная задача)
- Self-service эскроу (большой проект)
- Self-service developer dashboard `/developer/leads` (после валидации спроса)
- 22 витрины (только подключение `ServicePassport` через `MiniAppLayout`-обвязку)
- 60 админок и MC/Owner workspace
- Существующие vendor SaaS контракты (только UI-переупаковка)

---

### Часть 4. Тональная и архитектурная дисциплина

- Тон gov-tech: «комиссия 3%», «срок отчёта 5 рабочих дней», «оператор сделки — myUNO Pte. Ltd.»
- Никаких «лучший», «премиум», «выгодно»
- Все аббревиатуры расшифрованы (ClearView, ROI, WorldCheck, KYC, AML)
- Цифры явные: проценты, чеки, сроки
- RU + EN на каждой строке
- Никаких новых top-level routes — всё под `/property/*`, `/invest/*`, `/clearview` (последнее — единичное исключение для бренд-сервиса, требует обсуждения)
- `MiniAppLayout` везде, никаких новых shells
- Только токены `tokens.css`
- Аудит-маркер на каждом «денежном» экране
- `feature_flag:*` до GA

---

### Часть 5. Smoke-test после реализации

1. `/` 384px: вверху доминирует `RealEstateEntry` (3 трека), ниже `TrustAsAService` с ценами, ещё ниже — компактные хабы.
2. `/property/why-myuno`: спокойная логика «чем отличаемся», без продаж.
3. `/clearview`: лендинг для застройщика, цена ฿120 000, sample report, форма заявки.
4. `/pricing`: 3 секции (покупатели/застройщики/УК), все цены явные.
5. `/invest`: видна кнопка «Investment Deal $200K+» с разбивкой fee.
6. На карточке resale — кнопка «Оценка справедливости цены — ฿9 900».
7. На любой витрине вертикали — `ServicePassport` показывает revenue stream и take rate.
8. На order-confirmation — `AuditMarker` с tx + ledger + поток.
9. Тон: ни «лучший», ни «премиум», ни императивов; все ставки из `system_settings`.

---

### Часть 6. Риски и оговорки

- **Ставки 5–7% по new-build** — реалистичны для тайского рынка (стандарт 3–6%, верхний край за ClearView+маркетинг). Перед применением — подтверждение.
- **`/clearview` как top-level** — нарушает правило §13.1. Альтернатива: `/property/clearview` или `/build/clearview` (cluster Build). Спрошу при реализации.
- **Trust services как продукт** — требует back-office для генерации отчётов. На этой итерации — только UI-витрина + создание `support_request` с тегом. Ручная обработка первые 3 месяца — нормально для валидации спроса.
- **Lead Quality Engine** — требует scoring логики и developer dashboard. На этой итерации — только концепт в `/pricing`, без реализации воронки.
- **Объём:** ~17 файлов, 3–4 итерации. Иду фазами: (1) тон + датасеты + RE-engine модель, (2) главная + ClearView лендинг + Pricing, (3) Why-myUNO + investment deal flow, (4) ServicePassport + AuditMarker подключение + smoke-test.

### Что НЕ входит

- Эскроу-инфраструктура (отдельный большой проект)
- Self-service developer dashboard и lead marketplace
- Автоматическая генерация Trust-отчётов (ручная обработка Y1)
- Fiscalization и тайская налоговая отчётность платформы
- Перепрайсинг существующих vendor-договоров
- A/B-тестирование тарифов
- Полный пересмотр 366 страниц на тональность

