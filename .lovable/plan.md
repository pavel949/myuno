

# Market: Крупные карточки + заставка "Скоро откроется"

## Что делаем

### 1. Увеличение карточек товаров
Сейчас все карточки в горизонтальных секциях имеют фиксированную ширину `w-[160px]` -- это слишком мелко для маркетплейса. Увеличиваем:

- Горизонтальные скролл-секции (Bestsellers, New Arrivals, категории): `w-[160px]` --> `w-[180px]` (mobile) / адаптивно шире на desktop
- Сетка "Все товары": сейчас до 7 колонок на 2xl -- уменьшаем плотность до `grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` с увеличенным gap
- Убираем флаг `compact` с карточек в сетке, чтобы они отображались в полном размере

### 2. Заставка "Маркет скоро откроется"
Создаём компонент `MarketComingSoonOverlay` -- полупрозрачный оверлей (`bg-background/80 backdrop-blur-md`) поверх контента всех market-страниц:

- Иконка магазина / корзины
- Заголовок: "Маркет скоро откроется" / "Market coming soon"
- Подзаголовок с кратким описанием
- Кнопка "Перейти к услугам" --> навигация на `/services`
- Кнопка "На главную" --> навигация на `/`

Оверлей подключается:
- В `MarketIndex.tsx` (главная маркета)
- В `MarketCatalogPage.tsx`, `MarketCategoryPage.tsx`, `ProductDetailPage.tsx`, `MarketCheckout.tsx`, `StoreDetail.tsx`, `VendorPage.tsx`, `WishlistPage.tsx`

Оверлей будет управляться одним флагом-константой `MARKET_ENABLED = false`, чтобы при запуске маркета достаточно было поменять одно значение на `true`.

---

## Технические детали

### Новый файл
- `src/components/market/MarketComingSoonOverlay.tsx` -- overlay-компонент с полупрозрачным фоном, анимацией через framer-motion, и двумя CTA-кнопками

### Изменяемые файлы

| Файл | Изменение |
|------|-----------|
| `src/components/market/MarketComingSoonOverlay.tsx` | Новый компонент |
| `src/pages/market/MarketIndex.tsx` | Увеличение ширины карточек, подключение overlay |
| `src/pages/market/MarketCatalogPage.tsx` | Подключение overlay |
| `src/pages/market/MarketCategoryPage.tsx` | Подключение overlay |
| `src/pages/market/ProductDetailPage.tsx` | Подключение overlay |
| `src/pages/market/MarketCheckout.tsx` | Подключение overlay |
| `src/pages/market/StoreDetail.tsx` | Подключение overlay |
| `src/pages/market/VendorPage.tsx` | Подключение overlay |
| `src/pages/market/WishlistPage.tsx` | Подключение overlay |

