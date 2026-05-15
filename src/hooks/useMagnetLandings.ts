/**
 * useMagnetLandings — admin CRUD + public fetch for visual-builder landings.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LandingBlockType =
  | 'hero'
  | 'benefits'
  | 'checklist'
  | 'pdf_preview'
  | 'testimonial'
  | 'faq'
  | 'rich_text'
  | 'cta';

export interface LandingBlock {
  id: string;
  type: LandingBlockType;
  /** Free-form per-block props. Bilingual fields use `_ru` / `_en` suffix. */
  props: Record<string, unknown>;
}

export interface MagnetLanding {
  id: string;
  slug: string;
  magnet_slug: string | null;
  status: 'draft' | 'published' | 'archived';
  title_ru: string;
  title_en: string;
  subtitle_ru: string | null;
  subtitle_en: string | null;
  seo_title_ru: string | null;
  seo_title_en: string | null;
  seo_description_ru: string | null;
  seo_description_en: string | null;
  hero_image_url: string | null;
  pdf_url: string | null;
  blocks: LandingBlock[];
  theme: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export type MagnetLandingUpsert = Partial<Omit<MagnetLanding, 'created_at' | 'updated_at' | 'published_at'>> & {
  slug: string;
};

export function useMagnetLandings() {
  return useQuery({
    queryKey: ['magnet-landings', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('magnet_landings')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MagnetLanding[];
    },
  });
}

export function useMagnetLandingBySlug(slug: string | undefined, opts: { publishedOnly?: boolean } = {}) {
  return useQuery({
    queryKey: ['magnet-landing', slug, opts.publishedOnly ?? true],
    enabled: !!slug,
    queryFn: async () => {
      let q = supabase.from('magnet_landings').select('*').eq('slug', slug!);
      if (opts.publishedOnly !== false) q = q.eq('status', 'published');
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data as unknown as MagnetLanding | null;
    },
  });
}

export function useUpsertMagnetLanding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MagnetLandingUpsert) => {
      const patch: Record<string, unknown> = { ...payload };
      if (payload.status === 'published') patch.published_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('magnet_landings')
        .upsert(patch as never, { onConflict: 'slug' })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as MagnetLanding;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['magnet-landings'] });
      qc.invalidateQueries({ queryKey: ['magnet-landing'] });
    },
  });
}

export function useDeleteMagnetLanding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('magnet_landings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['magnet-landings'] }),
  });
}

/** Upload a file (pdf or image) to the magnet-landings bucket. Returns public URL. */
export async function uploadMagnetLandingAsset(file: File, slug: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('magnet-landings')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('magnet-landings').getPublicUrl(path);
  return data.publicUrl;
}

export function emptyBlock(type: LandingBlockType): LandingBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case 'hero':
      return { id, type, props: { eyebrow_ru: '', eyebrow_en: '', heading_ru: '', heading_en: '', cta_label_ru: 'Получить', cta_label_en: 'Get it' } };
    case 'benefits':
      return { id, type, props: { items: [{ title_ru: '', title_en: '', desc_ru: '', desc_en: '' }] } };
    case 'checklist':
      return { id, type, props: { items: [{ ru: '', en: '' }] } };
    case 'pdf_preview':
      return { id, type, props: { caption_ru: 'Превью документа', caption_en: 'Document preview' } };
    case 'testimonial':
      return { id, type, props: { quote_ru: '', quote_en: '', author: '', role_ru: '', role_en: '' } };
    case 'faq':
      return { id, type, props: { items: [{ q_ru: '', q_en: '', a_ru: '', a_en: '' }] } };
    case 'rich_text':
      return { id, type, props: { body_ru: '', body_en: '' } };
    case 'cta':
      return { id, type, props: { heading_ru: '', heading_en: '', label_ru: 'Получить', label_en: 'Get it' } };
  }
}
