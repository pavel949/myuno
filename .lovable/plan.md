

# Аудит дублей в кодовой базе myUNO

Прошёл по 397 хукам, 22 layout-обёрткам, 18 checkout edge-функциям, 7 notify-функциям и компонентам `property/`. Ниже — **только подтверждённые дубли с цифрами**, ранжированные по соотношению «вред/усилие на удаление».

---

## 🔴 P0 — Чистая копипаста, удалить целиком

### 1. Per-vertical Vendor-хуки (15 файлов, ~120 строк суммарно)

Все эти хуки — **тонкие 7–11-строчные обёртки** над `useVerticalCRUD`, отличаются ровно одной строкой (имя вертикали + ярлыки):

```
useVendorFlowers · Cleaning · Yachts · Restaurants · Pets · Babysitters
Salons · Gyms · Activities · Events · Vehicles · Clinics · Legal
useVendorEducation (11 строк) · useVendorExperiences (26 строк, единственный с extra-логикой)
```

`useVerticalCRUD` уже умеет всё через `getVerticalById(id).table`. Вместо 15 файлов — прямой вызов в компоненте: `useVerticalCRUD<Yacht>('yacht', providerId)`.

**Действие:** удалить 14 файлов (Experiences оставить — там кастомная логика). Заменить импорты (≈30–50 мест, find-replace).

---

### 2. Дублирующиеся property-компоненты

| Группа | Файлы | Что сейчас |
|---|---|---|
| Category icons | `PropertyCategoryIcons.tsx` (165) · `PropertyCategoryIcons.ribbon.tsx` (82) · `PropertyCategoryRibbon.tsx` (207) | 3 версии одного и того же |
| Highlights | `PropertyHighlights.tsx` (153) · `PropertyHighlightsDisplay.tsx` (83) | Старая + «новая» рядом |
| Extra fees | `GuestExtraFeesDisplay.tsx` (113) · `GuestExtraFeesSection.tsx` (281) | Section включает Display, но Display всё ещё импортируется отдельно |
| Contact | `ContactAdminButton.tsx` (98) · `MessageHostButton.tsx` (97) | Почти одинаковая логика — открыть WhatsApp/Inbox с шаблоном |

**Действие:** в каждой группе оставить одного «победителя», удалить остальные, мигрировать импорты.

---

## 🟠 P1 — Параллельные имплементации одного концепта

### 3. Layout-обёртки (5 thin adapters над `AppLayout`)

`AdminLayout` · `MCLayout` · `VendorLayout` · `GuestLayout` · `TeamLayout` — **каждая** просто рендерит:

```tsx
<AppLayout variant="workspace" navRole="<role>" usePageContainer={false} showFooter={false}>
  <Outlet />
</AppLayout>
```

Это 5 файлов по ~20 строк ради одной prop-переменной. Плюс `StaffLayout` использует ещё **третью** реализацию shell (свои `SidebarProvider + StaffSidebar`), хотя `NavShell` это уже умеет.

**Действие:**
- 4 из 5 «AppLayout-обёрток» можно удалить, в роутере писать `<AppLayout variant="workspace" navRole="vendor"/>` напрямую.
- `StaffLayout` мигрировать на `AppLayout variant="workspace" navRole="staff"` (потребует добавить роль `staff` в `navigationModel`).

---

### 4. Payment-селекторы (5 компонентов, 938 строк)

Все «выбери способ оплаты / момент оплаты» в одной папке, с пересекающейся ответственностью:

| Файл | Lines | Что делает |
|---|---|---|
| `PaymentMethodPicker.tsx` | 108 | card/transfer/whatsapp/rub_manual (новый) |
| `BookingPaymentSelect.tsx` | 302 | старый селектор, до DS2.0 |
| `PayWhenSelector.tsx` | 128 | full / split prepay |
| `PaymentStageSelector.tsx` | 241 | устаревший «когда платить» — заменён `PayWhenSelector` |
| `PaymentPolicySection.tsx` | 159 | отображение, не выбор |

**Действие:** удалить `BookingPaymentSelect` и `PaymentStageSelector`, оставить тройку `PaymentMethodPicker` + `PayWhenSelector` + `PaymentPolicySection` — это и есть текущая Airbnb-лайк связка.

---

### 5. Order-хуки (5 файлов, 1445 строк)

`useOrders` (411) · `useOrderTracking` (174) · `useServiceOrders` (377) · `usePurchaseOrders` (227) · `useBooking` (256). Все читают одну таблицу `orders`, фильтруют по разным `order_type`. Сейчас каждый дублирует свой supabase-запрос + realtime + типы.

**Действие:** ввести один `useOrdersByType(type)` поверх `useSupabaseQuery`; оставить `useOrders` как универсальный + `usePostOrderReview`/`useMultiPropertyBookings` (специализированные). Сократит ~600 строк дубля.

