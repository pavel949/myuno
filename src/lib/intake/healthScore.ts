/**
 * Intake item health-score — 0..100% completeness signal for the queue UI.
 * Soft-graded: even invalid items get partial credit so operators can prioritise.
 *
 * Weights:
 *  - required fields:  40%
 *  - images:           20%
 *  - description:      15%
 *  - location:         15%
 *  - price:            10%
 */

import { IntakeItem } from '@/hooks/useIntakeAgent';
import { getVerticalById } from '@/lib/intakeVerticals';

export interface IntakeHealthScore {
  /** 0..100 */
  score: number;
  /** colour bucket for UI ring */
  level: 'critical' | 'low' | 'medium' | 'high';
  /** breakdown for tooltip — each 0..1 */
  breakdown: {
    required: number;
    images: number;
    description: number;
    location: number;
    price: number;
  };
  /** human keys still missing (for tooltip) */
  missing: string[];
}

const WEIGHTS = {
  required: 0.4,
  images: 0.2,
  description: 0.15,
  location: 0.15,
  price: 0.1,
} as const;

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'number') return false;
  return false;
}

export function calculateHealthScore(item: IntakeItem): IntakeHealthScore {
  const vertical = getVerticalById(item.detectedVertical);
  const flat: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(item.extractedFields || {})) {
    flat[k] = f?.value;
  }

  // Inject AI-suggested + uploaded so they count toward the score
  if (isEmpty(flat.name_en) && item.suggestedTitle?.en) flat.name_en = item.suggestedTitle.en;
  if (isEmpty(flat.name_ru) && item.suggestedTitle?.ru) flat.name_ru = item.suggestedTitle.ru;
  if (isEmpty(flat.description_en) && item.suggestedDescription?.en) flat.description_en = item.suggestedDescription.en;
  if (isEmpty(flat.description_ru) && item.suggestedDescription?.ru) flat.description_ru = item.suggestedDescription.ru;
  if (isEmpty(flat.images) && item.sourceImages?.length) flat.images = item.sourceImages;
  if (isEmpty(flat.cover_image) && item.sourceImages?.length) flat.cover_image = item.sourceImages[0];

  const missing: string[] = [];

  // 1) required (vertical config)
  const required = vertical?.requiredFields ?? ['name_en'];
  let reqOk = 0;
  for (const f of required) {
    if (!isEmpty(flat[f])) reqOk++;
    else missing.push(f);
  }
  const required01 = required.length ? reqOk / required.length : 1;

  // 2) images
  const hasImages = !isEmpty(flat.cover_image) || !isEmpty(flat.images) || !isEmpty(flat.photo) || !isEmpty(flat.logo);
  const images01 = hasImages ? 1 : 0;
  if (!hasImages) missing.push('image');

  // 3) description (en OR ru is enough)
  const hasDesc = !isEmpty(flat.description_en) || !isEmpty(flat.description_ru) || !isEmpty(flat.bio_en) || !isEmpty(flat.bio_ru);
  const description01 = hasDesc ? 1 : 0;
  if (!hasDesc) missing.push('description');

  // 4) location (address OR district OR coords)
  const hasLocation = !isEmpty(flat.address) || !isEmpty(flat.district) || !isEmpty(flat.lat) || !isEmpty(flat.location);
  const location01 = hasLocation ? 1 : 0.4; // partial credit — many verticals don't strictly need it
  if (!hasLocation) missing.push('location');

  // 5) price (any of the common variants)
  const hasPrice =
    !isEmpty(flat.price) ||
    !isEmpty(flat.price_per_day) ||
    !isEmpty(flat.price_per_month) ||
    !isEmpty(flat.price_full_day) ||
    !isEmpty(flat.price_half_day) ||
    !isEmpty(flat.price_from) ||
    !isEmpty(flat.consultation_price);
  const price01 = hasPrice ? 1 : 0.5;
  if (!hasPrice) missing.push('price');

  const score = Math.round(
    (required01 * WEIGHTS.required +
      images01 * WEIGHTS.images +
      description01 * WEIGHTS.description +
      location01 * WEIGHTS.location +
      price01 * WEIGHTS.price) *
      100,
  );

  const level: IntakeHealthScore['level'] =
    score >= 85 ? 'high' : score >= 65 ? 'medium' : score >= 40 ? 'low' : 'critical';

  return {
    score,
    level,
    breakdown: {
      required: required01,
      images: images01,
      description: description01,
      location: location01,
      price: price01,
    },
    missing,
  };
}

/** Tailwind colour classes per level for the ring/badge. */
export function healthScoreColor(level: IntakeHealthScore['level']): {
  text: string;
  bg: string;
  ring: string;
} {
  switch (level) {
    case 'high':
      return { text: 'text-success', bg: 'bg-success/10', ring: 'stroke-success' };
    case 'medium':
      return { text: 'text-primary', bg: 'bg-primary/10', ring: 'stroke-primary' };
    case 'low':
      return { text: 'text-warning', bg: 'bg-warning/10', ring: 'stroke-warning' };
    case 'critical':
    default:
      return { text: 'text-destructive', bg: 'bg-destructive/10', ring: 'stroke-destructive' };
  }
}
