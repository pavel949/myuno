import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Translation {
  id: string;
  key: string;
  category: string | null;
  value_ru: string;
  value_en: string;
  value_th: string | null;
  is_custom: boolean;
  updated_at: string;
  updated_by: string | null;
}

interface UseTranslationsAdminReturn {
  translations: Translation[];
  isLoading: boolean;
  error: string | null;
  categories: string[];
  refetch: () => Promise<void>;
  updateTranslation: (id: string, updates: Partial<Translation>) => Promise<boolean>;
  createTranslation: (translation: Omit<Translation, 'id' | 'updated_at' | 'updated_by' | 'is_custom'>) => Promise<boolean>;
  deleteTranslation: (id: string) => Promise<boolean>;
  importTranslations: (translations: Omit<Translation, 'id' | 'updated_at' | 'updated_by' | 'is_custom'>[]) => Promise<boolean>;
}

export function useTranslationsAdmin(): UseTranslationsAdminReturn {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchTranslations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('translations')
        .select('*')
        .order('key');

      if (fetchError) throw fetchError;

      setTranslations(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(
        (data || [])
          .map(t => t.category)
          .filter((c): c is string => !!c)
      )].sort();
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Failed to fetch translations:', err);
      setError('Failed to load translations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTranslations();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('translations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'translations' },
        () => {
          fetchTranslations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTranslations]);

  const updateTranslation = useCallback(async (id: string, updates: Partial<Translation>) => {
    try {
      const { error: updateError } = await supabase
        .from('translations')
        .update({
          ...updates,
          is_custom: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      toast.success('Перевод обновлён');
      return true;
    } catch (err) {
      console.error('Failed to update translation:', err);
      toast.error('Ошибка обновления');
      return false;
    }
  }, []);

  const createTranslation = useCallback(async (
    translation: Omit<Translation, 'id' | 'updated_at' | 'updated_by' | 'is_custom'>
  ) => {
    try {
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          ...translation,
          is_custom: true,
        });

      if (insertError) throw insertError;
      
      toast.success('Перевод создан');
      return true;
    } catch (err) {
      console.error('Failed to create translation:', err);
      toast.error('Ошибка создания');
      return false;
    }
  }, []);

  const deleteTranslation = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('translations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      toast.success('Перевод удалён');
      return true;
    } catch (err) {
      console.error('Failed to delete translation:', err);
      toast.error('Ошибка удаления');
      return false;
    }
  }, []);

  const importTranslations = useCallback(async (
    items: Omit<Translation, 'id' | 'updated_at' | 'updated_by' | 'is_custom'>[]
  ) => {
    try {
      const { error: insertError } = await supabase
        .from('translations')
        .upsert(
          items.map(item => ({
            ...item,
            is_custom: false,
          })),
          { onConflict: 'key' }
        );

      if (insertError) throw insertError;
      
      toast.success(`Импортировано ${items.length} переводов`);
      await fetchTranslations();
      return true;
    } catch (err) {
      console.error('Failed to import translations:', err);
      toast.error('Ошибка импорта');
      return false;
    }
  }, [fetchTranslations]);

  return {
    translations,
    isLoading,
    error,
    categories,
    refetch: fetchTranslations,
    updateTranslation,
    createTranslation,
    deleteTranslation,
    importTranslations,
  };
}
