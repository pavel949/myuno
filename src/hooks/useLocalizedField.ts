// Read a localized field from a record with i18n jsonb column.
// Resolution order: i18n[lang][field] → legacy `{field}_{lang}` → record[field].
import { useLanguage } from "@/contexts/LanguageContext";

type Lang = "ru" | "en" | "th";

export interface I18nMeta {
  _source_lang?: Lang;
  _auto_translated?: Lang[];
  _translated_at?: string;
}

export type I18nMap = Partial<Record<Lang, Record<string, string>>> & I18nMeta;

export function getLocalizedField<T extends Record<string, any>>(
  record: T | null | undefined,
  field: string,
  lang: Lang,
): { value: string; isAutoTranslated: boolean; sourceLang?: Lang } {
  if (!record) return { value: "", isAutoTranslated: false };

  const i18n = (record.i18n ?? {}) as I18nMap;
  const fromI18n = i18n[lang]?.[field];
  if (fromI18n && fromI18n.trim()) {
    return {
      value: fromI18n,
      isAutoTranslated: !!i18n._auto_translated?.includes(lang) && i18n._source_lang !== lang,
      sourceLang: i18n._source_lang,
    };
  }

  const legacyKey = `${field}_${lang}`;
  if (typeof record[legacyKey] === "string" && record[legacyKey].trim()) {
    return { value: record[legacyKey], isAutoTranslated: false };
  }

  return {
    value: typeof record[field] === "string" ? record[field] : "",
    isAutoTranslated: false,
  };
}

export function useLocalizedField<T extends Record<string, any>>(
  record: T | null | undefined,
  field: string,
) {
  const { language } = useLanguage();
  return getLocalizedField(record, field, (language as Lang) ?? "en");
}
