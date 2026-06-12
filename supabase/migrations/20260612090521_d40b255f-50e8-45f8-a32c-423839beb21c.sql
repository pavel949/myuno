ALTER FUNCTION public.crm_contacts_normalize_phone() SET search_path = public;
ALTER FUNCTION public.delete_email(queue_name text, message_id bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(queue_name text, payload jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb) SET search_path = public;
ALTER FUNCTION public.normalize_phone_text(p text) SET search_path = public;
ALTER FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer) SET search_path = public;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;