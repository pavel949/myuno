/**
 * Import OFFPLAN seed JSON (github.com/pavel949/OFFPLAN data/seed/projects.json)
 * into myUNO property_projects + offplan_catalog.
 *
 * Target DB is the Supabase project for newbuilds/offplan (ref ktfwmfdlmcgpbdnsggrb — same host as
 * https://ktfwmfdlmcgpbdnsggrb.supabase.co). Direct Postgres: db.ktfwmfdlmcgpbdnsggrb.supabase.co:5432.
 *
 * Prerequisites:
 *   1. Apply migration: 20260415120000_property_projects_offplan_catalog.sql
 *   2. Env: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/import-offplan-catalog.mjs path/to/projects.json
 *   node scripts/import-offplan-catalog.mjs   # defaults to ./data/offplan-seed/projects.json
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadDotenv } from './lib/loadDotenv.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
loadDotenv(root);

const url =
  process.env.OFFPLAN_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;
const key =
  process.env.OFFPLAN_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    'Set OFFPLAN_SUPABASE_URL + OFFPLAN_SUPABASE_SERVICE_ROLE_KEY (or fallback SUPABASE_URL/VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)',
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function mapStkToProjectStatus(stK) {
  const s = String(stK || '').toLowerCase();
  if (s === 'ready' || s === 'done' || s === 'completed') return 'completed';
  if (s.includes('build') || s.includes('const') || s === 'uc') return 'under_construction';
  return 'offplan';
}

function completionDateFrom(p) {
  const y = p.compY;
  if (!y || y < 2000) return null;
  const q = String(p.compQ || '').toLowerCase();
  let month = 6;
  if (q.includes('1') || q === 'q1') month = 2;
  else if (q.includes('3') || q === 'q3') month = 8;
  else if (q.includes('4') || q === 'q4') month = 11;
  return `${y}-${String(month).padStart(2, '0')}-01`;
}

function muunoFromRat(rat) {
  const r = Number(rat);
  if (!Number.isFinite(r)) return null;
  if (r <= 10) return Math.min(100, Math.round(r * 10));
  return Math.min(100, Math.round(r));
}

function buildRow(p) {
  const slug = `offplan-${p.id}`;
  const offplan_catalog = {
    legacy_id: p.id,
    rec: p.rec,
    seg: p.seg,
    zone: p.zone,
    type: p.type,
    beach: p.beach,
    own: p.own,
    mgmt: p.mgmt,
    focus: p.focus,
    st_k: p.stK,
    tags: p.tags || [],
    rating: typeof p.rat === 'number' ? p.rat : undefined,
    comp_y: p.compY,
    comp_q: p.compQ,
    min_br: p.minBR,
  };

  return {
    slug,
    name_en: p.n,
    name_ru: p.n,
    district: p.zone || null,
    location_area: p.zone || null,
    developer_name: p.dev || null,
    description_en: p.desc || null,
    description_ru: p.desc || null,
    price_from: typeof p.pN === 'number' ? p.pN : null,
    project_status: mapStkToProjectStatus(p.stK),
    completion_date: completionDateFrom(p),
    construction_progress: mapStkToProjectStatus(p.stK) === 'completed' ? 100 : 0,
    roi_projected: typeof p.yN === 'number' ? p.yN : null,
    muuno_score: muunoFromRat(p.rat),
    risk_level: String(p.risk ?? ''),
    amenities: Array.isArray(p.tags) ? p.tags : null,
    is_active: true,
    is_approved: true,
    offplan_catalog,
  };
}

async function upsertProject(p) {
  const row = buildRow(p);
  const { data: existing, error: selErr } = await supabase
    .from('property_projects')
    .select('id')
    .contains('offplan_catalog', { legacy_id: p.id })
    .maybeSingle();

  if (selErr) {
    console.error('Lookup legacy_id', p.id, selErr.message);
    return false;
  }

  if (existing?.id) {
    const { error } = await supabase.from('property_projects').update(row).eq('id', existing.id);
    if (error) {
      console.error('Update', p.id, error.message);
      return false;
    }
    return true;
  }

  const { error } = await supabase.from('property_projects').insert(row);
  if (error) {
    console.error('Insert', p.id, error.message);
    return false;
  }
  return true;
}

const argPath = process.argv[2];
const jsonPath = argPath
  ? path.resolve(process.cwd(), argPath)
  : path.join(root, 'data', 'offplan-seed', 'projects.json');

if (!fs.existsSync(jsonPath)) {
  console.error('File not found:', jsonPath);
  console.error('Copy projects.json from OFFPLAN repo into data/offplan-seed/ or pass path as argv[1]');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const projects = Array.isArray(raw) ? raw : [];
let ok = 0;
for (const p of projects) {
  if (await upsertProject(p)) ok += 1;
}
console.log(`OFFPLAN import done: ${ok}/${projects.length} OK`);
