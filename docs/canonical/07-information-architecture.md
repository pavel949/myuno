# myUNO · Information Architecture v1.0
## Канонический документ информационной архитектуры

> **Статус:** эталонный. Источник истины для всех решений о структуре URL, навигации, субдоменах, cross-domain flows и SEO-маршрутизации.
>
> **Назначение.** Один файл, в который заглядывает любой разработчик, продукт-менеджер или AI-агент и получает ответ: куда класть новую страницу, какой субдомен использовать, как назвать URL, где размещать навигацию. Без импровизации.
>
> **Философия.** URL — это контракт между платформой и пользователем. Контракт нельзя менять без последствий. Каждая сломанная ссылка = потерянный лид в органическом трафике, потерянное доверие пользователя, потерянный ranking в Google. IA — это не «как красиво разложить страницы», это **дисциплина долговременной связности**.

---

## 1 · Три принципа информационной архитектуры

Всё в этом документе выводится из трёх принципов. Когда встаёт вопрос «куда класть?» — сверься с ними.

### 1.1 · Один user_id — все домены

Единый SSO. Пользователь, зарегистрированный на `myuno.app`, автоматически авторизован на `invest.myuno.app`, `app.myuno.app`, `clearview.myuno.app`. Никаких отдельных аккаунтов. Никаких «войдите снова». Принцип Singpass: расскажи один раз — доступ ко всему.

**Следствие:** любое решение о субдомене проверяется вопросом «а кросс-доменная авторизация работает чисто?». Если нет — не запускаем.

### 1.2 · URL описывает задачу пользователя, не продукт

Плохо: `/contract-ai-tool/upload-form`. Хорошо: `/documents/check`.
Плохо: `/services/category-legal/visa-navigator`. Хорошо: `/visa`.

URL должен читаться как предложение на естественном языке. Пользователь, увидевший `myuno.app/rent/long-term/bang-tao`, понимает о чём страница до клика.

**Следствие:** мы не кодируем внутренние названия продуктов в URL. ContractAI — это внутренний бренд, для пользователя это `/documents`. DueDiligence AI — это `/property/{id}/dd`.

### 1.3 · Структура страниц всегда обратима

Каждая страница отвечает на три вопроса: «где я сейчас», «как сюда попал», «куда могу уйти». Breadcrumbs, back-navigation, связанные ссылки, понятный parent-route. Это отличает инфраструктурный сайт от landing-page-фермы.

**Следствие:** любая страница достижима минимум двумя путями — через навигацию (discoverable) и через прямой URL (shareable).

---

## 2 · Архитектура субдоменов

### 2.1 · Карта всех субдоменов

myUNO работает в режиме **host-based routing** в Vercel monorepo. Каждый субдомен — отдельный Next.js app внутри `/apps/`, но с общим `/packages/` (UI, types, shared logic).

| Субдомен | Назначение | Аудитория | Статус |
|---|---|---|---|
| `myuno.app` | Главная точка входа, справочник, AI-консьерж, все публичные вертикали | Все | **P0** |
| `invest.myuno.app` | Инвест-платформа: проекты, DD, ClearView, калькуляторы | P8, P9, P11 investors | **P0** |
| `app.myuno.app` | Личный кабинет: документы, профиль, подписки | Все residents | **P0** |
| `clearview.myuno.app` | Public dashboard рейтингов AAA–BB | Investors + market | **P0** (ClearView v1) |
| `stay.myuno.app` | Booking-платформа краткосрочной аренды | Tourists, snowbirds | **P1** |
| `owner.myuno.app` | Owner portal: отчёты, финансы по объектам | P8 owners, P10 operators | **P1** |
| `pm.myuno.app` | Property Management Dashboard | P10 operators | **P1** |
| `capital.myuno.app` | Ignatev Capital mandate CRM | P9 HNW + internal | **P2** |
| `developers.myuno.app` | Developer Portal для ClearView submission | P22 developers | **P1** (ClearView integration) |
| `pro.myuno.app` | B2B white-label PM tools | Partners, agencies | **P2** |
| `admin.myuno.app` | Внутренний админ | Team only | **P0** |
| `docs.myuno.app` | Публичная документация + API | Partners, journalists | **P2** |

### 2.2 · Правила выбора субдомена

Когда появляется новая страница или функция — проходим по решающему дереву:

1. **Это публично и SEO-критично?** → `myuno.app/...`
2. **Это требует авторизации + персональные данные пользователя?** → `app.myuno.app/...`
3. **Это инвестиционное решение / сделка на $10K+?** → `invest.myuno.app/...`
4. **Это транзакция с недвижимостью в режиме booking?** → `stay.myuno.app/...`
5. **Это B2B, для operator/developer/partner?** → соответствующий pro-субдомен
6. **Это внутренний инструмент команды?** → `admin.myuno.app/...`

**Запрещено:** создавать новый субдомен без одобрения Павла. Причина — каждый субдомен это SSL cert, DNS record, deployment config, SEO-sitemap, cross-domain auth. Это дорого и редко нужно.

### 2.3 · Субдомен vs раздел — критерий

Часто возникает вопрос: делать ли новую вертикаль субдоменом или разделом главного сайта?

**Критерии для субдомена:**
- Отдельная аудитория с минимальным пересечением (developers ≠ tourists)
- Отдельный visual identity допустим (хотя в myUNO мы строго один)
- Отдельная модель авторизации (developers проходят KYB)
- Высокая плотность специфичных функций (Dashboard, CRM, specialized workflows)

**Критерии для раздела `myuno.app/...`:**
- Та же аудитория что и основной сайт
- SEO-приоритет (органический трафик ищет «Phuket visa», а не «visa.myuno.app»)
- Дополнение к основной функции, не параллельный продукт
- Бытовые вертикали (transport, health, food)

**Правило большого пальца:** если сомневаешься — это раздел, не субдомен. Субдомен — это архитектурное обязательство на годы.

---

## 3 · Полный sitemap — `myuno.app`

Главный публичный сайт. Мобильный приоритет, SEO-критичность высокая.

### 3.1 · Top-level structure

```
myuno.app/
├── /                              Главная — AI-консьерж + 3 вопроса
├── /about                         О платформе, команда, Ignatev Group
├── /for/[persona]                 Персонализированные лендинги (25 персон)
├── /guides                        Knowledge Hub (справочник)
├── /rent                          Long-term + short-term аренда
├── /buy                           Витрина недвижимости (off-plan + resale)
├── /services                      Каталог 16 категорий
├── /clearview                     Лендинг методологии (public methodology)
├── /sos                           Emergency landing (always accessible)
├── /pricing                       Публичные цены (bundles, subscriptions)
├── /contact                       Контакт, омбудсмен-статус
├── /blog                          News + Market insights
└── /legal                         Privacy, ToS, disclaimers
```

### 3.2 · Персонализированные лендинги `/for/[persona]`

Один маршрут для всех 25 персон из `01-segmentation-framework.md`. Slug — канонический kebab-case.

```
/for/tourists                 P1 — RU tourist
/for/chinese-investors        P2
/for/european-residents       P3
/for/nomads                   P4
/for/snowbirds                P5
/for/new-expats               P6
/for/families                 P7
/for/passive-investors        P8
/for/hnw-investors            P9
/for/operators                P10
/for/mongolian-investors      P11
/for/bangladeshi-investors    P12
/for/pet-owners               P13
/for/medical-tourists         P14
/for/weddings                 P15
/for/athletes                 P16
/for/halal-travellers         P17
/for/lgbtq                    P18
/for/accessibility            P19
/for/retirees                 P20
/for/local-providers          P21
/for/developers               P22
/for/local-smb                P23
/for/creative                 P24
/for/students                 P25
```

**Шаблон для каждого лендинга** описан в `07-content-architecture.md`. Все 25 роутов используют один dynamic route `/for/[persona]/page.tsx`.

### 3.3 · Ситуационные лендинги (10 кластеров)

Параллельная структура для 10 кластеров жизненных ситуаций.

```
/arrival                  Cluster A — Arrival & Orientation
/stay-longer              Cluster B — Extension & Transition
/settle                   Cluster C — Settlement
/investing                Cluster D — Investment Consideration
/buying                   Cluster E — Transaction
/manage                   Cluster F — Operations & Management
/compliance               Cluster G — Legal & Compliance
/emergency                Cluster H — Emergency (synonym /sos)
/lifestyle                Cluster I — Lifestyle
/leaving                  Cluster J — Exit & Re-entry
```

### 3.4 · Каталог услуг `/services`

Категории из `02-service-catalogue.md` маппятся на URL:

