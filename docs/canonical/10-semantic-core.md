# myUNO · Semantic Core v1.1
## Канонический документ семантического ядра платформы

> **Статус:** эталонный. Источник истины для SEO-стратегии, контент-производства (Knowledge Hub, лендинги, каталог услуг, AI-консьерж, system prompts), для именования URL и для смысловой логики всех публичных и внутренних текстов. Живёт в `/docs/canonical/10-semantic-core.md`.
>
> **Две функции документа одновременно:**
> 1. **Findability** — обеспечивает индексацию и ранжирование платформы в Google, Яндексе, Baidu, WeChat Search, на основе реальных запросов целевых персон.
> 2. **Meaning** — фиксирует единый смысловой каркас: как myUNO описывает себя, свои продукты, свои обязательства и свои ограничения. Любое внешнее слово о платформе сверяется с этим документом.
>
> **Связанные канонические документы:**
> - `PROJECT.md` — стратегический фундамент
> - `myuno_segmentation_framework.md` (01) — 25 персон + 10 кластеров
> - `ServiceCatalogue_v2.jsx` (02) — 16 категорий, ~230 услуг
> - `myuno_tone_of_voice.md` (03) — голос бренда
> - `06-clearview-methodology.md` — методология ClearView™
> - `07-information-architecture.md` — URL-структура и субдомены
> - `08-ai-prompts-library.md` — system prompts AI-агентов
> - `09-data-schema.md` — схема данных
>
> **Принцип:** семантическое ядро — это **контракт между смыслом и поиском**. Одно и то же понятие должно одинаково звучать в лендинге, в статье Knowledge Hub, в ответе AI-консьержа, в schema.org разметке и в заголовке URL. Расхождение смысла = фрагментация домена в глазах поисковика = потеря органического трафика = потеря лидов на закрытую сделку.

---

## 0 · Как использовать этот документ

### 0.1 · Статус и вето-право

Документ — **канонический**. В конфликте с любым нерукописным источником (черновиком, копирайтинговым гайдом агентства, предложением AI-агента) побеждает этот документ. При конфликте с другими каноническими документами работает порядок приоритета из §13.

Документ имеет прямое **вето на merge** в следующих случаях:

1. Нарушение §5 (использование синонимов канонических имён)
2. Нарушение §9.2 (отсутствие обязательных SEO-полей на публичной странице)
3. Нарушение §1.3 (дублирование intent на двух URL)
4. Нарушение §10.4 (anti-patterns)
5. Отсутствие тегов Lifecycle / Role / Cluster (§3) у новой публичной страницы

Всё остальное — рекомендация. PR с рекомендательными нарушениями может быть смержен с комментарием в changelog и fix-PR в течение недели.

### 0.2 · Кто читает и когда

Документ **обязателен к сверке** перед следующими задачами. «Обязателен» означает: AI-агент или человек читает указанные секции до начала работы.

| Задача | Кто выполняет | Обязательные секции |
|---|---|---|
| Создать новый публичный URL | Developer / AI-агент | §2, §3, §6, §9, §11 |
| Написать pillar или cluster-статью | Content Lead / AI | §2, §4.1–4.2, §5, §6, §11 |
| Написать карточку услуги / продукта | Product + Copy | §2, §5, §6 (для кластера), §11 |
| Создать или переименовать продукт | Pavel + Product | §5, §10.3 |
| Обновить system prompt AI-агента | AI Engineer | §2, §5, §7 |
| Запустить programmatic-шаблон страниц | CTO + SEO Lead | §4.3, §6, §9, §10.4 |
| Локализовать контент на новый язык | Content Lead | §8 |
| Имплементировать schema.org на странице | CTO | §9 полностью |
| Добавить новый кластер запросов | SEO Lead | §6, §10.3 |

Если задачи нет в списке, но она касается публичных текстов, URL, имён продуктов или переводов — документ обязателен.

### 0.3 · Автоматические проверки

Следующие проверки выполняются в CI и блокируют merge:

- **ESLint rule `no-canonical-synonyms`** (§14) — запрещённые синонимы из §5 в `.tsx`, `.ts`, `.md`, `.mdx`
- **ESLint rule `no-forbidden-tone`** (из M7) — продолжает работать параллельно
- **CI-скрипт `validate-semantic`** (§15) — проверяет публичные страницы на полноту SEO-полей из §9.2
- **PR-template checklist** (§16) — §11 в виде checkbox, PR не может быть помечен ready for review без пройденного чек-листа

### 0.4 · Как править документ

Любое изменение — PR с двумя approvers: Pavel и CTO (для §5, §9) или Pavel и Content Lead (для §2, §4, §6, §8).

**Шаблон описания PR для правки ядра:**

```
## Что меняется
[Раздел и конкретное изменение]

## Почему
[Запрос из production / данные из GSC / решение продуктовой стратегии]

## Последствия
- Какие существующие страницы требуют обновления
- Требуется ли 301-redirect (если меняется каноническое имя)
- Требуется ли обновление system prompts AI-агентов (§5 изменения)
- Требуется ли backfill keyword-map.csv

## Rollback plan
[Как откатить при регрессе в течение 7 дней]
```

Правки §5 (канонические имена) требуют сопутствующего миграционного PR со всеми заменами в существующем контенте — атомарно, а не «потом доделаем».

### 0.5 · Review cycle

- **Еженедельно** — SEO Lead добавляет новые запросы из Google Search Console и Яндекс.Вебмастер в `keyword-map.csv`. Если запрос не покрывается существующими кластерами §6 — PR с подкластером.
- **Ежемесячно** — Content Lead проходит топ-20 страниц по органическому трафику и проверяет, совпадает ли фактический intent с декларируемым.
- **Квартально** — Product + Pavel проходят §5 и сверяют с продакшеном через grep репо: не появились ли дрейф-синонимы.
- **Раз в полгода** — полный ревью §2 (позиционирующее ядро). Возможны major-изменения.

---

## 1 · Три принципа семантического ядра

Всё в этом документе выводится из трёх принципов. Любое нарушение в production — дефект, который правится PR в этот файл.

### 1.1 · Одна сущность — одно каноническое имя на каждом языке

У каждой значимой сущности платформы (продукт, услуга, документ, юридический термин, роль, кластер ситуаций) есть **ровно одно** каноническое название на каждом из рабочих языков. Синонимы — запрещены во всех публичных текстах. Это прямое продолжение словаря из `myuno_tone_of_voice.md` §15.

Причина: поисковые алгоритмы дедуплицируют по entity. Если один и тот же продукт называется «управление недвижимостью», «PM-услуга» и «property management» внутри одного сайта — три слабых entity вместо одной сильной. Если «Chanote», «Chanote title» и «чаноут» используются вперемешку — рассыпается authority на самую важную юридическую тему.

### 1.2 · Запросы клиента первичнее названий продуктов

Внутренний бренд продукта (ContractAI, DueDiligence AI, FloodScore, BankPass) — **вторичен**. Первичен — запрос клиента на естественном языке: «проверить договор покупки квартиры в Таиланде», «как проверить застройщика в Пхукете», «риск затопления виллы», «открыть счёт в Bangkok Bank иностранцу». 

URL, title, H1, первые 200 символов статьи — всегда формулируются языком клиента. Бренд продукта упоминается после того, как клиент нашёл решение своей задачи.

**Следствие:** семантическое ядро строится от запросов к продуктам, не от продуктов к запросам.

### 1.3 · Каждая страница отвечает ровно на один intent

Один URL = один запрос пользователя = одна задача. Страница `/guides/visas/dtv` отвечает на «как получить DTV визу». Она не отвечает одновременно на «что такое DTV», «сколько стоит DTV», «продление DTV» — это соседние страницы в том же кластере.

Это архитектурное решение, а не стилистическое. Клиент, ищущий «DTV visa cost Thailand», должен попасть на страницу, которая точно про стоимость — не на обобщённый гайд, где про стоимость сказано в шестом абзаце.

---

## 2 · Позиционирующее ядро

Первый уровень семантики — как myUNO описывает саму себя. Всё остальное в документе выводится отсюда.

### 2.1 · Формула позиционирования (одно предложение)

> **myUNO — цифровая инфраструктура для иностранцев в Юго-Восточной Азии, построенная вокруг операций с недвижимостью, по модели государственных услуг.**

