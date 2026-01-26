
# План: Исправление кнопки "Заказать воду" и реализация кросс-селлинга

## Обнаруженные проблемы

### 1. Путаница с понятием "Water"
Платформа имеет **две разные вертикали**, связанные с водой:
- **Water Activities** (`/water`) — водный спорт (дайвинг, снорклинг, серфинг)
- **Water Delivery** (`/services?category=water-delivery`) — доставка питьевой воды

Кнопка "Заказать" на странице Water Activities ведёт на бронирование активностей, что корректно. Текст кнопки: `Забронировать` / `Book Now` — это правильно для водного спорта.

### 2. Отсутствие кросс-селлинга
На страницах мини-приложений нет переходов в смежные сервисы для увеличения среднего чека.

---

## Решение: Универсальная система кросс-селлинга

### Архитектура

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CrossSellSection                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  "Также может понравиться" / "You Might Also Like"        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │  │
│  │  │ 🛥 Яхты │  │ 🛒 Маркет│  │ 🍽 Еда  │  │ 🏠 Жильё│      │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Матрица кросс-продаж

Логические связи между вертикалями на основе пользовательского контекста:

| Текущая страница | Смежные предложения |
|------------------|---------------------|
| **Water Activities** | Яхты, Рестораны (ужин после дайвинга), Транспорт (трансфер) |
| **Yachts** | Water Activities, Рестораны, Цветы (романтический круиз) |
| **Property** | Home Services (уборка), Legal (договор), Insurance |
| **Tours** | Транспорт, Рестораны, Events |
| **Restaurants** | Delivery (доставка), Events, Beauty/SPA |
| **Market** | Delivery, Restaurants, Flowers |
| **Flowers** | Restaurants, Beauty/SPA, Events |
| **Medical** | Pharmacy, Insurance, Home Services |
| **Beauty/SPA** | Fitness, Medical, Flowers |
| **Transport** | Tours, Property, Water Activities |
| **Services (Home)** | Property, Market (бытовая химия), Repair |
| **Events** | Restaurants, Transport, Flowers |
| **Fitness** | Beauty/SPA, Medical, Tours |

---

## Технические изменения

### Этап 1: Создание компонента CrossSellSection

**Файл:** `src/components/crosssell/CrossSellSection.tsx`

Универсальный компонент для отображения смежных сервисов:

```typescript
interface CrossSellLink {
  id: string;
  icon: string;        // Эмодзи
  path: string;
  labelEn: string;
  labelRu: string;
  description?: string;
}

interface CrossSellSectionProps {
  currentVertical: string;  // 'water' | 'yachts' | 'property' | etc.
  variant?: 'grid' | 'scroll';
  maxItems?: number;
}
```

**Логика:**
- Принимает ID текущей вертикали
- Возвращает массив связанных вертикалей из конфигурации
- Отображает карточки с иконками и кнопками перехода

### Этап 2: Конфигурация связей

**Файл:** `src/lib/crossSellConfig.ts`

```typescript
export const CROSS_SELL_MATRIX: Record<string, CrossSellLink[]> = {
  'water': [
    { id: 'yachts', icon: '🛥️', path: '/yachts', labelEn: 'Yacht Rentals', labelRu: 'Аренда яхт' },
    { id: 'restaurants', icon: '🍽️', path: '/restaurants', labelEn: 'Dinner After', labelRu: 'Ужин после' },
    { id: 'transport', icon: '🚗', path: '/transport', labelEn: 'Get a Ride', labelRu: 'Заказать трансфер' },
  ],
  'yachts': [
    { id: 'water', icon: '🤿', path: '/water', labelEn: 'Water Sports', labelRu: 'Водный спорт' },
    { id: 'restaurants', icon: '🍾', path: '/restaurants', labelEn: 'Celebrate Ashore', labelRu: 'Отпразднуйте на берегу' },
    { id: 'flowers', icon: '💐', path: '/flowers', labelEn: 'Romantic Touch', labelRu: 'Романтический штрих' },
  ],
  // ... остальные вертикали
};
```

### Этап 3: Интеграция в страницы мини-приложений

Добавить `<CrossSellSection>` в конец следующих страниц:

