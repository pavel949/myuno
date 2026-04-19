
-- ============================================================
-- PHASE 3: OPERATIONAL EXCELLENCE
-- Roles in management_company_members: director, admin, manager, accountant, staff, member
-- ============================================================

-- 1. APPROVAL CHAINS
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('expense','purchase_order','contract','payout','invoice','other')),
  min_amount NUMERIC,
  max_amount NUMERIC,
  currency TEXT DEFAULT 'THB',
  approver_user_ids UUID[] NOT NULL DEFAULT '{}',
  require_all BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_company ON public.approval_workflows(company_id);

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.approval_workflows(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_approval_requests_company ON public.approval_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(company_id, status);

CREATE TABLE IF NOT EXISTS public.approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  sequence INT NOT NULL DEFAULT 0,
  approver_user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','skipped')),
  comment TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_steps_request ON public.approval_steps(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_approver ON public.approval_steps(approver_user_id, status);

CREATE OR REPLACE FUNCTION public.tg_approval_steps_resolve()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total INT; approved_n INT; rejected_n INT;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE status='approved'), count(*) FILTER (WHERE status='rejected')
    INTO total, approved_n, rejected_n
  FROM public.approval_steps WHERE request_id = NEW.request_id;
  IF rejected_n > 0 THEN
    UPDATE public.approval_requests SET status='rejected', resolved_at=now(), updated_at=now()
     WHERE id = NEW.request_id AND status='pending';
  ELSIF total > 0 AND approved_n = total THEN
    UPDATE public.approval_requests SET status='approved', resolved_at=now(), updated_at=now()
     WHERE id = NEW.request_id AND status='pending';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_approval_steps_resolve ON public.approval_steps;
CREATE TRIGGER trg_approval_steps_resolve
AFTER INSERT OR UPDATE OF status ON public.approval_steps
FOR EACH ROW EXECUTE FUNCTION public.tg_approval_steps_resolve();

-- 2. TEAM SHIFTS & TIMESHEETS
CREATE TABLE IF NOT EXISTS public.team_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  assignee_user_id UUID NOT NULL REFERENCES auth.users(id),
  property_id UUID,
  role_label TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled','missed')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_shifts_company_date ON public.team_shifts(company_id, start_at);
CREATE INDEX IF NOT EXISTS idx_team_shifts_assignee ON public.team_shifts(assignee_user_id, start_at);

CREATE TABLE IF NOT EXISTS public.team_timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.team_shifts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  property_id UUID,
  clock_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out_at TIMESTAMPTZ,
  duration_minutes INT GENERATED ALWAYS AS (
    CASE WHEN clock_out_at IS NOT NULL
      THEN GREATEST(0, EXTRACT(EPOCH FROM (clock_out_at - clock_in_at))::INT / 60)
      ELSE NULL END
  ) STORED,
  clock_in_lat NUMERIC,
  clock_in_lng NUMERIC,
  clock_in_photo_url TEXT,
  clock_out_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_timesheets_user ON public.team_timesheets(user_id, clock_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_timesheets_company ON public.team_timesheets(company_id, clock_in_at DESC);

-- 3. PROCUREMENT
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  vendor_contact_id UUID,
  vendor_name TEXT,
  property_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partially_received','received','invoiced','closed','cancelled')),
  expected_date DATE,
  received_date DATE,
  invoice_id UUID,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, po_number)
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company ON public.purchase_orders(company_id, status);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  received_quantity NUMERIC NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON public.purchase_order_items(po_id);

CREATE TABLE IF NOT EXISTS public.goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_by UUID REFERENCES auth.users(id),
  receipt_number TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_po ON public.goods_receipts(po_id);

-- 4. OWNER PROFITABILITY VIEW (last 12 months)
-- Uses public.properties (real table) joined with property_financials (transaction_type='income'/'expense')
CREATE OR REPLACE VIEW public.v_owner_profitability AS
SELECT
  p.owner_id,
  p.management_company_id AS company_id,
  count(DISTINCT p.id) AS property_count,
  COALESCE(SUM(pf.amount) FILTER (WHERE pf.transaction_type='income' AND pf.transaction_date >= (CURRENT_DATE - INTERVAL '12 months')), 0) AS revenue_12m,
  COALESCE(SUM(pf.amount) FILTER (WHERE pf.transaction_type='expense' AND pf.transaction_date >= (CURRENT_DATE - INTERVAL '12 months')), 0) AS expenses_12m,
  COALESCE(SUM(pf.amount) FILTER (WHERE pf.transaction_type='income' AND pf.transaction_date >= (CURRENT_DATE - INTERVAL '12 months')), 0)
    - COALESCE(SUM(pf.amount) FILTER (WHERE pf.transaction_type='expense' AND pf.transaction_date >= (CURRENT_DATE - INTERVAL '12 months')), 0) AS net_income_12m,
  CASE WHEN COALESCE(SUM(pf.amount) FILTER (WHERE pf.transaction_type='income' AND pf.transaction_date >= (CURRENT_DATE - INTERVAL '12 months')), 0) > 0
    THEN ROUND(
      (COALESCE(SUM(pf.amount) FILTER (WHERE pf.transaction_type='income' AND pf.transaction_date >= (CURRENT_DATE - INTERVAL '12 months')), 0)
       - COALESCE(SUM(pf.amount) FILTER (WHERE pf.transaction_type='expense' AND pf.transaction_date >= (CURRENT_DATE - INTERVAL '12 months')), 0))
      / NULLIF(SUM(pf.amount) FILTER (WHERE pf.transaction_type='income' AND pf.transaction_date >= (CURRENT_DATE - INTERVAL '12 months')), 0)
      * 100, 2)
    ELSE 0
  END AS net_margin_pct,
  MIN(p.created_at) AS first_property_at,
  MAX(pf.transaction_date) AS last_transaction_date
FROM public.properties p
LEFT JOIN public.property_financials pf ON pf.property_id = p.id
WHERE p.owner_id IS NOT NULL AND p.management_company_id IS NOT NULL
GROUP BY p.owner_id, p.management_company_id;

-- ============================================================
-- RLS POLICIES (roles: director, admin, manager, accountant, staff, member)
-- ============================================================
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wf_select" ON public.approval_workflows FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = approval_workflows.company_id AND m.user_id = auth.uid() AND m.is_active = true));
CREATE POLICY "wf_modify" ON public.approval_workflows FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = approval_workflows.company_id AND m.user_id = auth.uid()
    AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = approval_workflows.company_id AND m.user_id = auth.uid()
    AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true));

