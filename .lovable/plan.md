

## Интеграция второго поставщика: Phuket Fast Track (Asia Fast Track)

### Результаты исследования

**Phuket Fast Track** -- это локальный бренд глобальной сети **Asia Fast Track**, работающей в 350+ аэропортах. В Таиланде они обслуживают HKT, BKK, DMK, CNX, USM, KBV. Компания работает под брендом **I Asia Thailand** (видно на Viator).

**Контакты:**
- Сайт: phuketfasttrack.com (маркетинг) / asiafasttrack.com (бронирование)
- WhatsApp: +65 8820 6350 (сингапурский номер, центральный офис)
- Бронирование: через book.asiafasttrack.com
- Viator: продукт 90546P94, рейтинг 4.7/5 (297 отзывов, 92% рекомендуют)

**Часы работы:** Fast Track доступен 06:00--23:59 (по времени рейса)
**Cutoff:** Отмена/бронирование за 24 часа
**Дети:** до 2 лет бесплатно, старше 2 -- полный тариф
**Опыт:** 14+ лет работы в аэропортах Таиланда

---

### Услуги Phuket Fast Track в HKT и цены

Цены взяты с Viator (актуальные, в THB по курсу ~35 THB/USD):

#### Arrival (International)

| Услуга | Цена (THB, оценка) | Что входит |
|--------|-------------------|-----------|
| Fast Track Arrival (базовый) | ~1,200--1,500 | Meet at skybridge, escort через immigration, помощь с багажом, проводят к водителю |
| Fast Track Arrival + Lounge | ~2,500--3,000 | То же + 2 часа VIP lounge |
| Fast Track Arrival + Transfer (Sedan) | ~3,500--4,000 | То же + трансфер до отеля |
| Fast Track Arrival + Transfer (Van 6 pax) | ~5,000--5,500 | Для групп до 6 чел. |

#### Departure (International)

| Услуга | Цена (THB, оценка) | Что входит |
|--------|-------------------|-----------|
| Fast Track Departure | ~1,200--1,500 | Meet у входа, помощь с check-in, escort через immigration, проводят к gate/lounge |
| Fast Track Departure + Premium Lounge | ~3,000--3,500 | То же + 2 часа Premium Lounge |

#### Ночные доплаты (00:00--05:59)
- Fast Track: +500 THB/чел (мин. 2 чел.)
- Fast Track + Premium Lounge: +1,300 THB/чел (мин. 2 чел.)

#### Ключевые отличия от Coral Lounge

| Параметр | Coral Lounge | Phuket Fast Track |
|----------|-------------|-------------------|
| Тип компании | Локальный оператор лаунжей | Глобальная сеть (350+ аэропортов) |
| Фокус | Собственные лаунжи (3 уровня) | Meet & Assist + партнёрские лаунжи |
| Лаунж-тиры | Executive / Premium / First Class | Один уровень (Premium) |
| Ночные доплаты | +200 THB фиксированно | +500 THB/чел (мин. 2 чел.) |
| Трансферы | Нет (через myUNO бандлы) | Собственные трансферы (sedan/van) |
| Viator рейтинг | N/A | 4.7/5 (297 отзывов) |
| Покрытие аэропортов | Только HKT | HKT, BKK, DMK, CNX, USM, KBV |

---

### Предложение по интеграции

#### 1. Добавить Phuket Fast Track как второго поставщика

Вставить в `airport_suppliers`:
- name: "Phuket Fast Track (Asia Fast Track)"
- contact: WhatsApp +65 8820 6350
- website: phuketfasttrack.com
- priority: 2 (Coral остаётся primary)
- SLA: 30 мин
- commission: 15%

#### 2. Добавить SKU-продукты Phuket Fast Track

Новые записи в `airport_services` с префиксом `HKT-PFT-`:

**Arrival:**
| SKU | Название | Retail (THB) |
|-----|---------|-------------|
| HKT-PFT-ARR-FT | Fast Track Arrival | 1,500 |
| HKT-PFT-ARR-LNG | Fast Track Arrival + Lounge | 2,800 |

**Departure:**
| SKU | Название | Retail (THB) |
|-----|---------|-------------|
| HKT-PFT-DEP-FT | Fast Track Departure | 1,500 |
| HKT-PFT-DEP-LNG | Fast Track Departure + Premium Lounge | 3,200 |

**Бандлы с трансфером:**
| SKU | Название | Retail (THB) |
|-----|---------|-------------|
| HKT-PFT-BND-SEDAN | Fast Track + Sedan Transfer | 3,200 |
| HKT-PFT-BND-VAN | Fast Track + Van Transfer (6 pax) | 5,000 |

**Ночные доплаты:** +500 THB/чел (мин. 2 чел.)

#### 3. UI: Выбор поставщика на странице Fast Track

Обновить `AirportFastTrackPage.tsx`:
- Добавить шаг "Выбор поставщика" перед выбором услуги
- Показывать карточки: Coral Lounge (премиум, собственные лаунжи) vs Phuket Fast Track (международный сервис, 4.7 рейтинг)
- При выборе поставщика -- фильтровать каталог услуг по `supplier_id`

#### 4. Привязка к `airport_services`

Добавить колонку `supplier_id` в таблицу `airport_services` (FK на `airport_suppliers.id`) для маршрутизации каждого SKU к своему поставщику. Обновить существующие Coral-записи.

#### 5. LifeOS -- без изменений

Ситуация "Trip Planning" уже настроена. Оба поставщика будут отображаться как варианты одной услуги.

---

### Техническая реализация

1. **SQL Migration:**
   - ALTER TABLE `airport_services` ADD COLUMN `supplier_id` UUID REFERENCES `airport_suppliers(id)`
   - INSERT Phuket Fast Track в `airport_suppliers`
   - INSERT 6 новых SKU в `airport_services`
   - UPDATE существующие Coral SKU -- проставить `supplier_id`

2. **Hook `useAirportServices`:** Обновить для поддержки фильтрации по `supplier_id`

3. **UI `AirportFastTrackPage`:** Добавить шаг выбора поставщика с карточками-сравнением

4. **Мультиязычные тексты:** EN/RU/TH для всех новых SKU Phuket Fast Track