Эта формула обязательна в: about-странице, press kit, первых абзацах pillar-статей, schema.org `description` главной страницы, LinkedIn-bio основателя, любом pitch-материале.

### 2.2 · Пять слов-якорей

Ядро построено на пяти словах-якорях. Они присутствуют в высокочастотной позиции (H1, first 100 chars, meta description, slug, alt-text) на критических страницах. **Никогда не заменяются синонимами.**

| Слово-якорь | Русский | Английский | Употребление |
|---|---|---|---|
| 1 | инфраструктура | infrastructure | Главная, about, PR |
| 2 | недвижимость | real estate | Ядро продуктовой семантики |
| 3 | сопровождение | navigation / assistance | Услуги, консьерж |
| 4 | сделка | transaction / deal | Транзакционный слой |
| 5 | соответствие (compliance) | compliance | Юридический слой |

Шесть слов-якорей второго уровня дополняют ядро: **доверие / trust, иностранец / foreigner, Пхукет / Phuket, Таиланд / Thailand, escrow, AI-консьерж / AI-concierge**.

### 2.3 · Чем myUNO не является (семантическая оборона)

Эти формулировки должны явно присутствовать в about, press и pillar-контенте, чтобы поисковик не склеил платформу с неправильной категорией:

- Не риелторское агентство (мы — институция, сопровождающая сделку, не продавец листингов)
- Не маркетплейс услуг (мы — инфраструктура с курируемой партнёрской сетью)
- Не туристическое агентство
- Не OTA-агрегатор краткосрочной аренды
- Не инвестиционный фонд (хотя Ignatev Capital — отдельный HNW-mandate)
- Не крипто-платформа
- Не инфобизнес, не коучинговый проект

### 2.4 · Формулы для meta description на разных уровнях

Эталонные строки для meta description (≤160 chars). На них ориентируются все новые страницы.

**Главная:** `myUNO — цифровая инфраструктура для иностранцев в Таиланде. Недвижимость, визы, compliance, сопровождение сделок на Пхукете. На русском и английском.`

**Invest:** `Инвестиции в недвижимость Пхукета: off-plan и вторичный рынок. Due diligence, escrow, ClearView-рейтинги застройщиков. Сопровождение сделки от myUNO.`

**ClearView:** `ClearView — публичная система рейтингов off-plan проектов Пхукета. Институциональная методология, 8 категорий, рейтинги AAA–BB. Независимая оценка.`

**Stay:** `Долгосрочная и краткосрочная аренда на Пхукете. Верифицированные объекты, прозрачные договоры, depositSafe. Без скрытых комиссий агента.`

---

## 3 · Отраслевая таксономия (три оси)

Всё многообразие запросов, продуктов и контента раскладывается по трём перпендикулярным осям. Каждая страница, каждая статья, каждая услуга тегируется по всем трём осям. Это основа внутренней перелинковки и логики AI-консьержа.

### 3.1 · Ось A · Lifecycle (фаза отношений с дестинацией)

Семь фаз из `myuno_segmentation_framework.md`. Используются как фасет в Knowledge Hub и как тег в CRM.

| Slug | RU | EN | Intent клиента |
|---|---|---|---|
| `scout` | разведчик | scout | «Присматриваюсь» |
| `tourist` | турист | tourist | «На отдыхе» |
| `snowbird` | сезонный | snowbird | «Каждый сезон» |
| `nomad` | цифровой кочевник | digital nomad | «Работаю удалённо» |
| `settler` | новый резидент | new expat | «Переезжаю» |
| `resident` | резидент | resident | «Живу здесь» |
| `absentee` | удалённый владелец | absentee owner | «Владею, не живу» |
| `returnee` | возвращенец | returnee | «Возвращаюсь после паузы» |

### 3.2 · Ось B · Economic Role (экономическая роль)

Шесть ролей. Определяют монетизационную логику и тип продуктовой оферты.

| Slug | RU | EN | Монетизация |
|---|---|---|---|
| `consumer` | потребитель | consumer | Escrow 8–15% на сервисах |
| `resident-user` | житель-пользователь | resident-user | Подписка + per-service |
| `investor-passive` | пассивный инвестор | passive investor | Комиссия 5–10% off-plan, PM revenue share |
| `investor-active` | активный инвестор | active investor | Комиссия + management retainer |
| `operator` | оператор | operator | PM подписка + revenue share |
| `provider` | партнёр-провайдер | service provider | Листинг + revenue share |

### 3.3 · Ось C · Situation Cluster (жизненная ситуация)

Десять кластеров из `myuno_segmentation_framework.md §5`. Это основа SEO-сайтмапа ситуационных лендингов (`/arrival`, `/buying`, etc.).

| Slug | RU | EN | Ключевой intent |
|---|---|---|---|
| `arrival` | прибытие и ориентация | arrival & orientation | «Только что прилетел» |
| `stay-longer` | продление пребывания | extension & transition | «Решаю остаться» |
| `settle` | обустройство | settlement | «Живу и обустраиваюсь» |
| `investing` | выбор инвестиции | investment consideration | «Думаю о покупке» |
| `buying` | сделка | transaction | «Покупаю / продаю» |
| `manage` | управление | operations & management | «Управляю объектом» |
| `compliance` | соответствие | legal & compliance | «Виза, налоги, регистрация» |
| `emergency` | экстренное | emergency | «Срочно помогите» |
| `lifestyle` | образ жизни | lifestyle | «Еда, спорт, сообщество» |
| `leaving` | выход и возврат | exit & re-entry | «Уезжаю / продаю» |

**Правило тегирования:** каждая страница получает 1 lifecycle (или `all`), 1–2 roles, ровно 1 cluster (максимум 2 — в пограничных случаях). Это матчится с полями `services.lifecycle[]`, `services.role[]`, `services.cluster` из `ServiceCatalogue_v2.jsx`.

---

## 4 · Семантические пласты контента

Контент платформы делится на пять пластов. Каждый имеет свою роль в поисковой воронке и свои правила оформления.

### 4.1 · Pillar pages (опорные страницы)

Одна страница на одну широкую тему. Длина — 2 500–4 000 слов. Задача — ранжироваться по самому частотному запросу категории и собирать ссылки из всего кластера.

**Базовые pillar-страницы myUNO (10 шт., приоритет Y1):**

1. Покупка недвижимости в Таиланде иностранцем (URL: `/guides/buying-property-thailand`)
2. Foreign ownership в Таиланде: freehold, leasehold, структуры (URL: `/guides/foreign-ownership-thailand`)
3. Визы Таиланда для долгого пребывания: DTV, LTR, Elite, Non-B (URL: `/guides/visas-thailand`)
4. Налоги иностранца в Таиланде и ДТТ (URL: `/guides/taxes-thailand-foreigner`)
5. Управление недвижимостью на Пхукете (URL: `/guides/property-management-phuket`)
6. Due diligence off-plan проектов в Таиланде (URL: `/guides/off-plan-due-diligence`)
7. Chanote и другие титулы собственности в Таиланде (URL: `/guides/thai-land-titles`)
8. Переезд на Пхукет: пошаговый план (URL: `/guides/relocation-phuket`)
9. Сдача недвижимости в аренду: STR и LTR на Пхукете (URL: `/guides/rental-phuket-str-ltr`)
10. Продажа недвижимости в Таиланде: налоги, процесс, комиссии (URL: `/guides/selling-property-thailand`)

Каждая pillar-страница имеет зеркало на английском (`/en/guides/...`) и опционально на китайском/немецком с месяца 6/9.

### 4.2 · Cluster articles (кластерные статьи)

По 5–10 статей вокруг каждой pillar. Длина — 800–1 500 слов. Отвечают на один конкретный long-tail запрос.

**Пример кластера вокруг pillar 1 (покупка):**

- Как проверить застройщика в Таиланде (→ ссылается на ClearView)
- Структура сделки off-plan vs secondary в Таиланде
- Какие документы нужны иностранцу для покупки квартиры в Таиланде
- Налоги при покупке недвижимости в Таиланде в 2026
- Escrow при покупке недвижимости в Таиланде: как работает
- Сроки closing сделки в Таиланде: от бронирования до Chanote
- Юридические риски покупки недвижимости в Таиланде
- Риски покупки квартиры на стадии котлована в Таиланде
- Разница freehold и leasehold в Таиланде
- Как оформить company structure для владения виллой в Таиланде

