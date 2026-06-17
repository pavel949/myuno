## Проблема

В `src/pages/transport/AirportTransferBooking.tsx` (handleSubmit, строка 241) — если пользователь не залогинен, его выкидывает на `/auth` и вся заполненная форма теряется. Профиль уже подставляется автоматически (useEffect на `profile`, строка 137), но для гостя — пусто, и в конце происходит редирект.

## Цель

1. Залогиненный — данные подставляются автоматически, поля редактируемые (уже работает, оставляем).
2. Гость — может полностью пройти форму без логина; перед оплатой ему предлагается **один из трёх путей**, без потери данных.
3. Никаких принудительных редиректов на `/auth` с очисткой стейта.

## Решение

### 1. Персистентность формы (страховка)
- Сохранять `formData` + `step` в `sessionStorage` под ключом `transfer_booking_draft` на каждом изменении (debounced).
- Восстанавливать при монтировании страницы.
- Очищать после успешной оплаты / в `TransferSuccess`.
- Это гарантирует: даже если что-то пойдёт не так (refresh, случайный редирект, OAuth callback) — форма не теряется.

### 2. Новый шаг "Контакт и аккаунт" (заменяет блокирующий редирект)

В `StepDetails` (или новый мини-блок перед StepPayment) для **гостя** показываем компонент `GuestAuthChoice` с тремя вариантами в одном экране:

```text
┌─────────────────────────────────────┐
│  Как оформить бронирование?         │
├─────────────────────────────────────┤
│ ○ Войти (есть аккаунт)              │
│   → inline email+password,          │
│     при успехе профиль подтянется   │
│                                     │
│ ● Создать аккаунт за 10 секунд      │
│   (рекомендуется)                   │
│   email, пароль (или Google)        │
│   → автосоздание через signUp,      │
│     профиль заполняется из формы    │
│                                     │
│ ○ Продолжить как гость              │
│   → заказ создаётся с               │
│     guest_email/guest_phone,        │
│     потом ссылка на claim в email   │
└─────────────────────────────────────┘
```

Все три варианта работают **внутри страницы** (никаких `navigate('/auth')`), формдата сохраняется.

### 3. Поведение по веткам

**Sign in (есть аккаунт):**
- `supabase.auth.signInWithPassword` inline → onAuthStateChange подхватит профиль → `useEffect [profile]` смержит данные (с приоритетом уже заполненных формой) → дальше оплата.

**Quick signup (рекомендуем):**
- `supabase.auth.signUp({ email: formData.email, password, options: { data: { full_name: formData.name, phone: formData.phone }}})` — `emailRedirectTo: window.location.href` чтобы вернуться на эту же страницу с восстановленным draft.
- Сразу после signUp создаём заказ (не ждём верификации email — заказ принадлежит уже созданному auth.user.id).
- Опционально Google OAuth кнопка: `signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href }})` — после возврата draft восстановится из sessionStorage.

**Guest checkout:**
- Снимаем требование `if (!user)` в handleSubmit.
- В `createOrder` передаём `user_id: null` + поля `guest_email`, `guest_phone` в metadata.
- Проверяем что RLS на `orders` / `order_participants` / `order_addresses` позволяет INSERT для anon (если нет — добавляем edge function `create-guest-order` с service-role).
- В письме-подтверждении даём magic-link на claim заказа в будущий аккаунт.

### 4. Залогиненный — никаких изменений в UX
- Уже работает (строки 137–148): из profile подставляется name/phone/email, поля остаются редактируемыми. Дополнительно: при пустом profile.phone дёргать `user_addresses` / последний заказ как fallback.

## Технические детали

**Файлы для правки:**
- `src/pages/transport/AirportTransferBooking.tsx` — убрать редирект, добавить draft-persistence, ветвление guest/user в submit
- `src/components/transport/booking-steps/StepDetails.tsx` — для гостя показать `GuestAuthChoice`
- `src/components/transport/booking-steps/GuestAuthChoice.tsx` — **новый** компонент (3 варианта auth inline)
- `src/hooks/useBookingDraft.ts` — **новый** generic хук `(key) => { draft, save, clear }` (пригодится для других букингов: цветы, экскурсии)
- `src/hooks/useOrders.ts` — поддержать `guest_email`/`guest_phone` (проверить, есть ли уже)
- Возможно `supabase/functions/create-guest-order/index.ts` — если RLS не пускает anon insert

**RLS / БД:**
- Проверить политики `orders`, `order_participants`, `order_addresses`, `order_items` для `anon`. Если INSERT запрещён — едж-функция `create-guest-order` с service_role.
- Поле для гостевого заказа: либо `orders.guest_email`/`guest_phone` (если есть), либо metadata jsonb.

**Тексты RU/EN:** все строки в `useLanguage`.

**Generic reuse:** `useBookingDraft` + `GuestAuthChoice` спроектировать так, чтобы потом применить к `FlowerCheckout`, `TaxiBooking`, `ExperienceBooking` (там та же боль).

## Что НЕ делаем в этом PR
- Не трогаем другие букинги (цветы и т.д.) — только трансфер. Но хуки делаем переиспользуемыми для следующего PR.
- Не делаем кастомный auth UI с подтверждением email — используем `auto_confirm_email` по текущей конфигурации (если выключено — quick signup всё равно работает, заказ создаётся, email с верификацией приходит параллельно).

## Acceptance criteria
1. Гость заходит на `/transport/airport-transfer`, проходит шаги 1–3, на шаге 4 видит выбор: login / signup / гость. Без редиректа.
2. После refresh страницы на любом шаге — данные восстановлены.
3. Залогиненный видит свои name/phone/email подставленными, может править.
4. Quick signup создаёт аккаунт и заказ без ухода со страницы.
5. Guest checkout создаёт заказ, привязанный к email, magic-link на claim приходит в письме.
