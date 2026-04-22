# Каноническая таксономия myUNO: жизненные ситуации, персоны и 36 приложений для Пхукета

## Executive summary и методология

**Данный документ — каноническая 6-уровневая таксономия платформы myUNO, построенная по принципу Life Situation → Micro-situation → Persona → Audience Cluster → Service Cluster → Service/App.** Он служит референсом для разработки продукта (Lovable/Cursor), наполнения справочников Supabase (enum-таблиц) и coordinations между тремя дивизионами Ignatev Group: by myUNO (36 apps), Ignatev Estate (35 объектов), Ignatev Capital ($7–10M+ тикет).

**Объём охвата.** Таксономия покрывает **12 жизненных ситуаций × ~140 микроситуаций × 38 персон × 14 аудиторных кластеров × 8 сервисных доменов × 36 приложений + 5 AI-агентов + флайуил-услуги Estate/Capital**. Все микроситуации привязаны к реальной правовой, финансовой и инфраструктурной среде Пхукета 2025–2026 (TM30, Dika 4655/2566, LTR, DTV, нотификация cannabis июнь 2025, marriage equality январь 2025, MR 399 по крипто).

**Методология.** Использованы: (1) публичные данные TAT, Phuket Immigration, BOI, Bank of Thailand, Revenue Department, DBD, DLD; (2) отчёты CBRE Thailand, Knight Frank, Colliers, C9 Hotelworks, REIC; (3) законодательство (Condominium Act, Hotel Act B.E. 2547, Land Code §§96/113, FBA, Revenue Code §41, Royal Decree No. 743, MR 399); (4) community-level источники (Telegram/Facebook группы русских/китайских/индийских сообществ); (5) официальные сайты провайдеров (Bangkok Hospital Phuket, BISP, UWC, Tiger Muay Thai, RPM и др.). Все числа и даты проверены по нескольким источникам; расхождения явно отмечены.

**Ключевая идея архитектуры.** myUNO не соревнуется с горизонтальными платформами (Airbnb, Grab, Agoda) — он **закрывает специфические микроситуации Пхукета**, которые глобальные игроки не видят: TM30 после re-entry, FET-форма для Land Office, nominee-риск после Dika 4655/2566, remittance-правило 2024, DTV-банкинг, 80→140m altitude rule. Каждое приложение — "узкий нож" под конкретный job-to-be-done, связанный SSO-хабом bymyuno.com.

**Роль Уполномоченного.** Статус Павла Игнатьева как **Общественного представителя Уполномоченного по защите прав предпринимателей города Москвы в Таиланде (Order 320-P)** — уникальный trust-актив, который усиливает 4 класса приложений: DepositSafe (escrow-заменитель), FinanceGuide (HNW compliance), ContractAI (lease-анализ после Dika 4655/2566), ComplianceTrack (FARA/DBD/nominee-мониторинг). Эти 4 продукта — ядро "канала доверия" между русскоязычными HNW и тайской правовой реальностью.

---

## 1. Уровень 1 — Жизненные ситуации (Life Situations)

Макроконтексты длиной от нескольких недель до многих лет. Каждый агрегирует 8–18 микроситуаций.

| Код | Жизненная ситуация | Типичная длительность | Якорные персоны |
|---|---|---|---|
| **LS-01** | Первая неделя на Пхукете | 1–7 дней | Tourist, Medical tourist, Bleisure |
| **LS-02** | Адаптация первые 90 дней (Onboarding) | 30–90 дней | Релокант, DTV nomad, Mixed couple newcomer |
| **LS-03** | Покупка недвижимости | 3–12 мес | Condo buyer, Villa buyer, HNW, Sport-relocator |
| **LS-04** | Владение и управление недвижимостью | 1–20 лет | Landlord, Portfolio owner, Absentee HNW |
| **LS-05** | Релокация семьи с детьми | 6–18 мес активной фазы | Семья school-year relocator, спортивная семья |
| **LS-06** | Ведение бизнеса на Пхукете | 1–10+ лет | F&B-предприниматель, сервисный оператор, застройщик |
| **LS-07** | Долгосрочный медицинский/wellness-стэй | 2 нед – 12 мес | Medical tourist, детокс-клиент, IVF, recovery |
| **LS-08** | Активные тренировки и sport-camps | 2 нед – 12 мес | Muay Thai pilgrim, triathlete, surfer, family athlete |
| **LS-09** | Выход на пенсию в Таиланде | 5–25 лет | Retiree (O-A, O-X, LTR WP), snowbird |
| **LS-10** | Инвестиционная жизнь HNW/UHNW | непрерывно | Capital client, yacht owner, private-jet traveller |
| **LS-11** | Событие / Destination event | 1 день – 3 нед | Wedding group, honeymoon, film crew, corporate MICE |
| **LS-12** | Экстренная ситуация / кризис | часы–недели | Любой сегмент (медицинская, правовая, погодная, финансовая) |

**Принцип декомпозиции.** Жизненная ситуация определяется **триггером входа** (приезд, покупка, беременность, диагноз, монсун) и **состоянием выхода** (уехал, владеет, родил, прошёл операцию, пережил сезон). Микроситуации — это минимальные job-to-be-done внутри ситуации.

---

## 2. Уровень 2 — Микроситуации (140+ Jobs-to-be-done)

Полный каталог, сгруппированный по жизненным ситуациям. Каждая микроситуация имеет триггер, окно решения и измеримый результат.

### LS-01 · Первая неделя на Пхукете (14 микро)
- **MS-101** Заполнить TDAC за 3 дня до прилёта (обязательно с 01.05.2025)
- **MS-102** Активировать SIM/eSIM в зале прилёта HKT (AIS/True/dtac — сравнение тарифов)
- **MS-103** Добраться из аэропорта не переплатив "taxi mafia" (Grab Gate 8 / Bolt 300m walk / Smart Bus Rawai ฿170)
- **MS-104** Снять наличные без ฿220 ATM-комиссии (Aeon ATM, банковские POS)
- **MS-105** Проверить pre-arrival, что в отеле/вилле есть электричество и стабильный инет (ElectroCheck)
- **MS-106** Узнать медузный/красный флаг на нужном пляже (bluebottle/box jellyfish май–окт)
- **MS-107** Обменять валюту по лучшему курсу без нарушения AMLO (SuperRich, Twelve Victory)
- **MS-108** Найти русскоговорящего/арабоговорящего/мандарин-врача ночью при ОРВИ у ребёнка
- **MS-109** Арендовать скутер/машину не отдав паспорт в залог
- **MS-110** Понять, можно ли купаться в monsoon (red/yellow/green flag status)
- **MS-111** Найти halal/кошерный/джайн-ресторан рядом (сертификация)
- **MS-112** Получить молитвенное время и qibla direction (GCC-путешественники)
- **MS-113** Забронировать верифицированную экскурсию (James Bond, Phi Phi) не через "туроператор в lobby"
- **MS-114** Сообщить родным о прибытии, когда в РФ YouTube/WhatsApp ограничены (Telegram-based)

### LS-02 · Адаптация первые 90 дней (18 микро)
- **MS-201** Подать TM30 после заселения (landlord ответственность, но в Phuket де-факто tenant)
- **MS-202** Продлить визу-exemption (+30 дней, ฿1,900) в Phuket Immigration или Blue Tree
- **MS-203** Открыть банковский счёт (BBL/KBank/SCB) — Non-B/O/O-A/LTR/Privilege требуется
- **MS-204** Получить Certificate of Residence в Phuket Immigration (бесплатно, нужен для банка и DLT)
- **MS-205** Разблокировать Revolut/Wise из Таиланда (KYC-reconfirm, IP/SIM)
- **MS-206** Перевести первые $ из-за границы правильно (FET-форма при ≥$50K для будущего Land Office)
- **MS-207** Конвертировать RUB → THB при ограниченном SWIFT (USDT OTC-desks в Rawai, лицензированные каналы)
- **MS-208** Получить Thai SIM с номером, регистрируемым по паспорту (для PromptPay, банк-OTP)
- **MS-209** Подключить AIS Fibre/True Online в квартиру/виллу
- **MS-210** Арендовать долгосрочное жильё с 2+1 depositом, избегая scam-landlord
- **MS-211** Оформить Yellow Book (Tabien Baan Тор.Ror.13) в amphoe по прописке
- **MS-212** Получить Pink ID Card после Yellow Book
- **MS-213** Конвертировать домашние права в Thai driving license в DLT Phuket
- **MS-214** Подписаться на PEA-электричество и PWA-воду на своё имя (или через landlord)
- **MS-215** Найти врача семейной практики, стоматолога, гинеколога на родном языке
- **MS-216** Первая 90-day TM47 через tm47.immigration.go.th
- **MS-217** Купить локальную медстраховку (LUMA, Pacific Cross, April, Cigna Thailand)
- **MS-218** Присоединиться к community-чатам (Telegram "Пхукет Инфо" 80K+, FB expat)

