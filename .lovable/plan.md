
# План исправлений P0 и P1: Критические уязвимости и технический долг

## Обзор найденных проблем (основано на коде)

| Приоритет | Проблема | Файл | Риск |
|-----------|----------|------|------|
| **P0** | Race condition в wallet top-up | `stripe-webhook/index.ts:428-432` | Потеря денег |
| **P0** | Не-атомарное создание заказа | `useOrders.ts:199-302` | Zombie-записи |
| **P0** | Permissive RLS для analytics | `cohort_analytics` и др. | Утечка бизнес-данных |
| **P1** | `console.error` вместо errorHandler | 5+ хуков | Потеря контекста ошибок |
| **P1** | Inconsistent role checking | `is_admin_or_uno_team()` vs hooks | Нарушение авторизации |

---

## 1. P0: Атомарное обновление баланса в stripe-webhook

### Текущий уязвимый код (строки 428-432):
```typescript
const newBalance = Number(walletData.balance) + amount;
await supabaseAdmin
  .from('wallets')
  .update({ balance: newBalance })
  .eq('id', walletData.id);
```

### Проблема:
Read-modify-write паттерн — если два webhook'а придут одновременно, один из них перезапишет другой.

### Решение:
Создать атомарную RPC функцию `topup_wallet_atomic`:

```sql
CREATE OR REPLACE FUNCTION public.topup_wallet_atomic(
  p_user_id uuid,
  p_amount numeric,
  p_reference_type text,
  p_reference_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_id UUID;
  v_new_balance NUMERIC;
  v_currency TEXT;
  v_transaction_id UUID;
BEGIN
  -- Lock row and update atomically
  UPDATE public.wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING id, balance, currency INTO v_wallet_id, v_new_balance, v_currency;
  
  IF v_wallet_id IS NULL THEN
    -- Wallet doesn't exist, create it
    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (p_user_id, p_amount, 'THB')
    RETURNING id, balance, currency INTO v_wallet_id, v_new_balance, v_currency;
  END IF;
  
  -- Insert transaction record
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, currency,
    description, description_ru,
    reference_type, reference_id, status
  ) VALUES (
    v_wallet_id, p_user_id, 'topup', p_amount, v_currency,
    'Wallet top up via Stripe', 'Пополнение кошелька через Stripe',
    p_reference_type, p_reference_id, 'completed'
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'wallet_id', v_wallet_id,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
END;
$function$;
```

### Изменение в stripe-webhook:
```typescript
// Заменить строки 420-447 на:
const { data: topupResult, error: topupError } = await supabaseAdmin
  .rpc('topup_wallet_atomic', {
    p_user_id: userId,
    p_amount: amount,
    p_reference_type: 'stripe_checkout',
    p_reference_id: session.id
  });

if (topupError || !topupResult?.success) {
  logStep("ERROR", `Failed to top up wallet: ${topupError?.message}`);
  throw new Error('Wallet top-up failed');
}

const newBalance = topupResult.new_balance;
```

---

## 2. P0: Атомарное создание заказа через RPC

### Текущий код (useOrders.ts, строки 199-302):
Выполняется 6+ последовательных INSERT без транзакции:
1. `orders` (строка 199)
2. `order_items` (строка 238)
3. `order_participants` (строка 255)
4. `order_addresses` (строка 273)
5. `payment_intents` (строка 282)
6. `order_status_history` (строка 296)

### Проблема:
Если INSERT #4 падает, у нас остаются "zombie" записи 1-3.

### Решение:
Создать RPC функцию `create_order_atomic`:

```sql
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_type text,
  p_customer_user_id uuid,
  p_provider_org_id uuid DEFAULT NULL,
  p_start_at timestamptz DEFAULT NULL,
  p_end_at timestamptz DEFAULT NULL,
  p_total_amount numeric,
  p_currency text DEFAULT 'THB',
  p_notes text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL,
  p_items jsonb,            -- Array of items
  p_participants jsonb DEFAULT NULL,  -- Array of participants
  p_addresses jsonb DEFAULT NULL,     -- Array of addresses
  p_payment_method text DEFAULT NULL,
  p_payment_amount numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_participant JSONB;
  v_address JSONB;
BEGIN
  -- Create order
  INSERT INTO public.orders (
    order_type, customer_user_id, provider_org_id,
    status, start_at, end_at, total_amount, currency, notes, metadata
  ) VALUES (
    p_order_type, p_customer_user_id, p_provider_org_id,
    'pending', p_start_at, p_end_at, p_total_amount, p_currency, p_notes, p_metadata
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;
  
  -- Insert items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, resource_id, provider_org_id,
      item_name, item_type, qty, unit_price, amount, metadata
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'resource_id')::uuid,
      COALESCE((v_item->>'provider_org_id')::uuid, p_provider_org_id),
      v_item->>'item_name',
      v_item->>'item_type',
      COALESCE((v_item->>'qty')::int, 1),
      (v_item->>'unit_price')::numeric,
      (v_item->>'amount')::numeric,
      COALESCE(v_item->'metadata', '{}'::jsonb)
    );
  END LOOP;
  
  -- Insert participants
  IF p_participants IS NOT NULL THEN
    FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participants)
    LOOP
      INSERT INTO public.order_participants (
        order_id, role, name, phone, email
      ) VALUES (
        v_order_id,
        COALESCE(v_participant->>'role', 'primary'),
        v_participant->>'name',
        v_participant->>'phone',
        v_participant->>'email'
      );
    END LOOP;
  END IF;
  
  -- Insert addresses
  IF p_addresses IS NOT NULL THEN
    FOR v_address IN SELECT * FROM jsonb_array_elements(p_addresses)
    LOOP
      INSERT INTO public.order_addresses (
        order_id, address_type, address_text, lat, lng, notes
      ) VALUES (
        v_order_id,
        v_address->>'address_type',
        v_address->>'address_text',
        (v_address->>'lat')::numeric,
        (v_address->>'lng')::numeric,
        v_address->>'notes'
      );
    END LOOP;
  END IF;
  
  -- Create payment intent if provided
  IF p_payment_method IS NOT NULL THEN
    INSERT INTO public.payment_intents (
      order_id, amount, currency, method, status
    ) VALUES (
      v_order_id, p_payment_amount, p_currency, p_payment_method, 'pending'
    );
  END IF;
  
  -- Record initial status
  INSERT INTO public.order_status_history (
    order_id, from_status, to_status, actor_user_id, reason
  ) VALUES (
    v_order_id, NULL, 'pending', p_customer_user_id, 'Order created'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;
```

