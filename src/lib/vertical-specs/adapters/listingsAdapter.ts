/**
 * Generic adapter for verticals stored in public.listings (vertical=<id>).
 * Maps between flat DB shape and spec-driven form shape with attributes JSONB.
 *
 * Convention:
 *  - form.name (string) ↔ db.name_en + db.name_ru (we store the same value in both
 *    columns; full bilingual editing happens via attributes.title i18n_text).
 *  - form.attributes.title { en, ru } ↔ db.name_en / db.name_ru when present (overrides).
 *  - form.attributes.description { en, ru } ↔ db.description_en / db.description_ru.
 *  - form.attributes.address { line, lat, lng, district } ↔ db.address / lat / lng.
 *  - form.cover_image ↔ db.cover_image.
 *  - form.gallery ↔ db.images.
 *  - form.attributes.phone ↔ db.phone.
 *  - Everything else stays in db.attributes JSONB.
 */

type DbRow = Record<string, unknown>;
type FormRow = Record<string, unknown>;
type Localized = { en?: string; ru?: string };

export function listingsDbToForm(db: DbRow): FormRow {
  const attrs = { ...(db.attributes as Record<string, unknown> ?? {}) };

  // Synthesize i18n title/description from columns if not already in attributes.
  if (!attrs.title) {
    attrs.title = { en: (db.name_en as string) ?? '', ru: (db.name_ru as string) ?? '' };
  }
  if (!attrs.description) {
    attrs.description = { en: (db.description_en as string) ?? '', ru: (db.description_ru as string) ?? '' };
  }
  if (!attrs.address) {
    attrs.address = {
      line: (db.address as string) ?? '',
      lat: typeof db.lat === 'number' ? (db.lat as number) : undefined,
      lng: typeof db.lng === 'number' ? (db.lng as number) : undefined,
    };
  }
  if (!attrs.phone && db.phone) attrs.phone = db.phone;

  return {
    name: (db.name_en as string) ?? (attrs.title as Localized)?.en ?? '',
    cover_image: db.cover_image ?? null,
    gallery: (db.images as string[]) ?? [],
    attributes: attrs,
  };
}

export function listingsFormToDb(form: FormRow, vertical: string): DbRow {
  const attrs = { ...(form.attributes as Record<string, unknown> ?? {}) };
  const title = (attrs.title as Localized) ?? {};
  const description = (attrs.description as Localized) ?? {};
  const address = (attrs.address as { line?: string; lat?: number; lng?: number }) ?? {};

  const nameEn = title.en?.trim() || (form.name as string) || '';
  const nameRu = title.ru?.trim() || (form.name as string) || nameEn;

  return {
    vertical,
    name_en: nameEn,
    name_ru: nameRu,
    description_en: description.en ?? '',
    description_ru: description.ru ?? '',
    cover_image: (form.cover_image as string) ?? null,
    images: (form.gallery as string[]) ?? [],
    address: address.line ?? null,
    lat: typeof address.lat === 'number' ? address.lat : null,
    lng: typeof address.lng === 'number' ? address.lng : null,
    phone: (attrs.phone as string) ?? null,
    attributes: attrs,
    approval_status: 'pending',
    is_active: false,
  };
}
