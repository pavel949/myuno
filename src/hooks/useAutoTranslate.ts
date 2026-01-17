import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranslationResult {
  translated: string;
  success: boolean;
}

export function useAutoTranslate() {
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = useCallback(async (
    text: string,
    targetLang: 'ru' | 'en' = 'ru'
  ): Promise<TranslationResult> => {
    if (!text.trim()) {
      return { translated: '', success: false };
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-translate', {
        body: { text, targetLang }
      });

      if (error) throw error;

      return { 
        translated: data?.translated || '', 
        success: true 
      };
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(targetLang === 'ru' 
        ? 'Ошибка перевода' 
        : 'Translation error'
      );
      return { translated: '', success: false };
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const translateMultiple = useCallback(async (
    fields: Record<string, string>,
    targetLang: 'ru' | 'en' = 'ru'
  ): Promise<Record<string, string>> => {
    const results: Record<string, string> = {};
    
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-translate', {
        body: { fields, targetLang }
      });

      if (error) throw error;

      return data?.translations || {};
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(targetLang === 'ru' 
        ? 'Ошибка перевода' 
        : 'Translation error'
      );
      return results;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return {
    translate,
    translateMultiple,
    isTranslating,
  };
}
