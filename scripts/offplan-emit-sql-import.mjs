/**
 * Emits a single PL/pgSQL DO block that imports OFFPLAN projects.json into property_projects.
 * Used by agents/CI with Supabase execute_sql (no service role in env).
 *
 *   node scripts/offplan-emit-sql-import.mjs [path/to/projects.json] > /tmp/offplan.sql
 *   OFFPLAN_BATCH_FROM=0 OFFPLAN_BATCH_TO=50 node scripts/offplan-emit-sql-import.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsonPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(root, 'data', 'offplan-seed', 'projects.json');

const raw = fs.readFileSync(jsonPath, 'utf8');
const all = JSON.parse(raw);
if (!Array.isArray(all)) {
  console.error('Expected JSON array');
  process.exit(1);
}
const from = Math.max(0, parseInt(process.env.OFFPLAN_BATCH_FROM ?? '0', 10) || 0);
const toRaw = process.env.OFFPLAN_BATCH_TO;
const to = toRaw !== undefined ? Math.min(all.length, parseInt(toRaw, 10) || all.length) : all.length;
const slice = all.slice(from, to);
const b64 = Buffer.from(JSON.stringify(slice), 'utf8').toString('base64');

const sql = `
DO $offplan_import$
DECLARE
  j jsonb := convert_from(decode('${b64}', 'base64'), 'UTF8')::jsonb;
  p jsonb;
  v_slug text;
  v_status text;
  v_prog int;
  v_comp date;
  v_muuno int;
  v_oc jsonb;
BEGIN
  FOR p IN SELECT jsonb_array_elements(j)
  LOOP
    v_slug := 'offplan-' || (p->>'id');
    v_status := CASE
      WHEN lower(coalesce(p->>'stK', '')) IN ('ready', 'done', 'completed') THEN 'completed'
      WHEN lower(coalesce(p->>'stK', '')) LIKE '%build%'
        OR lower(coalesce(p->>'stK', '')) LIKE '%const%'
        OR lower(coalesce(p->>'stK', '')) = 'uc' THEN 'under_construction'
      ELSE 'offplan'
    END;
    v_prog := CASE WHEN v_status = 'completed' THEN 100 ELSE 0 END;
    IF (p->>'compY') IS NULL OR (p->>'compY')::int < 2000 THEN
      v_comp := NULL;
    ELSE
      v_comp := make_date(
        (p->>'compY')::int,
        CASE
          WHEN lower(coalesce(p->>'compQ', '')) LIKE '%1%' OR lower(coalesce(p->>'compQ', '')) = 'q1' THEN 2
          WHEN lower(coalesce(p->>'compQ', '')) LIKE '%3%' OR lower(coalesce(p->>'compQ', '')) = 'q3' THEN 8
          WHEN lower(coalesce(p->>'compQ', '')) LIKE '%4%' OR lower(coalesce(p->>'compQ', '')) = 'q4' THEN 11
          ELSE 6
        END,
        1
      );
    END IF;
    IF (p->>'rat') IS NULL THEN
      v_muuno := NULL;
    ELSIF (p->>'rat')::numeric <= 10 THEN
      v_muuno := LEAST(100, ROUND((p->>'rat')::numeric * 10)::int);
    ELSE
      v_muuno := LEAST(100, ROUND((p->>'rat')::numeric)::int);
    END IF;
    v_oc := jsonb_strip_nulls(jsonb_build_object(
      'legacy_id', p->'id',
      'rec', p->'rec',
      'seg', p->'seg',
      'zone', p->'zone',
      'type', p->'type',
      'beach', p->'beach',
      'own', p->'own',
      'mgmt', p->'mgmt',
      'focus', p->'focus',
      'st_k', p->'stK',
      'tags', COALESCE(p->'tags', '[]'::jsonb),
      'rating', p->'rat',
      'comp_y', p->'compY',
      'comp_q', p->'compQ',
      'min_br', p->'minBR'
    ));
    INSERT INTO public.property_projects (
      slug,
      name_en,
      name_ru,
      district,
      location_area,
      developer_name,
      description_en,
      description_ru,
      price_from,
      project_status,
      completion_date,
      construction_progress,
      roi_projected,
      muuno_score,
      risk_level,
      amenities,
      is_active,
      is_approved,
      offplan_catalog
    ) VALUES (
      v_slug,
      COALESCE(p->>'n', v_slug),
      COALESCE(p->>'n', v_slug),
      NULLIF(p->>'zone', ''),
      NULLIF(p->>'zone', ''),
      NULLIF(p->>'dev', ''),
      NULLIF(p->>'desc', ''),
      NULLIF(p->>'desc', ''),
      CASE WHEN (p->>'pN') IS NOT NULL THEN (p->>'pN')::numeric ELSE NULL END,
      v_status,
      v_comp,
      v_prog,
      CASE WHEN (p->>'yN') IS NOT NULL THEN (p->>'yN')::numeric ELSE NULL END,
      v_muuno,
      COALESCE(p->>'risk', ''),
      CASE
        WHEN jsonb_array_length(COALESCE(p->'tags', '[]'::jsonb)) = 0 THEN NULL
        ELSE ARRAY(SELECT jsonb_array_elements_text(p->'tags'))
      END,
      true,
      true,
      v_oc
    )
    ON CONFLICT (slug) DO UPDATE SET
      name_en = EXCLUDED.name_en,
      name_ru = EXCLUDED.name_ru,
      district = EXCLUDED.district,
      location_area = EXCLUDED.location_area,
      developer_name = EXCLUDED.developer_name,
      description_en = EXCLUDED.description_en,
      description_ru = EXCLUDED.description_ru,
      price_from = EXCLUDED.price_from,
      project_status = EXCLUDED.project_status,
      completion_date = EXCLUDED.completion_date,
      construction_progress = EXCLUDED.construction_progress,
      roi_projected = EXCLUDED.roi_projected,
      muuno_score = EXCLUDED.muuno_score,
      risk_level = EXCLUDED.risk_level,
      amenities = EXCLUDED.amenities,
      is_active = EXCLUDED.is_active,
      is_approved = EXCLUDED.is_approved,
      offplan_catalog = EXCLUDED.offplan_catalog,
      updated_at = now();
  END LOOP;
END
$offplan_import$;
`;

process.stdout.write(sql.trim() + '\n');