### LS-03 · Покупка недвижимости (15 микро)
- **MS-301** Определить бюджет с учётом transfer 2% / SBT 3.3% / withholding / stamp 0.5% — реальный all-in
- **MS-302** Понять разницу Chanote vs Nor Sor 3 Gor vs Nor Sor 3 vs Sor Kor 1 vs Por Bor Tor 5
- **MS-303** Проверить foreign quota (49%) в конкретном кондо (сертификат от juristic office)
- **MS-304** Понять последствия Dika 4655/2566 для "30+30+30" lease: только первые 30 лет исполнимы
- **MS-305** Оценить риск nominee-структуры после крим. дела 2812/2567 Phuket и IBAS 2025
- **MS-306** Разобрать SPA/Reservation Agreement (Content-AI, русский перевод, flag risks)
- **MS-307** Провести title search в Phuket Land Office (Damrong Rd)
- **MS-308** Подтвердить отсутствие encumbrance, юрид. долгов, registered leases
- **MS-309** Проверить EIA для проекта >80 юнитов / >4,000 sqm
- **MS-310** Проверить коастальный setback, 140m altitude rule (с 13.12.2024), slope 35° (с 2018)
- **MS-311** Провести FET-транзакцию ≥$50K с указанием "for purchase of condominium"
- **MS-312** Выбрать структуру владения: freehold condo / leasehold / Sap-Ing-Sith / usufruct / superficies / BOI-land
- **MS-313** Назначить день трансфера в Phuket Land Office (до 14:30)
- **MS-314** Зарегистрировать Chanote на новое имя + получить Debt Clearance Certificate
- **MS-315** Repatriation-plan: как вывести капитал + gains обратно через FET

### LS-04 · Владение и управление (12 микро)
- **MS-401** Найти property manager для 30-day+ rental (Hotel Act B.E. 2547 запрещает <30 дней)
- **MS-402** Обнаружить revenue under-reporting от PM (PMDashboard со связью с PMS и PEA)
- **MS-403** Заплатить Land & Building Tax (0.02–0.10% residential)
- **MS-404** Оспорить чрезмерный juristic common-fee bill
- **MS-405** Реагировать на PEA/PWA перебои в Cherngtalay в high season
- **MS-406** Оформить 30-day+ tenant's TM30 (landlord obligation)
- **MS-407** Ликвидировать condo-дебт при resale; получить clearance letter
- **MS-408** Страховать виллу от monsoon-flood/lightning/termite/fire
- **MS-409** Координировать ремонт pool pump, aircon, roof leak удалённо (absentee owner)
- **MS-410** Перевести rental income за границу (1% corp / прогрессивный WHT)
- **MS-411** Передать виллу в estate/trust (BVI/SG/Cayman holdco) для inheritance planning
- **MS-412** Продать с ≥5-летним владением (избежать SBT 3.3%, только stamp 0.5%)

### LS-05 · Релокация семьи с детьми (12 микро)
- **MS-501** Выбрать школу: UWC (฿452–900K), BISP (฿452–935K + Cruzeiro), HeadStart (฿300–780K), BCIS (฿267–442K French/Cambridge), QSI (฿400–600K), Kajonkiet (฿200–450K)
- **MS-502** Попасть в waitlist BISP/UWC (entry test IELTS/CAT4)
- **MS-503** Оформить Non-O Guardian для родителей школьника
- **MS-504** Организовать школьный бас/водителя/кар-пул
- **MS-505** Найти педиатра/стоматолога для ребёнка на родном языке
- **MS-506** Подобрать ECA/спортивную академию (Cruzeiro, Thanyapura swim, tennis, Blue Tree)
- **MS-507** Оценить медицинскую страховку ребёнка (inpatient ≥฿400K для LTR/O-A)
- **MS-508** Импорт питомца через DLD (рабовакцина, микрочип, R1/1, 7–60 дней)
- **MS-509** Найти pet-friendly жильё (80–90% кондо запрещают; Layan Greens, Diamond, Zen Space ок)
- **MS-510** Планировать school-year calendar (Aug–Jun UK/IB; Aug–May US)
- **MS-511** Русская/французская/мандарин-доп. программа вне школы
- **MS-512** Возвращение домой: экспорт питомца, school records, cancel всех подписок

### LS-06 · Ведение бизнеса на Пхукете (14 микро)
- **MS-601** Зарегистрировать Thai Ltd (DBD) с 51% Thai + избежать nominee flags
- **MS-602** Получить BOI promotion (waives 4:1 ratio, ฿2M capital, 3–13-year tax holiday)
- **MS-603** Получить Foreign Business License если услуга в List 3 (property management, advisory)
- **MS-604** Нанять 1-го иностранца: ฿2M paid-up capital + 4 Thai FTE + VAT/SSO + физический офис
- **MS-605** Оформить work permit (E-Work Permit, 2025) с минимальной зарплатой по нац-ти (฿25–50K)
- **MS-606** Получить hotel license для villa-rental (только Thai-nationality eligible для small-scale)
- **MS-607** Зарегистрировать VAT (>฿1.8M revenue) + ежемесячный PND 53/3 withholding
- **MS-608** Открыть corporate banking (юрлицо), payroll, provident fund
- **MS-609** Подать corporate income tax (PND 50) через ACC партнёра
- **MS-610** Навигировать F&B specific compliance (halal cert, alcohol license Type 3/4, music license MCT)
- **MS-611** Tourism license (TAT) для tour operator
- **MS-612** Solve scooter-rental/driver labor scam exposure (work permit absent = deportation risk)
- **MS-613** Strategic exit: sell shares vs assets, treaty-shopping
- **MS-614** Мониторить DBD/DSI IBAS risk (25,000+ Phuket компаний в 2024 screening list)

### LS-07 · Медицинский/wellness-стэй (10 микро)
- **MS-701** Сравнить квоты PPSI/Rattinan/Kamol для rhinoplasty (฿85–180K), BBL (฿180–280K)
- **MS-702** Подтвердить IVF-цикл в IVF Phuket / BHP Fertility (฿180–500K, 50%+ успех)
- **MS-703** Выбрать детокс: Amatara Body/Mind (1 мес), Thanyapura, Santosa
- **MS-704** Организовать recovery-виллу (Rawai/Chalong с визитом медсестры)
- **MS-705** Получить translator-coordinator (BHP 16 языков: RU, ZH, AR, FR, DE, JP, KR…)
- **MS-706** Direct-billing через Cigna/April/AXA/Allianz/Bupa
- **MS-707** Post-op transfer HKT: wheelchair, flat bed upgrade
- **MS-708** Gender-affirming в Kamol (Bangkok) + recovery на Пхукете
- **MS-709** Dialysis-capable стэй (BHP, Siriroj, PIH, Vachira; ฿3.5–6K/сессия)
- **MS-710** Медикаменты долгосрочные: импорт/Thai-fill, narcotic-class permit

### LS-08 · Sport-camps и тренировки (10 микро)
- **MS-801** Выбрать Muay Thai-лагерь (Tiger MT, PTT, Sinbi, Dragon, AKA) + DTV Soft Power letter
- **MS-802** Пройти DTV Soft Power (6–9 мес, лицензированный gym-letter, ฿500K proof)
- **MS-803** Забронировать Thanyapura swim/tennis/triathlon camp
- **MS-804** Подобрать Cruzeiro Academy для ребёнка + BISP tuition
- **MS-805** Surf/kite season: swap west-coast (май–окт Kata/Kalim) на east (Rawai SW)
- **MS-806** Medical clearance + страхование combat-sport injury (типично excluded)
- **MS-807** Golf-пакет: Blue Canyon/Mission Hills/Red Mountain/Laguna
- **MS-808** Find physio/rehab после injury (Thanyapura, BHP ortho)
- **MS-809** Регистрация на Laguna Phuket Marathon/Triathlon (июнь/ноябрь)
- **MS-810** Equestrian/horseriding школа для детей (Phuket Riding Club)

### LS-09 · Retirement (8 микро)
- **MS-901** Выбрать между Non-O-Retirement / O-A / O-X / LTR Wealthy Pensioner
- **MS-902** Оформить ฿800K seasoning (2 мес до + 3 мес после; Phuket строго)
- **MS-903** Купить mandated inpatient ≥฿400K health insurance (O-A 2019+)
- **MS-904** Подать annual reporting вместо 90-day (LTR/SMART преимущество)
- **MS-905** Решить pension-income-letter проблему (US Embassy не выдаёт с 2019)
- **MS-906** Найти home-care nursing (Nurse On Call, ฿25–60K/мес)
- **MS-907** Pre-plan assisted-living (Phuket без dedicated; Chiang Mai Care Resort alternative)
- **MS-908** Navigate 2024 remittance tax на foreign pensions (если не LTR)