---

## 🟡 P2 — Backend-дубли в edge functions

### 6. Checkout-функции (18 шт., 5 уже мигрированы, 13 — нет)

В `_shared/checkout-handler.ts` и `checkout-factory.ts` уже есть готовая абстракция. Проверка `grep checkout-handler|checkout-factory`:

| Function | Использует _shared? |
|---|---|
| flowers / restaurant / event / market / wellness | ✅ да |
| cleaning / pet / legal / yacht / service | ❌ нет, копипаста |
| create-checkout / create-checkout-session / create-order-checkout | ❌ нет — **3 параллельных «универсальных»** входа |

Особенно болит: `create-checkout` vs `create-checkout-session` vs `create-order-checkout` — три обобщённые функции, никто не помнит, какая «правильная». Build-error из текущей сессии (`create-flowers-checkout` падает на TS2769) тоже про это — типы `orders` уже изменились, но 13 функций не подцепили общий handler.

**Действие:** мигрировать оставшиеся 10 vertical-функций на `checkout-handler.ts`, выбрать **одну** generic (`create-order-checkout`) и удалить 2 другие.

---

### 7. Notify-функции

`notify-admin-order` (344) vs `notify-vendor-order` (114) vs `notify-manual-payment-request` (235) vs `notify-fasttrack-booking` (275) vs `notify-transfer-booking` (256) — все делают **одно и то же**: собрать payload → `_shared/notify-utils.ts` → email + WhatsApp + insert into `notifications`. Логика разная только в шаблоне сообщения.

**Действие:** ввести `_shared/notify-event.ts` с интерфейсом `{ event, recipients, template, data }`, переписать notify-* как 30-строчные адаптеры, выносящие шаблоны в `email-templates/`.

---

## 🟢 P3 — Косметика, можно оставить на потом

- `useSupabaseQuery` + `useSupabaseCRUD` + `useVerticalCRUD` — нормальная иерархия, **не дубль**, оставить.
- `Sentry`/`toast` обёртки — единичные, ок.
- `MeShellLayout` / `OnboardingLayout` / `MiniAppLayout` / `LandingLayout` — у каждой реальное отличие (узкий ширина, без nav), не трогаем.

---

## Сводка экономии

| Категория | Файлов удалить | Строк убрать | Риск |
|---|---|---|---|
| Vendor-хуки (P0.1) | 14 | ~120 | низкий — find-replace |
| Property-компоненты (P0.2) | 5 | ~530 | низкий — точечная миграция импортов |
| Layout-обёртки (P1.3) | 4–5 | ~120 | средний — править router |
| Payment-селекторы (P1.4) | 2 | ~540 | средний — нужен smoke checkout-flow |
| Order-хуки (P1.5) | 0 удалить, ~600 строк ужать | ~600 | высокий — типы фронта |
| Checkout edge (P2.6) | 2 generic + рефактор 10 | ~800 | высокий — money path, нужен e2e |
| Notify edge (P2.7) | 0, рефактор 7 | ~600 | средний — нужен smoke по каждому каналу |

**Итого реалистично:** ~25 файлов и **~3 300 строк дублей** уходит без изменения поведения.

---

## План реализации (8 атомарных шагов, в порядке риска)

1. **P0.1 Vendor-хуки** — удалить 14 файлов, заменить импорты на `useVerticalCRUD<T>(verticalId, providerId)`. Полностью механический шаг.
2. **P0.2.a Category icons** — оставить `PropertyCategoryRibbon` (самый полный), удалить две другие, поправить импорты.
3. **P0.2.b Highlights / ExtraFees / Contact** — выбрать «победителя» в каждой паре, удалить лишнее.
4. **P1.3 Layout-обёртки** — удалить `AdminLayout` / `MCLayout` / `VendorLayout` / `GuestLayout`, в роутере подставить `AppLayout` напрямую. Отдельным шагом мигрировать `StaffLayout`.
5. **P1.4 Payment-селекторы** — удалить `BookingPaymentSelect` и `PaymentStageSelector`, протестировать checkout instant + request + RUB.
6. **P2.6.a Checkout** — мигрировать 10 оставшихся vertical-функций на `checkout-handler.ts` (закроет текущий build-error в `create-flowers-checkout`).
7. **P2.6.b Generic checkout** — выбрать `create-order-checkout` как канон, удалить `create-checkout` и `create-checkout-session`, переадресовать вызовы.
8. **P1.5 + P2.7 (Phase 2, отдельный большой PR)** — order-хуки и notify-функции: высокий риск, нужен e2e regression, делаем последним.

**Риск-контроль:** шаги 1–5 не трогают платёжный flow → можно мерджить в один день. Шаги 6–7 фиксят сегодняшние build errors. Шаг 8 — отдельная итерация со smoke-тестами на каждый order_type.

