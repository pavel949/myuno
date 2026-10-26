# Offline fixture generation from committed snapshots/registered SQL only.
import re,json,hashlib
from pathlib import Path
catalog=Path('src/lib/__tests__/fixtures/uno-team-live-catalog.sql').read_text()
core=['orders','order_items','order_participants','order_status_history','property_bookings','property_availability','payment_intents','manual_payment_requests','properties']
extra=['ledger_entries','ledger_accounts','property_financials','owner_properties','property_activity_log','providers','vertical_commission_rules']
lines=['-- Isolated representative booking layer: exact column/type snapshots from the','-- committed uno-team-live-catalog, actual captured/registered trigger bodies.','-- Supporting Auth dependencies remain synthetic. No production data or access.']
for definition in re.findall(r'^CREATE TYPE public\..*?;$',catalog,re.M):
 lines.append('DO $type$ BEGIN '+definition+' EXCEPTION WHEN duplicate_object THEN NULL; END $type$;')
def fields(body):
 depth=0;start=0
 for i,c in enumerate(body):
  if c=='(':depth+=1
  elif c==')':depth-=1
  elif c==',' and depth==0:yield body[start:i];start=i+1
 yield body[start:]
for table in core+extra:
 m=re.search(r'^CREATE TABLE "public"\."'+table+r'" \((.*?)\);$',catalog,re.M);assert m,table
 if table in extra:lines.append(m[0])
 else:
  for f in fields(m[1]):lines.append('ALTER TABLE public.'+table+' ADD COLUMN IF NOT EXISTS '+f.strip()+';')
 if '"id" uuid' in m[1]:lines.append('ALTER TABLE public.'+table+' ALTER COLUMN id SET DEFAULT gen_random_uuid();')
 if '"created_at" timestamp' in m[1]:lines.append('ALTER TABLE public.'+table+' ALTER COLUMN created_at SET DEFAULT now();')
 if '"updated_at" timestamp' in m[1]:lines.append('ALTER TABLE public.'+table+' ALTER COLUMN updated_at SET DEFAULT now();')
lines+=['CREATE UNIQUE INDEX fixture_availability_identity ON property_availability(property_id,date);',
 'CREATE FUNCTION public.is_admin_or_uno_team() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN (\'admin\',\'uno_team\')) $$;']
rows=json.loads(Path('docs/convergence/final_order_mutation/functions.json').read_text())['rows']
names=['get_order_vertical','calculate_order_commission','validate_order_fee','create_property_booking_from_order','create_financial_from_booking','trg_release_availability_on_order_cancel']
for r in rows:
 if r['proname'] in names:lines.append(r['definition'].rstrip()+';')
registered=Path('supabase/migrations/20260705000000_review_financial_rls_hardening.sql').read_text()
guard=re.search(r'CREATE OR REPLACE FUNCTION public.guard_orders_protected_columns\(\).*?\n\$\$;',registered,re.S)[0];lines.append(guard)
triggers=json.loads(Path('docs/convergence/final_order_mutation/triggers.json').read_text())['rows']
for r in triggers:
 if r['tgname'] in ['calculate_order_commission_trigger','trigger_calculate_order_commission','trigger_recalc_commission_on_update','trg_validate_order_fee','trg_create_property_booking','trg_create_financial_from_booking','trg_release_availability_on_order_cancel']:lines.append(r['definition']+';')
lines.append('CREATE TRIGGER trg_guard_orders_protected_columns BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION public.guard_orders_protected_columns();')
# Actual registered timestamp writers participate in CAS/version behavior.
for source,name in [('supabase/migrations/20260119042142_c1535ed5-ce1d-455e-aa79-81a5b1b7de1e.sql','update_updated_at'),('supabase/migrations/20260108232401_58910c54-a4ad-42a9-9a87-53b966dc5025.sql','update_updated_at_column')]:
 text=Path(source).read_text();match=re.search(r'CREATE OR REPLACE FUNCTION public\.'+name+r'\(\).*?\$\$ LANGUAGE plpgsql[^;]*;',text,re.S);assert match,name;lines.append(match[0])
lines.append('CREATE TRIGGER tr_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();')
lines.append('CREATE TRIGGER update_property_bookings_updated_at BEFORE UPDATE ON property_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();')
Path('src/lib/__tests__/fixtures/property-representative-layer.sql').write_text('\n'.join(lines)+'\n')
