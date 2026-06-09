/**
 * Restaurant ↔ listings table adapter.
 * Maps between flat DB shape (name_en/name_ru/description_en/...) and the
 * spec-driven form shape (i18n objects + JSONB attributes).
 */

type DbRow = Record<string, unknown>;
type FormRow = Record<string, unknown>;

export function dbToForm(db: DbRow): FormRow {
  const attrs = (db.attributes as Record<string, unknown>) ?? {};
  return {
    name: (db.name_en as string) ?? '',
    cover_image: db.cover_image ?? null,
    gallery: (db.images as string[]) ?? [],
    attributes: {
      ...attrs,
      description: {
        en: (db.description_en as string) ?? '',
        ru: (db.description_ru as string) ?? '',
      },
      address: attrs.address ?? {
        line: (db.address as string) ?? '',
        lat: db.lat as number | undefined,
        lng: db.lng as number | undefined,
      },
      hours: attrs.hours ?? (db.working_hours ? JSON.stringify(db.working_hours) : ''),
      phone: attrs.phone ?? (db.phone as string) ?? '',
    },
  };
}

export function formToDb(form: FormRow, vertical: string): DbRow {
  const attrs = { ...((form.attributes as Record<string, unknown>) ?? {}) };
  const description = (attrs.description as { en?: string; ru?: string }) ?? {};
  const pitch = (attrs.short_pitch as { en?: string; ru?: string }) ?? {};
  const address = (attrs.address as { line?: string; lat?: number; lng?: number }) ?? {};

  // Strip transient fields from attributes JSONB (keep only attribute domain data)
  delete (attrs as Record<string, unknown>).description;

  return {
    vertical,
    name_en: (form.name as string) ?? '',
    name_ru: (form.name as string) ?? '',
    description_en: description.en ?? pitch.en ?? '',
    description_ru: description.ru ?? pitch.ru ?? '',
    cover_image: (form.cover_image as string) ?? null,
    images: (form.gallery as string[]) ?? [],
    address: address.line ?? null,
    lat: typeof address.lat === 'number' ? address.lat : null,
    lng: typeof address.lng === 'number' ? address.lng : null,
    phone: (attrs.phone as string) ?? null,
    attributes: attrs,
    approval_status: 'pending',
  };
}
