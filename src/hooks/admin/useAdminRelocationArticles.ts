import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// TODO: drop `as never` / `(supabase as any)` casts once Supabase types
// are regenerated to include `relocation_articles`.

export interface AdminRelocationArticleRow {
  id: string;
  slug: string;
  category: string;
  title_en: string;
  title_ru: string;
  summary_en: string | null;
  summary_ru: string | null;
  content_en: string | null;
  content_ru: string | null;
  related_route: string | null;
  sort_order: number | null;
  is_published: boolean;
  updated_at: string | null;
  created_at: string | null;
}

export type RelocationArticleInput = Omit<
  AdminRelocationArticleRow,
  'id' | 'updated_at' | 'created_at'
> & { id?: string };

const LIST_KEY = ['admin_relocation_articles'] as const;

export function useAdminRelocationArticlesList() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: async (): Promise<AdminRelocationArticleRow[]> => {
      const { data, error } = await supabase
        .from('relocation_articles' as never)
        .select(
          'id, slug, category, title_en, title_ru, summary_en, summary_ru, content_en, content_ru, related_route, sort_order, is_published, updated_at, created_at'
        )
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as AdminRelocationArticleRow[];
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: LIST_KEY });
  qc.invalidateQueries({ queryKey: ['relocation_articles'] });
}

export function useUpsertRelocationArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RelocationArticleInput) => {
      const payload = {
        ...input,
        slug: input.slug.trim().toLowerCase(),
        category: input.category.trim().toLowerCase(),
      };
      const { error } = await (supabase as unknown as {
        from: (t: string) => {
          upsert: (v: unknown, opts?: { onConflict?: string }) => Promise<{ error: unknown }>;
        };
      })
        .from('relocation_articles')
        .upsert(payload, { onConflict: 'slug' });
      if (error) throw error as Error;
    },
    onSuccess: () => {
      toast.success('Статья сохранена');
      invalidate(qc);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить';
      toast.error('Ошибка сохранения', { description: msg });
    },
  });
}

export function useTogglePublishRelocationArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await (supabase as unknown as {
        from: (t: string) => {
          update: (v: unknown) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
        };
      })
        .from('relocation_articles')
        .update({ is_published })
        .eq('id', id);
      if (error) throw error as Error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.is_published ? 'Опубликовано' : 'Снято с публикации');
      invalidate(qc);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Ошибка';
      toast.error('Не удалось изменить статус', { description: msg });
    },
  });
}

export function useDeleteRelocationArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as unknown as {
        from: (t: string) => {
          delete: () => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
        };
      })
        .from('relocation_articles')
        .delete()
        .eq('id', id);
      if (error) throw error as Error;
    },
    onSuccess: () => {
      toast.success('Статья удалена');
      invalidate(qc);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Ошибка';
      toast.error('Не удалось удалить', { description: msg });
    },
  });
}

export function useRenameRelocationCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const target = to.trim().toLowerCase();
      if (!target) throw new Error('Новое имя категории пустое');
      const { error } = await (supabase as unknown as {
        from: (t: string) => {
          update: (v: unknown) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
        };
      })
        .from('relocation_articles')
        .update({ category: target })
        .eq('category', from);
      if (error) throw error as Error;
    },
    onSuccess: () => {
      toast.success('Категория переименована');
      invalidate(qc);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Ошибка';
      toast.error('Не удалось переименовать', { description: msg });
    },
  });
}
