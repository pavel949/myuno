/**
 * Quality score engine — evaluates a VerticalSpec.quality[] against a row.
 * Returns 0-100 score + per-rule pass/fail for the "improve your listing" panel.
 */
import type { QualityRule, VerticalSpec } from './types';

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function evaluateRule(rule: QualityRule, row: unknown): boolean {
  const value = getPath(row, rule.check.path);
  switch (rule.check.kind) {
    case 'field_present':
    case 'has_value':
      return value !== null && value !== undefined && value !== '';
    case 'field_i18n_complete': {
      const v = value as { en?: string; ru?: string } | null | undefined;
      return !!(v && typeof v === 'object' && v.en?.trim() && v.ru?.trim());
    }
    case 'array_min':
      return Array.isArray(value) && value.length >= rule.check.min;
    case 'media_min':
      return Array.isArray(value) && value.length >= rule.check.min;
    default:
      return false;
  }
}

export interface QualityReport {
  score: number;           // 0-100
  totalWeight: number;
  passedWeight: number;
  passed: string[];
  failed: { id: string; weight: number }[];
}

export function computeQualityScore(spec: VerticalSpec, row: unknown): QualityReport {
  const totalWeight = spec.quality.reduce((s, r) => s + r.weight, 0) || 1;
  const passed: string[] = [];
  const failed: { id: string; weight: number }[] = [];
  let passedWeight = 0;

  for (const rule of spec.quality) {
    if (evaluateRule(rule, row)) {
      passed.push(rule.id);
      passedWeight += rule.weight;
    } else {
      failed.push({ id: rule.id, weight: rule.weight });
    }
  }

  return {
    score: Math.round((passedWeight / totalWeight) * 100),
    totalWeight,
    passedWeight,
    passed,
    failed,
  };
}
