
# План улучшений семантического ядра LifeOS

## Обзор проблем

| # | Проблема | Приоритет | Тип |
|---|----------|-----------|-----|
| 1 | 6 ситуаций без маппингов в каталоге (0 рекомендаций) | P0 | БД |
| 2 | 287 маппингов привязаны к 5 неактивным ситуациям | P1 | БД |
| 3 | `transfer` и `page` отсутствуют в entityTypes.ts (62+5 записей используют их) | P1 | Код |
| 4 | `tours` таблица пуста (0 записей), но 7 маппингов ссылаются на tour | P1 | БД |
| 5 | Слабое покрытие каталога: 78% experiences и 60% yachts не привязаны к LifeOS | P2 | БД |

---

## Шаг 1: Заполнить catalog_life_map для 6 пустых ситуаций (P0)

Добавить маппинги на основе реальных данных в БД. Логика подбора:

| Ситуация | Релевантные entity_type | Кол-во реальных записей |
|----------|------------------------|------------------------|
| `visa_travel` | transfer (40), legal_service (9), insurance, property | ~60 записей |
| `sports` | gym (13), experience (88), water_activity, salon | ~110 записей |
| `nightlife` | event (15), restaurant (25), experience | ~128 записей |
| `shopping` | flower_shop (4), marketplace_product, restaurant | ~29 записей |
| `education` | education (14), babysitter (5), kindergarten | ~19 записей |
| `pets` | pet_service (5), clinic (16), cleaning (15) | ~36 записей |

Для каждой ситуации будет добавлено 8-15 маппингов с весами по governance-правилам:
- Primary блоки: вес 70-85
- Secondary блоки: вес 40-60

## Шаг 2: Перенести маппинги неактивных ситуаций (P1)

287 записей привязаны к 5 неактивным ситуациям. Варианты:
- `digital_nomad` -> перенести в `business`
- `pre_trip_planning` -> перенести в `arrival`
- `wedding_event` -> перенести в `leisure`
- `departure_day` -> перенести в `arrival`
- `retirement_living` -> перенести в `living`

Миграция: UPDATE life_situation_id для каждой группы, затем удаление дубликатов.

## Шаг 3: Добавить `transfer` и `page` в entityTypes.ts (P1)

62 маппинга используют entity_type `transfer`, но его нет в `ENTITY_TYPES`. Добавить:

```text
transfer: { type: 'transfer', icon: Car, route: '/transport/airport-transfer', ... }
page:     { type: 'page', icon: FileText, route: '/', ... }
```

## Шаг 4: Очистить пустые tour маппинги (P1)

Таблица `tours` содержит 0 активных записей. Действия:
- Удалить 7 маппингов entity_type=`tour` из catalog_life_map (ведут в пустоту)
- Или перенести их на entity_type=`experience` (консолидация по архитектурному стандарту "Experiences = Tours + Activities")

## Шаг 5: Расширить покрытие каталога (P2)

Добавить маппинги для неподключённых записей:
- 69 из 88 experiences не в LifeOS -> привязать к `leisure`, `sports`, `family`
- 58 из 97 yachts не в LifeOS -> привязать к `leisure`, `arrival`
- 18 из 33 vehicles не в LifeOS -> привязать к `living`, `arrival`

---

## Технические детали

### Миграция БД (один SQL-файл):

1. INSERT INTO catalog_life_map для 6 пустых ситуаций (~60 записей)
2. UPDATE catalog_life_map SET life_situation_id для 287 записей неактивных ситуаций
3. DELETE дубликатов после переноса
4. DELETE или UPDATE 7 маппингов tour -> experience

### Код (один файл):

- `src/lib/config/entityTypes.ts`: добавить `transfer` и `page`

### Что НЕ меняется:

- Мобильный UX
- Десктопный UX
- Компоненты карточек
- Роутинг
- LifeOS фронтенд-логика (только данные)
