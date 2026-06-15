## Что проверил

- `src/pages/Auth.tsx` (2-шаговый signup: phone → register)
- `src/contexts/AuthContext.tsx` (`signUp` → `supabase.auth.signUp`)
- Триггеры `auth.users`: `handle_new_user`, `handle_new_user_profile`, `handle_new_user_wallet`
- RLS на `profiles`, `terms_acceptances`
- Edge function `notify-new-signup`
- Последние 5 строк `public.profiles` (фактические данные)
- Auth-логи (`/user` 500 timeout, login/logout — работают)

## Найденные баги

### 🔴 BUG 1 — Phone теряется при регистрации
**Симптом:** в `profiles` у 4 из 5 последних юзеров `phone = NULL`, хотя поле обязательное в форме (шаг 1).

**Причина:** двойная поломка.
1. `AuthContext.signUp` кладёт телефон в `options.data.phone` (user metadata), **не** в `auth.signUp({ phone })`. Триггер `handle_new_user` читает `NEW.phone` из `auth.users.phone` — там пусто.
2. После signup делается `profiles.update({ phone }).eq('id', user.id)`. Если включено email confirmation, **сессии ещё нет** → RLS `auth.uid() = id` блокирует update молча (ошибка не показывается).

**Фикс:** читать в триггере `raw_user_meta_data->>'phone'` как fallback и/или убрать client-side update.

### 🔴 BUG 2 — terms_acceptances не записывается без email confirmation
Тот же RLS-провал: `auth.uid() = user_id`, но сессии нет. Запись юридически важная (согласие на условия) — её надо делать в `handle_new_user` триггере либо через edge function с service role.

### 🟡 BUG 3 — Referral code не применяется при email confirmation
`supabase.rpc('apply_referral_code', ...)` вызывается из клиента без сессии. Если RPC проверяет `auth.uid()`, она провалится. Нужно либо security definer без auth-check, либо вызов через edge function с service role.

### 🟡 BUG 4 — Phone обрезается до цифр без E.164
`phone.replace(/\D/g, '')` удаляет `+` — `+66931454605` сохраняется как `66931454605`. WhatsApp/SMS-нотификации могут не доходить.

### 🟢 BUG 5 — Welcome email + Supabase confirmation email одновременно
Юзеру приходит 2 письма сразу (наш welcome + Supabase подтверждение email). Welcome лучше слать **после** подтверждения почты (через триггер `on auth.users update` когда `email_confirmed_at` стал NOT NULL).

### Дополнительно (не баги, но обратить внимание)
- В auth-логах есть `/user` HTTP 500 (`timeout: context canceled`) от 06:45 — Supabase auth изредка таймаутит. Wrapper `withTimeout(15s)` уже защищает UI.
- `AccountTypeSelection.tsx` существует, но не подключён в роутинге — мёртвый код или забытая фича.
- Password min = 6 символов, HIBP-check выключен. Для production стоит включить.
- Pages `/auth?mode=signup` → нет `aria-live`/`aria-label` для ошибок (a11y).

## Что предлагаю исправить (приоритизировано)

| # | Что | Где | Риск |
|---|-----|-----|------|
| 1 | Триггер `handle_new_user`: подхватывать `phone` из `raw_user_meta_data` если `auth.users.phone` пуст | migration | низкий |
| 2 | Триггер `handle_new_user`: вставлять 2 строки в `terms_acceptances` (terms+privacy v1.0) — убрать client-side insert из `Auth.tsx` | migration + Auth.tsx | низкий |
| 3 | Edge function `apply-referral` с service role + вызов из клиента через invoke (или security definer RPC, игнорящая auth.uid) | новая function + Auth.tsx | средний |
| 4 | E.164-нормализация телефона: `+` сохранять, остальное чистить. `phone.replace(/[^\d+]/g,'')` + проверка start-with-`+` | Auth.tsx | низкий |
| 5 | Welcome email через триггер на `email_confirmed_at` change, а не из клиента сразу после signUp | migration (trigger вызывает edge fn) | средний |
| 6 | Включить HIBP password check | supabase--configure_auth | низкий |

## Технические детали

```sql
-- BUG 1+2: расширить handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger ... AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name',''),
          COALESCE(NULLIF(NEW.phone,''), NULLIF(NEW.raw_user_meta_data->>'phone','')))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  INSERT INTO public.terms_acceptances (user_id, document_type, document_version)
  VALUES (NEW.id,'terms','1.0'), (NEW.id,'privacy','1.0')
  ON CONFLICT DO NOTHING;
  ...
END $$;
```

```ts
// BUG 4: Auth.tsx
const cleanPhone = phone.trim().startsWith('+')
  ? '+' + phone.replace(/\D/g,'')
  : phone.replace(/\D/g,'');
```

**Рекомендую:** начать с BUG 1+2+4 (migration + Auth.tsx правки) — это закрывает 80% реальной проблемы (потеря phone и юридического согласия) без рисков для платежей. BUG 3 (referral) и BUG 5 (welcome email) — отдельной итерацией после.

Подтверди — реализую сразу пачкой.