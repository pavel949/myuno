#!/usr/bin/env node
// Apply Thai translations from /tmp/th_translations.json to DB via supabase REST (service_role bypass via psql is blocked by RLS; we emit a giant SQL for the supabase--insert tool).

import fs from 'node:fs';
const t = JSON.parse(fs.readFileSync('/tmp/th_translations.json', 'utf8'));
const esc = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);

const lines = [];
for (const [code, v] of Object.entries(t.situations || {})) {
  lines.push(`UPDATE public.life_situations SET title_th=${esc(v.title_th)}, description_th=${esc(v.description_th)} WHERE code='${code}';`);
}
for (const [slug, v] of Object.entries(t.categories || {})) {
  lines.push(`UPDATE public.categories SET name_th=${esc(v.name_th)} WHERE slug='${slug.replace(/'/g, "''")}';`);
}
for (const [slug, v] of Object.entries(t.groups || {})) {
  lines.push(`UPDATE public.category_groups SET name_th=${esc(v.name_th)} WHERE slug='${slug}';`);
}
fs.writeFileSync('/tmp/apply_th.sql', lines.join('\n') + '\n');
console.log(`Generated ${lines.length} UPDATE statements → /tmp/apply_th.sql`);
console.log(`Size: ${fs.statSync('/tmp/apply_th.sql').size} bytes`);
