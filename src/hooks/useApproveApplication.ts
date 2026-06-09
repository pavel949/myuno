import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

type Lang = 'en' | 'ru' | 'th';
const LANGS: Lang[] = ['en', 'ru', 'th'];

interface DraftI18n {
  source_lang?: Lang;
  title_en?: string;
  title_ru?: string;
  title_th?: string;
  description_en?: string;
  description_ru?: string;
  description_th?: string;
  [k: string]: unknown;
}

/**
 * Build listings.i18n payload from listing_applications.draft_data.
 * Shape: { en: { name, description }, ru: {...}, th: {...}, _source_lang, _auto_translated, _translated_at }
 */
export function buildListingI18n(draft: DraftI18n): Record<string, unknown> {
  const source = (draft.source_lang ?? 'en') as Lang;
  const i18n: Record<string, unknown> = {
    _source_lang: source,
    _auto_translated: false,
    _translated_at: new Date().toISOString(),
  };
  for (const lang of LANGS) {
    const name = draft[`title_${lang}` as const] as string | undefined;
    const description = draft[`description_${lang}` as const] as string | undefined;
    if (name || description) {
      i18n[lang] = {
        ...(name ? { name } : {}),
        ...(description ? { description } : {}),
      };
    }
  }
  return i18n;
}

export interface ApproveOptions {
  applicationId: string;
  listingId?: string; // if listing is already created and we just need to merge i18n
}

export function useApproveApplication() {
  const [isApproving, setIsApproving] = useState(false);

  const approve = useCallback(async ({ applicationId, listingId }: ApproveOptions) => {
    setIsApproving(true);
    try {
      // 1. Read application + draft_data
      const { data: app, error: appErr } = await supabase
        .from('listing_applications')
        .select('id, draft_data, listing_type')
        .eq('id', applicationId)
        .single();
      if (appErr) throw appErr;

      const draft = (app?.draft_data ?? {}) as DraftI18n;
      const i18n = buildListingI18n(draft);
      const source = (draft.source_lang ?? 'en') as Lang;
      const primary = draft[`title_${source}` as const] as string | undefined;
      const primaryDesc = draft[`description_${source}` as const] as string | undefined;

      // 2. Patch the listing
      if (listingId) {
        const patch: Record<string, unknown> = {
          i18n: i18n as unknown as Json,
          name_en: draft.title_en ?? primary,
          name_ru: draft.title_ru ?? primary,
          description_en: draft.description_en ?? primaryDesc,
          description_ru: draft.description_ru ?? primaryDesc,
          approval_status: 'approved',
          reviewed_at: new Date().toISOString(),
        };
        const { error: lErr } = await supabase
          .from('listings')
          .update(patch)
          .eq('id', listingId);
        if (lErr) throw lErr;
      }

      // 3. Mark application approved
      const { error: updErr } = await supabase
        .from('listing_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
      if (updErr) throw updErr;

      // 4. If source is th — trigger auto-translation for missing langs
      if (listingId && source === 'th') {
        const missing = LANGS.filter((l) => l !== source && !(i18n as Record<string, unknown>)[l]);
        if (missing.length) {
          await supabase.functions.invoke('auto-translate-record', {
            body: {
              table: 'listings',
              id: listingId,
              source_lang: source,
              fields: ['name', 'description'],
            },
          }).catch(() => undefined);
        }
      }

      toast.success('Заявка одобрена');
      return true;
    } catch (e) {
      console.error('[useApproveApplication]', e);
      toast.error('Не удалось одобрить заявку');
      return false;
    } finally {
      setIsApproving(false);
    }
  }, []);

  return { approve, isApproving };
}
