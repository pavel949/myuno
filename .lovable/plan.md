
# План: Унификация дизайна и UX/UI

## Цель
Создать единую, современную, глобально-конкурентную дизайн-систему, устранив несогласованности в карточках, типографике, тенях, анимациях и spacing.

---

## Часть 1: Выявленные проблемы дизайна

### 1.1 Несогласованность border-radius

| Компонент | Текущее значение | Проблема |
|-----------|------------------|----------|
| ui/Card | `rounded-xl` | Базовое |
| ProfessionalProductCard | `rounded-2xl` | Больше чем base |
| ProductCard | `rounded-xl` | Согласовано |
| ForYouSection карточки | `rounded-2xl` | Больше |
| RecommendedCarousel | `rounded-2xl` | Больше |
| CategoryGrid | `rounded-xl` | Согласовано |
| MarketplacePromoCarousel | `rounded-xl` | Согласовано |

**Решение**: Стандартизировать `rounded-2xl` (16px) для всех карточек контента.

### 1.2 Несогласованность размеров текста

Найдено 1051+ использований нестандартных размеров:
- `text-[10px]` — 700+ использований
- `text-[11px]` — 200+ использований
- `text-[9px]` — 50+ использований

**Решение**: Создать семантическую типографическую шкалу:
```css
--text-caption: 10px;   /* badges, meta */
--text-small: 11px;     /* secondary info */
--text-body-sm: 12px;   /* body small */
--text-body: 14px;      /* default body */
```

### 1.3 Несогласованность теней

| Тип | Использование | Проблема |
|-----|--------------|----------|
| `shadow-sm` | ~200 файлов | Слишком тонкие |
| `shadow-md` | ~150 файлов | Среднее |
| `shadow-lg` | ~300 файлов | Основное |
| `shadow-xl` | ~200 файлов | Для hero |
| `shadow-2xl` | ~50 файлов | Избыточное |

**Решение**: Стандартизировать:
- `shadow-sm` → карточки в списках
- `shadow-md` → hover состояние
- `shadow-lg` → модалы, dropdowns

### 1.4 Несогласованность анимаций hover

| Компонент | Анимация | 
|-----------|----------|
| ProfessionalProductCard | `group-hover:scale-110` (10%) |
| ExperiencesSection | `group-hover:scale-105` (5%) |
| MarketplacePromoCarousel | `group-hover:scale-105` (5%) |
| PromoBanner | `group-hover:scale-110` (10%) |
| CategoryGrid | `group-hover:scale-105` & `scale-110` |

**Решение**: Унифицировать `group-hover:scale-[1.03]` (3%) для всех изображений.

### 1.5 Дублирование карточек товаров

Существуют два компонента:
- `ProductCard.tsx` — 220 строк, базовый
- `ProfessionalProductCard.tsx` — 500+ строк, расширенный

**Решение**: Объединить в один `UnifiedProductCard` с вариантами.

---

## Часть 2: Создание Design Tokens

### 2.1 Новый файл `src/lib/designTokens.ts`

```typescript
export const DESIGN_TOKENS = {
  // Border Radius
  radius: {
    card: 'rounded-2xl',          // 16px - все карточки
    button: 'rounded-lg',          // 8px - кнопки
    badge: 'rounded-md',           // 6px - бейджи
    pill: 'rounded-full',          // круглые элементы
    input: 'rounded-xl',           // 12px - инпуты
  },
  
  // Shadows
  shadow: {
    card: 'shadow-sm',             // карточки по умолчанию
    cardHover: 'shadow-md',        // hover состояние
    elevated: 'shadow-lg',         // модалы, dropdowns
    float: 'shadow-xl',            // FAB, hero
  },
  
  // Spacing (8px grid)
  spacing: {
    cardPadding: 'p-4',            // 16px
    cardPaddingCompact: 'p-3',     // 12px
    sectionGap: 'gap-4',           // 16px
    itemGap: 'gap-3',              // 12px
  },
  
  // Typography
  text: {
    caption: 'text-[10px]',        // badges, meta
    small: 'text-xs',              // 12px
    body: 'text-sm',               // 14px
    title: 'text-base',            // 16px
    heading: 'text-lg',            // 18px
  },
  
  // Image hover
  imageHover: 'group-hover:scale-[1.03]',
  
  // Transitions
  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
  },
} as const;
```

### 2.2 Обновление CSS переменных в `src/index.css`

```css
@layer base {
  :root {
    /* Card tokens */
    --card-radius: 1rem;           /* 16px = rounded-2xl */
    --card-padding: 1rem;          /* 16px */
    --card-gap: 0.75rem;           /* 12px */
    
    /* Shadow tokens */
    --shadow-card: 0 1px 3px rgba(0,0,0,0.1);
    --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.15);
    --shadow-elevated: 0 10px 25px rgba(0,0,0,0.2);
  }
}
```

---

## Часть 3: Унифицированные компоненты карточек

### 3.1 Создать `UnifiedContentCard.tsx`

Единый компонент для всего контента с вариантами:
- `product` — товары маркетплейса
- `service` — услуги и провайдеры
- `experience` — туры и активности
- `property` — недвижимость

```typescript
interface UnifiedContentCardProps {
  variant: 'product' | 'service' | 'experience' | 'property';
  size?: 'compact' | 'default' | 'featured';
  orientation?: 'vertical' | 'horizontal';
  // ... common props
}
```

### 3.2 Компоненты для замены/рефакторинга