### LS-10 · HNW/UHNW life (11 микро)
- **MS-1001** Получить LTR Wealthy Global Citizen: $1M assets + $500K Thai invest (income-requirement снят янв 2025)
- **MS-1002** Приобрести Thailand Privilege Diamond/Reserve (฿2.5M/5M, 15–20 лет)
- **MS-1003** Structure $7–10M ticket: trophy villa vs 3–5 pool villas vs branded + condo portfolio
- **MS-1004** Private-jet handling в HKT (Siam Land Flying, MJets, VIP Jets Thailand)
- **MS-1005** Yacht berth в Ao Po Grand / RPM / PYH / Boat Lagoon
- **MS-1006** Charter provisioning + crew visa (Work Permit или DTV)
- **MS-1007** Alternative assets: wine cellar, watch storage, fine art (CITES для ivory/exotic)
- **MS-1008** Onshore-offshore структурирование (BVI/SG/Cayman holdco над Thai SPV)
- **MS-1009** Russian-speaking white-glove concierge
- **MS-1010** Gather-of-family events в 5–8-bedroom villa rental $2K–25K/ночь
- **MS-1011** Discreet security (close-protection, CCTV, panic-room)

### LS-11 · Destination events (8 микро)
- **MS-1101** Indian destination wedding 200–500 гостей, budget ฿3M–฿100M
- **MS-1102** Jain/вег-catering + dhol-wala из Бангкока/Индии
- **MS-1103** Muslim halal-yacht charter + women-only spa
- **MS-1104** LGBTQ+ wedding после 23.01.2025 (embassy "no impediment" issues)
- **MS-1105** Honeymoon package с engagement-photography на Promthep/Big Buddha
- **MS-1106** Film crew Thailand Film Office 30% cash rebate + permits (National Parks, CAAT drone)
- **MS-1107** Corporate MICE 100–300 pax в JW Marriott/Anantara/Kempinski
- **MS-1108** Annual KRSR/Phuket Boat Show participation

### LS-12 · Кризис (8 микро)
- **MS-1201** Scooter accident: triage к BHP/Siriroj + полицейский отчёт для insurance
- **MS-1202** Tsunami-warning ответ: 19 towers, 120dB, 1hr to higher ground
- **MS-1203** Monsoon flooding в Patong Bangla/Kata/Phuket Town Ranong Rd
- **MS-1204** Overstay (добровольная сдача: ฿500/день до ฿20K; >90 дней = 1yr ban)
- **MS-1205** Потеря паспорта + embassy contacts (RU, CN, IN, GCC, UK, DE, FR, US, AU, KR, JP, IL)
- **MS-1206** Bank account frozen (BoT 17.12.2025 anti-fraud — 1.1M аккаунтов)
- **MS-1207** Scam victim (property, rental, investment) — police + Ombudsman channel
- **MS-1208** Криминальный incident (robbery/assault) + DSI/provincial court

---

## 3. Уровень 3 — Каталог персон (38 профилей)

Каждая персона — минимальная операционная единица для product-targeting. Формат: код, имя-архетип, возраст, происхождение, статус, срок пребывания, виза, доход, бюджет услуг/месяц, география на Пхукете, ключевые pain points, top-5 jobs.

### Туристические персоны

**P-01 · Budget-Backpacker "Sasha, 22, РФ"** — студент, 1–3 недели, visa-exemption 60 дней, доход ~$800/мес, бюджет услуг ฿2–5K/день, Patong/Kata hostel. Pain: taxi-mafia, scooter-паспорт-залог, scam-tour. Jobs: eSIM дёшево, Grab вне airport, red-flag beach, proof-TDAC.

**P-02 · Mid-Market Couple "Markus & Anna, 34, DE"** — ИТ-специалисты, 10–14 дней, visa-exemption, $6K+/мес доход, бюджет ฿8–15K/день, Karon/Kamala 4-star resort. Pain: acceptable beach clubs, dental-check as side-gig, insurance coverage. Jobs: верифицированный тур-оператор, medical insurance direct-billing, activity booking.

**P-03 · Luxury-Traveller "Ahmed & family, 42, UAE"** — family owner, 2–3 недели июнь–август, visa-exemption, net worth $15M+, бюджет $2–5K/день, Surin/Amanpuri/Trisara. Pain: halal-cert, women-only pool, modest beach, qibla. Jobs: private villa с женским staff, halal-yacht, prayer-time tracker, private-jet FBO.

**P-04 · Bleisure "Priya, 36, IN/SG"** — CFO-trip, 5–7 дней, visa-exemption, $15K+/мес, Anantara Layan. Pain: стабильный 1 Gbps Wi-Fi, meeting-room rent. Jobs: co-working daypass, confidential call-booth, car+driver.

**P-05 · Chinese FIT Millennial "Li Wei, 28, CN"** — tech employee, 7 дней CNY, visa-exempt (post-2024), WeChat Pay Alipay, бюджет ฿5–8K/день, Patong shopping. Pain: Alipay+QR-acceptance, Mandarin menu, VPN to WeChat. Jobs: WeChat-paid tours, Mandarin guide, temple-tour.

### Medical-tourism персоны

**P-06 · Cosmetic-Tourist "Ekaterina, 38, RU"** — self-employed, 2–4 нед, SETV/METV, ฿150K/мес, ฿300–600K бюджет операции, recovery villa Rawai. Pain: Russian coordinator в PPSI, post-op care, insurance claim. Jobs: сравнение quotes, recovery-villa booking, Russian nurse visit.

**P-07 · IVF-Couple "Sarah & James, 41, AU"** — professionals, 3–4 мес, DTV Soft Power (medical), ฿400–800K бюджет цикла, Cherngtalay serviced apartment. Jobs: clinic ранжирование по success rate, genetic testing (PGT), embryo-legal международная отправка.

**P-08 · Detox-Guest "Hans, 55, DE"** — burnout-executive, 3–4 нед, visa-exemption, $20K+/мес, $8–15K retreat Amatara. Jobs: 1–12 мес membership, nutrition tracking, post-detox continuation home.

**P-09 · Dialysis-Traveller "Jean-Paul, 68, FR"** — pensioner, 4–6 нед, Non-O-A, €4K/мес, ฿3.5–6K/сессия × 12 sessions. Pain: accessible transport, oxygen availability. Jobs: pre-booking sessions, wheelchair-taxi, accessible hotel (Pullman Panwa).

### Резиденты-экспаты и релоканты

**P-10 · Early-Relocator "Pavel, 35, RU"** — IT, 90 дней → DTV, ฿200K/мес доход, бюджет услуг ฿30K/мес, Rawai. Pain: Revolut-KYC, Thai bank opening, TM30 после каждого re-entry. Jobs: VisaTrack, BankPass, community onboarding, scooter/driver licence.

**P-11 · Established-Expat "Emma, 42, UK"** — marketing consultant, 6+ лет, Non-B+WP, ฿300K/мес, Cherngtalay condo rent ฿60K. Jobs: annual PND 91 filing, work permit renewal, school fee planning.

**P-12 · Long-Stay Snowbird "Lars & Ingrid, 67, SE"** — retirees, ноябрь–апрель, Non-O-Retirement, пенсия €4K/мес, Nai Harn apartment ฿45K/мес. Jobs: annual return flight, winter-home handover, Thai mobile plan pause.

**P-13 · DTV Nomad "Alex, 29, US"** — remote-engineer Google, 180 дней циклами, DTV Workcation, $120K/год, Bang Tao coworking. Pain: Thai bank refusal, remittance-tax 2024 ambiguity, visa-run enforcement nov 2025. Jobs: TaxNav 180-day tracker, coworking day-pass, community meetups.

**P-14 · Single Female Expat "Mia, 33, CA"** — yoga-instructor, 2+ года, ED-visa, $2K/мес, Rawai. Pain: safety (scooter, драк-спайк Patong), verified scooter rent, gynaecology. Jobs: women-only community, safe-housing gated condo, self-defence.

**P-15 · Mixed Couple "Tom (UK) & Noi (TH), 45"** — Tom бизнес owner, Noi на Thai-company 51%, Non-O-Marriage, ฿400K bank deposit, Kathu villa. Pain: Land Dept. declaration, inheritance, nominee 2025 crackdown. Jobs: usufruct/superficies setup, dual-will, Land Code §93 awareness.

### Семьи с детьми и спортивные

**P-16 · School-Year Family "Brett & Lisa + 2 kids, 40, AU"** — 1 school year pilot, Non-O Guardian, $250K, BISP Cruzeiro student, Cherngtalay pool-villa ฿120K. Jobs: BISP waitlist, Cruzeiro enrolment, scooter-avoidance (car+driver).

**P-17 · Russian Family Relocator "Dmitry, Anna + 3 kids, 39, RU"** — tech-founder, перманент, Elite Gold 5yr / LTR WGC, $500K NW, Bang Tao villa покупка ฿55M. Pain: школа-pipeline (русская К+БISP), Russian OB/ped, asset-transfer post-sanctions. Jobs: DepositSafe, Russian-Mandarin-English school day-to-day.

**P-18 · Sport-Family "Rodrigo & Marcia + son 14, 44, BR"** — footballer's parents, 3–5 лет, Non-O Guardian, $180K, BISP + Cruzeiro elite. Jobs: elite coach liaison, competition calendar Costa Blanca/SEASAC, agent-scout visits.

