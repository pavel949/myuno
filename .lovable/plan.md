
# План: Профессиональный реестр поставщиков маркетплейса

## ✅ РЕАЛИЗОВАНО (29 января 2026)

### База данных
- ✅ Создана таблица `marketplace_vendors` с полями: slug, name_en/ru, description, logo, cover_image, контакты, рейтинг, verified
- ✅ Добавлено поле `vendor_id` в `marketplace_products` с FK на vendors
- ✅ Созданы RLS-политики для публичного чтения активных поставщиков
- ✅ Загружены 20 поставщиков: Thai Rice Co, Coca-Cola, Red Bull, Nestlé и др.
- ✅ Связаны 200 товаров с поставщиками

### UI-компоненты
- ✅ `src/types/marketplace.ts` — добавлен интерфейс MarketplaceVendor
- ✅ `src/hooks/useMarketplaceVendors.ts` — хуки useVendor, useVendorProducts, useVendorById
- ✅ `src/components/market/VendorInfo.tsx` — карточка продавца на странице товара
- ✅ `src/components/market/VendorCard.tsx` — карточка для списка продавцов
- ✅ `src/pages/market/VendorPage.tsx` — страница продавца /market/vendor/:slug
- ✅ Обновлён ProductDetailPage — блок VendorInfo с переходом на страницу продавца
- ✅ Добавлен роут /market/vendor/:slug в AnimatedRoutes

---

## Результат
- ✅ Реестр 20 поставщиков с рейтингами и верификацией
- ✅ Карточки продавцов на страницах товаров
- ✅ Страницы продавцов с их товарами
- ✅ Навигация как на Ozon/Wildberries/Amazon

## Дополнительные улучшения (опционально)
- [ ] Фильтр товаров по поставщику в категориях
- [ ] Поиск по названию поставщика
- [ ] Страница "Все продавцы" с рейтингами
- [ ] Логотипы и обложки для каждого поставщика