### 4.3 · Programmatic SEO (шаблонные страницы)

Автогенерируемые страницы с общим шаблоном, заполняемые данными. Покрывают длинный хвост запросов «[услуга] в [районе]» или «[услуга] для [персоны]».

**Шаблоны первой волны:**

- `/rent/long-term/[area]` — долгосрочная аренда по 12–15 районам Пхукета (Bang Tao, Cherngtalay, Rawai, Kata, Patong, Kamala, Laguna, Nai Harn, Chalong, Phuket Town, Naiyang, Mai Khao, Surin)
- `/buy/off-plan/[area]` — off-plan проекты по районам
- `/buy/condos/[area]` — готовые квартиры по районам
- `/services/[category]/[area]` — услуги категории в районе (уборка в Bang Tao и т.д.)
- `/for/[persona]` — 25 персон (покрыто в §3.2 IA)
- `/clearview/developers/[slug]` — публичные карточки застройщиков
- `/clearview/projects/[slug]` — публичные карточки проектов

Общее правило: programmatic страница публикуется только если у неё есть **минимум один уникальный data point** (цена, количество листингов, конкретный проект). Пустые шаблоны не публикуются — это фильтр Google Helpful Content Update.

### 4.4 · Transactional pages (транзакционные страницы)

Страницы, приносящие прямую выручку: оферта услуги, карточка объекта, карточка проекта, bundle. SEO здесь вторичен — первичен conversion. Семантическая задача — краткая и точная самоидентификация для семантической сетки сайта, а не борьба за топ.

### 4.5 · Trust pages (страницы доверия)

About, Ombudsman-статус, Team, Methodology (ClearView), Legal, Data Protection. Низкий поисковый трафик, высокая роль в E-E-A-T сигналах и в конверсии после органического клика на pillar. Семантически — это «подпись под институцией».

---

## 5 · Семантика продуктов и вертикалей

Здесь фиксируются канонические имена всех продуктовых сущностей. Эти таблицы — источник правды для всех system prompts, лендингов, каталогов, email-шаблонов.

### 5.1 · Платформенные уровни

| Уровень | Каноническое имя | Что значит для пользователя |
|---|---|---|
| Платформа | myUNO | Вся инфраструктура |
| Real Estate Core | myUNO Invest | Инвестиции и сделки с недвижимостью |
| Stay | myUNO Stay | Аренда (STR + LTR) |
| Personal account | myUNO App | Личный кабинет резидента |
| Owner tools | myUNO Owner | Инструменты собственника |
| PM tools | myUNO PM | Операционные инструменты управляющего |
| HNW mandate | Ignatev Capital | HNW-сделки $7M+ |
| Rating system | ClearView™ | Публичная методология оценки |
| Developer portal | myUNO Developers | B2B для застройщиков |

### 5.2 · AI-продукты

У каждого AI-продукта — внутренний бренд (для press, for пользователь-geek) и каноническая пользовательская формулировка.

| Внутренний бренд | Каноническая формулировка (RU) | Каноническая формулировка (EN) |
|---|---|---|
| ContractAI | анализ договора | contract review |
| DueDiligence AI | проверка проекта | project due diligence |
| FloodScore | оценка риска затопления | flood risk score |
| ChanoteCheck | проверка титула собственности | title deed check |
| VisaTrack | отслеживание визы | visa tracker |
| TM30 Auto | автоматическая TM30 регистрация | TM30 auto-filing |
| TaxNav | налоговый навигатор | tax navigator |
| BankPass | открытие банковского счёта | bank account opening |
| ExchangeBot | обмен валюты | currency exchange |
| RentMatch | подбор аренды | rental matching |
| DepositSafe | эскроу депозита | deposit escrow |
| StaySync | channel manager | channel manager |
| PropertySearch | поиск недвижимости | property search |
| MediFind | поиск клиники | clinic finder |
| SafeEats | верифицированные рестораны | verified restaurants |
| MotoGuard | защита при аренде мотобайка | motorbike protection |
| Phuket Price Index | Phuket Residential Price Index | Phuket Residential Price Index |

### 5.3 · Каноническая лексика real estate

Прямое следствие `myuno_tone_of_voice.md §15`, расширенное для SEO-контекста.

| Каноническое | Запрещённые замены |
|---|---|
| объект | недвижимость-как-вещь, юнит, property (внутри RU-текста), собственность |
| сделка | приобретение, операция, трансакция |
| покупатель | инвестор-покупатель, клиент-покупатель |
| продавец | текущий собственник (в формальном контексте — допустимо) |
| застройщик | девелопер (допустимо параллельно), developer |
| Chanote / чаноут | чаноте (ошибка), freehold-документ (не синоним) |
| off-plan | на стадии строительства (пояснение), котлован (жаргон — не используем) |
| секундарный рынок / вторичный рынок | resale (допустимо в EN-интерфейсе) |
| Land Office | Земельный департамент (для русскоязычного контекста) |
| TM30 | TM30-регистрация (развёртка), 24-hour reporting (пояснение) |
| escrow | эскроу, гарантийный счёт |

---

## 6 · Кластеры поисковых запросов

Это — работающая часть семантического ядра для SEO-команды и контент-лида. Кластеры сгруппированы по смыслу и привязаны к lifecycle × cluster из §3.

Формат: `кластер → тип страницы → пример запросов → canonical URL`. Полный перечень (300+ запросов) ведётся отдельно в `/docs/seo/keyword-map.csv`. Здесь — 12 приоритетных кластеров первой волны.

### 6.1 · Кластер «Покупка недвижимости в Таиланде»

**Lifecycle:** scout, snowbird, resident | **Cluster:** investing, buying | **Language:** RU + EN | **Priority:** P0

**Примеры запросов (RU):** купить квартиру в Таиланде, покупка недвижимости иностранцем Таиланд, покупка квартиры на Пхукете, как купить виллу на Пхукете, off-plan Таиланд, покупка condo Таиланд, freehold Таиланд иностранец, leasehold vs freehold Таиланд

**Примеры запросов (EN):** buy condo Phuket, foreign ownership Thailand, buying property in Thailand as foreigner, Phuket real estate for foreigners, off-plan Phuket, Thailand condo foreign quota

**Canonical pages:** `/guides/buying-property-thailand` (pillar), `/buy`, `/buy/off-plan`, `/buy/condos`, `/guides/foreign-ownership-thailand`

### 6.2 · Кластер «Due diligence / проверка застройщика»

**Lifecycle:** scout, snowbird, resident | **Cluster:** investing | **Priority:** P0

**Запросы:** проверка застройщика Таиланд, due diligence Пхукет, оценка off-plan проекта, рейтинг застройщиков Пхукет, надёжный застройщик Пхукет, Sansiri отзывы, как не потерять деньги на off-plan, недострой Пхукет

**Canonical pages:** `/guides/off-plan-due-diligence`, `/clearview`, `/clearview/projects/*`, `/services/real-estate/due-diligence`

**Связь с ClearView:** рейтинги AAA–BB — ключевая entity, поддерживается schema.org `Review` + `AggregateRating`.

### 6.3 · Кластер «Визы Таиланда»

**Lifecycle:** scout, nomad, settler, snowbird | **Cluster:** stay-longer, compliance | **Priority:** P0

**Запросы (RU):** виза в Таиланд, DTV виза, LTR виза Таиланд, Thailand Elite visa стоимость, Non-B виза, продление туристической визы, виза цифрового кочевника Таиланд

**Запросы (EN):** Thailand DTV visa, LTR visa Thailand, Thailand Elite visa cost, digital nomad visa Thailand, Non-B visa Thailand, Thailand visa for retirees

**Canonical pages:** `/guides/visas-thailand` (pillar), `/guides/visas/dtv`, `/guides/visas/ltr`, `/guides/visas/elite`, `/services/legal/visa`

### 6.4 · Кластер «Налоги иностранца в Таиланде»

**Lifecycle:** resident, absentee, nomad | **Cluster:** compliance | **Priority:** P1

**Запросы:** налог на аренду Таиланд, подоходный налог Таиланд иностранец, ДТТ Россия Таиланд, PND 90 91, налоговый резидент Таиланда, 3-НДФЛ при аренде в Таиланде, tax filing Thailand foreigner

