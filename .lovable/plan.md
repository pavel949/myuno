
# План: Центрирование + Раздел инвестиционного анализа недвижимости

## Часть 1: Исправление центрирования текста на жёлтом экране

### Проблема
На мобильных устройствах текст "myUNO" и "Добро пожаловать!" на экране приветствия PWA может смещаться.

### Решение
Добавить `w-full` к контейнеру текста и убедиться, что flex-контейнер корректно центрирует содержимое.

**Файл:** `src/components/pwa/PWAWelcomeScreen.tsx`
- Строка 64: добавить `w-full` к motion.div с текстом
- Убедиться в явном `text-center w-full` для h1 и p элементов

---

## Часть 2: Раздел инвестиционного анализа для владельцев

### Концепция
Добавить новый раздел "Инвестиции" (Investment) в меню управления объектом (`PropertyManage`), где владелец сможет:
1. Указать стоимость покупки объекта
2. Видеть автоматически подтянутые доходы и расходы
3. Получить реальный расчёт доходности

### Визуальный дизайн секции

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Инвестиционный анализ                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Стоимость приобретения ───────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   Цена покупки:        [฿ 5,000,000        ]                           │ │
│  │   Доп. расходы:        [฿   350,000        ] (налоги, оформление...)   │ │
│  │   ─────────────────────────────────────────────────────────────────     │ │
│  │   Общие инвестиции:    ฿ 5,350,000                                      │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Финансовые показатели (за период) ────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │ │
│  │   │ Доходы   │  │ Расходы  │  │ Чистый   │  │ Загрузка │               │ │
│  │   │ ฿320K    │  │ ฿85K     │  │ ฿235K    │  │ 72%      │               │ │
│  │   │ ↑12%     │  │ ↓5%      │  │ ↑18%     │  │          │               │ │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘               │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Ключевые метрики инвестора ───────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   ┌────────────────────────────────────────────────────────────────┐   │ │
│  │   │  ROI (Return on Investment)                                    │   │ │
│  │   │  ──────────────────────────────────────────────────────────── │   │ │
│  │   │  ████████████████████░░░░░░░░░░  4.4% годовых                  │   │ │
│  │   │  Чистая прибыль ฿235K / Инвестиции ฿5.35M                      │   │ │
│  │   └────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  │   ┌────────────────────────────────────────────────────────────────┐   │ │
│  │   │  Cap Rate (Ставка капитализации)                               │   │ │
│  │   │  ──────────────────────────────────────────────────────────── │   │ │
│  │   │  ████████████████████████░░░░░░  5.9% годовых                  │   │ │
│  │   │  NOI ฿235K / Цена покупки ฿5M                                  │   │ │
│  │   └────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  │   ┌────────────────────────────────────────────────────────────────┐   │ │
│  │   │  Gross Yield (Валовая доходность)                              │   │ │
│  │   │  ──────────────────────────────────────────────────────────── │   │ │
│  │   │  ████████████████████████████░░  6.4% годовых                  │   │ │
│  │   │  Доход ฿320K / Цена покупки ฿5M                                │   │ │
│  │   └────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  │   Срок окупаемости: ~17 лет                                            │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Фазы реализации

### Фаза 1: Миграция базы данных

Добавить поля в таблицу `owner_properties`:

```sql
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS acquisition_costs NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS renovation_costs NUMERIC DEFAULT 0;

COMMENT ON COLUMN owner_properties.purchase_price IS 'Property purchase price for ROI calculations';
COMMENT ON COLUMN owner_properties.acquisition_costs IS 'Additional costs (taxes, legal, furnishing)';
```

---

### Фаза 2: Создать компонент InvestmentSection

**Файл:** `src/components/owner/property-manage/InvestmentSection.tsx`

