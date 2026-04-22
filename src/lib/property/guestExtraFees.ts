/**
 * Guest Extra Fees — host-configurable list of charges that the guest pays
 * separately from the nightly rate (electricity, water, internet, cleaning,
 * gas, etc).
 *
 * Stored as a JSONB array on `properties.guest_extra_fees`. Each item is a
 * fully self-contained record so the host can mix-and-match metered utilities
 * with fixed add-ons without a rigid schema.
 *
 * Public surface (what the guest sees) is intentionally *informational*:
 * we never auto-add metered utilities to the booking total. Instead we show
 * the rate, an optional estimate range, and the moment of payment — same
 * pattern Airbnb uses for "Additional fees may apply at the property".
 */
export type GuestFeeKind =
  | 'electricity'
  | 'water'
  | 'internet'
  | 'cleaning'
  | 'gas'
  | 'linen'
  | 'other';

export type GuestFeePaymentMoment = 'at_booking' | 'at_check_in' | 'at_check_out';

export interface GuestExtraFee {
  /** Stable id (uuid v4 or short nanoid). Generated client-side. */
  id: string;
  kind: GuestFeeKind;
  /** Optional override label. If empty, the UI falls back to the kind preset. */
  label_en?: string;
  label_ru?: string;
  /** Unit shown next to the rate, e.g. "kWh", "m³", "night", "stay". */
  unit?: string;
  /** Numeric rate per unit (or fixed amount when unit = "stay"). */
  rate?: number | null;
  currency?: string;
  /** Optional ballpark range shown to the guest (per typical booking). */
  estimate_min?: number | null;
  estimate_max?: number | null;
  when_paid: GuestFeePaymentMoment;
  /** Optional bilingual notes. */
  notes_en?: string;
  notes_ru?: string;
}

export const GUEST_FEE_KIND_PRESETS: Record<
  GuestFeeKind,
  { labelEn: string; labelRu: string; defaultUnit: string; icon: string }
> = {
  electricity: { labelEn: 'Electricity', labelRu: 'Электричество', defaultUnit: 'kWh', icon: '⚡' },
  water: { labelEn: 'Water', labelRu: 'Вода', defaultUnit: 'm³', icon: '💧' },
  internet: { labelEn: 'Internet', labelRu: 'Интернет', defaultUnit: 'stay', icon: '🌐' },
  cleaning: { labelEn: 'Cleaning', labelRu: 'Уборка', defaultUnit: 'service', icon: '🧹' },
  gas: { labelEn: 'Gas', labelRu: 'Газ', defaultUnit: 'm³', icon: '🔥' },
  linen: { labelEn: 'Linen change', labelRu: 'Смена белья', defaultUnit: 'change', icon: '🛏️' },
  other: { labelEn: 'Other', labelRu: 'Прочее', defaultUnit: 'item', icon: '➕' },
};

export const PAYMENT_MOMENT_LABELS: Record<
  GuestFeePaymentMoment,
  { labelEn: string; labelRu: string }
> = {
  at_booking: { labelEn: 'At booking', labelRu: 'При бронировании' },
  at_check_in: { labelEn: 'At check-in', labelRu: 'При заселении' },
  at_check_out: { labelEn: 'At check-out', labelRu: 'При выезде' },
};

export function getFeeLabel(fee: GuestExtraFee, isRu: boolean): string {
  const override = isRu ? fee.label_ru : fee.label_en;
  if (override?.trim()) return override.trim();
  const preset = GUEST_FEE_KIND_PRESETS[fee.kind];
  return isRu ? preset.labelRu : preset.labelEn;
}

/**
 * Type-narrow a raw JSONB value coming from Supabase into a clean array of
 * GuestExtraFee. Bad/missing entries are silently skipped — the host edits
 * an array, never a partial blob.
 */
export function parseGuestExtraFees(raw: unknown): GuestExtraFee[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const kind = (item.kind as GuestFeeKind) ?? 'other';
      if (!GUEST_FEE_KIND_PRESETS[kind]) return null;
      return {
        id: String(item.id ?? cryptoRandomId()),
        kind,
        label_en: typeof item.label_en === 'string' ? item.label_en : undefined,
        label_ru: typeof item.label_ru === 'string' ? item.label_ru : undefined,
        unit: typeof item.unit === 'string' ? item.unit : undefined,
        rate: typeof item.rate === 'number' ? item.rate : null,
        currency: typeof item.currency === 'string' ? item.currency : undefined,
        estimate_min: typeof item.estimate_min === 'number' ? item.estimate_min : null,
        estimate_max: typeof item.estimate_max === 'number' ? item.estimate_max : null,
        when_paid:
          (item.when_paid as GuestFeePaymentMoment) ?? 'at_check_out',
        notes_en: typeof item.notes_en === 'string' ? item.notes_en : undefined,
        notes_ru: typeof item.notes_ru === 'string' ? item.notes_ru : undefined,
      } satisfies GuestExtraFee;
    })
    .filter((x): x is GuestExtraFee => x !== null);
}

function cryptoRandomId(): string {
  // Browser-safe id — works in Node/test envs too.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `fee_${Math.random().toString(36).slice(2, 10)}`;
}

export function newEmptyFee(kind: GuestFeeKind = 'electricity'): GuestExtraFee {
  const preset = GUEST_FEE_KIND_PRESETS[kind];
  return {
    id: cryptoRandomId(),
    kind,
    unit: preset.defaultUnit,
    rate: null,
    currency: 'THB',
    estimate_min: null,
    estimate_max: null,
    when_paid: 'at_check_out',
  };
}