```
/services/                        Все 16 категорий
/services/emergency               Категория 01
/services/home                    Категория 02
/services/food                    Категория 03
/services/health                  Категория 04
/services/family                  Категория 05
/services/transport               Категория 06
/services/legal                   Категория 07
/services/finance                 Категория 08
/services/tourism                 Категория 09
/services/real-estate             Категория 10
/services/pets                    Категория 11
/services/weddings                Категория 12
/services/halal                   Категория 13
/services/sports                  Категория 14
/services/community               Категория 15
/services/partners                Категория 16
```

**Отдельная услуга** (например, Welcome Pack): `/services/emergency/sos` или `/bundles/welcome-pack`.

### 3.5 · Knowledge Hub `/guides`

Детально описан в `07-content-architecture.md`. Структура URL:

```
/guides/                                       Весь hub
/guides/[category]                             Категория (visas, taxes, buying)
/guides/[category]/[article-slug]              Статья
/guides/tags/[tag]                             Тэговая страница
/guides/search                                 Поиск
```

Примеры:
- `/guides/visas/dtv-eligibility`
- `/guides/taxes/foreign-rental-income-thailand`
- `/guides/buying/freehold-vs-leasehold`

### 3.6 · Rent и Buy

**Rent** — двухуровневая структура (long-term и short-term):

```
/rent                             Лендинг
/rent/long-term                   LTR-листинг
/rent/long-term/[district]        LTR в районе (SEO: «аренда в Банг Тао»)
/rent/short-term                  STR booking
/rent/short-term/[district]
/rent/[id]                        Детальная карточка объекта
/rent/[id]/book                   Booking flow
```

**Buy** — аналогично:

```
/buy                              Лендинг
/buy/off-plan                     Новостройки
/buy/off-plan/[district]
/buy/resale                       Вторичный рынок
/buy/resale/[district]
/buy/land                         Земля
/buy/[id]                         Карточка проекта / юнита
/buy/[id]/dd                      Due Diligence (требует авторизации)
/buy/[id]/reserve                 Reservation flow
```

### 3.7 · ClearView на основном домене

```
/clearview                        Лендинг методологии (public)
/clearview/how-it-works           Объяснение 8 категорий
/clearview/ratings                Link на clearview.myuno.app (public dashboard)
/clearview/for-developers        CTA на developers.myuno.app
/clearview/certificate/[id]       Public verification (QR-сканирование certificate)
```

---

## 4 · Sitemap — `invest.myuno.app`

Инвест-платформа. Авторизация обязательна (или guest-mode с ограничениями).

```
invest.myuno.app/
├── /                              Dashboard (для авторизованного) или лендинг (для гостя)
├── /projects                      Все off-plan проекты
│   ├── /projects/new              Свежие launches
│   ├── /projects/[id]             Карточка проекта
│   ├── /projects/[id]/dd          DueDiligence AI
│   ├── /projects/[id]/clearview   ClearView scoring breakdown
│   └── /projects/[id]/floodscore  FloodScore
├── /portfolio                     Портфель клиента (авторизованные)
│   ├── /portfolio/holdings
│   ├── /portfolio/performance
│   └── /portfolio/documents
├── /tools                         Калькуляторы
│   ├── /tools/roi
│   ├── /tools/mortgage
│   └── /tools/tax
├── /reports                       ClearView reports, market briefs
├── /deals                         Активные сделки (инвестор видит свои)
├── /mandate                       Для Ignatev Capital клиентов
└── /news                          Market intelligence
```

---

## 5 · Sitemap — `app.myuno.app`

Личный кабинет. 100% авторизация. Это центральное hub-приложение после онбординга.

```
app.myuno.app/
├── /                              Dashboard: что сейчас важно
├── /profile                       Профиль, документы (паспорт, виза, адрес)
├── /documents                     Загруженные документы с AI-анализом
│   ├── /documents/upload
│   └── /documents/[id]
├── /subscriptions                 Активные подписки (TaxNav, ContractAI premium)
├── /orders                        История заказов услуг
├── /bookings                      Активные бронирования
├── /favorites                     Избранные объекты, проекты
├── /notifications                 Центр уведомлений
├── /concierge                     Чат с AI-консьержем + эскалация
├── /billing                       Платежи, счета, способы оплаты
└── /settings                      Язык, notifications, privacy
```

---

## 6 · Sitemap — `clearview.myuno.app`

Публичный dashboard. Гости видят всё, кроме Full Reports (paywall).

