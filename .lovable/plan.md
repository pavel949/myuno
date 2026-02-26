

# Снижение когнитивной нагрузки на главной (Desktop)

## Диагноз

Сейчас на десктопе **11 секций** идут одной колонкой сверху вниз. Основные проблемы:

1. **Два дублирующих CTA** -- "Browse Full Catalog" и "All Services & Situations" ведут примерно туда же
2. **Две карусели подряд** -- QuickSolutionsGallery + Products carousel сливаются визуально
3. **PropertyTourBanner** -- крупный промо-баннер разрывает контент
4. **Нет desktop-сетки** -- широкий экран 1536px не используется, всё в одну колонку
5. **Your Day + Smart Tip** -- два информационных блока рядом, но не сгруппированы

## Решение: "Calm Grid" layout для десктопа

### 1. Desktop 2-column grid для средней зоны

На экранах `lg+` организовать контент в сетку:

```text
+-----------------------------------------------+
|              HERO (full width)                 |
+-----------------------------------------------+
|          QUICK ACTIONS (full width)            |
+-----------------------------------------------+
|                                                |
|   YOUR DAY FEED        |   SMART TIP          |
|   (main column 2/3)    |   + CONCIERGE        |
|                         |   + PROPERTY TOUR    |
|                         |   (sidebar 1/3)      |
|                         |                      |
+-----------------------------------------------+
|     SOLUTIONS GALLERY (full width carousel)    |
+-----------------------------------------------+
|   TRUST + EMERGENCY (inline strip)             |
+-----------------------------------------------+
```

### 2. Убрать дублирующие CTA

- **Удалить** `DiscoverCTABanner` -- дублирует кнопку "Browse Full Catalog" и "More" в QuickActions
- **Объединить** "Browse Full Catalog" в заголовок секции Solutions как "See All" ссылку

### 3. Sidebar-блок вместо вертикального потока

На десктопе перенести в правую колонку (sticky sidebar):
- `LifecycleSmartTip` -- контекстная подсказка
- `ConciergeBanner` -- "Need help?"
- `PropertyTourBanner` -- промо (уменьшенный вариант)

Это освобождает основной поток и группирует "вспомогательный" контент отдельно.

### 4. Trust + Emergency -- горизонтальная полоса

Вместо двух отдельных блоков, на десктопе объединить Trust и Emergency в одну горизонтальную полосу внизу: `Verified | 50+ providers | 24/7 support | Emergency SOS`

### 5. Увеличить "воздух" между секциями

Увеличить `lg:space-y-12` до `lg:space-y-16` для более "дышащего" ощущения.

---

## Технический план

### Файл 1: `src/pages/Index.tsx`
- Добавить `useIsDesktop()` hook
- На desktop: обернуть YourDayFeed + sidebar-блоки в `lg:grid lg:grid-cols-3 lg:gap-8`
- Удалить `DiscoverCTABanner` из потока
- Объединить Trust + Emergency в одну строку на desktop

### Файл 2: `src/components/home/HomeProductsSection.tsx`
- Убрать отдельную кнопку "Browse Full Catalog"
- Добавить "See All" ссылку в заголовок QuickSolutionsGallery

### Файл 3: `src/components/home/TrustBanner.tsx`
- Добавить слот для Emergency-контента на desktop (4-я колонка)

### Результат
- С 11 визуальных блоков до 6 на desktop
- Чёткая иерархия: Hero → Actions → Daily Brief (+ sidebar) → Solutions → Trust
- "Confident, clean, premium" -- в соответствии с дизайн-системой

