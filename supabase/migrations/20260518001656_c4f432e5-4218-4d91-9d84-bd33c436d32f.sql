-- Wave 1: Dedupe crm_contacts by email + add UNIQUE index + normalize trigger

-- Step 1: Normalize all emails
UPDATE public.crm_contacts
SET email = lower(trim(email))
WHERE email IS NOT NULL AND email <> lower(trim(email));

-- Step 2 + 3 + 4 + 5: Merge duplicates inside a PL/pgSQL block
DO $$
DECLARE
  grp RECORD;
  canonical_id uuid;
  dup_ids uuid[];
BEGIN
  FOR grp IN
    SELECT lower(email) AS email_norm,
           array_agg(id ORDER BY created_at) AS ids
    FROM public.crm_contacts
    WHERE email IS NOT NULL AND email <> ''
    GROUP BY lower(email)
    HAVING COUNT(*) > 1
  LOOP
    canonical_id := grp.ids[1];
    dup_ids := grp.ids[2:array_length(grp.ids,1)];

    -- Merge non-null fields from duplicates into canonical (COALESCE chain)
    UPDATE public.crm_contacts c
    SET
      phone        = COALESCE(c.phone,        (SELECT phone        FROM public.crm_contacts WHERE id = ANY(dup_ids) AND phone        IS NOT NULL LIMIT 1)),
      first_name   = COALESCE(c.first_name,   (SELECT first_name   FROM public.crm_contacts WHERE id = ANY(dup_ids) AND first_name   IS NOT NULL LIMIT 1)),
      last_name    = COALESCE(c.last_name,    (SELECT last_name    FROM public.crm_contacts WHERE id = ANY(dup_ids) AND last_name    IS NOT NULL LIMIT 1)),
      company_name = COALESCE(c.company_name, (SELECT company_name FROM public.crm_contacts WHERE id = ANY(dup_ids) AND company_name IS NOT NULL LIMIT 1)),
      notes = CONCAT_WS(E'\n---\n',
        NULLIF(c.notes, ''),
        (SELECT string_agg(NULLIF(notes,''), E'\n---\n') FROM public.crm_contacts WHERE id = ANY(dup_ids) AND notes IS NOT NULL AND notes <> '')
      ),
      tags = (
        SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(c.tags,'{}'::text[]) || COALESCE(
          (SELECT array_agg(t) FROM public.crm_contacts d, unnest(COALESCE(d.tags,'{}'::text[])) t WHERE d.id = ANY(dup_ids)),
          '{}'::text[]
        )))
      )
    WHERE c.id = canonical_id;

    -- Repoint soft references
    UPDATE public.agent_deals                  SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.capital_intro_requests       SET crm_contact_id    = canonical_id WHERE crm_contact_id    = ANY(dup_ids);
    UPDATE public.capital_pipeline             SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.crm_activities               SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.crm_contact_notes            SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.crm_documents                SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.crm_emails                   SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.crm_meetings                 SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.crm_quotes                   SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.crm_sequence_enrollments     SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.crm_tasks                    SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.deal_scheduled_activities    SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.lead_magnet_submissions      SET crm_contact_id    = canonical_id WHERE crm_contact_id    = ANY(dup_ids);
    UPDATE public.nb_leads                     SET crm_contact_id    = canonical_id WHERE crm_contact_id    = ANY(dup_ids);
    UPDATE public.project_units                SET buyer_contact_id  = canonical_id WHERE buyer_contact_id  = ANY(dup_ids);
    UPDATE public.properties                   SET owner_contact_id  = canonical_id WHERE owner_contact_id  = ANY(dup_ids);
    UPDATE public.property_accounting_policies SET owner_contact_id  = canonical_id WHERE owner_contact_id  = ANY(dup_ids);
    UPDATE public.property_owners              SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.property_projects            SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);
    UPDATE public.purchase_orders              SET vendor_contact_id = canonical_id WHERE vendor_contact_id = ANY(dup_ids);
    UPDATE public.vendor_outreach_log          SET contact_id        = canonical_id WHERE contact_id        = ANY(dup_ids);

    -- Delete duplicates
    DELETE FROM public.crm_contacts WHERE id = ANY(dup_ids);
  END LOOP;
END $$;

-- Step 6: Partial UNIQUE index on lower(email)
CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_email_unique_lower
  ON public.crm_contacts (lower(email))
  WHERE email IS NOT NULL AND email <> '';

-- Step 7: Trigger to normalize email on insert/update
CREATE OR REPLACE FUNCTION public.crm_contacts_normalize_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
    IF NEW.email = '' THEN
      NEW.email := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_contacts_normalize_email_trg ON public.crm_contacts;
CREATE TRIGGER crm_contacts_normalize_email_trg
  BEFORE INSERT OR UPDATE OF email ON public.crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_contacts_normalize_email();