### Изменение в useOrders.ts:
Заменить последовательные INSERT на один вызов RPC.

---

## 3. P0: Ограничение RLS для analytics таблиц

### Текущие политики (выявлено линтером):
```sql
CREATE POLICY "cohort_read" ON public.cohort_analytics 
FOR SELECT TO authenticated USING (true);
```

Это позволяет ЛЮБОМУ аутентифицированному пользователю читать бизнес-аналитику.

### Решение:
Ограничить чтение только для admin/uno_team:

```sql
-- Удалить публичные SELECT политики
DROP POLICY IF EXISTS "cohort_read" ON public.cohort_analytics;
DROP POLICY IF EXISTS "funnel_read" ON public.funnel_analytics;
DROP POLICY IF EXISTS "daily_read" ON public.user_analytics_daily;
DROP POLICY IF EXISTS "segments_read" ON public.user_segments;

-- Создать политики только для админов
CREATE POLICY "analytics_admin_access" ON public.cohort_analytics 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

CREATE POLICY "analytics_admin_access" ON public.funnel_analytics 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

CREATE POLICY "analytics_admin_access" ON public.user_analytics_daily 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

CREATE POLICY "analytics_admin_access" ON public.user_segments 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());
```

---

## 4. P1: Замена console.error на errorHandler

### Файлы с проблемой:

| Файл | Строки | console.error |
|------|--------|---------------|
| `CartContext.tsx` | 95, 126, 206, 229, 252, 269, 285, 300 | 8 случаев |
| `useOrders.ts` | 323, 346, 372 | 3 случая |
| `useAdmin.ts` | 35, 65, 142, 214 | 4 случая |

### Пример исправления (CartContext.tsx):
```typescript
// Было:
} catch (error) {
  console.error('Error loading cart from database:', error);
  return [];
}

// Стало:
import { createErrorHandler } from '@/lib/errorHandler';
const errorLog = createErrorHandler('CartContext');

} catch (error) {
  errorLog.silent(error, 'load_database_cart');
  return [];
}
```

---

## 5. P1: Унификация проверки ролей

### Текущая проблема:
- `is_admin_or_uno_team()` проверяет только `user_roles`
- `useUserContext` проверяет `user_roles` + `org_members`
- RLS политики используют только `user_roles`

### Решение:
Создать единую функцию `has_elevated_access`:

```sql
CREATE OR REPLACE FUNCTION public.has_elevated_access(p_required_roles text[] DEFAULT ARRAY['admin', 'uno_team'])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
BEGIN
  -- Check user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = ANY(p_required_roles)
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check org_members for admin/owner role in any org
  IF EXISTS (
    SELECT 1 FROM public.org_members om
    JOIN public.orgs o ON o.id = om.org_id
    WHERE om.user_id = auth.uid() 
      AND om.is_active = TRUE
      AND om.role IN ('owner', 'admin')
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;
```

---

## Порядок реализации

1. **Миграция БД** — создать `topup_wallet_atomic` и `create_order_atomic`
2. **Миграция БД** — ограничить RLS для analytics таблиц
3. **Миграция БД** — создать `has_elevated_access` функцию
4. **stripe-webhook/index.ts** — использовать `topup_wallet_atomic`
5. **useOrders.ts** — использовать `create_order_atomic`
6. **CartContext.tsx** — заменить console.error на errorHandler
7. **useAdmin.ts** — заменить console.error на errorHandler

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `supabase/migrations/` (новый) | Атомарные RPC + RLS + has_elevated_access |
| `supabase/functions/stripe-webhook/index.ts` | Использовать topup_wallet_atomic |
| `src/hooks/useOrders.ts` | Использовать create_order_atomic |
| `src/contexts/CartContext.tsx` | Заменить 8× console.error |
| `src/hooks/useAdmin.ts` | Заменить 4× console.error |

---

## Ожидаемые улучшения

| Метрика | До | После |
|---------|-----|-------|
| Race condition risk | HIGH | ELIMINATED |
| Zombie records risk | HIGH | ELIMINATED |
| Analytics data exposure | ALL AUTH USERS | ADMIN ONLY |
| Error visibility | LOST IN CONSOLE | TRACKED + TOASTED |
