

# Здоровье портфеля — Portfolio Health Dashboard

## Концепция

Единый виджет-чеклист для каждого объекта в портфеле УК, который показывает **процент готовности** и список конкретных действий для достижения 100%. Формат — карточка на объект с прогресс-баром и раскрываемым списком категорий.

## Категории проверок (Health Checks)

Каждый объект оценивается по ~8 категориям. Каждая категория — бинарная (✅/❌) или процентная:

```text
┌─────────────────────────────────────────────────┐
│  Villa Orchid                        87% ██████░│
│  3 items need attention                         │
├─────────────────────────────────────────────────┤
│  ✅ Договор управления    — загружен            │
│  ✅ Электричество         — оплачено            │
│  ⚠️ CAM/Juristic          — просрочен 5 дн      │
│  ✅ Ключи                 — у менеджера Анна    │
│  ✅ Фото                  — 12 проф. фото       │
│  ❌ Правила дома          — не заполнены        │
│  ✅ Отчёты собственнику   — настроены           │
│  ✅ Портал собственника   — активирован         │
└─────────────────────────────────────────────────┘
```

### Детализация каждой проверки

| # | Категория | Источник данных | Условие ✅ |
|---|-----------|----------------|------------|
| 1 | **Договор управления** | `properties.management_document_url` | Не null/пустой |
| 2 | **Электричество** | `useUtilityOverview` (type=electricity) | Нет просроченных за текущий месяц |
| 3 | **CAM/Juristic** | `useUtilityOverview` (type=cam) | Нет просроченных |
| 4 | **Ключи** | `usePropertyKeysOverview` | Есть хотя бы одна запись с assigned_to |
| 5 | **Профессиональные фото** | `properties.images` | Массив ≥ 5 фото |
| 6 | **Правила дома** | `properties.house_rules` | Не null/пустой |
| 7 | **Отчёты собственнику** | `properties.auto_report_enabled` + `report_recipients` | Включены + есть получатели |
| 8 | **Портал собственника** | `owner_portal_settings` (по property_id) | Запись существует |

## Архитектура

### Новые файлы

1. **`src/hooks/usePortfolioHealth.ts`** — хук, который для массива property IDs загружает все нужные данные (properties fields, utilities, keys, portal settings) и возвращает `PropertyHealthReport[]`:
   ```ts
   interface HealthCheck {
     id: string;
     category: string;      // 'contract' | 'electricity' | 'cam' | ...
     labelEn: string;
     labelRu: string;
     status: 'ok' | 'warning' | 'missing';
     detail?: string;        // "у менеджера Анна" / "просрочен 5 дн"
     actionPath?: string;    // ссылка для исправления
   }
   
   interface PropertyHealthReport {
     propertyId: string;
     title: string;
     score: number;          // 0-100
     checks: HealthCheck[];
   }
   ```

2. **`src/components/owner/dashboard/PortfolioHealthWidget.tsx`** — виджет для дашборда:
   - Сводная полоска сверху: общий score портфеля и кол-во проблемных объектов
   - Список карточек по объектам (collapsed по умолчанию, expand при клике)
   - Каждая карточка: название, progress bar, badge с кол-вом проблем
   - При раскрытии: список чеков с иконками и кнопкой "Fix" → навигация

3. **Интеграция в дашборд**: Заменить текущий `property_status` виджет в секции "Portfolio Health" на новый `PortfolioHealthWidget`, либо добавить как `portfolio_health` в `DashboardWidgetKey`.

### Данные — без новых таблиц

Все данные уже есть в существующих таблицах и хуках:
- `useMyProperties` — список объектов + поля `management_document_url`, `images`, `house_rules`, `auto_report_enabled`, `report_recipients`
- `useUtilityOverview` — статус оплат utilities
- `usePropertyKeysOverview` — назначение ключей
- `owner_portal_settings` — наличие портала

### UX-решения

- **Сортировка**: объекты с наименьшим score — сверху (worst first)
- **Фильтр**: кнопка "Только проблемные" скрывает объекты с 100%
- **Action links**: каждый ❌ чек имеет кнопку → переход на соответствующий раздел в property manage (загрузить договор, заполнить правила, настроить отчёты)
- **Цвета**: ≥80% зелёный, 50-79% жёлтый, <50% красный

## Объём работ

1. Создать хук `usePortfolioHealth` — собирает все проверки
2. Создать виджет `PortfolioHealthWidget` — UI с прогресс-барами и чеклистом
3. Добавить `portfolio_health` в `DashboardWidgetKey` и подключить в секцию health дашборда
4. Заменить/дополнить `PropertyStatusSnapshot` новым виджетом

