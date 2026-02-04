/**
 * useAITranslate - Hook for AI-powered translation
 * 
 * Supports:
 * - Single text translation
 * - Batch field translation
 * - Auto language detection
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SupportedLang = 'ru' | 'en' | 'th';

interface TranslateOptions {
  /** Target language */
  targetLang: SupportedLang;
  /** Show success toast */
  showToast?: boolean;
}

interface BatchTranslateOptions extends TranslateOptions {
  /** Fields to translate: { fieldName: sourceText } */
  fields: Record<string, string>;
}

interface UseAITranslateReturn {
  /** Translate single text */
  translate: (text: string, options: TranslateOptions) => Promise<string | null>;
  /** Translate multiple fields at once */
  translateBatch: (options: BatchTranslateOptions) => Promise<Record<string, string> | null>;
  /** Auto-translate all _ru fields to _en or vice versa */
  autoTranslateForm: <T extends Record<string, any>>(
    formData: T,
    direction: 'ru_to_en' | 'en_to_ru'
  ) => Promise<Partial<T> | null>;
  /** Loading state */
  isTranslating: boolean;
  /** Last error */
  error: string | null;
}

const LANG_NAMES: Record<SupportedLang, string> = {
  ru: 'Русский',
  en: 'English',
  th: 'ไทย',
};

export function useAITranslate(): UseAITranslateReturn {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Translate single text
   */
  const translate = useCallback(async (
    text: string,
    options: TranslateOptions
  ): Promise<string | null> => {
    if (!text?.trim()) return null;
    
    setIsTranslating(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-translate', {
        body: { text, targetLang: options.targetLang },
      });

      if (fnError) throw fnError;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      if (options.showToast !== false) {
        toast.success(`Переведено на ${LANG_NAMES[options.targetLang]}`);
      }
      
      return data?.translated || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка перевода';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  /**
   * Translate multiple fields at once
   */
  const translateBatch = useCallback(async (
    options: BatchTranslateOptions
  ): Promise<Record<string, string> | null> => {
    const nonEmptyFields = Object.entries(options.fields)
      .filter(([_, v]) => v?.trim())
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    
    if (Object.keys(nonEmptyFields).length === 0) return null;
    
    setIsTranslating(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-translate', {
        body: { fields: nonEmptyFields, targetLang: options.targetLang },
      });

      if (fnError) throw fnError;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      if (options.showToast !== false) {
        toast.success(`Переведено ${Object.keys(nonEmptyFields).length} полей`);
      }
      
      return data?.translations || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка перевода';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  /**
   * Auto-translate form fields with _ru/_en suffixes
   */
  const autoTranslateForm = useCallback(async <T extends Record<string, any>>(
    formData: T,
    direction: 'ru_to_en' | 'en_to_ru'
  ): Promise<Partial<T> | null> => {
    const sourceSuffix = direction === 'ru_to_en' ? '_ru' : '_en';
    const targetSuffix = direction === 'ru_to_en' ? '_en' : '_ru';
    const targetLang: SupportedLang = direction === 'ru_to_en' ? 'en' : 'ru';
    
    // Find fields to translate
    const fieldsToTranslate: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(formData)) {
      if (key.endsWith(sourceSuffix) && typeof value === 'string' && value.trim()) {
        const baseKey = key.slice(0, -3); // Remove suffix
        const targetKey = baseKey + targetSuffix;
        
        // Only translate if target is empty or user wants to override
        if (!formData[targetKey] || !String(formData[targetKey]).trim()) {
          fieldsToTranslate[targetKey] = value;
        }
      }
    }
    
    if (Object.keys(fieldsToTranslate).length === 0) {
      toast.info('Нет полей для перевода');
      return null;
    }
    
    // Translate all fields
    const translations = await translateBatch({
      fields: fieldsToTranslate,
      targetLang,
      showToast: true,
    });
    
    return translations as Partial<T> | null;
  }, [translateBatch]);

  return {
    translate,
    translateBatch,
    autoTranslateForm,
    isTranslating,
    error,
  };
}

export default useAITranslate;
