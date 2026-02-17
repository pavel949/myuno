

## Архитектура Property Hub v2 — Минипортал недвижимости

### Текущее состояние

Property Hub сейчас имеет 4 таба: **Stays | Buy | Off-Plan | Invest**. Проблемы:

1. **Stays и Buy** — это один и тот же PropertyIndex с переключателем rent/buy внутри. Два таба для одного компонента создают путаницу.
2. **Off-Plan карточки показывают `riskLevel`** напрямую (зеленый/желтый бейдж) — это противоречит стратегии лидогенерации Due Diligence, где конкретный уровень риска должен быть скрыт.
3. **Нет связи между каталогом и управлением** — владелец не может из хаба перейти к своим объектам.
4. **Объекты на продажу и новостройки** существуют в разных таблицах (`properties` с listing_type=sale vs `property_projects`) и не пересекаются визуально.

### Предлагаемая структура табов

```text
Текущая:  [ Stays ] [ Buy ] [ Off-Plan ] [ Invest ]
                                                     
Новая:    [ Rent ] [ Buy ] [ New Build ] [ My Property ]
```

**Почему так:**
- **Rent** (Аренда) — чистый интент, заменяет "Stays"
- **Buy** (Купить) — вторичный рынок + объекты на продажу из `properties` (listing_type=sale)  
- **New Build** (Новостройки) — проекты из `property_projects`, девелоперы, комплексы. Включает Due Diligence как CTA, но НЕ показывает riskLevel
- **My Property** — персонализированный раздел: для владельцев — быстрый доступ к управлению (/owner), для инвесторов — портфель (/property/invest). Появляется только для авторизованных пользователей с ролями owner/investor

### Исправление riskLevel на карточках

На `OffplanProjectCard.tsx` сейчас отображается конкретный статус risk_level. По стратегии Due Diligence это должно быть заменено на:

- **Если DD пройден**: бейдж "Due Diligence Complete" (зеленый, без деталей уровня риска)
- **Если DD не пройден**: бейдж "Request Assessment" (янтарный, CTA для лида)

Конкретный riskLevel ("Low"/"High") уже правильно скрыт — карточка проверяет только наличие `project.riskLevel` (truthy/falsy). Это уже корректно реализовано, проблем нет.

### Маршрутизация

```text
/property                    -- Hub (точка входа)
  /property?mode=rent        -- Аренда (PropertyIndex, listing_type=rent)
  /property?mode=buy         -- Покупка (PropertyIndex, listing_type=sale)
  /property/offplan          -- Новостройки (OffplanIndex)
  /property/developers       -- Девелоперы
  /property/projects         -- Комплексы
  /property/invest           -- Инвестиционный хаб
  /property/invest/dashboard -- Портфель инвестора
  /property/my               -- Мои объекты (для владельцев — редирект на /owner)
```

### План реализации

**Шаг 1: Обновить табы в PropertyHub.tsx**

Переименовать и реструктурировать массив TABS:
- `stays` -> `rent` (label: "Rent" / "Аренда", icon: Home)
- `buy` оставить (label: "Buy" / "Купить", icon: ShoppingCart)
- `offplan` -> `newbuild` (label: "New Build" / "Новостройки", icon: Building2)  
- `invest` -> `my` (label: "My Property" / "Мои объекты", icon: User). Показывать условно только для авторизованных пользователей

Invest убрать из основных табов — он будет доступен:
- Как подраздел внутри "New Build" (CTA на карточках проектов с investment_enabled)
- Через "My Property" для инвесторов с портфелем

**Шаг 2: Добавить маршрут /property/my**

Создать простую страницу-роутер `PropertyMySection.tsx`:
- Если пользователь — owner/manager: показать сводку из `useMyProperties` + кнопка "Manage All" -> /owner
- Если пользователь — investor: показать мини-портфель + кнопка "Dashboard" -> /property/invest/dashboard
- Если не авторизован: CTA авторизации

**Шаг 3: Подтвердить корректность riskLevel**

Текущая реализация в `OffplanProjectCard.tsx` уже правильная — она проверяет наличие/отсутствие riskLevel, но НЕ показывает конкретное значение ("Low"/"High"). Бейдж показывает только "Due Diligence Complete" или "Request Assessment". Изменений не требуется.

**Шаг 4: Обновить OffplanIndex — добавить интеграцию с Buy**

В разделе "New Build" добавить фильтр "Готовые к покупке" который покажет completed-проекты из `property_projects` со статусом `completed` — это мост между новостройками и вторичным рынком.

**Шаг 5: Обновить навигационные ссылки**

Обновить QuickActions и PersonaChips:
- Для инвестора: ссылка на `/property` вместо `/property/invest` (инвестор найдет свой портфель в "My Property")
- Для владельца: добавить чип "My Property" -> `/property?tab=my`

### Файлы для изменения

| Файл | Что меняется |
|---|---|
| `src/pages/property/PropertyHub.tsx` | Обновление TABS: rent, buy, newbuild, my |
| `src/pages/property/PropertyMySection.tsx` | **Новый** — роутер "My Property" |
| `src/components/layout/AnimatedRoutes.tsx` | Добавить route `/property/my` |
| `src/components/home/PersonaChips.tsx` | Обновить ссылки для owner/investor |
| `src/components/home/QuickAccessChips.tsx` | Обновить invest-ссылку |

### Что НЕ меняем

- `OffplanProjectCard.tsx` — riskLevel уже реализован корректно (показывает статус DD, а не конкретный балл)
- `OffplanDetail.tsx` — DD блок корректен (CTA лидоформа)
- `/owner` — остается отдельным рабочим порталом
- `/property/invest/*` — маршруты остаются, но убираем из основных табов
- PropertyIndex — rent/buy логика внутри него работает корректно через searchParams