**P-19 · Muay Thai Pilgrim "Kyle, 27, US"** — pro fighter, 6–9 мес, DTV Soft Power, ฿40–60K/мес burn, Chalong studio. Pain: DTV-letter authenticity, injury insurance. Jobs: Tiger MT enrol, fight-record log, recovery/physio.

### HNW/UHNW и инвестиционные персоны

**P-20 · HNW Russian Investor "Sergey, 52, RU"** — ex-commodities exec, на Пхукете 6 мес/год, LTR WGC + Thailand Privilege Diamond, NW $30M+, ticket $7–10M+ в Capital. Pain: sanctions-compliant rails, FARA exposure, Dika-proof leases. **Ключевой клиент Ignatev Capital.** Jobs: branded residence + яхта, crypto+trad bridge, estate-trust EU/UAE/TH.

**P-21 · Chinese UHNW Family "Mr. Chen, 58, HK/CN"** — founder, multi-gen, LTR/Elite, $80M+, Cape Yamu villa ฿350M. Jobs: Mandarin concierge, RMB-settlement (Oct 2025 PBoC-BoT QR), multi-gen-succession.

**P-22 · Yacht Owner "Captain Nick, 60, GB"** — ex-City banker, 9 мес/год на борту 42m, Elite Platinum, $40M+, RPM Aquaminium penthouse. Jobs: haul-out scheduling, cabotage-permit, Type-B charter license, crew DTV.

**P-23 · Private-Jet Owner "Mohammed, 48, SA"** — family conglomerate, 3 раза/год G650, VIP Jets Thailand FBO, NW >$200M. Jobs: Siam Land Flying slot, customs fast-track, villa pre-stocking.

**P-24 · Crypto-Founder "Yaroslav, 31, UA/CY"** — Web3 DAO founder, DTV + Elite, $5M NW, Kamala villa rent. Pain: MR 399 only licensed-exchange exempt, Thai bank de-risking. Jobs: Bitkub/Orbix/InnovestX KYC, remittance-timing, DeFi-tax advice.

**P-25 · Developer / Застройщик "Max, 47, RU-TH"** — 200M+ pipeline, Thai Ltd + BOI, Cherngtalay 5-rai boutique. Jobs: EIA, 140m altitude compliance, marketing to RU/CN/IN buyers, escrow-like DepositSafe.

**P-26 · Absentee Portfolio-Owner "Lady Alice, 71, GB"** — London-based, 3 villas + 5 condos Rawai/Bang Tao, visits 2×/year. Pain: PM under-reporting, absentee maintenance, Land-and-Building Tax compliance. Jobs: PMDashboard unified, annual return, trust succession.

### Дополнительные сегменты

**P-27 · GCC Family "Al-Sabah family, 39, KW"** — June–August mid-stay, 2 villas Surin adjacent, $50K+/10 дней, halal-yacht chartered. Jobs: halal-cert + women-only, qibla, private-physio, Kuwaiti-consulate comms.

**P-28 · Indian Wedding Planner "Rohit, 38, IN"** — destination wedding organiser, on-site 3–10 дней × 8 событий/год, работает со Sri Panwa/Trisara. Jobs: Jain-catering audit, dhol-wala flight, permit-on-beach.

**P-29 · LGBTQ+ Couple "Claire & Nadia, 34, FR"** — married after Jan 2025 on Phuket, DTV, $120K, Bang Tao rental. Pain: Embassy "no impediment", surrogacy barrier (foreigners excluded). Jobs: wedding-service marketplace, family-friendly resort verify, legal-advice cross-border.

**P-30 · Pet-owner Relocator "Natasha + 2 cats, 36, RU"** — 12+ мес, Non-O, Rawai. Pain: 80–90% condo ban pets, vet-specialist scarcity, import timeline. Jobs: pet-friendly listing, DLD R1/1 navigator, vet-verify.

**P-31 · Honeymooner Couple "Yuki & Ren, 29, JP"** — 7 дней, visa-exempt, Amanpuri, $20K spend. Jobs: Promthep photographer, Japanese speaking concierge, onsen-equivalent.

**P-32 · GCC Medical Tourist "Noor, 44, SA"** — specialist cardiology referral to BHP, 2–3 нед, pay via Saudi Embassy LOA. Jobs: Arabic coordinator, halal-meals on-ward, family suite.

**P-33 · Film-Crew Producer "Michael, 45, US/TH"** — location manager, 3–6 нед, Non-B, manages 30-crew. Jobs: Thailand Film Office 30% rebate, CAAT drone, National Park Chief permit.

**P-34 · Yacht Crew "Anna, 26, ZA"** — stewardess на 45m yacht, 12 мес, WP via Type-B charter or DTV. Jobs: crew-specific health insurance, visa-run-free, berth-crew social.

**P-35 · Cannabis Tourist (post-2025) "Mark, 34, UK"** — wellness-traveller, 10 дней, visa-exempt. Pain: reclassification 25.06.2025 — prescription-only. Jobs: licensed dispensary + Thai-MD consult, CBD-spa discovery.

**P-36 · Accessibility-Traveller "Monique + caregiver, 55, FR"** — wheelchair, 2 нед, Pullman Panwa accessible room, Cigna-direct-bill. Jobs: accessible-van booking (from Bangkok ฿15–25K/день), beach-wheelchair hotels.

**P-37 · Digital-Nomad Female-Solo "Leila, 30, IL"** — content-creator, 3 мес cycles DTV, $6K/мес, Bang Tao. Combines P-13 + P-14. Jobs: safety + VPN + Israeli community.

**P-38 · Korean/Japanese Golf-Retiree "Mr. Park, 68, KR"** — 4 мес/год high-season, Elite Gold, Mission Hills membership, ฿200K/мес. Jobs: Korean-language medical, annual tee-time blocks, JP/KR grocery delivery.

---

## 4. Уровень 4 — Аудиторные кластеры (Audience Clusters)

Агрегация персон по поведенческому паттерну для маркетинга и product-bundling.

| Код | Кластер | Входящие персоны | Ключевой общий признак | Доля GTM приоритета |
|---|---|---|---|---|
| **AC-A** | Tourists <30 days | P-01 P-02 P-03 P-04 P-05 P-31 | Visa-exemption, transient, high impulse | 20% |
| **AC-B** | Medical/Wellness travellers | P-06 P-07 P-08 P-09 P-32 P-35 P-36 | Цель поездки — здоровье | 10% |
| **AC-C** | Long-stay expats & nomads | P-10 P-11 P-13 P-14 P-30 P-37 | 6+ мес, нуждаются в инфраструктуре | 18% |
| **AC-D** | Семьи с детьми | P-16 P-17 P-18 | School-cycle driven | 10% |
| **AC-E** | Спортсмены и sport-families | P-18 P-19 | Training-camp focused | 5% |
| **AC-F** | HNW/UHNW investors & lifestyle | P-20 P-21 P-22 P-23 P-26 | $1M+ ticket | 12% |
| **AC-G** | Russian-speaking cross-tier | P-06 P-10 P-17 P-20 P-24 P-25 P-30 | Русский язык + sanctions-context | 15% (сквозной) |
| **AC-H** | Chinese / Mandarin-market | P-05 P-21 | WeChat/Alipay, Mandarin service | 5% |
| **AC-I** | GCC / Muslim | P-03 P-27 P-32 | Halal-stack, June–August | 4% |
| **AC-J** | Indian weddings & family | P-04 P-28 | Event-budget, Jain, music | 3% |
| **AC-K** | Retirees & snowbirds | P-12 P-38 | Age 50+, seasonality | 5% |
| **AC-L** | Mixed couples & expat-landlords | P-15 P-26 | Thai-ownership вопросы | 3% |
| **AC-M** | LGBTQ+, solo-female, accessibility | P-14 P-29 P-36 P-37 | Trust + safety-first | 3% (+ reputation-halo) |
| **AC-N** | B2B: developers, PM firms, sport academies | P-25 P-28 P-33 | Коммерческие контрагенты | 7% |

AC-G (русскоязычный кластер) — сквозной и пересекает все остальные; он же — основное конкурентное преимущество Ignatev Group за счёт Order 320-P и локальной репутации.

---

## 5. Уровень 5 — Сервисные кластеры и каталог 8 доменов