**Canonical pages:** `/guides/taxes-thailand-foreigner` (pillar), `/guides/taxes/rental-income`, `/guides/taxes/tax-residency-thailand`, `/services/finance/tax`

### 6.5 · Кластер «TM30 и 90-day reporting»

**Lifecycle:** nomad, settler, resident | **Cluster:** compliance | **Priority:** P1

**Запросы:** TM30 Таиланд, штраф TM30, 90 day reporting Таиланд, регистрация иностранца в Таиланде, как подать TM30, TM30 онлайн

**Canonical pages:** `/guides/tm30-thailand`, `/guides/90-day-reporting`, `/services/legal/compliance`

### 6.6 · Кластер «Аренда long-term Пхукет»

**Lifecycle:** nomad, settler, resident | **Cluster:** stay-longer, settle | **Priority:** P0

**Запросы:** снять виллу Пхукет долгосрочно, аренда квартиры Пхукет на год, long term rental Phuket, аренда Bang Tao, аренда Rawai, снять дом Пхукет без агента, договор аренды Таиланд

**Canonical pages:** `/rent/long-term`, `/rent/long-term/[area]` (programmatic), `/guides/rental-phuket-str-ltr` (pillar), `/services/real-estate/rent-ltr`

### 6.7 · Кластер «Управление недвижимостью Пхукет»

**Lifecycle:** absentee, resident, investor | **Cluster:** manage | **Priority:** P1

**Запросы:** управляющая компания Пхукет, property management Phuket, сдать квартиру Пхукет в управление, channel manager Airbnb Phuket, отчёты собственника недвижимости Таиланд

**Canonical pages:** `/guides/property-management-phuket` (pillar), `/owner`, `/pm`, `/services/real-estate/pm`

### 6.8 · Кластер «Открытие банковского счёта»

**Lifecycle:** settler, nomad, investor | **Cluster:** settle, compliance | **Priority:** P1

**Запросы:** открыть счёт в банке Таиланд иностранцу, Bangkok Bank foreign account, Kasikorn foreign account, банковский счёт Таиланд без work permit

**Canonical pages:** `/guides/bank-account-thailand`, `/services/finance/banking`

### 6.9 · Кластер «Обмен валют и переводы»

**Lifecycle:** tourist, nomad, resident | **Cluster:** arrival, compliance | **Priority:** P2

**Запросы:** обмен валют Пхукет, где менять деньги Пхукет, перевод рублей в Таиланд, USDT в THB, best exchange rate Phuket

**Canonical pages:** `/services/finance/exchange`, `/services/finance/remittance`, `/guides/money-transfer-thailand`

### 6.10 · Кластер «Экстренное / SOS»

**Lifecycle:** all | **Cluster:** emergency | **Priority:** P0 (trust)

**Запросы:** туристическая полиция Пхукет телефон, скорая Пхукет, ближайшая больница Пхукет для иностранца, emergency number Phuket, потерял паспорт Таиланд

**Canonical pages:** `/sos`, `/guides/emergency-phuket`, `/services/emergency`

### 6.11 · Кластер «Районы Пхукета» (geo cluster)

**Lifecycle:** scout, snowbird, settler | **Cluster:** arrival, investing, settle | **Priority:** P1 (programmatic)

**Запросы:** Bang Tao обзор, Cherngtalay Пхукет, Rawai vs Kata, где лучше жить на Пхукете, Laguna Phuket, Surin Beach, какой район Пхукета выбрать для семьи

**Canonical pages:** `/areas/[area]` (13 geo-lendings), `/guides/areas/where-to-live-phuket`, `/for/families` и т.д.

### 6.12 · Кластер «myUNO как бренд»

**Lifecycle:** all | **Cluster:** any | **Priority:** P0 (brand authority)

**Запросы:** myUNO, myUNO Phuket, myUNO Ignatev, ClearView Ignatev, ombudsman Phuket, Ignatev Estate

**Canonical pages:** `/`, `/about`, `/contact`, `/clearview`, `/press`

---

## 7 · Entity graph (граф сущностей)

Это — семантическая карта связей между ключевыми сущностями. Используется для внутренней перелинковки, для schema.org связей, для логики AI-консьержа при маршрутизации.

### 7.1 · Первичные сущности и их типы

| Entity | Schema.org type | Primary URL |
|---|---|---|
| myUNO | Organization + WebSite | `/` |
| Ignatev Group | Organization | `/about` |
| ClearView | Brand + Service | `/clearview` |
| Phuket Residential Price Index | Dataset | `/insights/price-index` |
| Off-plan project | RealEstateListing + Product | `/buy/off-plan/[slug]` |
| Resale property | RealEstateListing | `/buy/condos/[slug]` |
| Rental property | RealEstateListing | `/rent/[type]/[slug]` |
| Guide article | Article + HowTo | `/guides/[slug]` |
| Service | Service | `/services/[cat]/[slug]` |
| Developer | Organization + Brand | `/clearview/developers/[slug]` |
| Area | Place | `/areas/[slug]` |

### 7.2 · Ключевые отношения (для перелинковки)

Каждая страница обязана иметь внутренние ссылки по следующим правилам:

- **Property → Area**: карточка объекта ссылается на соответствующий `/areas/[area]`
- **Property → Developer → ClearView**: объект → застройщик → его ClearView score
- **Guide → Pillar**: cluster-статья ссылается на свою pillar вверх по иерархии
- **Pillar → Cluster**: pillar содержит навигацию на 5–10 cluster-статей
- **Service → Persona**: карточка услуги ссылается на `/for/[persona]` для релевантных персон
- **Persona → Cluster × Service**: лендинг персоны сегментирует услуги по кластерам ситуаций
- **Area → Services × Properties**: гео-лендинг содержит услуги в районе и листинги в районе

### 7.3 · Граф для AI-консьержа

Тот же граф используется при маршрутизации в `concierge.md` system prompt. После детекции persona + situation cluster AI-консьерж обращается к графу и выбирает 5–7 сервисов с максимальной суммой релевантности (персона-совпадение + cluster-совпадение + lifecycle-совпадение).

Это закрытая выдача — исключает возможность AI-консьержа рекомендовать несуществующие или нерелевантные сервисы.

---

## 8 · Многоязычная стратегия

### 8.1 · Приоритет языков

| Язык | Приоритет | Volume-контента Y1 | Persona-якоря |
|---|---|---|---|
| Русский | P0 | 70% всего корпуса | P1, P5, P6, P7, P8, P9 |
| Английский | P0 | 25% всего корпуса | P3, P4, P9, P10 |
| Китайский (упрощённый) | P1 (с месяца 6) | 5% | P2 |
| Немецкий | P2 (с месяца 9) | отдельные страницы | P3 |
| Тайский | P3 | только compliance-страницы для операторов | P21 |

### 8.2 · Правила маршрутизации языков

- URL-шаблон: `myuno.app/...` для русского (default), `myuno.app/en/...`, `myuno.app/cn/...`, `myuno.app/de/...`
- НЕ используем языковые субдомены (`ru.myuno.app`) — это прямое указание из `07-information-architecture.md §15.3`
- `hreflang` обязателен на всех мультиязычных страницах
- `x-default` указывает на русскую версию
- Canonical — свой на каждый язык (не общий)

### 8.3 · Правила перевода контента

- Продуктовые названия (ContractAI, ClearView, Chanote) **не переводятся** (транслитерация в RU только там, где слово уже закрепилось: «чаноут» — допустимо как вспомогательная транслитерация, но canonical — Chanote)
- Юридические термины остаются на языке оригинала с пояснением (TM30, PND 90/91, FET)
- Персоны и кластеры имеют каноническое имя на каждом языке (§3)
- Ни один перевод не создаётся AI без ревью носителя. Tone of voice (§3 в `myuno_tone_of_voice.md`) проверяется на каждом языке отдельно

---

## 9 · Schema.org и техническая SEO-семантика

### 9.1 · Обязательная разметка по типам страниц

Из `07-information-architecture.md §11.5`, расширено:

| Тип страницы | Schema types |
|---|---|
| Главная | `Organization` + `WebSite` + `SearchAction` |
| About | `AboutPage` + `Organization` |
| Pillar-статья | `Article` + `HowTo` + `BreadcrumbList` |
| Cluster-статья | `Article` + `BreadcrumbList` + `FAQPage` (если есть FAQ) |
| Карточка объекта | `RealEstateListing` + `Offer` + `Place` |
| Карточка проекта (off-plan) | `RealEstateListing` + `Offer` + `Review` (ClearView) |
| ClearView-проект | `Review` + `AggregateRating` + `Service` |
| Сервисная страница | `Service` + `Offer` |
| Bundle | `Product` + `Offer` |
| Persona-лендинг | `CollectionPage` + `Service` (links) |
| Area-лендинг | `Place` + `CollectionPage` |
| FAQ-блок на любой странице | `FAQPage` |

### 9.2 · Обязательные поля на всех публичных страницах

- `<title>` ≤60 chars, уникален
- `<meta description>` ≤160 chars, уникален
- `<link rel="canonical">`
- `<meta property="og:...">` (title, description, image, url, type, locale)
- `<meta name="twitter:card">`
- `<link rel="alternate" hreflang>` для мультиязычных

### 9.3 · Entity consistency

В любом schema.org блоке на любой странице имя сущности (Organization name, Product name, Service name) **строго совпадает** с каноническим именем из §5. Расхождение — дефект, отлавливается в CI через lint-правило.

---

## 10 · Управление семантикой

### 10.1 · Ответственность

| Область | Владелец |
|---|---|
| Позиционирующее ядро (§2) | Pavel + Content Lead |
| Таксономия (§3) | Product + CTO |
| Лексика продуктов (§5) | Pavel + Product |
| Keyword map (§6 + `/docs/seo/keyword-map.csv`) | SEO/Content Lead |
| Schema.org implementation (§9) | CTO |
| Перевод / многоязычность (§8) | Content Lead + native reviewers |

### 10.2 · Review cycle

- **Еженедельно** — новые запросы в keyword-map (Google Search Console + Яндекс.Вебмастер → запросы без посадочной страницы → добавить в план)
- **Ежемесячно** — аудит топ-20 страниц по трафику: совпадают ли фактические запросы с каноническим intent страницы
- **Квартально** — ревью канонических имён (§5): появились ли дрейф-синонимы в продакшне
- **Годовой** — полный ревью позиционирующего ядра (§2), возможен major update

### 10.3 · Правила изменения

- Добавить новый кластер запросов — PR в этот файл + создание pillar + минимум 3 cluster-страниц перед merge
- Добавить новый продукт в §5 — только после согласования с Pavel
- Изменить каноническое имя существующей сущности — требует redirect-стратегии (см. `07-information-architecture.md §13`) и полного аудита всех упоминаний

### 10.4 · Anti-patterns (чего не делать)

- Создавать страницу без tagging по всем трём осям из §3
- Дублировать intent на двух разных URL (каннибализация)
- Использовать синонимы канонических имён в H1/title/meta
- Публиковать programmatic-страницу без уникального data point
- Переводить продуктовые бренды (ContractAI → «ДоговорАИ» — запрещено)
- Создавать keyword-stuffed тексты в ущерб tone of voice (любой запрещённый термин из `myuno_tone_of_voice.md` — стоп)
- Делать pillar без schema.org `HowTo` или `Article`
- Оставлять meta description пустым или автогенерированным из первых слов страницы

---

## 11 · Проверочный чек-лист для любой новой публичной страницы

Перед merge нового маршрута / новой статьи — пройти:

**Семантика**
- [ ] Ровно один intent, сформулированный одним предложением
- [ ] Каноническое имя сущности совпадает с §5
- [ ] Lifecycle / Role / Cluster теги присвоены (§3)
- [ ] Кластер запросов определён (§6 или добавлен в keyword-map)

**Контент**
- [ ] Tone of voice пройден (см. `myuno_tone_of_voice.md §14`)
- [ ] Первое предложение — про клиента, не про нас
- [ ] Есть минимум одна цифра или конкретный факт
- [ ] Есть раздел «что не входит / что нас беспокоит» для коммерческих страниц

**SEO**
- [ ] Unique `<title>` ≤60 chars с включением основного запроса кластера
- [ ] Unique `<meta description>` ≤160 chars по формуле §2.4
- [ ] H1 единственный и содержит основной запрос
- [ ] Canonical tag
- [ ] hreflang для мультиязычных
- [ ] Schema.org из §9.1
- [ ] OG / Twitter tags
- [ ] Добавлена в `sitemap.xml`
- [ ] Внутренние ссылки по правилам §7.2

**Перелинковка**
- [ ] Ссылка вверх (parent / pillar)
- [ ] Ссылка вниз (cluster / related)
- [ ] Ссылка на соответствующий сервис / CTA
- [ ] Breadcrumbs

**Технически**
- [ ] URL в kebab-case, на английском, ≤5 слов
- [ ] Правильный субдомен (§2.2 IA)
- [ ] Mobile 375px проверен
- [ ] Core Web Vitals (LCP < 2.5s, CLS < 0.1)

---

## 12 · Промпт для AI-агента (семантический ревью)

Когда AI-агент создаёт новую страницу — прикрепляется этот блок:

```
Ты редактор-семантик myUNO. Перед merge новой публичной страницы 
сверься с /docs/canonical/10-semantic-core.md и ответь на 12 пунктов:

1. Какой единственный intent у этой страницы? (одно предложение)
2. К какому кластеру запросов (§6) относится? Если новый — какой pillar?
3. Lifecycle / Role / Cluster теги? (§3)
4. H1 содержит основной запрос кластера? 
5. Title и meta description соответствуют формулам §2.4?
6. Использованы ли канонические имена из §5 без синонимов?
7. Есть ли запрещённые слова из tone-of-voice? («лучший», «уникальный», «революционный», urgency-лексика)
8. Schema.org тип из §9.1 применён?
9. Внутренние ссылки по правилам §7.2 поставлены? (parent, cluster, service)
10. Мультиязычность: hreflang корректен?
11. URL-структура соответствует §11 чек-листу?
12. Нет каннибализации с существующими страницами?

Если хоть одно «нет» — страница не мёрджится, fix-list в комментарий PR.
```

---

## 13 · Связанные документы и приоритет правок

При конфликте с другими каноническими документами — порядок приоритета:

1. `myuno_tone_of_voice.md` — в вопросах языка и запрещённой лексики (выше)
2. `07-information-architecture.md` — в вопросах URL и субдоменов (выше для structure)
3. `myuno_segmentation_framework.md` — в вопросах персон и кластеров (выше для taxonomy)
4. **Этот документ (`10-semantic-core.md`)** — в вопросах именования сущностей, keyword-map, schema.org, canonical meta (выше)
5. `08-ai-prompts-library.md` — в вопросах поведения AI-агентов (следует за семантикой)
6. `09-data-schema.md` — технические имена полей БД (отдельный слой)

---

## 14 · ESLint rule · `no-canonical-synonyms`

Правило ловит использование синонимов канонических имён из §5 в строковых литералах, JSX-текстах и markdown. Источник правды — §5.3 и §5.2 этого документа. Пары запрещённое → каноническое дублируются в коде правила (compromise в пользу скорости; §17 отмечает автопарсинг §5 как задачу уровня M10).

**Путь:** `/packages/eslint-config/rules/no-canonical-synonyms.js`

