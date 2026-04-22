# myUNO · Segmentation Framework v1.0

> Единая спецификация сегментации пользователей, жизненных ситуаций и сервисов.
> Является источником истины для: CRM-полей, AI-консьержа, каталога услуг, маркетинговых лендингов, контент-плана Knowledge Hub.

---

## 0 · Методологическая основа

Рамка синтезирует четыре академические модели:

1. **Migration-Mobility Continuum** (Cohen, Duncan, Thulemark) — классификация по длительности и намерению пребывания.
2. **Lifestyle Migration** (Benson & O'Reilly) — переезд ради качества жизни, не работы.
3. **Transnationalism** (Vertovec) — люди, живущие «между» странами.
4. **IOM / UN DESA** — формальная юридическая сегментация по визам.

Поверх академических моделей добавлены два практических слоя, критичных для платформы:
- **Экономическая роль** (consumer / investor / operator / provider).
- **Социокультурный модификатор** (язык, семья, спецпотребности).

Итоговая модель — **трёхосевая**: жизненная фаза × экономическая роль × модификатор. Пересечение трёх осей даёт уникальный персональный профиль, по которому AI-консьерж выдаёт персонализированный путь из 5–7 сервисов.

---

## 1 · Ось 1 — Жизненная фаза (Lifecycle Stage)

Базовый классификатор. Определяется через длительность пребывания, тип визы и намерение.

| Код | Фаза | Длительность | Визовой статус | Триггер перехода |
|---|---|---|---|---|
| `scout` | Scout (разведчик) | 3–14 дней | TR / visa exempt | Первый визит с целью оценки |
| `tourist` | Tourist (турист) | 7–30 дней | TR / 60-day | Чистый отдых |
| `snowbird` | Snowbird (зимовщик) | 1–6 мес/год | METV / DTV | Второй сезон подряд |
| `nomad` | Nomad (номад) | 6–24 мес | DTV / Elite | Удалённая работа |
| `settler` | Settler (новосёл) | 0–24 мес | Non-B / Retirement / DTV | Переезд с намерением остаться |
| `resident` | Resident (резидент) | 2+ года | LTR / long-term | 183+ дней, налоговое резидентство |
| `absentee` | Absentee Owner | Не живёт | Non-immigrant / нет | Владеет удалённо |
| `returnee` | Returnee (возвращенец) | Циклично | Варьируется | Продал, возвращается как гость/инвестор |

### Переходы между фазами (Customer Journey)

```
Scout ──► Tourist ──► Snowbird ──► Settler ──► Resident
  │           │           │           │
  │           ▼           ▼           ▼
  └──────► Investor-Passive ──► Absentee Owner ──► Returnee
                                                       │
                                                       └──► Investor-Active (HNW)
```

Каждый переход — триггер для контекстного предложения из каталога. Пример: `tourist.visits > 2 AND stay_duration > 21d → предлагаем Snowbird-пакет`.

---

## 2 · Ось 2 — Экономическая роль (Economic Role)

Определяет, как пользователь извлекает ценность из локации.

| Код | Роль | Суть | Ключевые вертикали |
|---|---|---|---|
| `consumer` | Consumer | Тратит: жильё, сервисы, развлечения | Stay, Lifestyle, Food |
| `resident-user` | Resident-User | Долгосрочно использует инфраструктуру | Home, Health, Family, Transport |
| `investor-passive` | Investor-Passive | Владеет 1–3 объектами удалённо | Invest, PM, Legal |
| `investor-active` | Investor-Active (HNW) | Портфель 3+, серийный покупатель | Invest, Legal, Wealth |
| `operator` | Operator | Бизнес на STR/PM/сервисах | PM, Compliance, B2B |
| `provider` | Provider | Партнёр-поставщик услуг | Partner Portal |

Один человек может совмещать роли: HNW-инвестор часто одновременно Resident-User и Investor-Active. AI-консьерж фиксирует **primary role** + до 2 secondary.

---

## 3 · Ось 3 — Социокультурный модификатор

Не отдельные аудитории — **фильтры** поверх основных осей. Влияют на контент, язык, каналы, услуги.

### 3.1 Язык (Language)
`RU` · `EN` · `CN` · `DE` · `MN` · `BN` · `TH` · `KR` · `JP` · `FR` · `AR`

### 3.2 Домохозяйство (Household)
- `solo` — одиночки
- `couple` — пары без детей
- `family-young` — с детьми 0–6
- `family-school` — с детьми 7–17
- `retiree` — пенсионеры, пусте-гнездо
- `multigenerational` — три поколения (актуально для азиатских аудиторий)

### 3.3 Спецстатус (Special Status)
- `pet-owner` — с питомцами
- `medical` — медицинский турист / хронические заболевания
- `halal` — мусульманское питание и практики
- `kosher` — кошерное питание
- `accessibility` — инвалидность, ограниченная мобильность
- `lgbtq` — ЛГБТК+ (особенно актуально для пар из юрисдикций с ограничениями)
- `athlete` — спортсмен, серьёзные тренировки
- `wedding` — свадебный визит

---

## 4 · Персоны — Фаза × Роль × Модификатор

Это реальные сегменты, для которых платформа создаёт выделенные разделы. Каждая персона — уникальная комбинация трёх осей.

### 4.1 Core Personas (первая волна)

| # | Персона | Фаза | Роль | Модификатор |
|---|---|---|---|---|
| P1 | 🇷🇺 Русскоязычный турист | tourist | consumer | RU · couple/family |
| P2 | 🇨🇳 Китайский турист-инвестор | tourist/scout | consumer/investor-passive | CN |
| P3 | 🇩🇪 Европейский гость | tourist/snowbird | consumer | DE · couple/retiree |
| P4 | 💻 Digital Nomad | nomad | consumer/resident-user | EN · solo/couple |
| P5 | ❄️ Snowbird (зимовщик) | snowbird | consumer/resident-user | RU/DE · couple/retiree |
| P6 | 🏡 Новый русскоязычный экспат | settler | resident-user | RU · family-school |
| P7 | 👨‍👩‍👧 Семья с детьми | settler/resident | resident-user | Any · family-school |
| P8 | 📊 Пассивный инвестор | absentee | investor-passive | RU/DE/CN |
| P9 | 🏦 HNW-инвестор | resident/absentee | investor-active | RU/CN/DE/MN |
| P10 | 🏨 STR/PM оператор | resident | operator | Any |
| P11 | 🇲🇳 Монгольский инвестор | scout/investor-active | consumer/investor-active | MN · multigenerational |
| P12 | 🇧🇩 Бангладешская бизнес-аудитория | absentee/scout | investor-passive | BN · halal |

### 4.2 Extended Personas (вторая волна — специализированные разделы)

| # | Персона | Фаза | Роль | Модификатор | Почему выделен |
|---|---|---|---|---|---|
| P13 | 🐾 Путешественник с питомцем | any | any | pet-owner | Сложный pet import, pet-friendly жильё — 20%+ экспатов |
| P14 | 🏥 Медицинский турист | tourist | consumer | medical | Пхукет — hub для стоматологии, пластики, check-up |
| P15 | 💒 Свадебный путешественник | tourist | consumer | wedding | Destination wedding — $15–80K чек, эко-система 20+ услуг |
| P16 | 🏋️ Спортсмен / Fight camp | tourist/nomad | consumer | athlete | Muay Thai, triathlon, diving — 6K+ приезжающих/год |
| P17 | ☪️ Мусульманский путешественник | any | consumer | halal | Малайзия, ОАЭ, Индонезия, БД — растущий поток |
| P18 | 🌈 ЛГБТК+ путешественник/резидент | any | any | lgbtq | Пхукет относительно дружелюбен — рынок до $ 2M/год |
| P19 | ♿ Путешественник с ограниченными возможностями | any | consumer | accessibility | Нет ни одной специализированной платформы |
| P20 | 🎓 Retiree (пенсионер) | resident | resident-user | retiree · RU/DE/EN/JP | Retirement O-A/O-X visa — отдельная воронка |
| P21 | 🔧 Local Provider (подрядчик) | resident | provider | Any | B2B-аудитория: мастера, клининг, ремонт |
| P22 | 🏗️ Developer (застройщик) | resident | provider | TH/CN | B2B: off-plan, sell-side инструменты |
| P23 | 🏪 Local SMB (ресторан/клиника/школа) | resident | provider | Any | B2B marketplace listing |
| P24 | 🎨 Creative Class (фотограф/архитектор/дизайнер) | nomad/settler | operator/provider | Any | Специфическая проф. инфраструктура |
| P25 | 👨‍🎓 Student / Young Adult | tourist/nomad | consumer | EN · solo | UWC, BIS university, gap year |

### 4.3 Сводная таблица — 25 персон

Всего платформа обслуживает **25 различимых персон**. Из них:
- **12 core** (первая волна, 90% выручки).
- **13 extended** (вторая волна, специализированные разделы, high-intent низкий объём).

---

## 5 · Семантическое ядро жизненных ситуаций

Пользователи не думают в терминах «вертикали». Они думают в терминах **ситуаций**. AI-консьерж распознаёт ситуацию → маппит на кластер услуг.

10 кластеров покрывают весь жизненный цикл от первого визита до выхода из актива.

### Кластер A — Arrival & Orientation («Первый раз здесь»)
Применим к: scout, tourist, snowbird (первый сезон), nomad, settler.

| Ситуация | Сервисы |
|---|---|
| «Только что прилетел» | Трансфер из аэропорта, SIM, обмен валюты, погода, Emergency widget |
| «Не знаю где остановиться» | STR booking, neighborhood guide, сравнение районов |
| «Нужно сориентироваться» | AI-консьерж, карта районов, русскоговорящий гид |
| «Заболел в первый день» | MediFind, медицинский переводчик, страховая |
| «Первое впечатление» | Welcome Pack, Safety Brief, топ-3 места по интересам |

### Кластер B — Extension & Transition («Решаю остаться подольше»)
Scout → Snowbird/Nomad, Tourist → Settler.

| Ситуация | Сервисы |
|---|---|
| «Продлить визу» | VisaTrack, DTV checker, TR extension wizard |
| «Перейти на LTR/Elite/DTV» | Visa advisory, eligibility calculator |
| «Снять жильё на 1–6 мес» | RentMatch, ContractAI, DepositSafe |
| «TM30 и регистрация» | AutoTM30, compliance tracker |
| «Перевезти вещи/питомца» | Relocation service, pet import |

### Кластер C — Settlement («Живу и обустраиваюсь»)
Settler, resident, возвратный snowbird.

| Ситуация | Сервисы |
|---|---|
| «Открыть банковский счёт» | BankPass, Agent banking |
| «Завести транспорт» | CarRent, MotoGuard, конвертация прав |
| «Найти школу/сад» | School Match, сопровождение поступления |
| «Найти врача/педиатра» | MediFind, семейный доктор |
| «Наладить быт» | Уборка, прачечная, мастер на час, интернет |
| «Питомец» | Pet import, vet, pet-friendly жильё |
| «Сообщество» | Meetups, клубы по интересам, языковые группы |
| «Домашний персонал» | Няня, повар, садовник, водитель |

### Кластер D — Investment Consideration («Думаю о покупке»)
Snowbird, settler, resident, investor-passive (новый).

| Ситуация | Сервисы |
|---|---|
| «Понять рынок» | MarketBrief, Phuket Price Index, Knowledge Hub |
| «Выбрать проект» | PropertySearch, Unit Selector, ROI calc |
| «Проверить девелопера» | DueDiligence AI, FloodScore, Construction Monitor |
| «Посчитать сделку» | InvestCalc, финансирование, налоги |
| «Виртуальный тур» | VR-тур, видео-звонок с агентом, remote viewing |

### Кластер E — Transaction («Покупаю/продаю»)
Investor-passive, investor-active, resident-user.

| Ситуация | Сервисы |
|---|---|
| «Оформление сделки» | ContractAI, Land Office, FET wizard |
| «Дистанционная сделка» | Online POA, notarisation, remote signing |
| «Структурирование» | BOI, tax structuring, trust, Thai company |
| «Выход из актива» | L3 First Look, resale listing, tax exit |
| «Обмен/trade-up» | Trade-in программа, upgrade path |

### Кластер F — Ownership & Operations («Управляю активом»)
Absentee, investor-active, operator.

| Ситуация | Сервисы |
|---|---|
| «Сдача в аренду» | StaySync, AI Guest Messaging, Dynamic Pricing |
| «Отчётность и compliance» | ComplianceTrack, Hotel Act, TAT, PND filing |
| «Ремонт и обслуживание» | ContractorHub, pool/garden service, snagging |
| «Получение дохода» | Revenue payout, multi-currency, PM Dashboard |
| «Портфель» | Investor Portfolio Dashboard (HNW) |
| «Мониторинг удалённо» | Property camera, monthly video report |

### Кластер G — Compliance & Legal («Соответствие и налоги»)
Settler → глубже.

| Ситуация | Сервисы |
|---|---|
| «Налоговое резидентство» | TaxNav, 183-day tracker, DTA advisory |
| «Переводы денег» | TransferRu, SEPA, SWIFT, crypto-onramp |
| «Юридические вопросы» | Legal marketplace, POA, wills |
| «Регуляторные изменения» | Regulation alerts, newsletter |
| «Наследство/планирование» | Thai will, trust, estate planning |

### Кластер H — Emergency («Экстренные ситуации»)
Все фазы, приоритет — первые 90 дней.

| Ситуация | Сервисы |
|---|---|
| «SOS» | 24/7 координатор, 1 тап |
| «Медицинская эвакуация» | Insurance coordination, переводчик |
| «ДТП/полиция/задержание» | Юрист за 1 час, переводчик |
| «Потеря документов» | Посольство, restore protocol |
| «Мошенничество» | Escrow freeze, юридическая поддержка |
| «Стихийное бедствие» | Эвакуация, координация со страховой |

### Кластер I — Lifestyle («Стиль жизни»)
Все фазы, преимущественно consumer и resident-user.

| Ситуация | Сервисы |
|---|---|
| «Где поесть/выпить» | SafeEats, beach clubs, бронирование |
| «Активности» | Морские туры, дайвинг, острова, Muay Thai |
| «Здоровье/велнес» | SPA, йога, фитнес, IV-дрипы |
| «Сообщество» | Events, клубы, встречи по интересам |
| «Культура» | Old Town, храмы, фестивали, local tours |
| «Спецсобытия» | Свадьба, юбилей, корпоратив |

### Кластер J — Exit & Re-entry («Выход/возврат»)
Returnee, переход resident → absentee.

| Ситуация | Сервисы |
|---|---|
| «Уезжаю — что с активом» | Перевод на PM, удалённое управление |
| «Продаю и уезжаю» | Sale + tax exit |
| «Возвращаюсь через год» | Re-activation, re-onboarding |
| «Двойное резидентство» | Tax treaty navigation |

---

## 6 · Матрица приоритетов «Персона × Кластер»

Это карта того, **что именно** показывать каждой персоне в первом касании. Легенда:
- **●●** — core: must-have в welcome flow
- **●** — relevant: upsell и secondary
- — — не релевантно на этой фазе

| Персона \ Кластер | A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|---|
| P1 RU-турист | ●● | | | | | | | ●● | ●● | |
| P2 CN-турист | ●● | ● | | ● | | | | ●● | ●● | |
| P3 DE-гость | ●● | ● | | ● | | | ● | ●● | ●● | |
| P4 Nomad | ●● | ●● | ●● | | | | ●● | ● | ● | ● |
| P5 Snowbird | ●● | ●● | ● | ● | | | ● | ●● | ●● | ● |
| P6 RU-экспат | ● | ●● | ●● | ● | | | ●● | ●● | ● | |
| P7 Семья | ● | ● | ●● | ● | | | ●● | ●● | ●● | |
| P8 Passive-investor | | | | ●● | ●● | ●● | ●● | | | ● |
| P9 HNW-investor | | | | ●● | ●● | ●● | ●● | | ● | ● |
| P10 Operator | | | ● | | | ●● | ●● | ● | | |
| P13 Pet-owner | ●● | ●● | ●● | | | | | ● | ● | |
| P14 Med-tourist | ●● | | | | | | | ●● | ● | |
| P15 Wedding | ●● | | | | | | | ● | ●● | |
| P16 Athlete | ●● | ● | | | | | | ● | ●● | |
| P17 Halal-tourist | ●● | | ● | | | | | ● | ●● | |
| P20 Retiree | ● | ●● | ●● | ● | | | ●● | ●● | ●● | |
| P21 Local Provider | | | | | | | ● | | | |
| P25 Student | ●● | ● | ● | | | | | ● | ●● | |

---

## 7 · Структура каталога услуг

Каталог организован по **15 категориям**. Каждая категория обслуживает несколько кластеров-ситуаций. Каждая услуга помечена флагами `lifecycle`, `role`, `cluster` для AI-маршрутизации.

### 7.1 Существующие категории (v1)
1. 🆘 **Emergency** — экстренные случаи
2. 🏠 **Home & Living** — дом и быт
3. 🍽️ **Food & Entertainment** — еда и развлечения
4. 🏥 **Health & Wellness** — здоровье и велнес
5. 👶 **Family & Kids** — семья и дети
6. 🚗 **Transport** — транспорт
7. 💼 **Business & Legal** — бизнес и право
8. 💰 **Finance** — финансы
9. 🏖️ **Tourism & Activities** — туризм и активности
10. 🏡 **Real Estate Full Stack** — недвижимость

### 7.2 Новые категории (v2) — добавлены для покрытия extended-персон
11. 🐾 **Pet Services** — сервисы для питомцев (P13, резиденты с животными)
12. 💒 **Wedding & Events** — свадьбы и события (P15, + retiree anniversaries)
13. 🕌 **Halal & Faith** — халяль-инфраструктура и религия (P17, P12, P11)
14. 🏋️ **Sports & Athletic Training** — спорт и тренировки (P16)
15. 🤝 **Community & Social** — сообщество и события (все resident-фазы)
16. 🛒 **Partner Portal (B2B)** — для провайдеров и вендоров (P21, P22, P23)

---

## 8 · Каталог новых категорий

### 8.1 🐾 Pet Services (для P13)

| Услуга | Описание | Монетизация | Фаза / Роль |
|---|---|---|---|
| Ввоз питомца в Таиланд | Сопровождение: чип, прививки, сертификаты, карантин, авиакомпании | ฿15,000–30,000 пакет | scout/settler · any |
| Ветеринарные клиники (RU/EN) | MediFind для животных — верифицированные клиники с переводом | Листинг + комиссия 8% | any |
| Экстренный вет 24/7 | Срочный вызов + телеконсультация | ฿1,500/вызов + SOS подписка | any |
| Pet-friendly жильё (фильтр) | Фильтр на STR/LTR-платформе — кошки, собаки, вес, порода | Встроено в Stay | tourist → resident |
| Выгул и pet-sitting | Dog walker, cat sitter в отъезде | ฿300–800/визит + комиссия 15% | all residents |
| Груминг и ветеринарная эстетика | Стрижка, ногти, зубы | Комиссия 10% | resident |
| Корм и товары (доставка) | Royal Canin, Hill's, локальные премиум-бренды | 8% комиссия | resident |
| Вывоз питомца из Таиланда | Обратный экспорт при переезде | ฿20,000–40,000 | returnee |
| Памятник/кремация | Утрата питомца — протокол, крематорий, оформление | ฿5,000–15,000 | resident |
| Pet-hotel и boarding | На время поездок владельца | Комиссия 12% | resident, snowbird |
| Обучение и дрессировка | Базовый курс, сложные случаи | Комиссия 15% + листинг | resident |
| Страхование питомца | Pet insurance через партнёров | Broker commission 15% | resident |

### 8.2 💒 Wedding & Events (для P15 и retiree-anniversaries)

| Услуга | Описание | Монетизация | Фаза / Роль |
|---|---|---|---|
| Destination Wedding планировщик | AI-планировщик: venue + budget + timeline + vendors | 10% от бюджета | tourist |
| Venue marketplace (100+ площадок) | Beach, villa, resort — фильтры по размеру, стилю, бюджету | Листинг ฿2,999/мес + 8% | tourist |
| Свадебный координатор | Day-of coordinator, full planning | 10–15% от бюджета | tourist |
| Юридическая регистрация брака | Legalization marriage certificate, Apostille | ฿15,000–25,000 пакет | tourist |
| Фото/видео команда | Свадебные фотографы, кинематографисты | Комиссия 12–15% | tourist |
| Декор и флористика | Бутики декора, флористы, light design | Комиссия 12% | tourist |
| Кейтеринг и торт | Свадебные кейтеринг-компании | Комиссия 10% | tourist |
| Платья и костюмы (аренда/покупка) | Трансфер из BKK, локальные ателье | Referral fee | tourist |
| Transport для свадьбы | Лимузин, lounge cars, speedboat для guests | Комиссия 12% | tourist |
| Размещение гостей | Блок-бронирование отелей, вилл для группы | Комиссия 8–10% | tourist |
| Девичник / мальчишник | Beach club, yacht, spa, Muay Thai | Комиссия 12% | tourist |
| Юбилеи и vow renewal | Renew vows, 20/25/50-anniversary пакеты | 10% от бюджета | retiree, returnee |
| Корпоративные свадьбы/MICE | Для корпоративных групп, DMC-функция | Комиссия 8–12% | B2B |

### 8.3 🕌 Halal & Faith (для P17, P12, P11)

| Услуга | Описание | Монетизация | Фаза / Роль |
|---|---|---|---|
| Halal-restaurants карта | Верифицированные рестораны с сертификатом MUIT | Листинг + комиссия 10% | halal-modifier все фазы |
| Halal-friendly виллы и отели | Фильтр: молитвенный коврик, qibla, нет алкоголя в мини-баре | Встроено в Stay | tourist, snowbird |
| Мечети Пхукета (карта) | 50+ мечетей с временами молитв, услугами | Бесплатно (community) | all |
| Prayer times & qibla widget | В приложении: локальные времена, qibla direction | Бесплатно | all |
| Халяль-продукты доставка | Мясные лавки, азиатские маркеты, доставка | 10% комиссия | resident, snowbird |
| Arabic/Indonesian/Malay guides | Гиды, переводчики на арабском, малайском, бенгальском | Комиссия 15% | tourist |
| Islamic finance (sukuk, takaful) | Сотрудничество с Islamic banks для HNW | Advisory 0.5–1% | investor (HNW) |
| Мусульманская свадьба | Nikah-координация, halal-кейтеринг, имам | 12% от бюджета | tourist wedding |
| Ramadan-пакеты | Iftar-рестораны, suhoor-доставка, ночные сервисы | Сезонная подписка | tourist, resident |
| Hajj/Umrah consultancy | Организация из Таиланда | Referral | resident halal |
| Kosher services (Chabad partner) | Кошерные рестораны, микве, Chabad house | Partner listing | tourist kosher |

### 8.4 🏋️ Sports & Athletic Training (для P16)

| Услуга | Описание | Монетизация | Фаза / Роль |
|---|---|---|---|
| Muay Thai fight camps | Tiger Muay Thai, Sinbi, Dragon — подбор по уровню | Комиссия 10% + листинг ฿999/мес | tourist, nomad |
| CrossFit / HIIT боксы | 15+ боксов Пхукета, сравнение, пробное занятие | Affiliate ฿500 + листинг | all residents |
| Триатлон-тренировки | Coaches, swim/bike/run маршруты, Laguna Phuket Tri camp | Комиссия 12% | tourist, nomad |
| Дайвинг (PADI advanced, tech) | Уже в activities — расширение для серьёзных дайверов | Комиссия 10% | athlete-modifier |
| Серфинг camps | Kata, Bang Tao — intermediate и advanced | Комиссия 10% | tourist, nomad |
| Jiu-Jitsu / BJJ | Phuket Top Team, Unit 27 | Листинг + 10% | tourist, nomad |
| Plyometric / functional | Individual coaches, verified | Комиссия ฿300/сессия | resident |
| Гольф-training | Pro coaches, courses, equipment | Комиссия 5% | retiree, investor |
| Теннис и падел | Академии, match-finder, корты | 8% комиссия + листинг | all residents |
| Велосипедные маршруты & e-bike rental | Карта маршрутов, аренда, групповые райды | Комиссия 10% | tourist, nomad |
| Recovery & sports medicine | Физиотерапия, массаж, IV-терапия | Комиссия 12% | athlete |
| Diet & sports nutrition | Meal prep, macros, coaches | Комиссия 10% + листинг | athlete |
| Соревнования и регистрация | Laguna Tri, Muay Thai fights, marathon | Partner commission | athlete |

### 8.5 🤝 Community & Social

| Услуга | Описание | Монетизация | Фаза / Роль |
|---|---|---|---|
| Events-календарь | Meetups, talks, networking, параллельно с Eventbrite | Листинг + комиссия с билетов 10% | resident, nomad |
| Профессиональные сообщества | Tech, finance, real estate — в Telegram + meetups | Премиум-членство ฿499/мес | nomad, resident |
| Language exchange | Thai-RU-EN-CN обмены | Freemium | all residents |
| Клубы по интересам | Book club, wine club, photography, sailing | Партнёрский листинг | resident |
| Параллельные школы родителей | PTA-аналог, группы по школам | Бесплатно (community) | family |
| Volunteering & charity | Animal shelters, beach cleanup, NGO | Донации + листинг | all |
| LGBTQ-friendly гид | Safe venues, events, сообщество | Партнёрский листинг | lgbtq-modifier |
| Retiree-клуб | Bridge, golf, book — для 60+ | Членство ฿299/мес | retiree |
| Women's circle | Русскоязычный женский клуб экспатов | Freemium | family, retiree |
| Mentorship program | Young expats ← HNW mentors | Платформа (комиссия) | nomad, student |
| Разговорный английский/тайский | Группы и тандем-партнёры | Листинг + 10% | all |

### 8.6 🛒 Partner Portal (B2B для P21, P22, P23)

| Услуга | Описание | Монетизация | Аудитория |
|---|---|---|---|
| Listed (бесплатный базовый листинг) | Имя, контакт, район | Бесплатно | All providers |
| Verified partner | Escrow + trust badge + приоритет | Подписка ฿2,000–5,000/мес + escrow 8–15% | Providers, SMB |
| Ombudsman-endorsed | Эксклюзивная категория, доступ к HNW | Подписка ฿10,000–25,000/мес | Top-tier |
| Partner CRM | Leads dashboard, messaging, calendar | Встроено в tier | Providers |
| Partner Academy | Обучение работе с иностранными клиентами, английский | Freemium + ฿1,999/курс | Providers |
| Insurance & bonding | Страхование ответственности для подрядчиков | Broker commission | Contractors |
| Equipment & supplies marketplace | B2B-закупки для ресторанов, отелей, клиник | Комиссия 5% | SMB |
| Payroll & HR for SMB | Найм, contracts, tax filing | ฿4,999/мес per SMB | SMB |
| Marketing co-op | Совместная реклама в RU/EN/CN-каналах | Membership ฿3,000/мес | Verified+ |
| Developer tools (sell-side) | Unit selector, CRM для девелоперов, lead scoring | SaaS ฿15,000–50,000/мес | Developers |
| Construction monitoring pro | Для подрядчиков — загрузка отчётов покупателям | Подписка ฿2,999/мес | Contractors |
| Bulk compliance (для PM) | Hotel Act, TAT, TM30 автоматизация для 10+ объектов | ฿999/объект/мес | Operators |

---

## 9 · Сервисные паттерны и уровни платформы

Поверх каталога — 4 универсальных слоя, работающие для всех персон.

### 9.1 SOS Layer (всегда 1 тап)
Приоритет P0. Всегда на экране. Подробности — категория Emergency.

### 9.2 AI Concierge (распознавание персоны)
Три вопроса при первом входе:
1. **Как давно/надолго здесь?** → фаза
2. **Владеете недвижимостью?** → роль
3. **С кем/что особенного?** → модификатор (семья, питомец, халяль, медицина и т.д.)

На выходе — персонализированный hub из 5–7 сервисов по core-кластерам персоны.

### 9.3 Daily Briefing (WhatsApp)
Каждое утро 08:00: погода + флаг пляжа + топ-3 события (отфильтровано по модификатору: halal-events для P17, family-events для P7) + напоминания пользователя.

### 9.4 Lifecycle Triggers (переходы между фазами)
Автоматические триггеры из CRM:
- `visits ≥ 2 AND total_days > 21` → предложить Snowbird-пакет
- `days_in_thailand > 175` → TaxNav alert (риск резидентства)
- `profile.kids_age_range.min < 18` → Family Hub
- `profile.modifiers includes 'pet'` → Pet section активируется в hub
- `transaction.type = 'property_purchase'` → онбординг в Stay PM

---

## 10 · Bundles (пакетные предложения)

Проверенные связки услуг для ключевых персон.

| Bundle | Для кого | Состав | Цена |
|---|---|---|---|
| **Welcome Pack** | P1 RU-турист (first visit) | Трансфер + SIM + обмен + SOS access + AI-гид | ฿1,499 |
| **Snowbird Winter Pack** | P5 | LTR виза + жильё 3–6 мес + медстраховка + VIP-трансферы | ฿15,000–35,000 |
| **New Expat 90 Days** | P6 | RentMatch + ContractAI + BankPass + TaxNav + WhatsApp priority | ฿8,999 |
| **Family Settle** | P7 | School Match + няня + педиатр + Family Hub premium | ฿12,999 |
| **Nomad Setup** | P4 | DTV + BankPass + coworking + TaxNav + 2-mo accommodation | ฿11,999 |
| **Investor Due Diligence** | P8 | DueDiligence + FloodScore + ContractAI + Legal review | ฿7,500 |
| **HNW Full Stack** | P9 | Mandate + все compliance + PM + FinanceGuide | 1–2% annual |
| **Operator SaaS** | P10 | StaySync + ComplianceTrack + PMDashboard + AI Guest | ฿1,499/объект/мес |
| **Pet Arrival Pack** | P13 | Pet import + vet setup + pet-friendly жильё + pet-sitter | ฿25,000–45,000 |
| **Destination Wedding** | P15 | Planner + venue + photo + catering + guest accom. + legal | 10% от бюджета (от ฿200K) |
| **Medical Tourism Pack** | P14 | Clinic match + виза + жильё + переводчик + сопровождение | ฿15,000–50,000 + % клиники |
| **Fighter Camp 30D** | P16 | Gym membership + accom + nutrition + recovery + visa | ฿29,999 |
| **Halal Traveller Pack** | P17 | Halal-жильё + mosque map + food + guide | ฿3,999 |
| **Retirement Pack** | P20 | Retirement visa + медстраховка + comm + home setup | ฿35,000 |

---

## 11 · Mapping на URL и информационную архитектуру сайта

Для SEO, маркетинга и UX каждая персона и кластер получают выделенный URL.

### 11.1 Посадочные страницы по персонам
- `myuno.app/for/tourists` · `/for/snowbirds` · `/for/nomads` · `/for/expats` · `/for/families`
- `myuno.app/for/investors` · `/for/hnw` · `/for/operators` · `/for/developers`
- `myuno.app/for/retirees` · `/for/medical-tourists` · `/for/weddings` · `/for/athletes`
- `myuno.app/for/pet-owners` · `/for/halal-travellers` · `/for/students` · `/for/lgbtq`
- `myuno.app/partners` (B2B для P21-P23)

### 11.2 По ситуациям (кластерам)
- `myuno.app/arrival` · `/stay-longer` · `/settle` · `/buying` · `/selling`
- `myuno.app/manage-property` · `/taxes-and-law` · `/emergency` · `/lifestyle` · `/leaving`

### 11.3 По категориям
- `myuno.app/services/{category-id}` — каждая из 16 категорий

### 11.4 Knowledge Hub
Структура: **персона × ситуация** = матрица 25 × 10 = 250 тем для контент-плана. Каждая статья маппится на услуги из каталога.

---

## 12 · CRM-поля (итоговая спецификация)

Минимальный набор полей в профиле пользователя для работы framework.

```
user:
  # Ось 1 — Lifecycle
  lifecycle_stage: enum[scout, tourist, snowbird, nomad, settler, resident, absentee, returnee]
  lifecycle_stage_history: [{stage, entered_at, left_at}]
  first_visit_at: date
  total_days_in_thailand: int
  visits_count: int
  visa_type: enum[TR, METV, DTV, Non-B, Retirement, LTR, Elite, Thai_Privilege]
  visa_expires_at: date

  # Ось 2 — Role
  primary_role: enum[consumer, resident-user, investor-passive, investor-active, operator, provider]
  secondary_roles: array<enum>
  owned_properties_count: int
  operated_properties_count: int

  # Ось 3 — Modifiers
  language: enum[RU, EN, CN, DE, MN, BN, TH, KR, JP, FR, AR]
  household_type: enum[solo, couple, family-young, family-school, retiree, multigenerational]
  special_status: array<enum[pet-owner, medical, halal, kosher, accessibility, lgbtq, athlete, wedding]>
  kids_ages: array<int>

  # Derived persona
  detected_persona: enum[P1..P25]
  detected_persona_confidence: float

  # Active clusters (what matters now)
  active_clusters: array<enum[A, B, C, D, E, F, G, H, I, J]>

  # Triggers monitored
  triggers_active: array<string>
  next_lifecycle_stage_eta: date (predicted)
```

---

## 13 · Правила приоритизации (product prioritisation)

При проектировании нового сервиса или лендинга — проверка по 5 вопросам:

1. **Для каких персон?** — минимум 1 core-персона или 2 extended.
2. **В каком кластере ситуаций?** — строго 1, максимум 2.
3. **На какой фазе lifecycle?** — и что триггерит переход в неё?
4. **Какая монетизация и LTV?** — должна считаться в $ на пользователя-персону.
5. **Как интегрируется с existing stack?** — какие данные шарит с CRM, Stay, Invest?

Сервис, не отвечающий на все 5 — не запускается.

---

## 14 · Следующие шаги

1. **Синхронизировать ServiceCatalogue.jsx** — добавить новые категории (Pet, Wedding, Halal, Sports, Community, Partner Portal) и расширить аудитории до 25 персон.
2. **Обновить CRM-схему** — добавить поля из раздела 12.
3. **Переписать AI-консьерж system prompt** — перевести на 3-вопросную логику из 9.2.
4. **Создать 25 посадочных страниц** (по 1 на персону) — SEO-приоритет.
5. **Контент-план Knowledge Hub** — матрица 25 × 10 = 250 тем на 18 месяцев.
6. **Партнёрская сетка** — идентифицировать 3–5 якорных партнёров для каждой новой категории (Pet, Wedding, Halal, Sports).

---

*Документ является эталонным. Все последующие изменения сегментации — только через обновление этого файла с версионированием.*