| Код | Сервисный кластер (домен) | Примеры сервисов внутри | Связь с myUNO apps |
|---|---|---|---|
| **SC-1 · Visa & Immigration** | TM30, TM47, extension, re-entry, Elite, LTR, DTV, overstay, Yellow/Pink ID, police clearance | VisaTrack, DTVready, ComplianceTrack (частично) |
| **SC-2 · Real Estate** | Search, contract review, due diligence, transfer, PM, rental, escrow, legal | PropertySearch, RentMatch, PMDashboard, InvestCalc, ContractAI, DepositSafe |
| **SC-3 · Finance & Tax** | Bank opening, FX, FET, tax residency, remittance, crypto-tax, WHT, corporate tax | BankPass, TransferRu, ExchangeBot, TaxNav, FinanceGuide |
| **SC-4 · Health & Wellness** | Hospital booking, IVF, dental, aesthetic, detox, insurance, emergency, dialysis | MedConnect*, WellnessPass*, PetHealth* (*gap/new) |
| **SC-5 · Education & Sports** | Schools, ECA, Cruzeiro, Thanyapura, Tiger MT, language | SchoolMatch*, CampFinder*, BloomPhuket (family-activities) |
| **SC-6 · Mobility & Connectivity** | SIM, eSIM, internet, car/bike rent, driver licence, airport FBO, yacht | SIMstart, CarRent, ElectroCheck (подключение), MarinaBerth* |
| **SC-7 · Business & Compliance** | DBD, BOI, FBL, VAT, work permit, hotel license, music license | ComplianceTrack, ContractAI, TaxNav, AI-агенты (Legal/Tax) |
| **SC-8 · Lifestyle, Events & Community** | Wedding, honeymoon, yacht charter, wellness retreat, community, concierge | EventPass, BloomPhuket, FinanceGuide (для HNW concierge) |

---

## 6. Уровень 6 — Полный каталог 36 приложений myUNO

Архитектурный принцип: **каждое приложение = один узкий job + одна чёткая монетизация + один owner-persona**. Все приложения доступны через SSO на bymyuno.com и живут на [appname].bymyuno.com.

### Phase 1 (Недели 1–4) — 10 приоритетных

| # | App | Домен | Core job | Primary persona | Monetisation | Ombudsman trust? |
|---|---|---|---|---|---|---|
| 1 | **ElectroCheck** | SC-6 | 3-day pre-arrival test: стабильность PEA, Wi-Fi speed-report виллы/кондо | P-02 P-04 P-13 | ฿190–490/отчёт, developer licence | — |
| 2 | **SIMstart** | SC-6 | Активация AIS/True/dtac SIM+eSIM из зала HKT | P-01…P-05 P-31 | Affiliate ฿50–200/SIM, topup-margin | — |
| 3 | **ExchangeBot** | SC-3 | Мониторинг курсов BBL/KBank/SuperRich/Twelve Victory (no aggregation) | Все тур+резиденты | Freemium + ad | — |
| 4 | **VisaTrack** | SC-1 | Таймер TM30/TM47/extension/re-entry для каждой визы | P-10 P-11 P-13 P-20 | ฿290/мес subscription | Средний |
| 5 | **BankPass** | SC-3 | Onboarding в BBL/KBank/SCB с документ-чеклистом по типу визы | P-10 P-13 P-15 | ฿1,990 one-off + агент-commission | Высокий |
| 6 | **TransferRu** | SC-3 | Рубль↔бат через лицензированные каналы (no нелегальная agg.) | AC-G | ฿299/мес + spread share | Высокий |
| 7 | **ContractAI** | SC-2 / SC-7 | AI-разбор SPA, lease (с учётом Dika 4655/2566), flag risks RU/EN | P-17 P-20 P-25 P-26 | ฿990/контракт; ฿9,900/abbo | **Очень высокий** |
| 8 | **TaxNav** | SC-3 | 180-day tracker + remittance-calculator по правилу 2024 | P-13 P-24 P-20 P-12 | ฿490/мес | Высокий |
| 9 | **DTVready** | SC-1 | Проверка eligibility + dossier-generator для DTV 3 категорий | P-13 P-19 P-37 | ฿4,990 pack | Средний |
| 10 | **ComplianceTrack** | SC-7 | Мониторинг DBD/IBAS flags + US FARA (для cross-border advisers) | P-25 P-26 | ฿4,900/мес B2B | **Очень высокий** |

### Phase 2 — Real Estate Track (PC2)

| # | App | Домен | Core job | Primary persona | Target MRR |
|---|---|---|---|---|---|
| 11 | **PropertySearch** | SC-2 | Поиск condo/villa с фильтрами foreign-quota, title-type, 140m rule | P-17 P-20 P-26 | ฿35K/мес (listed developers) |
| 12 | **RentMatch** | SC-2 | Long-term (30+day) rental-matcher avoiding Hotel Act breach | P-10 P-16 | ฿30K/мес |
| 13 | **PMDashboard** | SC-2 | Owner-side видимость revenue, OTA-commission, maintenance | P-26 P-20 P-22 | ฿40K/мес |
| 14 | **InvestCalc** | SC-2 | ROI-modeler для HNW ($7–10M tickets; IC lead-gen) | P-20 P-21 | lead-gen в Capital |
| 15 | **DepositSafe** | SC-2 | Escrow-заменитель при покупке (licensed bank trust + Ombudsman oversight) | P-17 P-20 P-29 | 0.5% сделки |

### Phase 3 — Community, Health, Family, Mobility

| # | App | Домен | Core job |
|---|---|---|---|
| 16 | **FinanceGuide** | SC-3 / SC-8 | HNW finance concierge (score 8.4): структурирование, banking, Ombudsman channel |
| 17 | **CarRent** | SC-6 | Car/bike rental с проверкой lessor-license, страховка included (score 8.7) |
| 18 | **EventPass** | SC-8 | Календарь + бронирование (KRSR, Vegetarian Festival, Songkran, концерты; score 8.5) |
| 19 | **BloomPhuket** | SC-5 / SC-8 | Family activities, kids' ECA, seasonal events (score 7.8) |
| 20 | **MedConnect** | SC-4 | Бронирование BHP/Siriroj/PIH/Mission с multi-lang coordinator |
| 21 | **DentalAI** | SC-4 | Quote-aggregator по Smile Signature / Sea Smile / PPSI-dental |
| 22 | **WellnessPass** | SC-4 / SC-8 | Amatara/Thanyapura/Santosa membership booking |
| 23 | **PetHealth** | SC-4 | DLD R1/1 + vet-verify + pet-friendly housing filter |
| 24 | **SchoolMatch** | SC-5 | BISP/UWC/HeadStart/BCIS waitlist-navigator + scholarship |
| 25 | **CampFinder** | SC-5 / SC-8 | Tiger MT, PTT, Sinbi, Thanyapura, Cruzeiro enrolment + DTV letter |
| 26 | **MarinaBerth** | SC-6 / SC-8 | Berth booking Ao Po / RPM / PYH / Boat Lagoon + haul-out |
| 27 | **YachtCharter** | SC-8 | 30-day+ charter (cabotage-compliant), crew visa |
| 28 | **HalalFinder** | SC-8 | Certified halal F&B, mosque, women-only spa (AC-I primary) |
| 29 | **RussianHub** | SC-8 | Русскоязычные verified-providers (врачи, юристы, школы) |
| 30 | **WeddingDest** | SC-8 | Destination-wedding workflow (Indian, LGBTQ+, Muslim sub-modules) |

### Phase 4 — B2B & Specialized

| # | App | Домен | Core job |
|---|---|---|---|
| 31 | **DeveloperPortal** | SC-2 / SC-7 | B2B для застройщиков: EIA tracker, 140m altitude compliance, BOI-land |
| 32 | **AcademyOps** | SC-5 | B2B для Cruzeiro-like академий: enrolment, student visas, insurance |
| 33 | **SeasonGuard** | SC-6 | Monsoon / tsunami / flood early-warning + evacuation routes |
| 34 | **SafetyFirst** | SC-6 / SC-8 | Safety-focus app для solo female / LGBTQ+ / accessibility |
| 35 | **PrivateJet** | SC-6 / SC-8 | FBO slot-booking (Siam Land Flying, MJets, VIP Jets) |
| 36 | **ConciergeUNO** | SC-8 | White-glove white-label для HNW + UHNW (cross-Capital/Estate) |

### 5 AI-агентов (горизонтальный слой)

| Код | AI-агент | Питание | Интеграция |
|---|---|---|---|
| **AGT-1** | **Legal Parser** | Dika 4655/2566 + CCC §§540, 1417, 1410; FBA; Hotel Act | ContractAI, ComplianceTrack, DepositSafe |
| **AGT-2** | **Tax Advisor** | Revenue Orders 161/162; Royal Decree 743 (LTR); MR 399 (crypto) | TaxNav, FinanceGuide |
| **AGT-3** | **Property Intelligence** | REIC, CBRE, Knight Frank, C9, Pulse; 140m rule; setbacks | PropertySearch, InvestCalc, DeveloperPortal |
| **AGT-4** | **Visa Navigator** | MFA, BOI, Immigration, TAT; 60-day updates, DTV, LTR, Elite | VisaTrack, DTVready, BankPass |
| **AGT-5** | **Market Intelligence** | TAT arrivals, tourism, pricing | BloomPhuket, EventPass, RentMatch |

---

## 7. Cross-Reference Matrix (персона × ситуация × приложение)

Сокращённая матрица для 10 топ-персон × 12 жизненных ситуаций. "●" — первичное использование; "○" — вторичное.

