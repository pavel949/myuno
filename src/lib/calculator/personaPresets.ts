/**
 * Persona-specific ROI calculator presets — M10c (IPP §17.3).
 *
 * Maps persona slug (used in /property/for/:persona CTAs) and CanonicalProfile
 * P-codes (P5..P11, P22) to default calculator inputs that match each
 * persona's typical investment shape:
 *
 *  - snowbird (P5)     — winter home, low occupancy, mid price
 *  - resident (P6)     — rent-to-own, smaller unit, long horizon
 *  - investor (P8)     — passive income, full occupancy, max yield
 *  - operator (P10)    — multi-unit operator, scale economics
 *  - hnw (P9)          — premium villa, low occupancy, capital preservation
 *  - mn (P11)          — Mongolian capital flight, mid premium
 *  - developer (P22)   — partner-side, no preset (returns null)
 *
 * Used by /newbuilds/calculator?preset=<slug> and PersonaWidgets dashboard.
 */

export type PresetSlug =
  | 'snowbird'
  | 'resident'
  | 'investor'
  | 'operator'
  | 'hnw'
  | 'mn';

export interface CalculatorPreset {
  slug: PresetSlug;
  /** Display label RU. */
  labelRu: string;
  /** Display label EN. */
  labelEn: string;
  /** Default purchase price (THB). */
  purchasePrice: number;
  /** Default nightly rate for STR-style operators (THB). */
  rentalPerNight: number;
  /** Default monthly long-term rent (THB) — used by ProjectROICalculator. */
  monthlyRent: number;
  /** Default occupancy %. */
  occupancyRate: number;
  /** Default annual appreciation %. */
  annualAppreciation: number;
  /** Default CAM fee per month (THB). */
  camFeeMonthly: number;
  /** Default mgmt fee %. */
  managementFee: number;
  /** Default hold horizon in years. */
  holdYears: number;
  /** Default unit area m². */
  area: number;
}

export const CALCULATOR_PRESETS: Record<PresetSlug, CalculatorPreset> = {
  snowbird: {
    slug: 'snowbird',
    labelRu: 'Снежная птица (зимний дом)',
    labelEn: 'Snowbird (winter home)',
    purchasePrice: 9_500_000,
    rentalPerNight: 4_500,
    monthlyRent: 55_000,
    occupancyRate: 50, // ~6 months self-use, 6 months rented
    annualAppreciation: 4,
    camFeeMonthly: 4_800,
    managementFee: 25,
    holdYears: 10,
    area: 60,
  },
  resident: {
    slug: 'resident',
    labelRu: 'Резидент (аренда-в-собственность)',
    labelEn: 'Resident (rent-to-own)',
    purchasePrice: 6_500_000,
    rentalPerNight: 2_800,
    monthlyRent: 38_000,
    occupancyRate: 35, // mostly self-use
    annualAppreciation: 5,
    camFeeMonthly: 3_600,
    managementFee: 15,
    holdYears: 7,
    area: 45,
  },
  investor: {
    slug: 'investor',
    labelRu: 'Пассивный инвестор',
    labelEn: 'Passive investor',
    purchasePrice: 8_000_000,
    rentalPerNight: 3_500,
    monthlyRent: 48_000,
    occupancyRate: 75,
    annualAppreciation: 6,
    camFeeMonthly: 4_200,
    managementFee: 25,
    holdYears: 5,
    area: 50,
  },
  operator: {
    slug: 'operator',
    labelRu: 'Оператор (портфель)',
    labelEn: 'Operator (portfolio)',
    purchasePrice: 7_500_000,
    rentalPerNight: 3_800,
    monthlyRent: 50_000,
    occupancyRate: 82,
    annualAppreciation: 5,
    camFeeMonthly: 4_000,
    managementFee: 12, // own ops
    holdYears: 5,
    area: 50,
  },
  hnw: {
    slug: 'hnw',
    labelRu: 'HNW (премиум-вилла)',
    labelEn: 'HNW (premium villa)',
    purchasePrice: 35_000_000,
    rentalPerNight: 18_000,
    monthlyRent: 220_000,
    occupancyRate: 45,
    annualAppreciation: 7,
    camFeeMonthly: 18_000,
    managementFee: 28,
    holdYears: 10,
    area: 220,
  },
  mn: {
    slug: 'mn',
    labelRu: 'Монгольский инвестор',
    labelEn: 'Mongolian investor',
    purchasePrice: 12_000_000,
    rentalPerNight: 5_000,
    monthlyRent: 65_000,
    occupancyRate: 70,
    annualAppreciation: 6,
    camFeeMonthly: 5_500,
    managementFee: 25,
    holdYears: 7,
    area: 65,
  },
};

export const PRESET_SLUGS = Object.keys(CALCULATOR_PRESETS) as PresetSlug[];

export function isPresetSlug(value: string | null | undefined): value is PresetSlug {
  if (!value) return false;
  return (PRESET_SLUGS as string[]).includes(value);
}

export function getPreset(slug: string | null | undefined): CalculatorPreset | null {
  if (!isPresetSlug(slug)) return null;
  return CALCULATOR_PRESETS[slug];
}

/**
 * Map canonical persona P-code → preset slug.
 * Returns null for personas without an investment shape (e.g. P1 tourists).
 */
export function presetForPersona(personaCode: string | null | undefined): PresetSlug | null {
  switch (personaCode) {
    case 'P5':  return 'snowbird';
    case 'P6':  return 'resident';
    case 'P8':  return 'investor';
    case 'P9':  return 'hnw';
    case 'P10': return 'operator';
    case 'P11': return 'mn';
    default:    return null;
  }
}
