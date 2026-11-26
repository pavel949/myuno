/**
 * ClearView review model — Design Bible Round 4A · H1 review editor.
 *
 * Extends `due_diligence_reports.analysis[<criterion>]` (jsonb, written by
 * generate-due-diligence) with analyst-authored fields. No schema change:
 *   analysis.legal = { score 0–10, maturity_level, findings[], evidence_gaps[],
 *                      items?: RiskItem[], public_finding?, member_detail? }
 *
 * Scoring stays canon V3 (06-clearview-methodology.md, methodology.ts):
 *   total = Σ(score × 10 × weight) + Σ(modifier.delta), clamped 0–100.
 * Item-level P/S/D/mitigation/confidence is the evidence ledger behind each
 * category score; missing evidence caps confidence automatically.
 */
import { CLEARVIEW_CATEGORIES, scoreToGrade, type ClearViewCategory, type ClearViewGrade } from './methodology';
import { checkCopy } from '@/lib/content/copyCheck';

export type EvidenceType = 'document' | 'registry' | 'site_visit' | 'missing';

export interface RiskItem {
  id: string;
  title: string;
  /** 1–5 */
  probability: number;
  /** 1–5 */
  severity: number;
  /** 1–5 (5 = hardest to detect) */
  detectability: number;
  /** 0–1 share of risk mitigated */
  mitigation: number;
  /** 0–1 analyst confidence before evidence penalty */
  confidence: number;
  evidence: EvidenceType;
}

export interface CategoryReview {
  score: number | null;
  maturity_level?: number;
  findings: string[];
  evidence_gaps: string[];
  items: RiskItem[];
  public_finding: string;
  member_detail: string;
}

export interface ReviewModifier {
  type: string;
  delta: number;
  reason: string;
}

export type CategoryStatus = 'done' | 'active' | 'waiting';

/** Confidence ceiling applied when an item has no evidence. */
export const MISSING_EVIDENCE_CONFIDENCE_CAP = 0.7;

export const analysisKey = (c: ClearViewCategory): string => c.scoreField.replace('score_', '');

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const EVIDENCE: readonly EvidenceType[] = ['document', 'registry', 'site_visit', 'missing'];

function parseItem(raw: unknown, i: number): RiskItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== 'string') return null;
  const evidence = EVIDENCE.includes(r.evidence as EvidenceType) ? (r.evidence as EvidenceType) : 'missing';
  return {
    id: typeof r.id === 'string' ? r.id : `item-${i}`,
    title: r.title,
    probability: clamp(Math.round(num(r.probability, 1)), 1, 5),
    severity: clamp(Math.round(num(r.severity, 1)), 1, 5),
    detectability: clamp(Math.round(num(r.detectability, 1)), 1, 5),
    mitigation: clamp(num(r.mitigation, 0), 0, 1),
    confidence: clamp(num(r.confidence, 1), 0, 1),
    evidence,
  };
}

/** Normalise one analysis entry (tolerates AI output and older drafts). */
export function parseCategoryReview(raw: unknown, columnScore: number | null): CategoryReview {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const items = Array.isArray(r.items) ? r.items.map(parseItem).filter((x): x is RiskItem => x !== null) : [];
  const score = typeof r.score === 'number' ? r.score : columnScore;
  return {
    score: score == null ? null : clamp(score, 0, 10),
    maturity_level: typeof r.maturity_level === 'number' ? r.maturity_level : undefined,
    findings: strArr(r.findings),
    evidence_gaps: strArr(r.evidence_gaps),
    items,
    public_finding: typeof r.public_finding === 'string' ? r.public_finding : '',
    member_detail: typeof r.member_detail === 'string' ? r.member_detail : '',
  };
}

export function effectiveConfidence(item: RiskItem): number {
  return item.evidence === 'missing' ? Math.min(item.confidence, MISSING_EVIDENCE_CONFIDENCE_CAP) : item.confidence;
}

/** Residual risk 0–1 = (P·S·D / 125) × (1 − mitigation). Used to rank items. */
export function residualRisk(item: RiskItem): number {
  return ((item.probability * item.severity * item.detectability) / 125) * (1 - item.mitigation);
}