```
clearview.myuno.app/
├── /                              Main dashboard: map + list всех оценённых проектов
├── /projects                      Полный список с фильтрами
│   ├── /projects/[id]             Карточка проекта (public summary)
│   ├── /projects/[id]/report      Premium/Full Report (paywall)
│   └── /projects/[id]/certificate Верификация certificate по QR
├── /methodology                   Публичная методология V3 (из 06-clearview)
├── /quarterly                     Quarterly Report (public PDFs)
├── /developers                    CTA для застройщиков → developers.myuno.app
└── /api-docs                      Public API docs (для банков/оценщиков)
```

---

## 7 · Sitemap — остальные субдомены (краткая схема)

### `stay.myuno.app`
```
/                    Booking home
/search              С фильтрами
/[district]          LP района
/[id]                Карточка объекта
/[id]/book           Booking flow
/host                Для владельцев (онбординг объекта)
/trips               Мои бронирования (авторизация)
```

### `owner.myuno.app`
```
/                    Owner Dashboard (все объекты)
/properties/[id]     Объект: финансы, occupancy, отчёты
/properties/[id]/calendar
/properties/[id]/bookings
/properties/[id]/finances
/properties/[id]/compliance
/reports             Периодические отчёты
/payouts             Истории выплат
```

### `pm.myuno.app`
```
/                    PM Dashboard (multi-property)
/properties          Все управляемые объекты
/tasks               Task queue (уборка, ремонты)
/team                Команда
/contractors        Подрядчики
/pricing             Dynamic pricing engine
/channels            StaySync channel manager
/compliance          TAT, Hotel Act tracking
```

### `capital.myuno.app`
```
/                    Mandate dashboard (Павел + команда)
/leads               Pipeline HNW-клиентов
/mandates            Активные сделки
/prospects           База потенциальных клиентов
/documents           Legal documents vault
/reports             Internal reporting
```

### `developers.myuno.app`
```
/                    Developer lounge
/projects/submit     ClearView submission flow
/projects/[id]       Мой проект: status, scores, certificate
/projects/[id]/docs  Upload documents
/monitoring          Quarterly monitoring subscriptions
/billing             Payments
/academy             Partner Academy (обучение)
```

### `pro.myuno.app`
```
/                    Partner home
/listings            Мои объекты/услуги
/leads               Incoming leads
/crm                 Partner CRM
/academy             Training
/earnings            Revenue dashboard
/verification        Verified/Ombudsman tier управление
```

### `admin.myuno.app` (internal)
```
/                    Команда dashboard
/users               Все пользователи
/leads               Все лиды (cross-domain)
/transactions        Все транзакции
/content             CMS для Knowledge Hub
/partners            Partner management
/clearview           ClearView ops (assessments pipeline)
/analytics           Все метрики
```

---

## 8 · URL conventions — строгие правила

### 8.1 · Casing

**Всегда kebab-case в URL.** Никогда camelCase, snake_case, PascalCase.

```
✅ /for/hnw-investors
✅ /guides/freehold-vs-leasehold
❌ /for/hnwInvestors
❌ /guides/FreeholdVsLeasehold
❌ /for/hnw_investors
```

### 8.2 · Язык URL

**URL — всегда на английском**, даже для русскоязычного контента.

- Русский контент доступен по тому же URL через `Accept-Language` header или `?lang=ru`
- Seperate language URL только для критичных SEO-статей Knowledge Hub (`/guides/ru/taxes/...`)

**Причина:** единая sitemap, единые канонические URL для Google, международная команда читает одно и то же. Пользователь не видит URL в 95% случаев.

### 8.3 · Slugs

**Правила slug-ов:**
- Lowercase
- Kebab-case
- Без чисел в начале (`/guides/5-tips` ❌)
- Максимум 5 слов
- Без диакритики и кириллицы
- Без стоп-слов (`the`, `a`, `of`), когда можно без них

**Примеры:**
- ✅ `/guides/dtv-visa-eligibility`
- ✅ `/buy/off-plan/bang-tao`
- ❌ `/guides/how-to-get-a-dtv-visa-and-what-to-know`
- ❌ `/buy/off-plan/Bang-Tao`

### 8.4 · Параметры и фильтры

**Фильтры — в query string**, не в path:

```
✅ /buy/off-plan?district=bang-tao&price-max=10000000
❌ /buy/off-plan/bang-tao/price/0-10m
```

**Исключение — SEO-ключевые фильтры** идут в path:

```
✅ /buy/off-plan/bang-tao        (SEO: «новостройки Банг Тао»)
✅ /buy/off-plan?district=bang-tao&bedrooms=2  (детальная фильтрация)
```

Принцип: один район в path — одна посадочная SEO-страница. Комбинации — через query.

### 8.5 · Trailing slash

**Не используем trailing slash.** Канонический URL без `/` на конце.

```
✅ /buy/off-plan
❌ /buy/off-plan/
```

Vercel config должен делать 301 redirect с trailing-slash на без неё.

### 8.6 · IDs vs slugs

**Для сущностей с читаемым именем** — используем slug + id:

```
/buy/[id]-[slug]              /buy/7f3a-rhom-bho-marina
/guides/[category]/[slug]     /guides/buying/freehold-vs-leasehold
```

Где `[slug]` — human-readable часть, `[id]` — стабильный UUID или короткий hash. Если slug меняется (проект переименован) — старый URL делает 301 на новый. ID остаётся якорем.

### 8.7 · Версионирование API

API routes на субдомене `api.myuno.app` с версией в path:

```
api.myuno.app/v1/properties
api.myuno.app/v1/clearview/scores
api.myuno.app/v2/properties  (next major version)
```

### 8.8 · Deep-link маршруты

Ссылки, которые мы шарим в WhatsApp, email, push — должны быть **идеально предсказуемыми**:

```
/sos                          Emergency
/for/[persona]                Персональный лендинг
/guides/[cat]/[slug]          Статья
/buy/[id]                     Объект
/offer/[hash]                 Персональное предложение от менеджера
/quote/[hash]                 Расчёт стоимости услуги
```

---

## 9 · Навигация — глобальные паттерны

### 9.1 · Global Header

На всех публичных страницах (`myuno.app`, `stay.myuno.app`, `invest.myuno.app`, `clearview.myuno.app`) — **единый header**.

```
┌─────────────────────────────────────────────────────┐
│ myUNO   Rent  Buy  Services  Guides  [SOS]  Log in │
└─────────────────────────────────────────────────────┘
```

**Структура:**
- Logo слева — всегда ведёт на home текущего субдомена
- Основные 4 пункта: Rent, Buy, Services, Guides
- **SOS-кнопка** — всегда видима, даже на mobile (красная)
- Log in / Profile справа
- Language switcher (RU / EN / CN / DE) — в dropdown профиля

### 9.2 · Global Footer

На всех публичных страницах — единый footer.

```
┌─────────────────────────────────────────────────────┐
│ myUNO                                                │
│                                                      │
│ Платформа         Продукты         Услуги            │
│ ──────            ──────            ──────          │
│ О нас             myUNO Invest      Emergency        │
│ Команда           ClearView         Real Estate      │
│ Карьера           Stay              Legal            │
│                                                      │
│ Ресурсы           Юридическое        Контакт         │
│ ──────            ──────            ──────          │
│ Справочник        Privacy           Cherngtalay      │
│ Блог              Terms              +66 92 240 7355│
│ API docs          Disclaimers       info@myuno.app   │
│                                                      │
│ Омбудсмен-статус:                                    │
│ Представитель Правительства Москвы в Таиланде        │
│                                                      │
│ © 2026 Ignatev Group · Phuket                        │
└─────────────────────────────────────────────────────┘
```

### 9.3 · Mobile Navigation (bottom tab)

На mobile (<768px) — нижняя навигация с 5 иконками максимум:

```
┌─────────────────────────────────────────────┐
│                                              │
│  [Главная]  [Поиск]  [SOS]  [Чат]  [Профиль]│
└─────────────────────────────────────────────┘
```

**Фиксированные пункты:**
1. Home — главная текущего субдомена
2. Search — универсальный поиск (объекты, статьи, услуги)
3. **SOS** — центральная, красная, всегда
4. Concierge — чат с AI
5. Profile — личный кабинет

**Не добавлять 6-й пункт.** Если что-то критичное не помещается — оно не критичное.

### 9.4 · Breadcrumbs

На всех страницах глубже 2 уровней — обязательно.

```
Главная > Руководства > Визы > DTV виза: кто может получить
```

**Последний элемент** — не ссылка (текущая страница). Остальные кликабельны.

На mobile — только показывают parent (одна стрелка назад).

### 9.5 · Related content

Каждая страница-контент (статья, объект, услуга) имеет блок «Связанные»:

**Для статьи** — 3 связанных статьи + 1 CTA на услугу.
**Для объекта** — 3 похожих объекта + 1 CTA на виzing.
**Для услуги** — 2 связанных услуги + 1 bundle.