CREATE POLICY "req_select" ON public.approval_requests FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = approval_requests.company_id AND m.user_id = auth.uid() AND m.is_active = true));
CREATE POLICY "req_insert" ON public.approval_requests FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = approval_requests.company_id AND m.user_id = auth.uid() AND m.is_active = true)
  AND requested_by = auth.uid());
CREATE POLICY "req_update" ON public.approval_requests FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = approval_requests.company_id AND m.user_id = auth.uid()
    AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true));

CREATE POLICY "steps_select" ON public.approval_steps FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.approval_requests r
  JOIN public.management_company_members m ON m.company_id = r.company_id AND m.user_id = auth.uid() AND m.is_active = true
  WHERE r.id = approval_steps.request_id));
CREATE POLICY "steps_insert" ON public.approval_steps FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.approval_requests r
  JOIN public.management_company_members m ON m.company_id = r.company_id AND m.user_id = auth.uid() AND m.is_active = true
  WHERE r.id = approval_steps.request_id));
CREATE POLICY "steps_update_own" ON public.approval_steps FOR UPDATE TO authenticated
USING (approver_user_id = auth.uid());

CREATE POLICY "shifts_select" ON public.team_shifts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = team_shifts.company_id AND m.user_id = auth.uid() AND m.is_active = true)
  OR assignee_user_id = auth.uid());
CREATE POLICY "shifts_modify" ON public.team_shifts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = team_shifts.company_id AND m.user_id = auth.uid()
    AND m.role IN ('director','admin','manager') AND m.is_active = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = team_shifts.company_id AND m.user_id = auth.uid()
    AND m.role IN ('director','admin','manager') AND m.is_active = true));
CREATE POLICY "shifts_self_update_status" ON public.team_shifts FOR UPDATE TO authenticated
USING (assignee_user_id = auth.uid());

CREATE POLICY "ts_select" ON public.team_timesheets FOR SELECT TO authenticated
USING (user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = team_timesheets.company_id AND m.user_id = auth.uid()
      AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true));
CREATE POLICY "ts_insert_self" ON public.team_timesheets FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = team_timesheets.company_id AND m.user_id = auth.uid() AND m.is_active = true));
CREATE POLICY "ts_update_self" ON public.team_timesheets FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "po_select" ON public.purchase_orders FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = purchase_orders.company_id AND m.user_id = auth.uid() AND m.is_active = true));
CREATE POLICY "po_modify" ON public.purchase_orders FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = purchase_orders.company_id AND m.user_id = auth.uid()
    AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = purchase_orders.company_id AND m.user_id = auth.uid()
    AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true));

CREATE POLICY "po_items_select" ON public.purchase_order_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.purchase_orders po
  JOIN public.management_company_members m ON m.company_id = po.company_id AND m.user_id = auth.uid() AND m.is_active = true
  WHERE po.id = purchase_order_items.po_id));
CREATE POLICY "po_items_modify" ON public.purchase_order_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.purchase_orders po
  JOIN public.management_company_members m ON m.company_id = po.company_id AND m.user_id = auth.uid()
  WHERE po.id = purchase_order_items.po_id
    AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders po
  JOIN public.management_company_members m ON m.company_id = po.company_id AND m.user_id = auth.uid()
  WHERE po.id = purchase_order_items.po_id
    AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true));

CREATE POLICY "gr_select" ON public.goods_receipts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = goods_receipts.company_id AND m.user_id = auth.uid() AND m.is_active = true));
CREATE POLICY "gr_modify" ON public.goods_receipts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = goods_receipts.company_id AND m.user_id = auth.uid()
    AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = goods_receipts.company_id AND m.user_id = auth.uid()
    AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true));

-- updated_at triggers
CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_shifts_updated BEFORE UPDATE ON public.team_shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_po_updated BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
