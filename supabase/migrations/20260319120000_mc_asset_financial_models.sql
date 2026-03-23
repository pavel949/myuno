-- mc_asset_financial_models
-- Stores financial model inputs and computed scenario snapshots per asset.
-- Access controlled via mc_can_access() with module='finances'.

CREATE TABLE public.mc_asset_financial_models (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID        NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  property_id   UUID        REFERENCES public.properties(id) ON DELETE SET NULL,
  asset_name    TEXT        NOT NULL,
  asset_address TEXT,
  inputs        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  scenarios     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mc_asset_financial_models_company
  ON public.mc_asset_financial_models(company_id);

CREATE INDEX idx_mc_asset_financial_models_property
  ON public.mc_asset_financial_models(property_id)
  WHERE property_id IS NOT NULL;

ALTER TABLE public.mc_asset_financial_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_models_select" ON public.mc_asset_financial_models
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'finances', 'view'));

CREATE POLICY "fin_models_insert" ON public.mc_asset_financial_models
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'finances', 'edit'));

CREATE POLICY "fin_models_update" ON public.mc_asset_financial_models
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'finances', 'edit'));

CREATE POLICY "fin_models_delete" ON public.mc_asset_financial_models
  FOR DELETE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'finances', 'edit'));

CREATE TRIGGER set_mc_asset_financial_models_updated_at
  BEFORE UPDATE ON public.mc_asset_financial_models
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
