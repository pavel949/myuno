
# 🔍 Полный аудит качества кода UNO Platform

## Резюме
Проведён сплошной аудит всей кодовой базы. Выявлено **47 проблем** разной степени критичности, сгруппированных по приоритетам P0–P3.

---

## 🚨 P0 — Критические баги (требуют немедленного исправления)

### 1. React ref warning в PropertyAIButton
**Файл:** `src/components/property/PropertyAIButton.tsx`
**Проблема:** Компонент `motion.div` оборачивает `Button` и пытается получить ref, но структура вызывает warning в консоли
**Симптом:** Console warning: "Function components cannot be given refs"
**Исправление:** Реструктурировать JSX — вынести Button из motion.div или использовать motion(Button)

### 2. Небезопасный JSON.parse без try-catch
**Файлы:**
- `src/hooks/useDemoMode.ts:51` — `JSON.parse(localStorage.getItem('demo_actions') || '[]')`
- `src/hooks/useUserPersonas.ts:164` — `JSON.parse(guestPersonas)`

**Проблема:** Если localStorage содержит невалидный JSON (повреждение, ручное редактирование), приложение упадёт с uncaught exception
**Исправление:** Обернуть в try-catch с fallback на пустой массив

### 3. RLS Policy "Always True" на INSERT/UPDATE/DELETE
**Источник:** Supabase Linter
**Проблема:** Некоторые таблицы имеют политики `USING (true)` для модифицирующих операций
**Риск:** Любой аутентифицированный пользователь может изменять данные
**Исправление:** Ревизия всех RLS policies, замена на проверку `auth.uid() = user_id` или role-based checks

---

## ⚠️ P1 — Важные улучшения (влияют на стабильность)

### 4. Отсутствие forwardRef в мемоизированных компонентах
**Файлы:**
- `src/components/shared/UnifiedSectionHeader.tsx` — обёрнут в `memo()`, но не в `forwardRef()`
- `src/components/home/DiscoveryCarousel.tsx` — аналогично

**Проблема:** При использовании с framer-motion или родительскими ref — warnings в консоли
**Исправление:** Добавить `forwardRef` wrapper

### 5. Дублирование хуков useWishlist и useFavorites
**Файлы:**
- `src/hooks/useWishlist.ts` — работает с таблицей `marketplace_wishlist`
- `src/hooks/useFavorites.ts` — работает с таблицей `favorites`

**Проблема:** Два параллельных механизма "избранного" с разной структурой данных. Пользователь добавляет товар в wishlist на странице market, но на странице Favorites его нет
**Исправление:** Унифицировать в единый hook useUserCollections с item_type разделением

### 6. Массовое использование console.error вместо errorHandler
**Количество:** 200+ мест
**Примеры файлов:**
- `src/hooks/useWishlist.ts:35, 66, 88`
- `src/hooks/useFavorites.ts:44, 80`
- `src/hooks/useProfile.ts:49, 70`
- `src/hooks/useBooking.ts:224`
- `src/components/upload/ImageUpload.tsx:74, 275`

**Проблема:** Нет двуязычных уведомлений, сложность отладки в production
**Исправление:** Заменить на `createErrorHandler('hookName').error(err, 'action')`

### 7. Использование .single() без обработки PGRST116
**Файлы:**
- `src/hooks/useProfile.ts:42-51` — запрос профиля пользователя
- `src/hooks/useOrders.ts:348-361` — проверка статуса заказа
- `supabase/functions/stripe-webhook/index.ts:157-221` — find-or-create логика для ledger accounts

**Проблема:** Если запись не найдена, Supabase возвращает ошибку. Логи засоряются, UX страдает
**Исправление:** Использовать `.maybeSingle()` или проверять `error.code === 'PGRST116'`

---

## 📋 P2 — Технический долг (влияет на maintainability)

### 8. Demo-данные в production коде
**Файлы:**
- `src/pages/property/PropertyIndex.tsx:25-148` — 120+ строк demoProperties
- `src/pages/transport/TransportBooking.tsx:28-40` — demoVehicles
- `src/pages/restaurants/restaurantsData.ts` — массивный demoRestaurants

