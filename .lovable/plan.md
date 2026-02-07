

## Coral Lounge Thailand -- Исследование и план интеграции

### Что я нашёл о Coral Lounge

**The Coral Executive Lounge** -- крупнейший оператор VIP-сервисов в аэропортах Таиланда.

**Контакты:**
- Сайт: coralthailand.com
- Email для бронирования: booking@coralphuket.com
- Email для продаж: sales@coralthailand.com

**Аэропорты присутствия:**
- Phuket (HKT)
- Bangkok Suvarnabhumi (BKK)
- Bangkok Don Mueang (DMK)
- Chiang Mai (CNX)

**Часы работы:** 06:00 -- 24:00 ежедневно
**Минимальное время бронирования:** 12 часов до рейса (на сайте Coral), 24 часа (через агентов)
**Дети до 2 лет:** бесплатно. Старше 2 лет = тариф взрослого.

---

### Услуги Coral Lounge в HKT (Phuket) и актуальные цены

Цены по прайсу (ноябрь 2025 -- октябрь 2026):

#### A. Arrival (International)

| Услуга | Цена (THB) | Вне часов работы |
|--------|-----------|-----------------|
| VIP Arrival Service (Meet & Greet + Fast Track + Porter) | 2,100 | 2,300 (мин. 2 чел.) |
| Fast Track Only (immigration lane) | 1,300 | N/A |

#### B. Departure (International)

| Услуга | Coral Executive Lounge | Coral Premium Lounge | Coral First Class |
|--------|----------------------|---------------------|------------------|
| VIP Departure (escort + lounge + fast track) | 2,500 | 3,300 (вне часов 3,799) | 4,100 (мин. 8 чел.) |
| Lounge Only | 1,400 | 1,900 (вне часов 2,185) | 2,900 (мин. 8 чел.) |
| Fast Track Only | 1,300 | 1,300 | 1,300 |

#### Что входит в VIP Arrival:
1. Meet & Greet у выхода из самолёта
2. Escort через immigration fast track lane
3. Помощь с Visa on Arrival (если нужна)
4. Porter -- до 2 единиц багажа на пассажира
5. Координация с водителем/отелем у выхода

#### Что входит в VIP Departure:
1. Meet & Greet на входе в аэропорт
2. Porter
3. Fast Track через immigration
4. Доступ к лаунжу (еда, напитки, алкоголь, Wi-Fi, массаж)
5. Лаунж -- макс. 2.5 часа (доплата 350 THB/час, 1,000 THB/час для First Class)
6. Дополнительный багаж сверх 2 шт. -- 100 THB/шт.

#### Дополнительная услуга:
- **Welcome by Coral** (только Arrival) -- встреча с табличкой после таможни, без fast track

---

### Что нужно обновить в myUNO

Текущие цены в базе занижены и не соответствуют реальному прайсу Coral:

| SKU | Сейчас в базе | Цена Coral | Рекомендация |
|-----|--------------|-----------|-------------|
| HKT-FT-ARR (Fast Track Arrival) | 2,500 | 2,100 (VIP) / 1,300 (FT only) | Разбить на 2 продукта |
| HKT-FT-DEP (Fast Track Departure) | 2,900 | 2,500 (Executive) / 3,300 (Premium) | Разбить по типам лаунжа |
| HKT-ADDON-LOUNGE | 1,200 | 1,400--2,900 (зависит от уровня) | Разбить по уровням |

---

### План реализации

#### 1. Внести Coral Lounge как поставщика в `airport_suppliers`

Данные:
- Название: The Coral Executive Lounge
- Email: booking@coralphuket.com / sales@coralthailand.com
- Сайт: coralthailand.com
- Аэропорты: HKT (сейчас), позже BKK/DMK/CNX
- Часы: 06:00--24:00
- Cutoff: 12 часов (для наших целей -- 24 часа)

#### 2. Переструктурировать каталог `airport_services`

Вместо текущих 2 общих продуктов -- создать реальную линейку Coral:

**Arrival (International):**
| SKU | Название | Retail Price | Описание |
|-----|---------|-------------|---------|
| HKT-CRL-ARR-VIP | VIP Arrival Service | 2,500 | Meet & Greet + Fast Track + Porter |
| HKT-CRL-ARR-FT | Fast Track Only (Arrival) | 1,500 | Immigration fast track lane only |
| HKT-CRL-ARR-MEET | Airport Meet & Greet | 800 | Welcome с табличкой, без fast track |

**Departure (International):**
| SKU | Название | Retail Price | Описание |
|-----|---------|-------------|---------|
| HKT-CRL-DEP-EXEC | VIP Departure -- Executive Lounge | 2,900 | Fast Track + Executive Lounge |
| HKT-CRL-DEP-PREM | VIP Departure -- Premium Lounge | 3,800 | Fast Track + Premium Lounge |
| HKT-CRL-DEP-FC | VIP Departure -- First Class | 4,700 | Fast Track + First Class Lounge (мин. 8 чел.) |
| HKT-CRL-DEP-FT | Fast Track Only (Departure) | 1,500 | Immigration fast track only |
| HKT-CRL-DEP-LNG-EXEC | Lounge Only -- Executive | 1,600 | Без escort, только лаунж |
| HKT-CRL-DEP-LNG-PREM | Lounge Only -- Premium | 2,200 | Без escort, Premium Lounge |

**Бандлы (Arrival + Transfer):**
| SKU | Название | Retail Price | Экономия |
|-----|---------|-------------|---------|
| HKT-CRL-BND-SEDAN | VIP Arrival + Sedan Transfer | 3,400 | ~15% vs отдельно |
| HKT-CRL-BND-VAN | VIP Arrival + Family Van | 3,900 | ~15% vs отдельно |
| HKT-CRL-BND-FULL | Full VIP Package (Arrival + Assistant + Sedan) | 5,200 | ~20% vs отдельно |

**Night surcharge (00:01--06:00):** +200 THB (для arrival VIP)

#### 3. Привязать к LifeOS ситуации "Trip Planning" (планирую)

Fast Track -- услуга для планирования, не для "только прилетел". Переместить основную привязку с `arrival_first_day` на `pre_trip_planning` с высоким весом (85), а в `arrival_first_day` оставить как вторичную (вес 50, "ещё не поздно забронировать").

#### 4. Обновить UI страницы Fast Track

- Добавить выбор уровня лаунжа для Departure (Executive / Premium / First Class)
- Показать включённые услуги для каждого уровня
- Отобразить бренд Coral Lounge (логотип, доверие)
- Обновить копирайт на реальные описания услуг

---

### Техническая реализация

1. **INSERT в `airport_suppliers`**: Coral Lounge с полными контактами
2. **UPDATE `airport_services`**: Заменить generic SKU на реальную линейку Coral с привязкой к supplier
3. **UPDATE `catalog_life_map`**: Переназначить weight -- `pre_trip_planning` = 85, `arrival_first_day` = 50
4. **UPDATE UI**: AirportFastTrackPage -- выбор уровня лаунжа, описания услуг Coral
5. **Мультиязычные тексты**: EN/RU/TH для всех новых продуктов

