-- GDPR/PDPA right-to-erasure support.
--
-- Backs the self-service `delete-account` edge function. Performs the DB half of
-- account erasure in one transaction: PII is scrubbed from retained financial
-- records (orders/wallet — kept 7 years per the privacy policy) and hard-deleted
-- from non-cascading personal stores (document vault, CRM, marketing leads).
-- Tables that FK to auth.users with ON DELETE CASCADE (profiles, user_roles,
-- favorites, notifications, terms_acceptances, …) are cleaned by the subsequent
-- auth.admin.deleteUser call in the edge function and are NOT touched here.
--
-- Storage objects are purged separately by the edge function (by the `${userId}/`
-- prefix in the user-file buckets), so this function only handles rows.

-- Reconciliation marker: which retained orders had their customer PII erased.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_erased_at timestamptz;

CREATE OR REPLACE FUNCTION public.erase_user_account(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email        text;
  v_orders       integer;
  v_vault        integer;
  v_docs         integer;
  v_crm          integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  -- profiles still exists at this point (auth cascade runs after this fn),
  -- so we can resolve the subject's email to match marketing-lead rows.
  SELECT email INTO v_email FROM public.profiles WHERE id = p_user_id;

  -- 1. Scrub PII on retained financial records (kept for tax/audit).
  UPDATE public.order_participants op
     SET name = 'Deleted user', phone = NULL, email = NULL, metadata = NULL
    FROM public.orders o
   WHERE op.order_id = o.id
     AND o.customer_user_id = p_user_id;

  UPDATE public.order_addresses oa
     SET address_text = '[erased]', notes = NULL, lat = NULL, lng = NULL
    FROM public.orders o
   WHERE oa.order_id = o.id
     AND o.customer_user_id = p_user_id;

  UPDATE public.orders
     SET notes = NULL,
         -- drop all metadata (delivery/contact PII) but keep the order_type tag
         metadata = jsonb_build_object('erased', true, 'order_type', order_type),
         customer_erased_at = now()
   WHERE customer_user_id = p_user_id;
  GET DIAGNOSTICS v_orders = ROW_COUNT;

  UPDATE public.wallet_transactions
     SET description = '[erased]', description_ru = '[erased]'
   WHERE user_id = p_user_id;

  -- 2. Hard-delete non-cascading personal-document stores.
  DELETE FROM public.user_documents_vault WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_vault = ROW_COUNT;
  DELETE FROM public.user_documents WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_docs = ROW_COUNT;

  -- 3. Anonymize CRM records linked to the subject (keep the business shell,
  --    strip personal data + unlink from the auth user).
  UPDATE public.crm_contacts
     SET first_name = NULL, last_name = NULL, email = NULL,
         phone = NULL, phone2 = NULL, mobile = NULL,
         whatsapp = NULL, telegram = NULL, line_id = NULL,
         birthday = NULL, passport_country = NULL, tax_id = NULL, tax_residency = NULL,
         emergency_contact_name = NULL, emergency_contact_phone = NULL,
         avatar_url = NULL, ai_summary = NULL, notes = NULL, special_notes = NULL,
         linked_user_id = NULL
   WHERE linked_user_id = p_user_id;
  GET DIAGNOSTICS v_crm = ROW_COUNT;

  -- 4. Scrub marketing/attribution leads matched by email.
  IF v_email IS NOT NULL THEN
    UPDATE public.mcc_leads
       SET email = NULL, phone = NULL, name = '[erased]'
     WHERE lower(email) = lower(v_email);
  END IF;

  RETURN jsonb_build_object(
    'orders_anonymized', COALESCE(v_orders, 0),
    'vault_deleted',     COALESCE(v_vault, 0),
    'documents_deleted', COALESCE(v_docs, 0),
    'crm_anonymized',    COALESCE(v_crm, 0)
  );
END;
$$;

-- Service-role only: the edge function authenticates the caller and invokes this
-- with the service key. No direct client access.
REVOKE ALL ON FUNCTION public.erase_user_account(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.erase_user_account(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.erase_user_account(uuid) FROM authenticated;
