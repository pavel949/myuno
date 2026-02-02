import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type ContentType = 'ad' | 'email' | 'social' | 'landing';
export type TargetLanguage = 'en' | 'ru' | 'th';

interface GenerateContentParams {
  prompt: string;
  contentType: ContentType;
  targetLanguage: TargetLanguage;
  campaignId?: string;
}

interface GeneratedVariant {
  content: string;
  index: number;
}

interface SaveCreativeParams {
  campaignId?: string;
  contentType: ContentType;
  name: string;
  content: string;
  language: TargetLanguage;
  variantName?: string;
}

interface Creative {
  id: string;
  campaign_id: string | null;
  creative_type: string;
  name: string;
  content: Record<string, unknown>;
  language: string | null;
  variant_name: string | null;
  is_control: boolean | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  spend: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

const CONTENT_TYPE_LABELS: Record<ContentType, { en: string; ru: string }> = {
  ad: { en: 'Ad Copy', ru: 'Рекламный текст' },
  email: { en: 'Email Template', ru: 'Email шаблон' },
  social: { en: 'Social Post', ru: 'Соц. сети' },
  landing: { en: 'Landing Page', ru: 'Лендинг' },
};

/**
 * Hook for AI-powered content generation in MCC
 */
export function useMCCContent() {
  const queryClient = useQueryClient();
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Fetch saved creatives
  const { data: creatives, isLoading: isLoadingCreatives } = useQuery({
    queryKey: ['mcc-creatives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_creatives')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Creative[];
    },
  });

  // Generate content using AI agent
  const generateContent = useCallback(async ({
    prompt,
    contentType,
    targetLanguage,
  }: GenerateContentParams): Promise<GeneratedVariant[]> => {
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedVariants([]);

    try {
      const contentTypeLabel = CONTENT_TYPE_LABELS[contentType]?.en || contentType;
      
      const userMessage = `Generate ${contentTypeLabel} content in ${targetLanguage === 'ru' ? 'Russian' : targetLanguage === 'th' ? 'Thai' : 'English'}.

User request: ${prompt}

Please provide 3 compelling variants.`;

      // Call AI agent edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            agentSlug: 'mcc-content',
            messages: [{ role: 'user', content: userMessage }],
            context: {
              contentType,
              language: targetLanguage,
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted. Please contact support.');
        }
        throw new Error('Failed to generate content');
      }

      // Parse streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullContent = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process SSE events line by line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
            }
          } catch {
            // Incomplete JSON, will be handled in next iteration
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Parse variants from response
      const variants = parseVariants(fullContent);
      setGeneratedVariants(variants);
      
      return variants;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setGenerationError(message);
      toast.error(message);
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Save creative mutation
  const saveCreativeMutation = useMutation({
    mutationFn: async (params: SaveCreativeParams) => {
      const { data, error } = await supabase
        .from('mcc_creatives')
        .insert({
          campaign_id: params.campaignId || null,
          creative_type: params.contentType,
          name: params.name,
          content: { text: params.content, generated_at: new Date().toISOString() },
          language: params.language,
          variant_name: params.variantName || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcc-creatives'] });
      toast.success('Creative saved');
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Delete creative mutation
  const deleteCreativeMutation = useMutation({
    mutationFn: async (creativeId: string) => {
      const { error } = await supabase
        .from('mcc_creatives')
        .delete()
        .eq('id', creativeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcc-creatives'] });
      toast.success('Creative deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  return {
    // Generation
    generateContent,
    generatedVariants,
    isGenerating,
    generationError,
    clearVariants: () => setGeneratedVariants([]),

    // Creatives CRUD
    creatives,
    isLoadingCreatives,
    saveCreative: saveCreativeMutation.mutate,
    isSaving: saveCreativeMutation.isPending,
    deleteCreative: deleteCreativeMutation.mutate,
    isDeleting: deleteCreativeMutation.isPending,
  };
}

/**
 * Parse AI response into separate variants
 */
function parseVariants(content: string): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  
  // Try to split by numbered patterns like "1.", "2.", "3." or "Variant 1:", etc.
  const patterns = [
    /(?:^|\n)\s*(?:Variant\s*)?(\d+)[.:]\s*/gi,
    /(?:^|\n)\s*#(\d+)[.:]\s*/gi,
    /(?:^|\n)\s*\[(\d+)\]\s*/gi,
  ];

  let bestSplit: string[] = [];
  
  for (const pattern of patterns) {
    const parts = content.split(pattern).filter(p => p.trim() && isNaN(Number(p)));
    if (parts.length > bestSplit.length) {
      bestSplit = parts;
    }
  }

  // If no good split found, try splitting by double newlines
  if (bestSplit.length < 2) {
    bestSplit = content.split(/\n\n+/).filter(p => p.trim());
  }

  // Create variants (max 5)
  bestSplit.slice(0, 5).forEach((text, index) => {
    const cleanText = text.trim();
    if (cleanText.length > 10) { // Skip very short fragments
      variants.push({
        content: cleanText,
        index: index + 1,
      });
    }
  });

  // Fallback: if still no variants, return the whole content as one
  if (variants.length === 0 && content.trim()) {
    variants.push({ content: content.trim(), index: 1 });
  }

  return variants;
}