Функциональность:
- Форма ввода `purchase_price`, `purchase_date`, `acquisition_costs`, `renovation_costs`
- Автоподтягивание данных из `property_financials` (доходы/расходы)
- Расчёт метрик на клиенте:
  - **Total Investment** = purchase_price + acquisition_costs + renovation_costs
  - **Annual Income** = сумма income транзакций за 12 месяцев (или экстраполяция)
  - **Annual Expenses** = сумма expense транзакций
  - **NOI** (Net Operating Income) = Income - Expenses
  - **Gross Yield** = (Annual Income / Purchase Price) * 100
  - **Cap Rate** = (NOI / Purchase Price) * 100
  - **ROI** = (NOI / Total Investment) * 100
  - **Payback Period** = Total Investment / NOI (в годах)

---

### Фаза 3: Интегрировать в PropertyManage

**Файл:** `src/pages/owner/PropertyManage.tsx`

1. Добавить секцию в `MENU_SECTIONS`:
```typescript
{ id: 'investment', label: 'Investment', labelRu: 'Инвестиции', icon: <TrendingUp />, badge: 'NEW' }
```

2. Добавить case в `renderContent()`:
```typescript
case 'investment':
  return <PropertyManageInvestmentSection propertyId={id} />;
```

---

### Фаза 4: Обновить хуки

**Файл:** `src/hooks/usePropertyCare.ts`
- Добавить поля `purchase_price`, `acquisition_costs`, `renovation_costs` в тип `OwnerProperty`

**Файл:** `src/hooks/usePropertyFinancials.ts`
- Добавить хук `usePropertyInvestmentMetrics(propertyId)` для расчёта ROI/Cap Rate

---

## Формулы расчёта

| Метрика | Формула | Описание |
|---------|---------|----------|
| **Total Investment** | purchase_price + acquisition_costs + renovation_costs | Общие вложения |
| **Gross Yield** | (Annual Gross Income / Purchase Price) × 100 | Валовая доходность |
| **Cap Rate** | (NOI / Purchase Price) × 100 | Ставка капитализации |
| **Cash-on-Cash ROI** | (Annual Cash Flow / Total Investment) × 100 | Возврат на инвестиции |
| **Payback Period** | Total Investment / Annual Cash Flow | Срок окупаемости |
| **RevPAR** | Total Revenue / Available Days | Доход на доступный номер |

---

## Файлы для создания/изменения

| Файл | Тип | Описание |
|------|-----|----------|
| `src/components/pwa/PWAWelcomeScreen.tsx` | UPDATE | Исправить центрирование |
| DB Migration | NEW | Добавить поля purchase_price и др. |
| `src/components/owner/property-manage/InvestmentSection.tsx` | NEW | Раздел инвестанализа |
| `src/pages/owner/PropertyManage.tsx` | UPDATE | Добавить секцию в меню |
| `src/hooks/usePropertyCare.ts` | UPDATE | Расширить тип OwnerProperty |
| `src/hooks/usePropertyFinancials.ts` | UPDATE | Добавить хук расчёта метрик |

---

## Данные для расчётов

Источники данных:
1. **Доходы** — `property_financials` WHERE `transaction_type = 'income'` AND `property_id = :id`
2. **Расходы** — `property_financials` WHERE `transaction_type = 'expense'` AND `property_id = :id`
3. **Загрузка** — `property_bookings` для расчёта occupancy rate
4. **Стоимость** — новые поля `purchase_price`, `acquisition_costs` из `owner_properties`

---

## Особенности UX

1. **Валюта** — показывать в валюте объекта (THB) с возможностью конвертации
2. **Период** — выбор периода анализа (месяц, квартал, год, всё время)
3. **Подсказки** — объяснения каждой метрики при наведении
4. **Экспорт** — возможность скачать отчёт в PDF (расширение)
5. **Сравнение** — benchmark с рынком Пхукета (будущее)

---

## Техническое резюме

| Метрика | Значение |
|---------|----------|
| Новые компоненты | 1 |
| Изменяемые файлы | 4 |
| Миграция БД | Да (4 поля) |
| Сложность | Средняя |
| Риск регрессии | Низкий |
