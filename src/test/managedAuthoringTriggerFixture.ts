import { readFileSync } from 'node:fs';
import type postgres from 'postgres';

/** Production-source trigger bodies on synthetic supporting columns only.
 * This fixture never connects to a hosted database or dispatches notifications.
 * Managed shells have provider_id NULL, exercising the vendor early-return gate.
 */
export async function installManagedAuthoringTriggerFixture(sql: postgres.Sql) {
  function body(path: string, name: string) {
    const source = readFileSync(path, 'utf8');
    const start = source.search(new RegExp(`CREATE (?:OR REPLACE )?FUNCTION (?:public\\.)?${name}\\(`));
    if (start < 0) throw new Error(`Missing trigger function ${name}`);
    const opening = source.indexOf('$$', start);
    const closing = source.indexOf('$$', opening + 2);
    return source.slice(start, source.indexOf(';', closing + 2) + 1);
  }
  await sql.unsafe(`ALTER TABLE management_companies ADD COLUMN properties_count integer DEFAULT 0;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS sale_intent text,
      ADD COLUMN IF NOT EXISTS transfer_fee_split text, ADD COLUMN IF NOT EXISTS escrow_provider text,
      ADD COLUMN IF NOT EXISTS quick_sale_reason text, ADD COLUMN IF NOT EXISTS title_deed_type text,
      ADD COLUMN IF NOT EXISTS spa_stage text, ADD COLUMN IF NOT EXISTS quick_sale_discount_pct numeric,
      ADD COLUMN IF NOT EXISTS tenancy_modes text[];
    ALTER TABLE property_activity_log ADD CONSTRAINT acceptance_actor_role CHECK(actor_role IN
      ('owner','trustee','agent','manager','management_company','uno_team','system'));`);
  for (const [path, name] of [
    ['drizzle/migrations/0025_delegation_company_guards.sql', 'guard_property_company_change'],
    ['supabase/migrations/20260226034859_e3fd30c9-235d-4bfb-8806-7e60de04ecd6.sql', 'update_mc_properties_count'],
    ['supabase/migrations/20260424161200_03f0de8c-13a3-4dda-9533-4cd40c158a88.sql', 'validate_property_tracks'],
    ['supabase/migrations/20260108232401_58910c54-a4ad-42a9-9a87-53b966dc5025.sql', 'update_updated_at_column'],
    ['supabase/migrations/20260219021046_e89c5f9a-9e7e-4cae-90e6-21f001ea543e.sql', 'set_updated_at'],
    ['supabase/migrations/20260228003351_afbbacc8-2a87-4ade-b22e-c28e7761268d.sql', 'fn_auto_expense_on_task_done'],
  ]) await sql.unsafe(body(path, name));
  const normalization = readFileSync('supabase/migrations/20260225144021_bfb9f5d1-f20a-4f47-a6d4-70971cc08d8f.sql', 'utf8');
  await sql.unsafe(normalization.match(/CREATE OR REPLACE FUNCTION normalize_district\(\)[\s\S]*?\$\$ LANGUAGE plpgsql;/)![0]);
  const vendor = readFileSync('supabase/migrations/20260121010005_982a783a-0ff3-49fc-bd4a-230f9365dbd8.sql', 'utf8');
  const start = vendor.indexOf('CREATE OR REPLACE FUNCTION notify_vendor_on_content_status_change()');
  const ending = '$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;';
  await sql.unsafe(vendor.slice(start, vendor.indexOf(ending, start) + ending.length));
  await sql.unsafe(`CREATE TRIGGER guard_property_company_change BEFORE UPDATE OF management_company_id ON properties
      FOR EACH ROW EXECUTE FUNCTION guard_property_company_change();
    CREATE TRIGGER trg_mc_properties_count AFTER INSERT OR DELETE OR UPDATE OF management_company_id ON properties
      FOR EACH ROW EXECUTE FUNCTION update_mc_properties_count();
    CREATE TRIGGER trg_normalize_district_properties BEFORE INSERT OR UPDATE ON properties
      FOR EACH ROW EXECUTE FUNCTION normalize_district();
    CREATE TRIGGER trigger_notify_vendor_properties AFTER UPDATE OF approval_status ON properties
      FOR EACH ROW EXECUTE FUNCTION notify_vendor_on_content_status_change();
    CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER validate_property_tracks_trg BEFORE INSERT OR UPDATE ON properties
      FOR EACH ROW EXECUTE FUNCTION validate_property_tracks();
    CREATE TRIGGER trg_property_complexes_updated_at BEFORE UPDATE ON property_complexes
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    CREATE TRIGGER trg_auto_expense_on_task_done BEFORE UPDATE ON property_operational_tasks
      FOR EACH ROW EXECUTE FUNCTION fn_auto_expense_on_task_done();
    CREATE TRIGGER update_property_operational_tasks_updated_at BEFORE UPDATE ON property_operational_tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`);
}
