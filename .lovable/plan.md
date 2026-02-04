
# План исправления каруселей и мобильного UX платформы

## Диагноз проблемы

### Корневая причина
`ScrollArea` от Radix UI создаёт вложенные `div`-контейнеры с `overflow: hidden`, которые перехватывают touch-события и блокируют клики на мобильных устройствах. Это особенно критично в комбинации с `overflow-x: hidden` на layout-уровне.

### Почему `RecommendedCarousel` работает, а `PortfolioSection` — нет

| Компонент | Метод | Touch-события | Клики |
|-----------|-------|---------------|-------|
| RecommendedCarousel | Нативный `overflow-x-auto` | Работают | Работают |
| PortfolioSection | Radix `ScrollArea` | Конфликтуют | Блокируются |
| ActiveStaysWidget | Radix `ScrollArea` | Конфликтуют | Блокируются |

---

## Стандарт карусели для платформы (Airbnb/Klook Style)

### Эталонный паттерн (из RecommendedCarousel)

```tsx
<div
  className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-x snap-x snap-mandatory"
>
  <div className="flex-shrink-0 w-[85vw] max-w-[280px] snap-start touch-manipulation">
    <Card onClick={...} />
  </div>
</div>
```

### Правила:

1. **Контейнер:**
   - `overflow-x-auto` — нативный горизонтальный scroll
   - `scrollbar-hide` — скрыть scrollbar (визуально чище)
   - `-mx-4 px-4` — "bleed-to-edge" эффект (карточки выходят за padding)
   - `touch-pan-x` — разрешить горизонтальный swipe
   - `snap-x snap-mandatory` — snap-точки для плавной остановки

2. **Элементы:**
   - `flex-shrink-0` — не сжиматься
   - `w-[85vw] max-w-[280px]` — адаптивная ширина (85% экрана, max 280px)
   - `snap-start` — привязка к началу карточки
   - `touch-manipulation` — оптимизация touch-событий

3. **Клики:**
   - Использовать `<button>` или `onClick` с `e.stopPropagation()` для вложенных действий

---

## Файлы для исправления

### Фаза 1: Owner Dashboard (P0 — критично)

| Файл | Проблема | Решение |
|------|----------|---------|
| `src/components/owner/dashboard/PortfolioSection.tsx` | ScrollArea блокирует клики | Заменить на нативный scroll |
| `src/components/owner/dashboard/ActiveStaysWidget.tsx` | ScrollArea блокирует клики | Заменить на нативный scroll |
| `src/components/owner/dashboard/PropertiesBlock.tsx` | ScrollArea блокирует клики | Заменить на нативный scroll |

### Фаза 2: Shared Components (P1)

| Файл | Проблема | Решение |
|------|----------|---------|
| `src/components/shared/UnifiedScrollSection.tsx` | ScrollArea — общий компонент | Заменить на нативный scroll |
| `src/components/crosssell/CrossSellSection.tsx` | ScrollArea в scroll-режиме | Заменить на нативный scroll |
| `src/components/market/QuickSubcategories.tsx` | ScrollArea для категорий | Заменить на нативный scroll |
| `src/components/beauty/StaffPicker.tsx` | ScrollArea для выбора мастера | Заменить на нативный scroll |

### Фаза 3: Home Sections (P1)

| Файл | Проблема | Решение |
|------|----------|---------|
| `src/components/home/WaterSection.tsx` | Использует overflow-x-auto (OK) | Добавить snap-x |
| `src/components/home/ToursSection.tsx` | Использует overflow-x-auto (OK) | Добавить snap-x |
| `src/components/recommendations/RecentlyViewedSection.tsx` | Использует overflow-x-auto (OK) | Добавить snap-x |

---

## Детали изменений

### 1. PortfolioSection.tsx (строки 104-124)

Было:
```tsx
<ScrollArea className="w-full">
  <div className="flex gap-3 pb-2">
    {properties.slice(0, 5).map((property) => (
      <div key={property.id} className="w-[85vw] max-w-[280px] flex-shrink-0">
        <PropertyCard property={property} variant="hero" mode="owner" />
      </div>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

Станет:
```tsx
<div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-x snap-x snap-mandatory">
  {properties.slice(0, 5).map((property) => (
    <div 
      key={property.id} 
      className="w-[85vw] max-w-[280px] flex-shrink-0 snap-start"
      onClick={() => navigate(`/owner/properties/${property.id}/manage`)}
    >
      <PropertyCard property={property} variant="hero" mode="owner" />
    </div>
  ))}
  {/* Add new card */}
  <button 
    className="w-[85vw] max-w-[280px] flex-shrink-0 snap-start border-2 border-dashed ..."
    onClick={() => navigate('/owner/properties/new')}
  >
    ...
  </button>
</div>
```

### 2. ActiveStaysWidget.tsx (строки 105-194)

Было:
```tsx
<ScrollArea className="w-full">
  <div className="flex gap-3 pb-2">
    {activeStays.map((stay) => (
      <Card className="shrink-0 w-72" onClick={...}>
```

Станет:
```tsx
<div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-x snap-x snap-mandatory">
  {activeStays.map((stay) => (
    <Card 
      className="shrink-0 w-[85vw] max-w-[288px] snap-start touch-manipulation"
      onClick={...}
    >
```

### 3. UnifiedScrollSection.tsx (общий компонент)

Было:
```tsx
<ScrollArea className="w-full">
  <div className={cn("flex gap-3 pb-2", ...)}>
    {children}
  </div>
  <ScrollBar orientation="horizontal" className="invisible" />
</ScrollArea>
```

Станет:
```tsx
<div className={cn(
  "flex gap-3 overflow-x-auto scrollbar-hide pb-2 touch-pan-x snap-x snap-mandatory",
  !noPadding && "-mx-4 px-4",
  className
)}>
  {children}
</div>
```

---

## Чеклист после реализации

- [ ] PortfolioSection — карточки кликабельны
- [ ] ActiveStaysWidget — карточки гостей кликабельны
- [ ] PropertiesBlock — миниатюры кликабельны
- [ ] UnifiedScrollSection — работает во всех местах использования
- [ ] CrossSellSection — кликабельны кросс-продажи
- [ ] QuickSubcategories — кнопки категорий работают
- [ ] StaffPicker — выбор мастера работает
- [ ] Snap-эффект при прокрутке (плавная остановка)
- [ ] Touch-swipe работает плавно
- [ ] Нет горизонтального overflow на уровне страницы

---

## Техническое резюме

**Проблема**: Radix `ScrollArea` создаёт дополнительные слои DOM, которые перехватывают pointer-события на touch-устройствах.

**Решение**: Заменить `ScrollArea` на нативный CSS-паттерн с `overflow-x-auto`, `touch-pan-x`, и `snap-x`.

**Затронутые файлы**: 10 компонентов

**Риск регрессии**: Низкий — заменяем сложный компонент на более простой нативный CSS.
