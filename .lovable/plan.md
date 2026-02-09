

# Аудит и расширение Life Situations + маппингов

## Текущее состояние

### 9 ситуаций (все активны):
| Код | EN | Маппинги | Вертикали |
|---|---|---|---|
| pre_trip_planning | Trip Planning | 17 | property, vehicle, airport_service, experience, tour, insurance, page, restaurant |
| emergency_medical | Medical Help | 10 | clinic, legal_service, insurance, page |
| arrival_first_day | Just Arrived | 13 | vehicle, restaurant, clinic, page, airport_service, salon |
| relocation_visa | Relocation & Visa | 11 | legal_service, property, insurance, restaurant, gym, education, clinic |
| long_term_living | Long-term Stay | 19 | property, gym, salon, clinic, restaurant, legal_service, event, pet_service, cleaning |
| vacation_leisure | Vacation & Leisure | 21 | property, tour, salon, restaurant, yacht, page, experience, cleaning, event, airport_service |
| family_with_children | Family with Kids | 28 | experience, babysitter, property, clinic, airport_service, restaurant, page, cleaning, tour, pet_service |
| business_work | Business & Work | 13 | property, legal_service, restaurant, vehicle, gym, education, event |
| investment_property | Property Investment | 11 | property, legal_service, restaurant, insurance |

### Пробелы в маппингах

Три вертикали с данными в БД полностью отсутствуют в catalog_life_map:

| Вертикаль | Записей в БД | Маппингов |
|---|---|---|
| flower_shops (цветы) | 18 | 0 |
| transfers (трансферы) | 40 | 0 |
| water_activities (водные) | 31 | 0 |

Также недопредставлены:
- **yacht** -- 97 записей, но только 2 маппинга (vacation_leisure)
- **event** -- 35 записей, только 3 маппинга
- **education** -- 17 записей, только 2 маппинга

---

## Часть 1: Маппинг недостающих вертикалей

### 1.1 Transfers (40 записей)
Привязать к ситуациям:
- `arrival_first_day` (weight: 90) -- трансфер из аэропорта -- главная потребность
- `pre_trip_planning` (weight: 80) -- забронировать трансфер заранее
- `family_with_children` (weight: 75) -- семейный трансфер
- `vacation_leisure` (weight: 60) -- поездки на экскурсии
- `business_work` (weight: 55) -- деловые поездки

### 1.2 Water Activities (31 запись)
Привязать к ситуациям:
- `vacation_leisure` (weight: 85) -- основной контекст отдыха
- `family_with_children` (weight: 75) -- семейные активности на воде
- `pre_trip_planning` (weight: 60) -- планирование водных развлечений

### 1.3 Flower Shops (18 записей)
Привязать к ситуациям:
- `long_term_living` (weight: 50) -- украшение дома, подарки
- `vacation_leisure` (weight: 40) -- подарки, романтика
- `family_with_children` (weight: 35) -- праздники

### 1.4 Yacht -- расширить маппинги (97 записей, сейчас только 2)
Добавить к ситуациям:
- `pre_trip_planning` (weight: 75) -- забронировать чартер заранее
- `family_with_children` (weight: 65) -- семейный морской день
- `business_work` (weight: 55) -- корпоративные мероприятия
- `investment_property` (weight: 40) -- lifestyle-контекст инвестора

### 1.5 Event -- расширить (35 записей, сейчас 3)
Добавить:
- `vacation_leisure` -- уже есть (1)
- `family_with_children` (weight: 60) -- детские мероприятия
- `arrival_first_day` (weight: 45) -- что происходит сегодня
- `pre_trip_planning` (weight: 50) -- запланировать посещение

### 1.6 Education -- расширить (17 записей, сейчас 2)
Добавить:
- `long_term_living` (weight: 65) -- школы/курсы для резидентов
- `family_with_children` (weight: 70) -- школы для детей

---

## Часть 2: Новые жизненные ситуации

### 2.1 Wedding / Special Event
```
code: wedding_event
title_en: Wedding & Celebration
title_ru: Свадьба и торжество
icon: PartyPopper
color: #D946EF (фуксия)
priority: 38
```

Маппинги:
- flower_shops (weight: 90) -- цветы для свадьбы
- event (weight: 88) -- организация
- restaurant (weight: 85) -- банкет
- salon (weight: 82) -- подготовка невесты
- property (weight: 75) -- вилла для торжества
- yacht (weight: 70) -- свадьба на яхте
- vehicle (weight: 60) -- транспорт гостей
- transfer (weight: 55) -- трансферы гостей

### 2.2 Digital Nomad
```
code: digital_nomad
title_en: Remote Work & Nomad
title_ru: Удалённая работа
icon: Laptop
color: #0EA5E9 (голубой)
priority: 36
```

Маппинги:
- property (weight: 90) -- коворкинг-френдли жильё
- legal_service (weight: 85) -- визовые вопросы
- gym (weight: 65) -- фитнес
- restaurant (weight: 60) -- кафе для работы
- event (weight: 55) -- нетворкинг
- education (weight: 50) -- курсы/языки
- salon (weight: 40) -- быт
- clinic (weight: 45) -- страховка/чекап

### 2.3 Retirement / Senior Living
```
code: retirement_living
title_en: Retirement Living
title_ru: Жизнь на пенсии
icon: Sunset
color: #F97316 (оранжевый)
priority: 42
```

Маппинги:
- property (weight: 90) -- долгосрочное жильё
- clinic (weight: 88) -- медицина
- legal_service (weight: 85) -- визы, наследство
- insurance (weight: 82) -- страховка
- restaurant (weight: 55) -- рестораны
- gym (weight: 50) -- здоровье
- cleaning (weight: 60) -- бытовые услуги
- pet_service (weight: 45) -- питомцы
- flower_shops (weight: 35) -- сад, хобби

---

## Техническая реализация

### Шаг 1: SQL-миграция
Одна миграция, которая:
1. INSERT 3 новые ситуации в `life_situations`
2. INSERT все новые маппинги в `catalog_life_map` (используя реальные entity_id из БД, либо маппинг по entity_type для массовой вставки)

Для массовой привязки по entity_type используем подход:
```text
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT
  '<situation_uuid>',
  'transfer',
  id,
  90,
  ARRAY['guest','resident'],
  '{}'::jsonb
FROM transfers
WHERE is_active = true
LIMIT 10;
```

Лимит 10 на вертикаль на ситуацию -- чтобы resolver не возвращал слишком много результатов; топ-записи выбираются по rating/is_featured.

### Шаг 2: Проверка resolve_life_os_context
После вставки -- вызвать RPC для каждой новой ситуации и убедиться, что resolver возвращает корректные данные.

### Шаг 3: Код -- никаких изменений
Фронтенд-код уже динамически загружает ситуации из `life_situations` и резолвит через `resolve_life_os_context`. Новые ситуации и маппинги автоматически появятся в UI без изменений кода.

---

## Итого

| Действие | Кол-во |
|---|---|
| Новые ситуации | 3 |
| Новые маппинги для существующих ситуаций | ~15 type-привязок |
| Новые маппинги для новых ситуаций | ~25 type-привязок |
| Изменения в коде | 0 |

