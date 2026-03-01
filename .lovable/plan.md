

# Централизованные настройки УК (как в Odoo)

## Концепция

Создать единый модуль **Настройки** (`/mc/settings`) в сайдбаре УК -- последним пунктом с иконкой шестеренки. Внутри -- табы по модулям (Общие, Финансы, CRM, Операции), где УК может кастомизировать поведение каждого блока. Текущий "CRM Settings" (`/mc/sales/settings`) переедет внутрь как таб CRM.

## Структура страницы `/mc/settings`

```text
+-------------------------------------------+
| Settings / Настройки                      |
+-------------------------------------------+
| [General] [Finance] [CRM] [Operations]    |
+-------------------------------------------+
| (содержимое выбранного таба)              |
+-------------------------------------------+
```

### Таб "Finance / Финансы"
- **Категории расходов**: чеклист из 22 стандартных -- УК включает/выключает нужные. Плюс список кастомных с возможностью добавить/удалить.
- **Категории доходов**: аналогично (5 стандартных + кастомные).
- Активные категории сохраняются в таблице `company_category_settings`.

### Таб "CRM"
- Перенос содержимого текущей страницы `PipelineSettingsPage` (стадии воронки, кастомные поля CRM).

### Таб "General / Общие"
- Валюта по умолчанию, язык отчетов, часовой пояс (заготовка на будущее).

### Таб "Operations / Операции"
- Заготовка для настроек задач, шаблонов чек-листов (пока placeholder).

## Изменения в базе данных

**Новая таблица `company_category_settings`:**
```sql
CREATE TABLE public.company_category_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES management_companies(id) ON DELETE CASCADE,
  category_type text NOT NULL CHECK (category_type IN ('expense', 'income')),
  category_code text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, category_type, category_code)
);

ALTER TABLE public.company_category_settings ENABLE ROW LEVEL SECURITY;
```

RLS: чтение -- участники компании; запись -- director/manager/accountant.

## Изменения в коде

### 1. Новая страница `src/pages/mc/MCSettingsPage.tsx`
- Tabs: General, Finance, CRM, Operations
- Таб Finance содержит компонент `FinanceCategorySettings` -- чеклист стандартных категорий с переключателями + список кастомных

### 2. Новый компонент `FinanceCategorySettings`
- Показывает все 22 `EXPENSE_CATEGORIES` как Switch-переключатели
- При первом заходе -- все включены (если нет записей в `company_category_settings`)
- Отключенные категории не показываются в `QuickCategoryGrid`

### 3. Хук `useCompanyCategorySettings`
- Загружает настройки из `company_category_settings`
- Мутации для toggle (вкл/выкл категории)
- Экспортирует `enabledCategoryCodes` для фильтрации

### 4. Обновление `useFinancialCategories`
- Фильтрует стандартные категории по `enabledCategoryCodes` из настроек компании
- Если настроек нет -- показывает все (backward compatible)

### 5. Обновление `MCSidebar.tsx`
- Добавить пункт **Settings / Настройки** в нижнюю часть сайдбара (перед footer, отдельной группой)
- Убрать "CRM Settings" из группы CRM & Sales

### 6. Маршрутизация
- Добавить route `/mc/settings` в `AnimatedRoutes.tsx`
- Redirect `/mc/sales/settings` на `/mc/settings?tab=crm` для обратной совместимости

## Порядок реализации
1. Миграция БД (таблица + RLS)
2. Хук `useCompanyCategorySettings`
3. Страница `MCSettingsPage` с табами
4. Компонент `FinanceCategorySettings`
5. Обновить `useFinancialCategories` -- фильтрация по настройкам
6. Обновить сайдбар и маршруты