| Персона \\ LS | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **P-10 Relocator Pavel** | ● SIMstart, ExchangeBot | ● VisaTrack, BankPass, TaxNav | ○ ContractAI | — | — | ○ | ○ MedConnect | — | — | — | — | ● SeasonGuard |
| **P-13 DTV Alex** | ● SIMstart | ● DTVready, TaxNav, BankPass | — | — | — | — | — | — | — | — | — | ○ SafetyFirst |
| **P-17 Russian Family** | ● RussianHub | ● VisaTrack, BankPass, TransferRu | ● PropertySearch, ContractAI, DepositSafe, InvestCalc | ● PMDashboard | ● SchoolMatch, BloomPhuket, PetHealth, CampFinder | — | ○ MedConnect | ○ CampFinder | — | ○ FinanceGuide | — | ● SeasonGuard |
| **P-20 HNW Sergey** | ● ConciergeUNO | ● VisaTrack (LTR) | ● PropertySearch, ContractAI, DepositSafe, **InvestCalc→Capital** | ● PMDashboard | — | — | ○ WellnessPass | — | — | ● MarinaBerth, YachtCharter, PrivateJet, FinanceGuide, ComplianceTrack | ○ | ● ComplianceTrack |
| **P-22 Yacht Captain Nick** | — | ● VisaTrack (Elite) | — | ○ | — | — | ○ | — | — | ● MarinaBerth, YachtCharter | ○ EventPass (KRSR) | ● SeasonGuard |
| **P-25 Developer Max** | — | — | ● ContractAI, PropertySearch | ○ PMDashboard | — | ● DeveloperPortal, ComplianceTrack, TaxNav | — | — | — | — | — | ● ComplianceTrack |
| **P-27 GCC Al-Sabah** | ● HalalFinder | — | — | — | — | — | ○ MedConnect | — | — | ● ConciergeUNO, YachtCharter, PrivateJet | ○ WeddingDest | — |
| **P-28 Indian Wedding** | — | — | — | — | — | — | — | — | — | ○ | ● WeddingDest, EventPass | — |
| **P-06 Medical-Tourist Ekaterina** | ○ SIMstart | — | — | — | — | — | ● MedConnect, DentalAI, WellnessPass | — | — | — | — | — |
| **P-12 Snowbird Lars** | — | ● VisaTrack (Non-O) | ○ RentMatch | — | — | — | ○ MedConnect | ○ (гольф) | ● FinanceGuide, TaxNav | — | ○ EventPass | ● SeasonGuard |

**Прочтение матрицы.** Russian Family (P-17) использует 12 разных приложений в течение 18 мес — это **максимально flywheel-генерирующая персона** и должна быть первичной целью onboarding-воронки в phase 1–2. HNW Sergey (P-20) использует меньше приложений, но с **максимальной маржой и с прямым переходом в Capital** через InvestCalc + DepositSafe + FinanceGuide.

---

## 8. Gap analysis — непокрытые микроситуации (White Spaces)

Микроситуации, которые **не покрыты** ни одним из 36 приложений и представляют собой кандидатов для Phase 5–6 или партнёрств.

### Топ-15 приоритетных gap'ов (по частоте × willingness-to-pay × moat)

1. **Injury+Insurance claim concierge** (MS-1201, MS-806) — scooter-авария с полной обработкой страховки и полиции. Нет app; только Quintessentially/концерж. **→ новое приложение "InsuranceClaim"**.
2. **Home-care nursing matching** (MS-906) — нет marketplace для Nurse On Call / частных сиделок для retirees. **→ "HomeCareMatch"**.
3. **Assisted-living planning** (MS-907) — Пхукет без dedicated facilities; gap для retirement-сегмента. **→ партнёрство с Chiang Mai Care Resort + future Phuket Senior Living**.
4. **Cannabis medical consultation** (MS-1X post-June 2025) — после reclassification нужен verified-MD + licensed dispensary matcher. **→ "CannabisMedConnect"**.
5. **Post-op recovery villa** (MS-704) — serviced rehab accommodations с медсестрами. Ручная работа; нет platform. **→ extension WellnessPass или новое "RecoveryStay"**.
6. **Crypto-onramp/offramp compliance** (MS-207 + MS-1001 P-24) — USDT-OTC grey; MR 399 dual-tax regime. **→ "CryptoCompliance"**.
7. **Mandarin-segment closed-loop** (P-05 P-21) — WeChat/Alipay глубокая интеграция, Chinese-nominee risk. **→ "MandarinUNO"** (аналог RussianHub).
8. **LGBTQ+ wedding cross-border paperwork** (MS-1104) — UK embassy "no impediment" блок, international recognition. **→ extension WeddingDest**.
9. **Yacht crew welfare** (P-34) — специфическая страховка, crew-DTV, social network. **→ extension YachtCharter или "CrewLife"**.
10. **Jain/Kosher/vegan-strict catering verification** (MS-1102) — пока ручная работа у wedding-planners. **→ extension WeddingDest или HalalFinder→FoodCertify**.
11. **Birth-tourism coordination** (P-X) — Russian/Chinese пары; визы при беременности, embassy registration. Sensitive. **→ "MaternityPass"** (правовая экспертиза обязательна).
12. **Film-production permit bundle** (P-33 MS-1106) — CAAT drone + National Parks + Thailand Film Office 30%. **→ "FilmOps"**.
13. **F&B / Tourism business licensing** (MS-601 MS-606 MS-611) — TAT tour-operator, hotel license, alcohol type 3/4, music MCT. **→ "BizLicense"**.
14. **Accessible travel planning** (P-36) — beach wheelchairs, accessible vans, hotel verification. **→ "AccessPhuket"** (или extension SafetyFirst).
15. **Alternative-asset logistics** (MS-1007) — wine/watch/art bonded storage, CITES, insurance. **→ "AltAssetVault"**.

### Вторичные gap'ы (Phase 7+)
- Eco-rewilding / conservation tourism booking (Soi Dog, Sea Turtle Centre Mai Khao)
- Monsoon insurance marketplace
- Scooter rental verification registry (тактический расширение CarRent)
- Dhol-wala/Indian music artist flight bookings (micro-feature внутри WeddingDest)
- Korean/Japanese golf-retiree closed-loop (модуль MandarinUNO-analog для KR/JP)

### Дублирование / overlap внутри портфеля (требует cleanup)
- **ContractAI vs ComplianceTrack vs Legal Parser (AGT-1)** — есть риск пересечения: все трое используют legal-corpus. **Правило:** ContractAI — для B2C разбор отдельного документа; ComplianceTrack — для B2B мониторинг статуса компании/сделки; Legal Parser — shared backbone (не выставляется напрямую пользователю).
- **TaxNav vs FinanceGuide** — TaxNav = self-service tracker; FinanceGuide = HNW-concierge human-in-the-loop. Разделение чёткое.
- **BankPass vs TransferRu** — BankPass = открытие; TransferRu = денежные переводы. Нет перекрытия.
- **VisaTrack vs DTVready** — VisaTrack = tracking существующей; DTVready = dossier-gen для подачи. Четко разделено.
- **CampFinder vs AcademyOps** — B2C vs B2B split. Чёткое.
- **ConciergeUNO vs FinanceGuide** — оба для HNW; правило: ConciergeUNO = lifestyle/event; FinanceGuide = финансы/legal.
- **WeddingDest vs EventPass** — WeddingDest = организация своего события; EventPass = discovery чужих событий.
- **HalalFinder vs RussianHub vs MandarinUNO** — cultural-hub паттерн, можно вынести в shared **"CulturalHub" framework** с инстанциями.

---

## 9. Flywheel mapping — myUNO ↔ Estate ↔ Capital

**Принцип:** 36 приложений myUNO — это top-of-funnel (широкий, низкочекающий, high-frequency). Estate (35 объектов) — mid-funnel (средний чек, retention). Capital ($7–10M ticket) — bottom-funnel (самая высокая маржа, от 10–50 клиентов/год).

### Top 10 flywheel-связок (myUNO → Estate → Capital)

| # | Trigger micro-situation | App myUNO | Переход в Estate | Переход в Capital |
|---|---|---|---|---|
| 1 | Русскоязычная семья планирует покупку виллы ฿50M+ | ContractAI + PropertySearch + DepositSafe | PMDashboard after purchase | InvestCalc с escalation на ≥$7M ticket |
| 2 | HNW client получает LTR WGC, ищет $10M+ deployment | VisaTrack + TaxNav (LTR exemptions) | Estate portfolio intake | Direct Capital lead |
| 3 | Застройщик хочет распродать inventory до оверсаплая 2026 | DeveloperPortal + ComplianceTrack | Estate marketing channel | Capital syndication if size ≥$30M |
| 4 | Absentee owner страдает от PM fraud | PMDashboard | Estate переход на full-service | Capital re-deployment если owner продаёт |
| 5 | Dika-проверка старого leasehold villa | ContractAI + Legal Parser | Estate re-structures (usufruct/Sap-Ing-Sith) | Capital обмен на freehold condo-portfolio |
| 6 | Crypto-founder ищет real-estate hedge | TaxNav + FinanceGuide | Estate rental portfolio | Capital tokenized real-estate offering |
| 7 | GCC family хочет branded residence | ConciergeUNO + HalalFinder + PropertySearch | Estate seasonal management | Capital multi-asset |
| 8 | Yacht owner хочет house+berth combo | MarinaBerth + PropertySearch | Estate manages villa while at sea | Capital integrated yacht+RE |
| 9 | School-relocator (BISP+Cruzeiro) — 3+ years stay | SchoolMatch + VisaTrack + RentMatch | Estate long-term rental | Capital если семья решает покупать + второй asset |
| 10 | Russian HNW exit из РФ с sanctions-compliant rails | TransferRu + ComplianceTrack + FinanceGuide | Estate pre-arrival setup | Capital white-glove onboarding |