| Страница | Файл |
|----------|------|
| Water Activities Index | `src/pages/water/WaterActivitiesIndex.tsx` |
| Water Activity Detail | `src/pages/water/WaterActivityDetail.tsx` |
| Yachts Index | `src/pages/yachts/YachtsIndex.tsx` |
| Yacht Detail | `src/pages/yachts/YachtDetail.tsx` |
| Property Index | `src/pages/property/PropertyIndex.tsx` |
| Tours Index | `src/pages/tours/ToursIndex.tsx` |
| Restaurants Index | `src/pages/restaurants/RestaurantsIndex.tsx` |
| Market Index | `src/pages/market/MarketIndex.tsx` |
| Beauty Index | `src/pages/beauty/BeautyIndex.tsx` |
| Services Index | `src/pages/services/ServicesIndex.tsx` |
| Events Index | `src/pages/events/EventsIndex.tsx` |
| Fitness Index | `src/pages/fitness/FitnessIndex.tsx` |
| Flowers Index | `src/pages/flowers/FlowersIndex.tsx` |

### Этап 4: Добавление секции "Маркет" на страницу Water

На странице Water Activities добавить быстрый доступ к маркету:

```typescript
// В WaterActivitiesIndex.tsx после списка активностей
<CrossSellSection 
  currentVertical="water" 
  variant="scroll"
  title={{ en: "Complete Your Adventure", ru: "Дополните приключение" }}
/>
```

---

## Новые файлы

| Файл | Описание |
|------|----------|
| `src/components/crosssell/CrossSellSection.tsx` | Основной UI-компонент |
| `src/components/crosssell/CrossSellCard.tsx` | Карточка одного предложения |
| `src/components/crosssell/index.ts` | Экспорт компонентов |
| `src/lib/crossSellConfig.ts` | Матрица связей между вертикалями |

## Изменяемые файлы

| Файл | Изменение |
|------|-----------|
| `src/pages/water/WaterActivitiesIndex.tsx` | Добавить CrossSellSection |
| `src/pages/water/WaterActivityDetail.tsx` | Добавить CrossSellSection перед кнопкой |
| `src/pages/yachts/YachtsIndex.tsx` | Добавить CrossSellSection |
| `src/pages/property/PropertyIndex.tsx` | Добавить CrossSellSection |
| `src/pages/restaurants/RestaurantsIndex.tsx` | Добавить CrossSellSection |
| `src/pages/tours/ToursIndex.tsx` | Добавить CrossSellSection |
| `src/pages/market/MarketIndex.tsx` | Добавить CrossSellSection |
| `src/pages/services/ServicesIndex.tsx` | Добавить CrossSellSection |
| `src/pages/beauty/BeautyIndex.tsx` | Добавить CrossSellSection |
| `src/pages/events/EventsIndex.tsx` | Добавить CrossSellSection |
| `src/pages/fitness/FitnessIndex.tsx` | Добавить CrossSellSection |
| `src/pages/flowers/FlowersIndex.tsx` | Добавить CrossSellSection |

---

## UI-дизайн CrossSellSection

```text
┌────────────────────────────────────────────────────────────────┐
│  ✨ Дополните приключение                            Все →    │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   🛥️    │  │   🍽️    │  │   🚗    │  │   💐    │       │
│  │  Яхты   │  │ Рестораны│  │ Трансфер │  │  Цветы  │       │
│  │  ----   │  │  ----    │  │   ----   │  │  ----   │       │
│  │ Аренда  │  │ Ужин     │  │ Заказать │  │ Букет   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────────────────────────────────────────────┘
```

**Стиль карточки:**
- Размер: 120x120px
- Иконка-эмодзи: 32px
- Заголовок: font-medium, truncate
- Подзаголовок: text-muted-foreground, text-xs
- Hover-эффект: scale + shadow
- Border: card border с rounded-xl

---

## Аналитика кросс-селлинга

Добавить отслеживание кликов для метрик:

```typescript
// При клике на CrossSellCard
const trackCrossSell = (fromVertical: string, toVertical: string) => {
  // Можно использовать существующую таблицу cross_sell_metrics
  // или добавить custom event
};
```

---

## Ожидаемый результат

1. **На странице Water Activities** появятся карточки:
   - 🛥️ "Яхты" → `/yachts`
   - 🍽️ "Рестораны" → `/restaurants`
   - 🚗 "Транспорт" → `/transport`
   - 🛒 "Маркет" → `/market`

2. **На всех страницах мини-приложений** будет секция с релевантными смежными сервисами

3. **Увеличение cross-sell rate** за счёт удобной навигации между вертикалями

---

## Оценка времени

| Задача | Время |
|--------|-------|
| Создание CrossSellSection | 30 мин |
| Конфигурация матрицы связей | 20 мин |
| Интеграция в 12+ страниц | 40 мин |
| Тестирование | 15 мин |
| **Итого** | **~1.5 часа** |
