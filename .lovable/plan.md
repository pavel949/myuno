

# Аудит Life Situations: UX-оптимизация, departure_day, слияние, smart sort

## Проблема

Сейчас 12 ситуаций, но компонент `LifeSituationSelector` показывает только первые 8 (по `priority`). Итог:

```text
ВИДНЫ на Home (priority 3-35):          СКРЫТЫ (priority 36-42):
1. Trip Planning                        9.  Remote Work & Nomad
2. Medical Help                         10. Wedding & Celebration
3. Just Arrived                         11. Property Investment
4. Relocation & Visa                    12. Retirement Living
5. Long-term Stay
6. Vacation & Leisure
7. Family with Kids
8. Business & Work
```

4 только что добавленные ситуации пользователь не видит. Также `business_work` и `digital_nomad` пересекаются по 5 из 7 вертикалей.

---

## План действий

### 1. Слияние `business_work` + `digital_nomad`

Объединяем в одну ситуацию `business_work` с расширенным названием:
- **EN:** "Business & Remote Work"
- **RU:** "Бизнес и удалёнка"

Все маппинги из `digital_nomad` (clinic, education, event, gym, legal, property, restaurant, salon) переносятся в `business_work`. Дубликаты пропускаются через `ON CONFLICT`. После переноса `digital_nomad` деактивируется (`is_active = false`).

**Результат:** 12 ситуаций минус 1 = 11 активных.

### 2. Добавление `departure_day`

Новая ситуация:
- **code:** `departure_day`
- **EN:** "Departure Day"
- **RU:** "День отъезда"
- **icon:** `PlaneTakeoff`
- **color:** `#64748B` (серо-синий)
- **priority:** 32 (после family, перед business)

Маппинги:
- `transfer` (weight: 95) -- трансфер в аэропорт
- `airport_service` (weight: 90) -- fast track, lounge
- `cleaning` (weight: 70) -- уборка при выезде
- `property` (weight: 60) -- checkout
- `legal_service` (weight: 50) -- закрытие документов

**Результат:** 11 + 1 = 12 активных.

### 3. Перестройка приоритетов для видимости

Новый порядок (12 ситуаций, первые 8 -- основные, видимые):

| # | code | Название | priority |
|---|---|---|---|
| 1 | arrival_first_day | Just Arrived | 5 |
| 2 | vacation_leisure | Vacation & Leisure | 10 |
| 3 | family_with_children | Family with Kids | 15 |
| 4 | long_term_living | Long-term Stay | 20 |
| 5 | relocation_visa | Relocation & Visa | 25 |
| 6 | business_work | Business & Remote Work | 30 |
| 7 | emergency_medical | Medical Help | 35 |
| 8 | wedding_event | Wedding & Celebration | 40 |
| --- | --- | --- ниже среза --- | --- |
| 9 | pre_trip_planning | Trip Planning | 45 |
| 10 | departure_day | Departure Day | 50 |
| 11 | investment_property | Property Investment | 55 |
| 12 | retirement_living | Retirement Living | 60 |

Логика среза: первые 8 -- ситуации, актуальные "на месте". Нижние 4 -- до/после поездки или нишевые.

### 4. Кнопка "Show all" в LifeSituationSelector

Сейчас `slice(0, 8)` жёстко обрезает список. Добавляем кнопку "Ещё" / "More" после 8-й карточки, которая раскрывает оставшиеся ситуации в том же горизонтальном скролле.

---

## Техническая реализация

### Шаг 1: SQL-миграция (одна)

1. Перенести маппинги `digital_nomad` в `business_work` (с `ON CONFLICT DO NOTHING`)
2. Деактивировать `digital_nomad` (`is_active = false`)
3. Обновить title для `business_work`: "Business & Remote Work" / "Бизнес и удалёнка"
4. INSERT `departure_day` с маппингами
5. UPDATE приоритеты всех 12 ситуаций

### Шаг 2: Код -- LifeSituationSelector.tsx

Единственное изменение: вместо жёсткого `slice(0, 8)` добавить состояние `showAll` и кнопку-чип "Ещё N" в конце ряда, которая убирает лимит.

### Шаг 3: Обновить AI-контекст в useLifeOS.ts

Добавить `departure_day` в `intentMap` функции `getLifeOSAIContext`:
```text
departure_day: { intent: 'depart', time_horizon: '12h', risk_level: 'medium' }
```

---

## Итого

| Действие | Кол-во |
|---|---|
| Слияние ситуаций | 1 (digital_nomad -> business_work) |
| Новые ситуации | 1 (departure_day) |
| Перестройка приоритетов | 12 записей |
| Изменения в коде | 2 файла (LifeSituationSelector, useLifeOS) |
