
# Аудит вертикалей: чистота сборки и UX

## Методология проверки

Проверены все 20+ клиентских вертикалей через визуальный браузинг (мобильный viewport 390x844), анализ консоли, сетевых запросов и исходного кода (~600 строк роутинга, ~400 строк page registry, все index-страницы вертикалей).

---

## Общий результат

**15 из 20 вертикалей** работают корректно и визуально консистентны. Обнаружены **5 проблем** разной степени критичности.

---

## Обнаруженные проблемы

### 1. КРИТИЧНО: Маркетплейс заблокирован заглушкой

**Файл:** `src/components/market/MarketComingSoonOverlay.tsx`, строка 9
**Проблема:** `MARKET_ENABLED = false` — наложен размытый оверлей поверх всего маркета. Страница /market показывает контент за блюром, не кликабельный.
**Затронуто:** 7 страниц маркета (MarketIndex, MarketCatalogPage, MarketCategoryPage, VendorPage, StoreDetail, MarketCheckout, ProductDetailPage)

**Исправление:** Установить `MARKET_ENABLED = true`

---

### 2. БАГ: Отсутствует ключ перевода `pharmacy.consultation`

**Файл:** `src/pages/pharmacy/PharmacyIndex.tsx`, строка 104
**Проблема:** Вызов `t('pharmacy.consultation')` использует несуществующий ключ. В LanguageContext есть `pharmacy.delivery`, `pharmacy.24h`, но нет `pharmacy.consultation`. В UI отображается сырой ключ "pharmacy.consultation" вместо перевода.

**Исправление:** Добавить ключ во все три языковых словаря в `LanguageContext.tsx`:
- RU: `'pharmacy.consultation': 'Консультация'`
- EN: `'pharmacy.consultation': 'Consultation'`
- TH: `'pharmacy.consultation': 'ปรึกษา'`

---

### 3. БАГ: Classifieds (/classifieds) без AppLayout

**Файл:** `src/pages/classifieds/ClassifiedsIndex.tsx`, строка 46-47
**Проблема:** Страница использует голый `<div>` вместо `<AppLayout>`. Результат: нет нижней навигации (bottom nav), нет единого хедера, пользователь "застревает" без возможности перейти на другие разделы.

**Исправление:** Обернуть в `<AppLayout showHeader={false} showBottomNav>` аналогично другим вертикалям (Pharmacy, Events, Fitness).

---

### 4. UX: Fitness карточки без изображений

**Визуально:** Все 13 залов показывают градиентные плейсхолдеры (teal-purple) вместо реальных фотографий. Это единственная вертикаль, где массово отсутствуют cover_image.

**Исправление:** Заполнить поле `cover_image` в таблице `gyms` для всех записей (URLs из Unsplash или реальные фотографии).

---

### 5. MINOR: Hardcoded цвета вместо design tokens

**Масштаб:** ~1500 случаев в 128 файлах (bg-blue-500, text-red-500, text-green-600 и т.д.)
**Пример:** `text-green-600` вместо `text-success`, `bg-red-500` вместо `bg-destructive`

Это не блокирующая проблема, но нарушает design system "Quiet Power". Рекомендуется постепенная миграция при следующих рефакторингах.

---

## Что работает хорошо

| Вертикаль | Статус | Примечания |
|-----------|--------|------------|
| Property | OK | Hub-layout с табами (Аренда/Купить/Новостройки) |
| Yachts | OK | 77 судов, фильтры по типу, сортировка |
| Restaurants | OK | 25 ресторанов, location chips, кнопка "Бронь" |
| Beauty | OK | 11 салонов, категории |
| Transport | OK | Smart Hero Search, класс-навигация |
| Experiences | OK | 68 впечатлений, туры/активности |
| Flowers | OK | 20 букетов, sales psychology |
| Cleaning | OK | 13 услуг |
| Medical | OK | 16 клиник, экстренная плашка 1669 |
| Events | OK | 15 событий, даты |
| Legal | OK | 9 компаний, визовые услуги |
| Insurance | OK | 5 провайдеров, планы |
| Babysitter | OK | 4 няни |
| Education | OK | 14 провайдеров |
| Pets | OK | 5 услуг |
| Discover | OK | Жизненные ситуации, hub |

---

## Консольные ошибки

Все ошибки в консоли — инфраструктурные (CORS для manifest.webmanifest, postMessage cross-origin), связаны с платформой Lovable, а не с кодом приложения. Нет application-level ошибок.

---

## Технические детали реализации

### Файлы для изменения:

1. `src/components/market/MarketComingSoonOverlay.tsx` — строка 9: `false` -> `true`
2. `src/contexts/LanguageContext.tsx` — добавить `'pharmacy.consultation'` в RU/EN/TH словари
3. `src/pages/classifieds/ClassifiedsIndex.tsx` — обернуть в `<AppLayout>`
4. Таблица `gyms` в БД — UPDATE cover_image для всех записей

### Порядок выполнения:
1. Исправить перевод pharmacy.consultation (быстрый fix)
2. Обернуть Classifieds в AppLayout (быстрый fix)
3. Включить маркетплейс (1 строка)
4. Загрузить фото для Fitness (DB update)