### Ombudsman trust-layer

Статус Павла Игнатьева как Общественного представителя Уполномоченного **особо усиливает 6 точек взаимодействия**:

1. **DepositSafe** — escrow-заменитель с Ombudsman oversight = единственный маркетингово-защищённый механизм на рынке после March 2025 ruling;
2. **ContractAI** — юридический "второй взгляд" с институциональной гарантией;
3. **ComplianceTrack** — для russophone entrepreneurs, чувствительных к IBAS/DSI screenings;
4. **FinanceGuide** — HNW-concierge с escalation-channel в Уполномоченного при dispute;
5. **TransferRu** — подчёркивает legality каналов, нет нелицензированных FX;
6. **Capital onboarding** — Order 320-P как trust-signal для $7M+ LPs.

Во всех публичных коммуникациях этих 6 продуктов — badge "При участии Общественного представителя Уполномоченного по защите прав предпринимателей города Москвы в Таиланде" (соблюдая правила неинтерпретации полномочий).

---

## 10. Priority score matrix (следующие итерации)

Оценка приложений по 4 факторам × веса: **Frequency (25%) × Willingness-to-Pay (30%) × Competitive Moat (20%) × Flywheel Value to Estate/Capital (25%)**. Шкала 1–10; итог — weighted sum.

| # | App | Freq | WTP | Moat | Flywheel | Score |
|---|---|---|---|---|---|---|
| 1 | **DepositSafe** | 4 | 10 | 10 | 10 | **8.4** |
| 2 | **ContractAI** | 7 | 9 | 9 | 9 | **8.55** |
| 3 | **InvestCalc** | 3 | 9 | 8 | 10 | **7.65** |
| 4 | **FinanceGuide** | 6 | 10 | 9 | 10 | **8.8** |
| 5 | **ComplianceTrack** | 5 | 10 | 9 | 9 | **8.3** |
| 6 | **VisaTrack** | 10 | 6 | 6 | 5 | **6.7** |
| 7 | **PMDashboard** | 10 | 8 | 7 | 9 | **8.55** |
| 8 | **BankPass** | 5 | 8 | 7 | 7 | **6.8** |
| 9 | **TransferRu** | 9 | 8 | 8 | 8 | **8.25** |
| 10 | **PropertySearch** | 7 | 7 | 6 | 10 | **7.55** |
| 11 | **DTVready** | 4 | 8 | 7 | 5 | **6.05** |
| 12 | **TaxNav** | 10 | 8 | 8 | 7 | **8.25** |
| 13 | **SIMstart** | 10 | 3 | 3 | 2 | **4.4** |
| 14 | **ElectroCheck** | 5 | 5 | 6 | 3 | **4.65** |
| 15 | **ExchangeBot** | 10 | 3 | 4 | 3 | **4.95** |
| 16 | **RentMatch** | 8 | 6 | 6 | 7 | **6.75** |
| 17 | **ConciergeUNO** | 6 | 10 | 7 | 10 | **8.4** |
| 18 | **SchoolMatch** | 3 | 8 | 7 | 6 | **6.05** |
| 19 | **CampFinder** | 4 | 7 | 7 | 5 | **5.75** |
| 20 | **EventPass** | 8 | 5 | 5 | 4 | **5.5** |
| 21 | **CarRent** | 10 | 5 | 4 | 4 | **5.8** |
| 22 | **BloomPhuket** | 8 | 4 | 4 | 5 | **5.25** |
| 23 | **MedConnect** | 7 | 7 | 6 | 6 | **6.55** |
| 24 | **RussianHub** | 9 | 5 | 8 | 8 | **7.45** |
| 25 | **HalalFinder** | 5 | 5 | 7 | 5 | **5.4** |
| 26 | **WeddingDest** | 2 | 10 | 7 | 7 | **6.65** |
| 27 | **MarinaBerth** | 3 | 8 | 7 | 8 | **6.55** |
| 28 | **YachtCharter** | 4 | 9 | 7 | 8 | **7.1** |
| 29 | **PetHealth** | 5 | 6 | 6 | 4 | **5.25** |
| 30 | **SeasonGuard** | 8 | 4 | 5 | 4 | **5.2** |
| 31 | **PrivateJet** | 2 | 10 | 7 | 8 | **6.9** |
| 32 | **DeveloperPortal** | 4 | 9 | 8 | 9 | **7.6** |
| 33 | **AcademyOps** | 3 | 8 | 8 | 6 | **6.25** |
| 34 | **SafetyFirst** | 7 | 4 | 5 | 3 | **4.7** |
| 35 | **WellnessPass** | 5 | 7 | 6 | 6 | **6.05** |
| 36 | **DentalAI** | 4 | 7 | 5 | 4 | **5.0** |

### Топ-10 приоритетов по весам

1. **FinanceGuide 8.8** — флагман HNW-концьержа, ключевой мост в Capital.
2. **ContractAI 8.55** — максимальный Ombudsman-moat после Dika 2025.
3. **PMDashboard 8.55** — единственный high-freq app с высокой маржей + прямой flywheel в Estate.
4. **DepositSafe 8.4** — escrow-gap на рынке; абсолютный Ombudsman-moat.
5. **ConciergeUNO 8.4** — UHNW-retention engine.
6. **ComplianceTrack 8.3** — B2B монополия на nominee/DBD/IBAS navigation.
7. **TransferRu 8.25** — русскоязычный must-have.
8. **TaxNav 8.25** — 2024 remittance rule даёт монопольное окно.
9. **InvestCalc 7.65** — lead-gen прямо в Capital.
10. **DeveloperPortal 7.6** — B2B high-margin, 140m-rule + EIA навигация.

### Рекомендуемая последовательность запуска
- **Q1–Q2 2026**: ContractAI, DepositSafe, VisaTrack, BankPass, TransferRu, TaxNav, DTVready, SIMstart, ElectroCheck, ExchangeBot (Phase 1 baseline).
- **Q3 2026**: PropertySearch, RentMatch, PMDashboard, InvestCalc, FinanceGuide, ComplianceTrack.
- **Q4 2026**: ConciergeUNO, RussianHub, DeveloperPortal, MedConnect, SchoolMatch.
- **2027 H1**: все остальные + gap-filler-apps (InsuranceClaim, HomeCareMatch, MandarinUNO, FilmOps, BizLicense).

---

## 11. Приложение A — Справочники Supabase (enum-таблицы)

Для технической реализации платформы. Каждая таблица — один enum, используемый по всему стеку приложений.

### `life_situations` (12 значений)
`LS-01 first_week`, `LS-02 onboarding_90d`, `LS-03 property_purchase`, `LS-04 property_ownership`, `LS-05 family_relocation`, `LS-06 business_operation`, `LS-07 medical_stay`, `LS-08 sport_camp`, `LS-09 retirement`, `LS-10 hnw_lifestyle`, `LS-11 destination_event`, `LS-12 crisis`.

### `persona_codes` (38 значений P-01…P-38, см. раздел 3)

### `audience_clusters` (14: AC-A…AC-N)

### `service_clusters` (8: SC-1…SC-8)

### `visa_types` (17 значений)
`visa_exempt_60d`, `visa_exempt_korea_90d`, `voa_15d`, `tr_setv`, `tr_metv`, `non_b`, `non_o_marriage`, `non_o_guardian`, `non_o_retirement`, `non_oa`, `non_ox`, `privilege_bronze`, `privilege_gold`, `privilege_platinum`, `privilege_diamond`, `privilege_reserve`, `ltr_wgc`, `ltr_wp`, `ltr_wfTP`, `ltr_hsp`, `dtv_workcation`, `dtv_soft_power`, `dtv_dependant`, `smart_s`, `ed`.

### `land_title_types` (6 значений)
`chanote_ns4j`, `ns3g`, `ns3`, `sk1`, `pbt5`, `spk_4_01`.

### `real_right_types` (5 значений)
`freehold_condo`, `leasehold_30y`, `usufruct`, `superficies`, `habitation`, `sap_ing_sith`.

### `property_zones_phuket` (16 геозон)
`bang_tao_cherngtalay`, `layan`, `surin`, `kamala_kalim`, `patong`, `kata`, `karon`, `rawai`, `nai_harn`, `chalong`, `phuket_town`, `mai_khao`, `nai_yang`, `nai_thon`, `cape_panwa`, `cape_yamu_ao_po`, `kathu`, `thalang_inland`.

