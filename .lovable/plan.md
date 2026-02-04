
# План исправления оставшихся багов (v2)

## Обзор
Осталось исправить 5 категорий проблем: битые checkout-роуты, legacy-роуты `/water/*`, мёртвые файлы, и импорты в AnimatedRoutes.

---

## Фаза 1: Исправление checkout-роутов в Cart.tsx

**Проблема:** Cart.tsx ссылается на `/experiences/checkout` и `/yachts/checkout`, которых не существует.

**Решение:** Перенаправлять на страницы бронирования с ID:
- `tour` → `/experiences/:id/book` (используя ID первого товара)
- `activity` → `/experiences/:id/book`  
- `yacht` → `/yachts/:id/booking`

```typescript
// Изменения в handleCheckout()
case 'tour':
case 'activity':
  if (firstItem.providerId) {
    navigate(`/experiences/${firstItem.providerId}/book`);
  } else {
    navigate('/experiences');
  }
  break;
case 'yacht':
  if (firstItem.providerId) {
    navigate(`/yachts/${firstItem.providerId}/booking`);
  } else {
    navigate('/yachts');
  }
  break;
```

---

## Фаза 2: Редиректы для legacy /water/* роутов

**Проблема:** `/water/:id` и `/water/:id/book` всё ещё рендерят старые компоненты.

**Решение:** Добавить redirect-компоненты по аналогии с TourRedirect:

```typescript
// Новые редиректы
const WaterDetailRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/experiences/${id}`} replace />;
};
const WaterBookRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/experiences/${id}/book`} replace />;
};
```

И заменить роуты:
```tsx
<Route path="/water/:id" element={<WaterDetailRedirect />} />
<Route path="/water/:id/book" element={<WaterBookRedirect />} />
```

---

## Фаза 3: Удаление legacy файлов

**Файлы для удаления:**
1. `src/pages/tours/TourDetail.tsx` — заменён на `/experiences/:id`
2. `src/pages/tours/TourBooking.tsx` — заменён на `/experiences/:id/book`
3. `src/pages/water/WaterActivityDetail.tsx` — заменён на `/experiences/:id`
4. `src/pages/water/WaterActivityBooking.tsx` — заменён на `/experiences/:id/book`

---

## Фаза 4: Очистка импортов в AnimatedRoutes.tsx

Удалить lazy-импорты:
```diff
- const TourDetail = lazy(() => import('@/pages/tours/TourDetail'));
- const TourBooking = lazy(() => import('@/pages/tours/TourBooking'));
- const WaterActivityDetail = lazy(() => import('@/pages/water/WaterActivityDetail'));
- const WaterActivityBooking = lazy(() => import('@/pages/water/WaterActivityBooking'));
```

---

## Итоговые изменения

| Файл | Действие |
|------|----------|
| `src/pages/Cart.tsx` | Исправить checkout-логику |
| `src/components/layout/AnimatedRoutes.tsx` | Удалить импорты, добавить редиректы |
| `src/pages/tours/TourDetail.tsx` | **УДАЛИТЬ** |
| `src/pages/tours/TourBooking.tsx` | **УДАЛИТЬ** |
| `src/pages/water/WaterActivityDetail.tsx` | **УДАЛИТЬ** |
| `src/pages/water/WaterActivityBooking.tsx` | **УДАЛИТЬ** |

**Всего:** 2 файла на рефакторинг, 4 файла на удаление

---

## Результат
- Все checkout-кнопки в корзине будут работать корректно
- Legacy роуты `/water/:id` и `/tours/:id` будут редиректить на `/experiences`
- Удалён мёртвый код (~500 строк)
- Уменьшен размер бандла
