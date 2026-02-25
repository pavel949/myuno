

# Миграция оставшихся ~200 файлов на семантические цвета

## Масштаб работы

Осталось примерно 200+ файлов с ~4000 вхождениями жёстко закодированных Tailwind-цветов. Работа будет выполняться пакетами по 15-20 файлов за раз.

## Карта замен

| Жёсткий цвет | Семантический токен |
|---|---|
| green-500/600/700 | success |
| red-500/600/700 | destructive |
| yellow-500/600, amber-500/600 | warning |
| blue-500/600/700 | info |
| purple-500/600/700 | accent-purple |
| teal-500/600, cyan-500/600 | accent-teal / accent-cyan |
| orange-500/600 | accent-amber |
| pink-500/600 | accent-coral |

Примеры:
- `bg-green-500/10 text-green-600` -> `bg-success/10 text-success`
- `fill-yellow-500 text-yellow-500` -> `fill-warning text-warning`
- `bg-red-500 hover:bg-red-600` -> `bg-destructive hover:bg-destructive/90`
- `text-blue-600 dark:text-blue-400` -> `text-info`

## Порядок выполнения (по приоритету)

### Пакет 1: Утилиты и общие модули
- `src/lib/orderUtils.ts` -- центральная карта статусов заказов
- `src/components/admin/PayoutManager.tsx`
- `src/components/admin/lifeos/LifeOSHealthTab.tsx`
- `src/components/transport/GrabLeadModal.tsx`
- `src/components/referral/ReferralCard.tsx`
- `src/components/yachts/YachtPolicies.tsx`

### Пакет 2: Вендорские страницы
- `src/pages/vendor/VendorBookings.tsx`
- `src/pages/vendor/VendorEducation.tsx`
- `src/pages/vendor/VendorRestaurants.tsx`
- `src/pages/vendor/VendorEvents.tsx`
- и другие vendor-страницы

### Пакет 3: Админские страницы
- `src/pages/admin/AdminStores.tsx`
- `src/pages/admin/AdminPharmacies.tsx`
- `src/pages/admin/AdminRestaurants.tsx`
- и другие admin-страницы

### Пакет 4: Expat/Info страницы
- `src/pages/expat/VeterinaryPage.tsx`
- `src/pages/pharmacy/PharmacyDetail.tsx`
- `src/pages/education/CourseDetail.tsx`
- и другие публичные страницы

### Пакет 5: Channel Manager и OTA
- `src/components/owner/channel-manager/QuickConnectCards.tsx`
- и другие channel-manager компоненты

### Пакеты 6-12: Оставшиеся компоненты
- Все оставшиеся файлы из `src/components/` и `src/pages/`

## Принципы

1. **Контекстная замена** -- не просто механическая: цвет выбирается по смыслу (статус, рейтинг, предупреждение)
2. **Градиенты и брендинг OTA** -- сохраняются как есть (Airbnb red, Booking blue) или маппятся на ближайший семантический токен
3. **Dark mode** -- семантические токены уже имеют dark-варианты, так что `text-blue-600 dark:text-blue-400` упрощается до `text-info`
4. **Без изменения логики** -- только CSS-классы

## Результат

Единообразная цветовая система по всей платформе. Смена темы или ребрендинг потребует изменений только в `src/index.css`.