```javascript
'use strict';

// Пары { forbidden, canonical, contexts }
// contexts: 'all' | 'ru' | 'en' | 'commercial'
const FORBIDDEN_SYNONYMS = [
  // Real estate лексика (§5.3)
  { forbidden: 'юнит', canonical: 'объект', contexts: ['ru'] },
  { forbidden: 'собственность', canonical: 'объект', contexts: ['ru', 'commercial'] },
  { forbidden: 'приобретение', canonical: 'сделка', contexts: ['ru'] },
  { forbidden: 'трансакция', canonical: 'сделка', contexts: ['ru'] },
  { forbidden: 'чаноте', canonical: 'Chanote', contexts: ['ru'] },
  { forbidden: 'котлован', canonical: 'off-plan', contexts: ['ru', 'commercial'] },
  { forbidden: 'Земельный департамент', canonical: 'Land Office', contexts: ['ru'] },
  { forbidden: 'сбор', canonical: 'комиссия', contexts: ['ru', 'commercial'] },
  { forbidden: 'гарантийный счёт', canonical: 'escrow', contexts: ['ru'] },

  // Продуктовые имена (§5.2)
  { forbidden: 'КонтрактAI', canonical: 'ContractAI', contexts: ['all'] },
  { forbidden: 'ДоговорAI', canonical: 'ContractAI', contexts: ['all'] },
  { forbidden: 'Клиарвью', canonical: 'ClearView', contexts: ['all'] },
  { forbidden: 'КлирВью', canonical: 'ClearView', contexts: ['all'] },
  { forbidden: 'myuno', canonical: 'myUNO', contexts: ['all'] },
  { forbidden: 'MyUNO', canonical: 'myUNO', contexts: ['all'] },
  { forbidden: 'My UNO', canonical: 'myUNO', contexts: ['all'] },
  { forbidden: 'MYUNO', canonical: 'myUNO', contexts: ['all'] },

  // Tone of voice (из 03-tone-of-voice §15)
  { forbidden: 'пользователь', canonical: 'клиент', contexts: ['ru', 'commercial'] },
  { forbidden: 'юзер', canonical: 'клиент', contexts: ['ru'] },
  { forbidden: 'лид', canonical: 'клиент', contexts: ['ru', 'commercial'] },
  { forbidden: 'поставщик', canonical: 'партнёр', contexts: ['ru'] },
  { forbidden: 'вендор', canonical: 'партнёр', contexts: ['ru'] },
];

const CYRILLIC_RE = /[А-Яа-яЁё]/;
const LATIN_RE = /[A-Za-z]/;

function isCommercialFile(f) {
  return /\/(marketing|for|services|guides|rent|buy|clearview|landing)\//i.test(f);
}

function matchesContext(contexts, text, filename) {
  if (contexts.includes('all')) return true;
  if (contexts.includes('ru') && CYRILLIC_RE.test(text)) return true;
  if (contexts.includes('en') && LATIN_RE.test(text) && !CYRILLIC_RE.test(text)) return true;
  if (contexts.includes('commercial') && isCommercialFile(filename)) return true;
  return false;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkString(text, filename) {
  const violations = [];
  for (const rule of FORBIDDEN_SYNONYMS) {
    if (!matchesContext(rule.contexts, text, filename)) continue;
    const pattern = new RegExp(
      `(?:^|[^а-яёa-z0-9])${escapeRegex(rule.forbidden.toLowerCase())}(?:[^а-яёa-z0-9]|$)`,
      'i'
    );
    if (pattern.test(` ${text} `)) violations.push(rule);
  }
  return violations;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Запрещает синонимы канонических имён из 10-semantic-core.md §5',
      category: 'Semantic Consistency',
      recommended: true,
    },
    schema: [],
    messages: {
      forbiddenSynonym:
        'Запрещённый синоним: "{{forbidden}}". Используй каноническое имя: "{{canonical}}" (10-semantic-core.md §5)',
    },
  },

  create(context) {
    const filename = context.getFilename();

    if (
      filename.includes('10-semantic-core.md') ||
      filename.includes('no-canonical-synonyms') ||
      filename.endsWith('.test.ts') ||
      filename.endsWith('.test.tsx')
    ) {
      return {};
    }

    function report(node, text) {
      const violations = checkString(text, filename);
      for (const v of violations) {
        context.report({
          node,
          messageId: 'forbiddenSynonym',
          data: { forbidden: v.forbidden, canonical: v.canonical },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string' && node.value.length > 2) report(node, node.value);
      },
      TemplateElement(node) {
        if (node.value && node.value.cooked && node.value.cooked.length > 2) {
          report(node, node.value.cooked);
        }
      },
      JSXText(node) {
        if (node.value && node.value.trim().length > 2) report(node, node.value);
      },
    };
  },
};
```

**Подключение в `/packages/eslint-config/index.js`:**

```javascript
module.exports = {
  // ... existing config ...
  plugins: ['myuno'],
  rules: {
    'myuno/no-forbidden-tone': 'error',
    'myuno/no-canonical-synonyms': process.env.CI ? 'error' : 'warn',
  },
};
```

**Регистрация плагина в `/packages/eslint-config/plugin.js`:**

```javascript
module.exports = {
  rules: {
    'no-forbidden-tone': require('./rules/no-forbidden-tone'),
    'no-canonical-synonyms': require('./rules/no-canonical-synonyms'),
  },
};
```

---

## 15 · CI-скрипт `validate-semantic.ts`

Скрипт обходит публичные Next.js страницы в `/apps/*/app/**/page.{tsx,jsx}`, проверяет восемь типов нарушений из §9.2 и §11. Exit code для блокировки PR.

**Путь:** `/scripts/validate-semantic.ts`

