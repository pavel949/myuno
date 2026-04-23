-- M6 · Track C.2 — DB trigger on bookings → async lifecycle recompute
-- Использует pg_net.http_post для вызова edge function canonical-lifecycle-recompute
-- асинхронно (не блокирует INSERT/UPDATE на bookings).

-- Включаем pg_net (pg_cron включим отдельно при настройке C.4 cron job).
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper-функция: дёргает edge function для одного user_id.
-- SECURITY DEFINER — чтобы триггер мог писать в net.http_request_queue
-- независимо от роли инициатора.
CREATE OR REPLACE FUNCTION public.trigger_lifecycle_recompute(
  _user_id uuid,
  _source text DEFAULT 'booking'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text := 'https://kakkwibljrjsawxgnupk.supabase.co/functions/v1/canonical-lifecycle-recompute';
BEGIN
  IF _user_id IS NULL THEN
    RETURN;
  END IF;
  PERFORM net.http_post(
    url     := _url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object('user_id', _user_id, 'source', _source)
  );
EXCEPTION WHEN OTHERS THEN
  -- Глотаем ошибки, чтобы не ломать основную транзакцию (booking confirm).
  NULL;
END;
$$;

-- Триггер-функция на bookings: реагируем только когда status переходит в 'confirmed'.
CREATE OR REPLACE FUNCTION public.bookings_after_confirm_recompute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.guest_user_id IS NOT NULL
  THEN
    PERFORM public.trigger_lifecycle_recompute(NEW.guest_user_id, 'booking');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_after_confirm_recompute ON public.bookings;
CREATE TRIGGER bookings_after_confirm_recompute
AFTER INSERT OR UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.bookings_after_confirm_recompute();