Принцип — **никогда не тупик**. Всегда есть 3+ следующих шага.

### 9.6 · SOS — sticky всегда

SOS-кнопка — единственный UI-элемент, который **гарантированно видим на 100% экранов всех субдоменов всегда**.

- Desktop: fixed, bottom-right, 56×56, красная (`#DC2626`)
- Mobile: центр bottom nav, 56×56, красная
- Z-index 9999
- Клик → модалка с вариантами (полиция, скорая, SOS-координатор)

Детали UI — в `05-visual-design-system.md` раздел 8.10.

---

## 10 · Cross-domain flows

Потоки между субдоменами — самая хрупкая часть архитектуры. Каждый прописан явно.

### 10.1 · Регистрация (любой домен → авторизация)

```
1. User нажимает "Log in" на myuno.app/for/nomads
2. Redirect → auth.myuno.app/sign-up?return=myuno.app/for/nomads
3. Регистрация через email/phone/Google
4. Redirect обратно на исходный URL с валидной session
5. Session cookie установлен на *.myuno.app (shared across subdomains)
```

**Реализация:** Supabase Auth с `cookieOptions: { domain: '.myuno.app' }`. Proverено через Vercel + custom domain setup.

### 10.2 · Первый просмотр объекта → Stay booking

```
myuno.app/for/tourists
  ↓ click "Забронировать"
stay.myuno.app/search?dates=...&guests=...
  ↓ выбор объекта
stay.myuno.app/[id]/book
  ↓ оплата
stay.myuno.app/trips/[booking-id]         ← авторизованная страница
  ↓ cross-sell
stay.myuno.app/trips/[booking-id]/addons  ← трансфер, SIM, SOS
```

### 10.3 · Прогрев лида → инвест → сделка

```
myuno.app/guides/buying/freehold-vs-leasehold
  ↓ +15 lead score (прочитал статью)
myuno.app/buy/off-plan/bang-tao
  ↓ +10 (просмотр витрины)
invest.myuno.app/projects/[id]
  ↓ +20 (глубокий просмотр проекта)
invest.myuno.app/projects/[id]/clearview
  ↓ +35 (просмотр ClearView отчёта)
invest.myuno.app/projects/[id]/dd
  ↓ +30 (запустил DueDiligence)
→ score > 80 → WhatsApp alert Павлу
```

Вся эта последовательность — один user_id, один session, все данные в одной таблице `lead_events`.

### 10.4 · Developer submission → ClearView assessment

```
myuno.app/clearview/for-developers         (лендинг)
  ↓ click "Submit project"
developers.myuno.app/projects/submit       (intake form)
  ↓ Stripe payment 50% upfront
developers.myuno.app/projects/[id]/docs    (upload documents)
  ↓ review process
clearview.myuno.app/projects/[id]          (published after certification)
```

### 10.5 · Owner — автоматическая cross-domain настройка

Когда покупатель закрывает сделку на `invest.myuno.app`:

```
invest.myuno.app/deals/[id]/close
  ↓ closing confirmed
→ auto-create профиль в owner.myuno.app
→ auto-enroll в app.myuno.app (личный кабинет)
→ invite на pm.myuno.app (если объект в управлении myUNO)
→ welcome email + WhatsApp с deep-links на все три субдомена
```

---

## 11 · SEO-стратегия URL

### 11.1 · Canonical URLs

Каждая страница имеет ровно один канонический URL. Всё остальное — 301 redirect.

**Канонические форматы:**
- `https://myuno.app/...` (с https, без www, без trailing slash)
- Никогда `http://`, никогда `www.myuno.app/...`, никогда с trailing slash

**Vercel config** должен обеспечивать:
- HTTP → HTTPS (301)
- www → apex (301)
- Trailing slash → без неё (301)

### 11.2 · Sitemap.xml

Генерируется автоматически. Включает:
- Все статичные страницы
- Все 25 persona-лендингов
- Все 10 cluster-лендингов
- Все опубликованные Knowledge Hub статьи
- Все активные объекты в Rent/Buy
- Все опубликованные ClearView проекты

**Исключения:** страницы с `noindex`, страницы, требующие auth, search pages с query-строками.

### 11.3 · hreflang

Все многоязычные страницы имеют `<link rel="alternate" hreflang="...">` теги:

```html
<link rel="alternate" hreflang="ru" href="https://myuno.app/guides/ru/visas/dtv" />
<link rel="alternate" hreflang="en" href="https://myuno.app/guides/en/visas/dtv" />
<link rel="alternate" hreflang="x-default" href="https://myuno.app/guides/visas/dtv" />
```

### 11.4 · robots.txt

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*/checkout/*
Disallow: /app/*
Disallow: /*/billing/*

Sitemap: https://myuno.app/sitemap.xml
```

Приватные субдомены (`admin`, `app`, `capital`) имеют собственный `robots.txt` с `Disallow: /`.

### 11.5 · Schema.org markup

Каждый тип страницы маркируется правильной схемой:

| Страница | Schema type |
|---|---|
| Home | `Organization` + `WebSite` |
| Лендинг услуги | `Service` |
| Объект недвижимости | `RealEstateListing` |
| Статья | `Article` + `BreadcrumbList` |
| Путеводитель | `HowTo` или `FAQPage` |
| ClearView проект | `Review` + `AggregateRating` |
| Контактная страница | `LocalBusiness` |

---

## 12 · Статусы и пустые состояния

### 12.1 · HTTP status pages

**404 — not found**
Не «упс, ничего нет». Показываем:
- Заголовок «Страница не найдена»
- 3 предложения: похожие страницы (на основе URL pattern)
- CTA: «На главную» и «Написать нам»

**410 — gone (deprecated content)**
Когда страница была, но убрана навсегда.
- Объяснение причины
- Ссылка на актуальную замену

**500 — server error**
- Минимум информации («что-то пошло не так»)
- Кнопка «Повторить»
- Ссылка на SOS (если это критичная операция)
- Автоматически репортится в Sentry

### 12.2 · Empty states

Никогда не «пусто». Всегда — следующий шаг.

**Пример: нет объектов в фаворитах**
```
Здесь будут ваши избранные объекты.
Зайдите в раздел Buy и нажмите сердечко на любом интересном.

[Смотреть объекты]
```

**Пример: нет активных сделок в CRM**
```
Активных сделок нет.
Проверьте лиды в секции Prospects — там могут быть готовые к переходу в Hot.

[Открыть Prospects]
```

### 12.3 · Loading states

Все длительные операции (>300ms) — skeleton UI, не spinner.
Все запросы с ретри — явный индикатор попытки.
Все критичные операции (платёж, подписание) — блокирующий overlay с объяснением «Обрабатываем, не закрывайте».

---

## 13 · URL-миграции и redirects

### 13.1 · Правила изменения URL

**URL меняется только через формальный migration process:**

1. Новый URL создаётся параллельно со старым
2. Канонический meta-тэг указывает на новый
3. 301 redirect со старого на новый
4. Внутренние ссылки обновляются
5. Sitemap обновляется
6. 4 недели мониторинг 404-ошибок
7. Старый URL остаётся навсегда в redirect-map

**Никогда не:** удалять URL без 301. Никогда не менять URL только потому что «так красивее».

### 13.2 · Redirect map

Файл `apps/web/redirects.ts` содержит все активные 301:

```typescript
export const redirects = [
  { source: '/old-path', destination: '/new-path', permanent: true },
  // ...
];
```

Файл проверяется в CI. Дубликаты запрещены. Каждый redirect имеет дату добавления и причину в комментарии.

---

## 14 · Проверочный чек-лист для любой новой страницы

Перед merge нового маршрута — пройти:

**URL structure**
- [ ] kebab-case
- [ ] На английском
- [ ] ≤5 слов в slug
- [ ] Без trailing slash
- [ ] Правильный субдомен (из раздела 2.2)

**SEO**
- [ ] Unique `<title>` (≤60 chars)
- [ ] Unique `<meta description>` (≤160 chars)
- [ ] Canonical tag
- [ ] hreflang если многоязычная
- [ ] Schema.org markup
- [ ] Open Graph tags
- [ ] Добавлена в sitemap.xml

**Навигация**
- [ ] Breadcrumbs (если >2 уровней)
- [ ] Back button / parent link
- [ ] Related content block
- [ ] CTA с очевидным next step

**Контент**
- [ ] H1 есть и один
- [ ] Заголовки иерархичны (H1 → H2 → H3)
- [ ] Alt-text на всех изображениях
- [ ] Tone of voice пройден (03-tone-of-voice.md §14)

**Тех**
- [ ] 404 handler работает для несуществующих вариантов
- [ ] Loading state (skeleton)
- [ ] Error boundary
- [ ] Mobile 375px проверен
- [ ] Works без JS (для SEO-страниц)

**Cross-domain**
- [ ] Auth flow работает (если страница в auth-домене)
- [ ] Deep-link из WhatsApp / email проверен
- [ ] Session сохраняется при переходе на другой субдомен

---

## 15 · Anti-patterns — чего не делать

### 15.1 · URL-плохие практики

- ❌ `/?id=123&type=property` — query-only URL для SEO-страниц
- ❌ `/page.html`, `/article.php` — файловые расширения
- ❌ `/%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D1%8B` — кириллица в URL
- ❌ `/prop/prop123` — повторение в path
- ❌ Глубокая вложенность >4 уровней (`/a/b/c/d/e/f`)

### 15.2 · Навигационные плохие практики

- ❌ Mega-menu с 40+ пунктами
- ❌ Hamburger на desktop (кроме admin)
- ❌ Carousel как основная навигация
- ❌ Hover-only dropdowns (mobile не работает)
- ❌ Разная навигация на разных субдоменах (кроме admin и dashboard-апп)

### 15.3 · Архитектурные плохие практики

- ❌ Создание нового субдомена для каждой новой фичи
- ❌ Смешение авторизованного и публичного контента на одном subdomain
- ❌ Cross-domain formsubmissions (всегда делать redirect)
- ❌ Разные базы пользователей на разных субдоменах
- ❌ Локализация через субдомен (`ru.myuno.app`) — используем `?lang=ru` или `/ru/`

---

## 16 · Эволюция и управление

### 16.1 · Review cycle

- **Monthly** — redirects-log review (сколько 404, топ старых ссылок)
- **Quarterly** — sitemap audit (какие страницы не в индексе, почему)
- **Annually** — full IA review с возможностью major restructuring

### 16.2 · Кто владеет

- **IA документа** (этот файл) — Pavel + CTO
- **Sitemap** (актуальный) — CTO + content lead
- **Redirect map** — автоматически через CI + ручной review

### 16.3 · Когда создавать новый субдомен

Проверочные вопросы (ответ должен быть «да» на все 5):
1. Отдельная аудитория с минимальным пересечением?
2. Отдельный bundle функций на 20+ маршрутов?
3. Разный auth / access level?
4. Павел дал явное согласие?
5. Есть план обслуживания на 3+ года?

Если хотя бы одно «нет» — это раздел существующего субдомена.

---

## 17 · Промпт для AI-агента

Когда даёшь Cursor / Claude Code задачу создать новую страницу или route — прикрепи этот документ и используй шаблон:

```
Создай новый маршрут для myUNO.

КОНТЕКСТ. Информационная архитектура в /docs/canonical/07-information-architecture.md.
Ты ОБЯЗАН следовать:
- Правилам URL conventions (раздел 8) — kebab-case, английский, без trailing slash
- Выбору субдомена (раздел 2.2) — через решающее дерево
- Схеме сайтмапа (разделы 3–7) для правильного parent route

ЗАДАЧА.
[описание страницы и её назначения]

ПЕРЕД КОДОМ опиши:
1. На каком субдомене размещаем и почему
2. Какой parent route в sitemap
3. Предлагаемый URL slug
4. Какая persona / cluster целевая (см. 01-segmentation-framework.md)
5. Авторизация: public / auth required / hybrid
6. SEO-приоритет: high / medium / low

Только после одобрения — код.

ЧТО НЕ ДЕЛАТЬ.
— Не создавай новые субдомены
— Не используй query-params для SEO-критичных фильтров
— Не оставляй URL с trailing slash
— Не создавай URL на русском
— Не делай глубину >4 уровней
```

---

## 18 · Связанные документы

- `PROJECT.md` — стратегический фундамент и роль субдоменов
- `01-segmentation-framework.md` — 25 персон и 10 кластеров (URL маппинг в §3.2-3.3)
- `02-service-catalogue.md` — 16 категорий услуг (URL маппинг в §3.4)
- `03-tone-of-voice.md` — тексты внутри UI
- `05-visual-design-system.md` — компоненты header/footer/nav
- `06-clearview-methodology.md` — ClearView sitemap интегрирован в §6

---

*Document · v1.0 · Апрель 2026 · Owner: Pavel + CTO*

*Принцип: URL — это контракт. Контракт не меняют по желанию, только по необходимости, и всегда с 301.*