```typescript
#!/usr/bin/env tsx
/**
 * validate-semantic.ts
 *
 * Проверяет соответствие публичных страниц требованиям 10-semantic-core.md §9.2 и §11.
 *
 * Запуск:
 *   pnpm validate-semantic
 *   pnpm validate-semantic --verbose
 */

import { readFileSync, existsSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';

type Severity = 'error' | 'warning';

interface Violation {
  file: string;
  rule: string;
  severity: Severity;
  message: string;
}

const violations: Violation[] = [];

const APP_DIRS = [
  'apps/web/app',
  'apps/invest/app',
  'apps/clearview/app',
  'apps/stay/app',
];

const EXCLUDED_PATTERNS = [
  /\/(api|admin|_internal)\//,
  /\/\[.*\]\/.*\[.*\]\/.*\[.*\]\//,
];

function findPublicPages(): string[] {
  const files: string[] = [];
  for (const dir of APP_DIRS) {
    if (!existsSync(dir)) continue;
    const matches = globSync(`${dir}/**/page.{tsx,jsx}`);
    for (const match of matches) {
      if (EXCLUDED_PATTERNS.some((p) => p.test(match))) continue;
      files.push(match);
    }
  }
  return files;
}

function getUrlFromFile(file: string): string {
  const relative = file.replace(/^apps\/[^/]+\/app/, '').replace(/\/page\.(tsx|jsx)$/, '');
  return relative || '/';
}

function checkUrlConventions(file: string) {
  const url = getUrlFromFile(file);
  const segments = url.split('/').filter(Boolean);

  for (const seg of segments) {
    if (seg.startsWith('[') && seg.endsWith(']')) continue;
    if (seg.startsWith('(') && seg.endsWith(')')) continue;

    if (!/^[a-z0-9-]+$/.test(seg)) {
      violations.push({
        file,
        rule: 'url-kebab-case',
        severity: 'error',
        message: `URL-сегмент "${seg}" нарушает kebab-case. URL: ${url}`,
      });
    }

    if (/[А-Яа-яЁё]/.test(seg)) {
      violations.push({
        file,
        rule: 'url-no-cyrillic',
        severity: 'error',
        message: `URL-сегмент "${seg}" содержит кириллицу.`,
      });
    }

    if (seg.split('-').length > 5) {
      violations.push({
        file,
        rule: 'url-max-words',
        severity: 'warning',
        message: `URL-сегмент "${seg}" >5 слов.`,
      });
    }
  }

  if (segments.filter((s) => !s.startsWith('(')).length > 4) {
    violations.push({
      file,
      rule: 'url-max-depth',
      severity: 'error',
      message: `URL глубина >4 уровней: ${url}`,
    });
  }
}

function checkPageMetadata(file: string) {
  const content = readFileSync(file, 'utf-8');
  const url = getUrlFromFile(file);

  const hasMetadata =
    /export\s+const\s+metadata\s*[:=]/.test(content) ||
    /export\s+(async\s+)?function\s+generateMetadata/.test(content);

  if (!hasMetadata) {
    violations.push({
      file,
      rule: 'metadata-missing',
      severity: 'error',
      message: `Файл не экспортирует metadata. URL: ${url}`,
    });
    return;
  }

  if (!/title\s*:/.test(content)) {
    violations.push({ file, rule: 'title-missing', severity: 'error', message: 'metadata без title.' });
  } else {
    const m = content.match(/title\s*:\s*['"`]([^'"`]+)['"`]/);
    if (m && m[1].length > 60) {
      violations.push({
        file,
        rule: 'title-too-long',
        severity: 'warning',
        message: `title ${m[1].length} chars (>60).`,
      });
    }
  }

  if (!/description\s*:/.test(content)) {
    violations.push({
      file,
      rule: 'description-missing',
      severity: 'error',
      message: 'metadata без description.',
    });
  } else {
    const m = content.match(/description\s*:\s*['"`]([^'"`]+)['"`]/);
    if (m && m[1].length > 160) {
      violations.push({
        file,
        rule: 'description-too-long',
        severity: 'warning',
        message: `description ${m[1].length} chars (>160).`,
      });
    }
  }

  const hasCanonical =
    /alternates\s*:\s*{[^}]*canonical\s*:/.test(content) ||
    /canonical\s*:\s*['"`]/.test(content);
  if (!hasCanonical) {
    violations.push({
      file,
      rule: 'canonical-missing',
      severity: 'error',
      message: 'Отсутствует alternates.canonical.',
    });
  }

  if (!/openGraph\s*:/.test(content)) {
    violations.push({
      file,
      rule: 'og-missing',
      severity: 'warning',
      message: 'Отсутствует openGraph.',
    });
  }

  const isLocalized = /\/(en|cn|de)\//.test(url);
  if (isLocalized && !/languages\s*:/.test(content)) {
    violations.push({
      file,
      rule: 'hreflang-missing',
      severity: 'error',
      message: 'Мультиязычная страница без alternates.languages.',
    });
  }

  const hasJsonLd =
    /application\/ld\+json/.test(content) ||
    /<JsonLd/.test(content) ||
    /jsonLd/.test(content);

  if (!hasJsonLd) {
    violations.push({
      file,
      rule: 'schema-org-missing',
      severity: 'warning',
      message: 'Страница без JSON-LD schema.org.',
    });
  }

  const hasSegmentation = /lifecycle\s*:/.test(content) && /cluster\s*:/.test(content);
  const systemPages = ['/sos', '/about', '/contact', '/legal', '/pricing'];
  const isSystemPage = systemPages.some((p) => url === p || url.startsWith(`${p}/`));

  if (!hasSegmentation && !isSystemPage) {
    violations.push({
      file,
      rule: 'segmentation-tags-missing',
      severity: 'warning',
      message: 'Страница не экспортирует segmentation теги (lifecycle, cluster).',
    });
  }
}

function checkDuplicateUrls(files: string[]) {
  const urlToFiles = new Map<string, string[]>();
  for (const file of files) {
    const url = getUrlFromFile(file);
    if (!urlToFiles.has(url)) urlToFiles.set(url, []);
    urlToFiles.get(url)!.push(file);
  }

  for (const [url, fs] of urlToFiles.entries()) {
    if (fs.length > 1) {
      for (const f of fs) {
        violations.push({
          file: f,
          rule: 'url-duplicate',
          severity: 'error',
          message: `Дубль URL "${url}" также в: ${fs.filter((x) => x !== f).join(', ')}`,
        });
      }
    }
  }
}

function printReport(verbose: boolean) {
  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warning');

  if (violations.length === 0) {
    console.log('✓ Semantic validation passed. 0 violations.');
    return;
  }

  console.log(`\n=== Semantic Validation Report ===`);
  console.log(`Errors:   ${errors.length}`);
  console.log(`Warnings: ${warnings.length}\n`);

  const byRule = new Map<string, Violation[]>();
  for (const v of violations) {
    if (!byRule.has(v.rule)) byRule.set(v.rule, []);
    byRule.get(v.rule)!.push(v);
  }

  for (const [rule, vs] of Array.from(byRule.entries()).sort()) {
    const prefix = vs[0].severity === 'error' ? '✗' : '⚠';
    console.log(`${prefix} ${rule} (${vs.length})`);
    for (const v of vs.slice(0, verbose ? 999 : 5)) {
      console.log(`  ${path.relative(process.cwd(), v.file)}`);
      console.log(`    ${v.message}`);
    }
    if (!verbose && vs.length > 5) {
      console.log(`  ... ещё ${vs.length - 5} (--verbose для полного списка)`);
    }
    console.log('');
  }
}

function main() {
  const verbose = process.argv.includes('--verbose');
  const files = findPublicPages();
  console.log(`Found ${files.length} public pages.\n`);

  for (const file of files) {
    checkUrlConventions(file);
    checkPageMetadata(file);
  }
  checkDuplicateUrls(files);
  printReport(verbose);

  const errorCount = violations.filter((v) => v.severity === 'error').length;
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
```

**Регистрация в корневом `package.json`:**

```json
{
  "scripts": {
    "validate-semantic": "tsx scripts/validate-semantic.ts",
    "validate-semantic:verbose": "tsx scripts/validate-semantic.ts --verbose"
  }
}
```

**GitHub Action `/.github/workflows/semantic-check.yml`:**

```yaml
name: Semantic Core Validation

on:
  pull_request:
    paths:
      - 'apps/**/*.tsx'
      - 'apps/**/*.jsx'
      - 'apps/**/app/**/*.ts'
      - 'docs/canonical/**'
      - 'packages/eslint-config/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: ESLint
        run: pnpm lint
      - name: Semantic Core validation
        run: pnpm validate-semantic
```

---

## 16 · PR-template

Чек-лист §11 встраивается в GitHub PR-template. Блокирует merge для PR, затрагивающих публичный контент, URL, продуктовые имена, schema.org или system prompts.

**Путь:** `/.github/pull_request_template.md` (если файл уже существует — добавить секцию «Semantic Core»)

```markdown
## Описание

<!-- Что и зачем -->

## Тип изменения

- [ ] Bug fix
- [ ] Новая фича
- [ ] Рефактор
- [ ] Изменение публичного контента / URL / продуктовых имён
- [ ] Изменение инфраструктуры / CI

## Semantic Core · чек-лист

**Заполняется для PR, создающих или меняющих публичные страницы, статьи, продуктовые имена, URL, schema.org, system prompts.**

- [ ] Not applicable — PR не затрагивает публичный контент / URL / продуктовые имена

### Семантика
- [ ] Ровно один intent на страницу, сформулированный одним предложением
- [ ] Каноническое имя сущности совпадает с `10-semantic-core.md §5`
- [ ] Lifecycle / Role / Cluster теги присвоены (§3)
- [ ] Кластер запросов определён (§6 или добавлен в `keyword-map.csv`)

### Контент
- [ ] Tone of voice пройден (`myuno_tone_of_voice.md §14`)
- [ ] Первое предложение — про клиента, не про нас
- [ ] Минимум одна цифра или конкретный факт
- [ ] Раздел «что не входит / что нас беспокоит» (для коммерческих страниц)

### SEO
- [ ] Unique `<title>` ≤60 chars с основным запросом кластера
- [ ] Unique `<meta description>` ≤160 chars по формуле §2.4
- [ ] H1 единственный, содержит основной запрос
- [ ] Canonical tag
- [ ] hreflang для мультиязычных
- [ ] Schema.org из §9.1
- [ ] OG / Twitter tags
- [ ] Добавлена в `sitemap.xml`
- [ ] Внутренние ссылки по §7.2

### Технически
- [ ] URL в kebab-case, английский, ≤5 слов
- [ ] Правильный субдомен (`07-information-architecture.md §2.2`)
- [ ] Mobile 375px проверен
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1

### Автоматические проверки
- [ ] `pnpm lint` проходит (включая `no-canonical-synonyms` и `no-forbidden-tone`)
- [ ] `pnpm validate-semantic` проходит
- [ ] Тесты проходят

## Изменения продуктовых имён (§5)

- [ ] Not applicable

Если applicable:
- [ ] PR в `10-semantic-core.md §5` включён в этот же PR или смержен заранее
- [ ] Все упоминания старого имени в `.tsx`, `.md`, `.ts` заменены
- [ ] System prompts AI-агентов (`/packages/ai/prompts/`) обновлены
- [ ] Schema.org markup на существующих страницах обновлён
- [ ] 301-redirect настроен для изменённых URL
- [ ] Approvers: @pavel + @cto

## Rollback plan

<!-- Как откатить за 1 коммит -->
```

---

## 17 · Промпты для Cursor / Claude Code

Два промпта для AI-агентов: создание публичной страницы и написание статьи Knowledge Hub. Оба начинаются с обязательного чтения этого документа.

### 17.1 · Промпт создания публичной страницы

**Путь:** `/docs/prompts/semantic-page-creation.md`

```markdown
# Промпт: создание новой публичной страницы

Используй как system prompt или префикс для Cursor / Claude Code при задачах
«создай страницу / лендинг / маршрут».

---

КОНТЕКСТ.

Ты разработчик myUNO. Перед работой ты ОБЯЗАН прочитать:

1. `/docs/canonical/10-semantic-core.md` — семантика, именование, SEO-поля
2. `/docs/canonical/07-information-architecture.md` — URL-структура и субдомены
3. `/docs/canonical/03-tone-of-voice.md` — язык и запрещённая лексика
4. `/docs/canonical/01-segmentation-framework.md` — 25 персон и 10 кластеров

ЗАДАЧА.

[Описание страницы]

ПЕРЕД КОДОМ ответь на 12 пунктов из §12 документа `10-semantic-core.md`:

1. Единственный intent страницы (одно предложение на языке клиента)?
2. К какому кластеру запросов (§6) относится? Если новый — какой pillar?
3. Lifecycle / Role / Cluster теги (§3)?
4. 3–5 запросов, по которым страница должна найтись в поиске?
5. Какой subdomain (§2.2 IA)? Обоснуй.
6. Slug URL (kebab-case, английский, ≤5 слов)?
7. Title (≤60 chars) и meta description (≤160 chars по формуле §2.4)?
8. H1?
9. Schema.org type (§9.1)?
10. Внутренние ссылки: parent, child, связанные?
11. Мультиязычность: будут ли версии /en/, /cn/, /de/?
12. Риск каннибализации с существующими страницами?

Жди подтверждения от Павла («ОК» или правки). Только после подтверждения — код.

ТРЕБОВАНИЯ К КОДУ.

1. Создай `page.tsx` в правильной директории.
2. Экспортируй `metadata` со ВСЕМИ полями из §9.2: title, description, alternates.canonical, openGraph, twitter, alternates.languages.
3. JSON-LD через `<JsonLd>` с типом из §9.1.
4. Segmentation-теги:
   ```typescript
   export const segmentation = {
     lifecycle: [...],
     role: [...],
     cluster: '...',
   };
   ```
5. H1 с основным запросом кластера.
6. Первое предложение — про клиента.
7. Минимум одна конкретная цифра.
8. Раздел «Что не входит» или «Что нас беспокоит» для коммерческих.
9. Breadcrumbs, back-навигация, ≥3 внутренние ссылки.
10. Mobile-first 375px.

ЧТО НЕ ДЕЛАТЬ.

— Синонимы канонических имён из §5
— Запрещённые слова: «лучший», «уникальный», «революционный», urgency
— URL с кириллицей, глубиной >4, trailing slash
— Новые subdomain — только из §2.1 IA
— Inline schema.org или tone-of-voice — импортируй из shared

АКЦЕПТ.

— `pnpm lint` проходит
— `pnpm validate-semantic` проходит (0 errors)
— Mobile 375px
— Все поля §9.2 в `<head>` (проверь DevTools)
— Чек-лист §11 заполнен в PR description
```

### 17.2 · Промпт написания статьи Knowledge Hub

**Путь:** `/docs/prompts/semantic-article-creation.md`

```markdown
# Промпт: написание статьи Knowledge Hub

Для задач «напиши pillar» или «напиши cluster-статью».

---

КОНТЕКСТ.

Ты контент-редактор myUNO. Обязательно прочитай:

1. `/docs/canonical/10-semantic-core.md` §4, §5, §6
2. `/docs/canonical/03-tone-of-voice.md` полностью
3. `/docs/canonical/01-segmentation-framework.md` §4, §5
4. Для off-plan / DD / рейтингов — `/docs/canonical/06-clearview-methodology.md`

ЗАДАЧА.

[Тема]

ПЕРЕД ПИСЬМОМ ответь на 10 пунктов:

1. Единственный intent (одно предложение)?
2. Pillar или cluster? К какому кластеру §6?
3. Если cluster — какая pillar родитель?
4. Lifecycle / Role / Cluster теги (§3)?
5. Target personas (§4 segmentation)?
6. 5–10 primary запросов?
7. Длина (pillar 2500–4000, cluster 800–1500)?
8. H2/H3 outline?
9. Связанные статьи (≥5 для pillar, ≥2 для cluster)?
10. Какие данные/цифры/факты нужны (из внешних источников, не придумывать)?

Ожидай подтверждения outline. Только после ОК — писать.

ТРЕБОВАНИЯ К ТЕКСТУ.

1. Первый абзац — проблема глазами клиента. Никакого «myUNO предлагает».
2. Минимум 3 конкретных числа/факта/сроков.
3. Лексика §5 строго.
4. Запрещённые слова: «лучший», «уникальный», «революционный», urgency, «упс» — не используй.
5. Длина предложений 14–18 слов в среднем, максимум 25.
6. Обращение «вы» (строчная) в RU.
7. «Что нас беспокоит» — обязательный раздел в коммерческих статьях.
8. Pillar → 5–10 cluster, cluster → pillar + 1–2 соседних cluster.
9. Источники для каждой юридической/налоговой цифры (Revenue Code, Land Act, BOT).
10. Для pillar — FAQ из 6–10 вопросов.

METADATA в frontmatter `.mdx`:

```yaml
---
title: '[H1] · myUNO'
description: '[по формуле §2.4]'
slug: '[kebab-case-english]'
cluster: '[из §6]'
lifecycle: ['scout', 'snowbird']
role: ['investor-passive']
situationCluster: 'investing'
publishedAt: '2026-04-XX'
author: '[Имя]'
reviewer: '[Имя]'
factCheckedBy: '[Имя]'
language: 'ru'
hreflang:
  en: '/en/guides/[slug]'
schemaType: 'Article'
---
```

АКЦЕПТ.

— Чек-лист §11 пройден
— Канонические имена корректны
— Title/description в лимитах
— ≥3 конкретных числа
— «Что нас беспокоит» (для коммерческих)
— Рабочие внутренние ссылки
— FAQ для pillar
— `pnpm lint` на .mdx проходит
```

---

## 18 · Порядок внедрения активационного слоя

Внедрение секций §14–§17 — отдельная задача после завершения вех M1–M7 из `myuno_implementation_protocol.md`. Не раньше — без M7 (tone-of-voice ESLint rule) правило §14 не имеет соседа, без M6 (лендинги персон) валидатор §15 проверять нечего.

**День 1 (~4 часа):**

1. Создать ESLint rule из §14 в `/packages/eslint-config/rules/no-canonical-synonyms.js` (30 мин)
2. Зарегистрировать в общем конфиге и plugin.js (15 мин)
3. Прогнать `pnpm lint` на всём репо; ожидаемо много warnings (1 час)
4. Исправить критичные или понизить severity до `warn` на 14 дней для постепенной миграции (1 час)
5. Создать `/.github/pull_request_template.md` из §16 или добавить секцию в существующий (15 мин)
6. Commit + PR

**День 2 (~4 часа):**

1. Создать `/scripts/validate-semantic.ts` из §15 (30 мин)
2. Создать GitHub Action `semantic-check.yml` (15 мин)
3. Прогнать `pnpm validate-semantic` локально; починить errors (1–2 часа — зависит от текущего состояния)
4. Создать `/docs/prompts/semantic-page-creation.md` и `/docs/prompts/semantic-article-creation.md` из §17 (15 мин)
5. Патч в `myuno_implementation_protocol.md` M6.ACCEPTANCE: добавить `pnpm validate-semantic` и `pnpm lint` как обязательные пункты (15 мин)
6. Final PR

**Критерий завершения:**

- CI зелёный на main
- Все новые PR проходят через чек-лист §16
- Минимум одна тестовая страница создана по §17.1 и прошла все проверки

**Что НЕ входит в средний уровень (задачи M10):**

- Автопарсинг §5 как источника правды для ESLint rule (сейчас синонимы дублируются в коде — compromise)
- Валидация совпадения canonical имён в JSON-LD со §5
- Мониторинг дрейфа intent через реальные запросы из GSC (требует API-интеграции)
- Автогенерация `keyword-map.csv` из документа
- Визуализация entity graph §7 в виде дашборда

Эти возможности собираются блоком M10 после накопления 50+ публичных страниц и данных органического трафика.

---

*Document · v1.1 · Апрель 2026 · Owner: Pavel + Content Lead + CTO*

*Принцип: семантическое ядро — это контракт между смыслом и поиском. Одно имя, одна сущность, один intent на URL. Всё остальное — ошибка связности.*