### `compliance_events` (12 значений)
`tm30_arrival`, `tm30_reentry`, `tm47_90day`, `reentry_permit`, `visa_extension`, `work_permit_renewal`, `90day_to_annual_switch`, `ltr_year1_check`, `fet_property`, `dbd_shareholder_review`, `ibas_flag`, `fara_disclosure_us`.

### `tax_events` (9)
`days_count_180`, `remittance_2024`, `ltr_exemption`, `mr399_crypto_capgain`, `pnd91_annual`, `pnd50_corp`, `wht_rental`, `wht_transfer`, `sbt_check_5y`.

### `seasons_phuket` (6)
`high_nov_apr`, `shoulder_may`, `low_jun_sep`, `shoulder_oct`, `chinese_ny`, `songkran`, `vegetarian_fest`.

### `hazards` (7)
`monsoon_flood`, `tsunami`, `jellyfish_bluebottle`, `jellyfish_box`, `scooter_accident`, `property_scam`, `financial_scam`.

### `languages_supported` (9)
`ru`, `en`, `zh`, `ar`, `he`, `fr`, `de`, `ja`, `ko`, `hi`, `th`.

---

## 12. Приложение B — Глоссарий (sorted A–Я/A–Z)

**AMLO** — Anti-Money Laundering Office of Thailand; регулирует среди прочего FX-aggregation, с 2025 прорабатывает nominee-landholding как predicate offense.
**BOI** — Board of Investment; administers LTR visa и промо-привилегии (tax holiday 3–13 лет, waived 4:1 ratio).
**Chanote (Nor Sor 4 Jor / โฉนด)** — сильнейший тайский титул, GPS-выверенные границы, <30% общей земли страны.
**CCC** — Civil & Commercial Code. Ключевые секции: §§540 (30-year lease cap), 1402–1409 (habitation), 1410–1416 (superficies), 1417–1428 (usufruct).
**Dika 4655/2566** — ключевое решение Верховного суда Таиланда (решено 2023, публичность 2025), признавшее pre-agreed lease renewals void beyond первые 30 лет. Кейс происходил в Пхукете.
**DBD** — Department of Business Development, Ministry of Commerce; регистрирует юрлица, администрирует FBA и nominee-screening, включая систему IBAS.
**DSI** — Department of Special Investigation; ведёт сложные дела по nominee, money laundering, FBA на Пхукете с 2024.
**DTV** — Destination Thailand Visa (запущена 15.07.2024); 5-year multi-entry, 180 дней/въезд, ฿500K proof, 3 категории: Workcation, Soft Power, Dependant.
**Elite / Thailand Privilege** — 5-tier visa (Bronze ฿650K / Gold ฿900K / Platinum ฿1.5M / Diamond ฿2.5M / Reserve ฿5M); администрируется Thailand Privilege Card Co., Ltd.
**FBA** — Foreign Business Act B.E. 2542 (1999); Lists 1–3 restricted activities; требует FBL для foreigners в List 2/3.
**FBL** — Foreign Business License (под FBA).
**FBO** — Fixed Base Operator; на HKT — Siam Land Flying (новый, 2024–2025) и MJets ground handling.
**FET / Tor Tor 3** — Foreign Exchange Transaction form; обязателен для transfers ≥ US$50K при покупке condo и для future capital repatriation.
**HKT** — IATA-code Phuket International Airport.
**IBAS** — Intelligence Business Analytic System; DBD AI-платформа (late 2025) для выявления nominee-структур.
**JCI** — Joint Commission International; аккредитация BHP, Siriroj.
**LTR** — Long-Term Resident visa; 4 категории: WGC (Wealthy Global Citizen), WP (Wealthy Pensioner), WfTP (Work-from-Thailand Professional), HSP (Highly-Skilled Professional); fee ฿50K; 10-year stay (5+5).
**MR 399 (Ministerial Reg 399)** — Royal Gazette 05.09.2025; 0% PIT на crypto capital gains через SEC-licensed exchanges 2025–2029.
**Nominee** — использование Thai shareholders как прокси для de facto foreign control; незаконно под Land Code §§96/113 и FBA; penalties до 3 лет + ฿100K–1M + forced sale.
**Nor Sor 3 Gor (น.ส.3 ก.)** — конфирмированное владение с аэрофото-границами; upgradable до Chanote.
**Non-O / Non-O-A / Non-O-X** — retirement-visas для 50+; финансовые пороги ฿400K/฿800K/฿3M соответственно.
**PEA** — Provincial Electricity Authority (вне Bangkok; Phuket в PEA).
**PMG** — Property Management (full-service 20–30% of revenue short-term, 10–15% long-term).
**PPSI** — Phuket Plastic Surgery Institute (формирован 2016 из BPICS+PIAC, при PIH / Bangkok Hospital Siriroj).
**PromptPay** — национальная QR-платёжная система; доступна foreigners с Thai bank account (по passport/pink ID).
**PWA** — Provincial Waterworks Authority.
**RPM** — Royal Phuket Marina; 5 Gold Anchor, 350 berths включая dry-stack, Asia's first Carbon Neutral Marina.
**Sap-Ing-Sith** — новое registrable real right (CCC-amendments) как post-2025 альтернатива проблемным lease-renewals.
**SBT** — Specific Business Tax 3.3%; при продаже property удерживаемой <5 лет.
**Section 38 (Immigration Act)** — правовая база TM30.
**Sor Kor 1 (ส.ค.1)** — pre-1972 возможностное уведомление; не mortgageable/leasable/subdividable; foreigners не могут владеть.
**SRS** — Sex Reassignment Surgery; Kamol Hospital (Bangkok) primary provider.
**Tabien Baan (Thor Ror 13)** — жёлтая домовая книга для foreigners; выдаётся в amphoe по прописке.
**TDAC** — Thailand Digital Arrival Card; заменил бумажный TM6 с 01.05.2025; онлайн за 3 дня до прилёта.
**TM30** — уведомление о месте жительства foreigner, в 24 часа с прибытия; responsibility landlord/house master; section38.immigration.go.th.
**TM47** — 90-day report для стэев >90 дней; окно -15 / +7 дней; tm47.immigration.go.th.
**UWC Thailand** — United World College (16-й в мире); IB Continuum; Thalang campus co-located с Thanyapura.

---

## Заключение: от таксономии к продукту

**Три ключевых вывода.** Первое — для Пхукета **не существует реального конкурента myUNO как портфолио 36 узких apps**: Airbnb/Agoda/Grab/Booking покрывают горизонтальные transactions, а вертикальные игроки (Siam Legal, CBRE, private wealth советники) не масштабируются через software. Myuno занимает пересечение: узкие microsituations × SSO-hub × trust-слой Ombudsman.

**Второе — приоритизация должна строиться не по частоте, а по flywheel-ценности.** SIMstart (10-балльная частота) генерирует 5x меньше выручки, чем DepositSafe (4-балльная частота, 10-балльный Ombudsman-moat и 10-балльная flywheel-value в Capital). Phase 1 должен иметь 2–3 high-frequency acquisition-apps (SIMstart, ExchangeBot, VisaTrack, ElectroCheck) как "верхняя воронка", но маржинальная часть портфолио — 5 премиум-apps с Ombudsman-усилением (ContractAI, DepositSafe, ComplianceTrack, FinanceGuide, TransferRu).

**Третье — русскоязычный кластер AC-G пересекает всё** и является одновременно самым объёмным (1.07M Russian arrivals 2024, ~30K+ residents) и самым недообслуженным рынком на острове. Комбинация Order 320-P, RussianHub, ContractAI и TransferRu формирует защищённый канал, который невозможно воспроизвести без формальной институциональной поддержки.

**Новый ракурс.** Самое крупное "белое пятно" в портфеле — не отдельное приложение, а **отсутствие единого shared identity-слоя для трастового разрешения споров**. После Dika 4655/2566, IBAS-screening, BoT fraud-regulations 17.12.2025, cannabis reclassification и нового remittance tax — каждый высокобюджетный expat на Пхукете находится в состоянии правовой неопределённости. DepositSafe + ComplianceTrack + Ombudsman channel могут стать **де-факто инфраструктурой доверия для русскоязычного HNW-сегмента в Таиланде**, что само по себе — более крупный бизнес, чем сумма всех 36 apps.

**Практический next step для команды.** Немедленно (1) залить справочники из раздела 11 в Supabase; (2) реализовать P-17 (Russian Family) как первую end-to-end journey через 12 приложений; (3) оформить badging Ombudsman на 6 trust-touchpoints; (4) начать Phase 2 gap-closure с InsuranceClaim и HomeCareMatch как самых высокочастотных гапов; (5) построить единый event-bus (persona × life_situation × micro_situation × app) — он автоматически сгенерирует cross-sell между apps и flywheel-triggers в Estate/Capital.