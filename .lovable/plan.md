

# Аудит соответствия текстов жизненным ситуациям

## Выявленные проблемы

### 1. КРИТИЧЕСКИЕ: Несовпадение кодов в next_routes

Маршруты (`lifeos_routes`) ссылаются на коды ситуаций, которых **нет** среди активных ситуаций:

| Маршрут | next_routes содержит | Проблема |
|---------|---------------------|----------|
| arrival | `emergency_medical` | Нет ситуации с таким кодом. Реальный код: **`health`** |
| arrival | `long_term_living` | Нет такого кода. Реальный код: **`living`** |
| arrival | `vacation_leisure` | Нет такого кода. Реальный код: **`leisure`** |
| living | `relocation_visa` | Нет такого кода. Реальный код: **`relocation`** |
| living | `family_with_children` | Нет такого кода. Реальный код: **`family`** |
| living | `business_work` | Нет такого кода. Реальный код: **`business`** |
| leisure | `family_with_children` | Нет. Правильно: **`family`** |
| leisure | `emergency_medical` | Нет. Правильно: **`health`** |
| health | `relocation_visa` | Нет. Правильно: **`relocation`** |
| health | `long_term_living` | Нет. Правильно: **`living`** |
| family | `emergency_medical` | Нет. Правильно: **`health`** |
| family | `vacation_leisure` | Нет. Правильно: **`leisure`** |
| family | `long_term_living` | Нет. Правильно: **`living`** |
| business | `relocation_visa` | Нет. Правильно: **`relocation`** |
| business | `long_term_living` | Нет. Правильно: **`living`** |
| business | `vacation_leisure` | Нет. Правильно: **`leisure`** |
| property | `relocation_visa` | Нет. Правильно: **`relocation`** |
| property | `business_work` | Нет. Правильно: **`business`** |
| relocation | `long_term_living` | Нет. Правильно: **`living`** |
| relocation | `business_work` | Нет. Правильно: **`business`** |
| relocation | `investment_property` | Нет. Правильно: **`property`** |
| pre_trip | `arrival_first_day` | Нет. Правильно: **`arrival`** |
| pre_trip | `vacation_leisure` | Нет. Правильно: **`leisure`** |
| pre_trip | `family_with_children` | Нет. Правильно: **`family`** |

**Результат**: Ссылки "Что может понадобиться дальше" ведут на несуществующие маршруты (пользователь видит fallback/пустую страницу).

### 2. Несовпадение кодов в InsurancePromptBlock

Файл `InsurancePromptBlock.tsx` использует устаревшие коды:
- `family_with_children` -- реальный код `family`
- `arrival_first_day` -- реальный код `arrival`
- `emergency_medical` -- реальный код `health`
- `vacation_leisure` -- реальный код `leisure`
- `pre_trip_planning` -- не активен (`is_active: false`)

**Результат**: Страховой блок **никогда не показывается**, потому что ни один код не совпадает.

### 3. Несовпадение кодов в ContextualHeader

`ContextualHeader.tsx` использует ключи `arrival`, `living`, `medical`, `leisure`, `investment`. Код `medical` не существует (правильно `health`), `investment` не существует (правильно `property`).

### 4. Несовпадение кодов в getLifeOSAIContext

`useLifeOS.ts` содержит маппинг с устаревшими кодами:
- `arrival_first_day` (правильно `arrival`)
- `long_term_living` (правильно `living`)
- `family_with_children` (правильно `family`)
- `emergency_medical` (правильно `health`)
- `investment_property` (правильно `property`)
- `departure_day`, `wedding_event`, `retirement_living` -- все неактивны

### 5. Несоответствия в текстах CTA

| Ситуация | CTA RU | CTA target | Проблема |
|----------|--------|------------|----------|
| business | "Выбрать коворкинг" | `/properties` | CTA говорит "коворкинг", но ведёт на недвижимость |
| business | recommended_title_ru: "Лучшие коворкинги" | entity_type: property | Заголовок обещает коворкинги, но рекомендует объекты недвижимости |

### 6. Слабые / пустые описания (description)

Несколько ситуаций имеют минималистичные описания, которые не помогают пользователю:
- `visa_travel`: "Visa runs, SEA travel" / "Поездки за визой, путешествия" -- слишком коротко
- `sports`: "Gyms, activities, trainers" -- нет контекста Пхукета
- `nightlife`: "Bars, clubs, events" -- нет контекста
- `shopping`: "Malls, markets, delivery" -- нет контекста
- `education`: "Schools, courses, tutoring" -- нет контекста
- `pets`: "Vets, grooming, pet-friendly places" -- нет контекста

### 7. Нет lifeos_routes для 6 активных ситуаций

Ситуации `visa_travel`, `sports`, `nightlife`, `shopping`, `education`, `pets` не имеют записей в `lifeos_routes` -- пользователь видит только fallback "Подбираем лучшие варианты".

---

## План исправлений

### Шаг 1: Исправить next_routes в БД (миграция)

Обновить все записи в `lifeos_routes`, заменив устаревшие коды на актуальные:

```text
emergency_medical    -->  health
long_term_living     -->  living
vacation_leisure     -->  leisure
relocation_visa      -->  relocation
family_with_children -->  family
business_work        -->  business
investment_property  -->  property
arrival_first_day    -->  arrival
```

### Шаг 2: Исправить InsurancePromptBlock.tsx

Обновить `INSURANCE_ROUTES` и `contextMap` на актуальные коды:
- `arrival_first_day` -> `arrival`
- `family_with_children` -> `family`
- `emergency_medical` -> `health`
- `vacation_leisure` -> `leisure`
- `pre_trip_planning` -> оставить (может активироваться)

### Шаг 3: Исправить ContextualHeader.tsx

- `medical` -> `health`
- `investment` -> `property`

### Шаг 4: Исправить getLifeOSAIContext в useLifeOS.ts

Обновить все ключи маппинга на актуальные коды ситуаций.

### Шаг 5: Исправить CTA бизнеса

- `cta_target` с `/properties` на `/coworking` или оставить `/properties` но исправить текст CTA на "Найти жильё рядом"
- Либо обновить `recommended_entity_type` на `coworking` с реальным коворкингом

### Шаг 6: Улучшить описания

Обновить `description_en` / `description_ru` для 6 ситуаций с контекстом Пхукета.

### Шаг 7: Создать lifeos_routes для новых ситуаций

Добавить записи маршрутов для `visa_travel`, `sports`, `nightlife`, `shopping`, `education`, `pets` с реалистичными текстами recognition/reassurance/what_matters.

---

### Итого: 7 правок, из них 4 критические (ломают навигацию и скрывают блоки)

