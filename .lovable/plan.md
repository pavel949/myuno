
# Каталог /discover — Мировые стандарты SuperApp

## Реализованные улучшения

### 1. ✅ Секция "Недавние" (Recently Viewed)
- Показывает последние 4 просмотренных сервиса
- Компактный горизонтальный скролл
- Персонализация для залогиненных пользователей
- **Цель**: Повышение retention

### 2. ✅ Featured-бейджи (PRO)
- Хук `useFeaturedCategories` для работы с таблицей `featured_listings`
- Выделение платных промо-слотов золотой рамкой и бейджем "PRO"
- Градиентный фон для featured-карточек
- **Цель**: Монетизация через платные размещения

### 3. ✅ Рейтинги на карточках провайдеров
- Добавлены поля `rating` и `review_count` в интерфейс Service
- Передаются в компонент UnifiedCard
- Demo-данные содержат реалистичные рейтинги
- **Цель**: Социальное доказательство

### 4. ✅ Адаптивная мобильная верстка
- Breakpoint `xs: 400px` в tailwind.config.ts
- Сетка: 3 колонки → 4 колонки → 5 колонок
- Иконки: 40px на мобильных, 48px на десктопе
- `hyphens: auto` для русского текста

---

## Архитектура

```
/discover (UNIFIED CATALOG)
├── Tab: "Все"
│   ├── RecentlyViewedCompact (если залогинен)
│   └── AllCategoriesView (с Featured-бейджами)
│
├── Tab: "Категории"  
│   └── CategoryTreeView (4x4 grid с NEW/HOT)
│
└── Tab: "Провайдеры"
    └── ProvidersView (с рейтингами и фильтрами)
```

---

## Файлы

| Файл | Изменения |
|------|-----------|
| `src/pages/Discover.tsx` | +RecentlyViewedCompact, +Featured badges, +isFeatured prop |
| `src/hooks/useFeaturedCategories.ts` | Новый хук для featured_listings |
| `src/hooks/useServices.ts` | +rating, +review_count в Service interface |
| `tailwind.config.ts` | +xs breakpoint (400px) |

---

## Соответствие мировым стандартам

| Паттерн | Grab/Gojek | myUNO |
|---------|------------|-------|
| Персонализация | ✅ Recently Used | ✅ Реализовано |
| Featured слоты | ✅ Платные промо | ✅ Реализовано |
| Рейтинги | ✅ Звёзды + отзывы | ✅ Реализовано |
| Адаптивность | ✅ Mobile-first | ✅ Реализовано |
