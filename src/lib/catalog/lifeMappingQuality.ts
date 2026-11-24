export interface LifeMappingForAudit {
  id: string;
  entity_type: string;
  entity_id: string;
  life_situation_id: string;
  weight: number;
  life_situations: { code: string; title_en: string; title_ru: string | null; is_active?: boolean | null } | null;
}
/** Structural checks only. Ranking weight is never provider verification or trust. */
export function auditLifeMappings(rows: LifeMappingForAudit[]) {
  const keys = new Set<string>();
  return rows.map(row => {
    const key = `${row.life_situation_id}:${row.entity_type}:${row.entity_id}`;
    const issues: string[] = [];
    if (!row.life_situations) issues.push('missing-situation');
    else if (row.life_situations.is_active === false) issues.push('inactive-situation');
    if (!row.entity_type.trim() || !row.entity_id.trim()) issues.push('missing-entity');
    if (!Number.isFinite(row.weight) || row.weight < 0 || row.weight > 100) issues.push('invalid-weight');
    if (keys.has(key)) issues.push('duplicate-link');
    keys.add(key);
    return { ...row, issues };
  });
}
