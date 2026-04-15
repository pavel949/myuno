/** Shared CRM contact form presets — language, interests */

export const CRM_COMMUNICATION_LANG_PRESETS = [
  { code: 'en', labelEn: 'English', labelRu: 'Английский' },
  { code: 'ru', labelEn: 'Russian', labelRu: 'Русский' },
  { code: 'th', labelEn: 'Thai', labelRu: 'Тайский' },
  { code: 'zh', labelEn: 'Chinese', labelRu: 'Китайский' },
  { code: 'fr', labelEn: 'French', labelRu: 'Французский' },
  { code: 'de', labelEn: 'German', labelRu: 'Немецкий' },
] as const;

export const CRM_LANG_CUSTOM_VALUE = '__custom__';

const PRESET_CODES = new Set(CRM_COMMUNICATION_LANG_PRESETS.map((p) => p.code));

export function languageForDb(preset: string, custom: string): string | null {
  if (preset === CRM_LANG_CUSTOM_VALUE) {
    const t = custom.trim();
    return t.length > 0 ? t : null;
  }
  return preset.length > 0 ? preset : null;
}

export function parseLanguageFields(stored: string | null | undefined): { preset: string; custom: string } {
  if (!stored || !stored.trim()) return { preset: 'en', custom: '' };
  const s = stored.trim();
  if (PRESET_CODES.has(s)) return { preset: s, custom: '' };
  return { preset: CRM_LANG_CUSTOM_VALUE, custom: s };
}

export const COMMON_CONTACT_INTERESTS = [
  'golf', 'diving', 'yoga', 'fitness', 'sailing', 'travel', 'wine', 'cooking',
  'art', 'photography', 'crypto', 'business', 'kids activities', 'spa',
] as const;

/** Marital status — DB CHECK must match */
export const MARITAL_STATUS_VALUES = [
  'single',
  'married',
  'partner',
  'divorced',
  'widowed',
  'prefer_not_say',
] as const;
export type MaritalStatus = (typeof MARITAL_STATUS_VALUES)[number];

export function isMaritalStatus(value: string | null | undefined): value is MaritalStatus {
  return !!value && (MARITAL_STATUS_VALUES as readonly string[]).includes(value);
}

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, { en: string; ru: string }> = {
  single: { en: 'Single', ru: 'Холост / не замужем' },
  married: { en: 'Married', ru: 'В браке' },
  partner: { en: 'Partner', ru: 'Партнёр' },
  divorced: { en: 'Divorced', ru: 'В разводе' },
  widowed: { en: 'Widowed', ru: 'Вдовец / вдова' },
  prefer_not_say: { en: 'Prefer not to say', ru: 'Не указывать' },
};