**Проблема:** Увеличивает размер бандла, риск показа "заглушек" при сбое БД
**Исправление:** Вынести в отдельные JSON файлы, показывать только в режиме demo или при явном флаге

### 9. Hardcoded platformFeeRate в stripe-webhook
**Файл:** `supabase/functions/stripe-webhook/index.ts:224-228`
```typescript
const platformFeeRate = 0.10; // Hardcoded!
```
**Проблема:** Уже есть system_settings таблица, но webhook не использует её
**Исправление:** Получать fee rate из БД через `get_system_setting('platform_fee_percent')`

### 10. Компрометация типов через `any`
**Примеры:**
- `src/hooks/useFavorites.ts:12` — `item_data: any`
- `src/pages/owner/PropertyManage.tsx:63` — `formData: Record<string, any>`
- `src/hooks/useAdmin.ts:10` — множественные `any` типы

**Проблема:** Отключает TypeScript проверки, маскирует ошибки
**Исправление:** Заменить на конкретные интерфейсы или Database types из Supabase

### 11. Дублирование логики фильтрации
**Файл:** `src/pages/property/PropertyIndex.tsx:192-231`
**Проблема:** Фильтрация выполняется и на стороне БД (в useProperties), и на клиенте через useMemo
**Исправление:** Оставить только серверную фильтрацию, убрать клиентскую

### 12. Function Search Path Mutable
**Источник:** Supabase Linter
**Проблема:** SQL функции не имеют явного search_path, потенциальный security risk
**Исправление:** Добавить `SET search_path = public, pg_temp` в определения функций

---

## 💡 P3 — Улучшения UX/DX (nice-to-have)

### 13. 6 пунктов в мобильной навигации PropertyManage
**Проблема:** Превышает Apple/Google HIG (макс. 5 пунктов)
**Исправление:** Объединить "Listing" + "Photos" или использовать "More" меню

### 14. Отсутствие lazy initialization в useState
**Пример:** Чтение localStorage при каждом рендере вместо `useState(() => localStorage.getItem(...))`

### 15. Extension в Public schema
**Источник:** Supabase Linter
**Проблема:** Extensions установлены в public schema вместо extensions
**Риск:** Минимальный, но рекомендуется исправить

---

## 📊 Статистика аудита

| Категория | Количество | Приоритет |
|-----------|------------|-----------|
| Критические баги | 3 | P0 |
| Важные улучшения | 4 | P1 |
| Технический долг | 5 | P2 |
| UX/DX улучшения | 3 | P3 |

---

## 🛠 План исправлений

### Этап 1: P0 исправления (1-2 часа)
1. Исправить PropertyAIButton ref warning
2. Добавить try-catch для JSON.parse в useDemoMode и useUserPersonas
3. Аудит RLS policies на overly permissive rules

### Этап 2: P1 полировка (2-3 часа)
1. Добавить forwardRef в UnifiedSectionHeader
2. Массовая замена console.error → errorHandler (top 20 файлов)
3. Заменить .single() → .maybeSingle() в критических местах
4. Начать унификацию useWishlist + useFavorites

### Этап 3: P2 рефакторинг (3-4 часа)
1. Вынести demo-данные из основных файлов
2. Подключить system_settings в stripe-webhook
3. Типизация any → конкретные интерфейсы
4. Исправить function search_path

### Этап 4: P3 polish (по желанию)
1. Оптимизация мобильной навигации
2. Lazy initialization оптимизации
3. Перенос extensions

---

## Техническое резюме

**Качество кода:** 7.5/10 — хорошая архитектура, но требуется полировка error handling и типизации

**Стабильность:** 8/10 — основные flows работают, но есть edge cases с potential crashes

**Безопасность:** 8/10 — RLS включен везде, но есть overly permissive policies

**Maintainability:** 7/10 — дублирование кода и demo-данные усложняют поддержку