| Старый компонент | Новый подход |
|-----------------|--------------|
| `ProductCard.tsx` | → `UnifiedContentCard variant="product"` |
| `ProfessionalProductCard.tsx` | → объединить с ProductCard |
| `ServiceProviderCard.tsx` | → `UnifiedContentCard variant="service"` |
| `PropertyPreviewCard.tsx` | → оставить, унифицировать стили |
| `ForYouSection` карточки | → использовать UnifiedContentCard |

---

## Часть 4: Исправление ForYouSection

### 4.1 Текущие проблемы
- Карточки как `<button>` вместо `<div>` с onClick
- Нестандартный hover эффект
- Отсутствие разделения цены и рейтинга

### 4.2 Улучшения
```tsx
// Было: простая button
<button className="flex-shrink-0 w-64 bg-card rounded-2xl...">

// Станет: структурированная карточка
<UnifiedContentCard
  variant="experience"
  size="default"
  image={item.image}
  title={item.title}
  rating={item.rating}
  price={item.price}
  badge={reasonLabel}
  onClick={handleClick}
/>
```

---

## Часть 5: Стандартизация анимаций

### 5.1 Файл `src/lib/motionPresets.ts`

```typescript
export const CARD_ANIMATIONS = {
  // Image hover zoom
  imageHover: {
    className: 'transition-transform duration-300 group-hover:scale-[1.03]',
  },
  
  // Card lift on hover
  cardHover: {
    className: 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
  },
  
  // Button press
  buttonPress: {
    className: 'active:scale-[0.98]',
  },
  
  // Icon bounce
  iconHover: {
    className: 'group-hover:scale-110 transition-transform',
  },
};
```

### 5.2 Framer Motion presets

```typescript
export const MOTION_VARIANTS = {
  cardAppear: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
  },
  
  stagger: {
    container: { staggerChildren: 0.05 },
    item: { 
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
    },
  },
};
```

---

## Часть 6: Файлы для изменения

### Новые файлы
| Файл | Описание |
|------|----------|
| `src/lib/designTokens.ts` | Централизованные design tokens |
| `src/lib/motionPresets.ts` | Стандартизированные анимации |
| `src/components/shared/UnifiedContentCard.tsx` | Универсальная карточка контента |

### Обновление существующих
| Файл | Изменения |
|------|-----------|
| `src/index.css` | Добавить CSS переменные для карточек |
| `src/components/ui/card.tsx` | Обновить base radius на `rounded-2xl` |
| `src/components/recommendations/ForYouSection.tsx` | Рефакторинг карточек |
| `src/components/home/RecommendedCarousel.tsx` | Унификация стилей |
| `src/components/home/ExperiencesSection.tsx` | Унификация hover |
| `src/components/home/MarketplacePromoCarousel.tsx` | Унификация стилей |
| `src/components/market/ProductCard.tsx` | Слияние с Professional |
| `src/components/market/ProfessionalProductCard.tsx` | Слияние |
| `src/components/services/ServiceProviderCard.tsx` | Унификация |

### Масштабное обновление теней и анимаций
- 27+ файлов с `group-hover:scale` → унифицировать
- 139+ файлов с тенями → стандартизировать

---

## Часть 7: Порядок реализации

### Этап 1: Фундамент (4 файла)
1. Создать `designTokens.ts`
2. Создать `motionPresets.ts`
3. Обновить `index.css` с CSS переменными
4. Обновить `card.tsx` с новым radius

### Этап 2: Унифицированная карточка (1 файл)
1. Создать `UnifiedContentCard.tsx` с 4 вариантами

### Этап 3: Рефакторинг главной страницы (5 файлов)
1. `ForYouSection.tsx` — использовать токены
2. `RecommendedCarousel.tsx` — унифицировать
3. `ExperiencesSection.tsx` — унифицировать
4. `MarketplacePromoCarousel.tsx` — унифицировать
5. `PromoBanner.tsx` — унифицировать

### Этап 4: Рефакторинг маркетплейса (3 файла)
1. Объединить `ProductCard` и `ProfessionalProductCard`
2. Обновить `ProductSection.tsx`
3. Обновить все импорты

### Этап 5: Массовая замена (batch)
1. Поиск и замена `group-hover:scale-105` → `group-hover:scale-[1.03]`
2. Поиск и замена `group-hover:scale-110` → `group-hover:scale-[1.03]`
3. Стандартизация теней

---

## Ожидаемый результат

После реализации:
1. **Единый визуальный язык** — все карточки выглядят согласованно
2. **Современный вид** — тонкие hover эффекты как у Airbnb/Klook
3. **Предсказуемые анимации** — одинаковый отклик везде
4. **Maintainability** — изменение токена обновляет весь UI
5. **Performance** — меньше кастомных классов, лучше tree-shaking
6. **Глобальный стандарт** — соответствие лучшим практикам мировых приложений

---

## Визуальные примеры стандартов

### Карточка товара (цель):
```
┌─────────────────────────────┐  ← rounded-2xl (16px)
│  ┌───────────────────────┐  │
│  │      IMAGE            │  │  ← aspect-square
│  │   scale-[1.03] hover  │  │
│  └───────────────────────┘  │
│                             │
│  Vendor Name (caption)      │  ← text-[10px] muted
│  Product Title              │  ← text-sm semibold
│  ★ 4.8 (123)                │  ← amber badge
│                             │
│  ฿1,290    [+] button       │  ← primary bold + rounded-full
└─────────────────────────────┘
   ↑ shadow-sm → shadow-md on hover
```

### Hover поведение:
- Image: `scale-[1.03]` over 300ms
- Card: `shadow-md` + `-translate-y-0.5` over 200ms
- Button: `active:scale-[0.98]`