export function categoryStatus(c: CategoryReview): CategoryStatus {
  if (c.score == null) return 'waiting';
  if (c.items.some((i) => i.evidence === 'missing') || c.evidence_gaps.length > 0) return 'waiting';
  if (!c.public_finding.trim()) return 'active';
  return 'done';
}

export type CategoryMap = Record<string, CategoryReview>;

export function liveScore(categories: CategoryMap, modifiers: readonly ReviewModifier[]): { score: number; grade: ClearViewGrade | null; complete: boolean } {
  let total = 0;
  let complete = true;
  for (const cat of CLEARVIEW_CATEGORIES) {
    const s = categories[analysisKey(cat)]?.score;
    if (s == null) complete = false;
    total += (s ?? 0) * 10 * cat.weight;
  }
  total += modifiers.reduce((acc, m) => acc + (Number.isFinite(m.delta) ? m.delta : 0), 0);
  const score = Math.round(clamp(total, 0, 100) * 10) / 10;
  return { score, grade: complete ? scoreToGrade(score) : null, complete };
}

/** Average effective confidence across all items (1 when there are none). */
export function overallConfidence(categories: CategoryMap): number {
  const items = Object.values(categories).flatMap((c) => c.items);
  if (!items.length) return 1;
  return items.reduce((a, i) => a + effectiveConfidence(i), 0) / items.length;
}

export interface PublishCheck {
  id: 'scores' | 'evidence' | 'copy' | 'public_text' | 'second_review';
  ok: boolean;
  /** 'warn' = blocks publish but is expected mid-review; 'todo' = pending step. */
  level: 'ok' | 'warn' | 'todo';
  count?: number;
}

export function publishChecklist(categories: CategoryMap, approvals: number): PublishCheck[] {
  const values = CLEARVIEW_CATEGORIES.map((c) => categories[analysisKey(c)]).filter(Boolean) as CategoryReview[];
  const unscored = CLEARVIEW_CATEGORIES.length - values.filter((c) => c.score != null).length;
  const missing = values.reduce((a, c) => a + c.items.filter((i) => i.evidence === 'missing').length + c.evidence_gaps.length, 0);
  const copyIssues = values.reduce((a, c) => a + checkCopy(c.public_finding).length, 0);
  const noPublic = values.filter((c) => !c.public_finding.trim()).length + unscored;
  const lvl = (ok: boolean, todo = false): PublishCheck['level'] => (ok ? 'ok' : todo ? 'todo' : 'warn');
  return [
    { id: 'scores', ok: unscored === 0, level: lvl(unscored === 0), count: unscored },
    { id: 'evidence', ok: missing === 0, level: lvl(missing === 0), count: missing },
    { id: 'copy', ok: copyIssues === 0, level: lvl(copyIssues === 0), count: copyIssues },
    { id: 'public_text', ok: noPublic === 0, level: lvl(noPublic === 0), count: noPublic },
    { id: 'second_review', ok: approvals >= 2, level: lvl(approvals >= 2, true), count: approvals },
  ];
}

export type ReportPatch = {
  analysis: Record<string, unknown>;
  modifiers: ReviewModifier[];
  total_score: number;
  grade: ClearViewGrade | null;
} & Partial<Record<ClearViewCategory['scoreField'], number | null>>;

/** Serialise categories back into the analysis jsonb + score_* columns. */
export function toReportPatch(categories: CategoryMap, modifiers: readonly ReviewModifier[], prevAnalysis: Record<string, unknown>): ReportPatch {
  const live = liveScore(categories, modifiers);
  const analysis: Record<string, unknown> = { ...prevAnalysis };
  const scores: Partial<Record<ClearViewCategory['scoreField'], number | null>> = {};
  for (const cat of CLEARVIEW_CATEGORIES) {
    const key = analysisKey(cat);
    const c = categories[key];
    if (!c) continue;
    const prev = prevAnalysis[key] && typeof prevAnalysis[key] === 'object' ? (prevAnalysis[key] as Record<string, unknown>) : {};
    analysis[key] = { ...prev, ...c };
    scores[cat.scoreField] = c.score;
  }
  return { analysis, modifiers: [...modifiers], total_score: live.score, grade: live.grade, ...scores };
}
