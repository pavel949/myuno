import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  FileText,
  Mail,
  MessageSquare,
  Globe,
  Save,
  Trash2,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ContentType = 'ad' | 'email' | 'social' | 'landing';
type TargetLanguage = 'en' | 'ru' | 'th';

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

function useMCCContent() {
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

export function MCCContentLabTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [contentType, setContentType] = useState<ContentType>('ad');
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('en');
  const [prompt, setPrompt] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{ content: string; index: number } | null>(null);
  const [creativeName, setCreativeName] = useState('');

  const {
    generateContent,
    generatedVariants,
    isGenerating,
    generationError,
    creatives,
    isLoadingCreatives,
    saveCreative,
    isSaving,
    deleteCreative,
  } = useMCCContent();

  const contentTypes = [
    { id: 'ad' as ContentType, label: isRu ? 'Рекламный текст' : 'Ad Copy', icon: FileText },
    { id: 'email' as ContentType, label: isRu ? 'Email шаблон' : 'Email Template', icon: Mail },
    { id: 'social' as ContentType, label: isRu ? 'Соц. сети' : 'Social Post', icon: MessageSquare },
    { id: 'landing' as ContentType, label: isRu ? 'Лендинг' : 'Landing Page', icon: Globe },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await generateContent({
      prompt,
      contentType,
      targetLanguage,
    });
  };

  const handleCopy = (index: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveClick = (variant: { content: string; index: number }) => {
    setSelectedVariant(variant);
    setCreativeName(`${contentType.toUpperCase()} - ${new Date().toLocaleDateString()}`);
    setSaveDialogOpen(true);
  };

  const handleSaveConfirm = () => {
    if (!selectedVariant || !creativeName.trim()) return;
    
    saveCreative({
      contentType,
      name: creativeName,
      content: selectedVariant.content,
      language: targetLanguage,
      variantName: `Variant ${selectedVariant.index}`,
    });
    
    setSaveDialogOpen(false);
    setSelectedVariant(null);
    setCreativeName('');
  };

  const getCreativeText = (content: Record<string, unknown>): string => {
    if (typeof content === 'object' && content !== null && 'text' in content) {
      return String(content.text);
    }
    return JSON.stringify(content);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isRu ? 'AI Контент-лаборатория' : 'AI Content Lab'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Генерируйте маркетинговый контент с помощью AI' : 'Generate marketing content with AI'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isRu ? 'Генератор контента' : 'Content Generator'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Content Type */}
            <div className="grid grid-cols-4 gap-2">
              {contentTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={contentType === type.id ? 'default' : 'outline'}
                  className="flex-col h-auto py-3"
                  onClick={() => setContentType(type.id)}
                >
                  <type.icon className="h-5 w-5 mb-1" />
                  <span className="text-xs">{type.label}</span>
                </Button>
              ))}
            </div>

            {/* Language */}
            <Select value={targetLanguage} onValueChange={(v) => setTargetLanguage(v as TargetLanguage)}>
              <SelectTrigger>
                <SelectValue placeholder={isRu ? 'Язык' : 'Language'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="th">ภาษาไทย</SelectItem>
              </SelectContent>
            </Select>

            {/* Prompt */}
            <Textarea
              placeholder={isRu 
                ? 'Опишите что нужно сгенерировать... Например: "Рекламный текст для привлечения туристов на аренду вилл в Пхукете"'
                : 'Describe what to generate... E.g.: "Ad copy to attract tourists for villa rentals in Phuket"'
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />

            {/* Error Message */}
            {generationError && (
              <div className="p-3 rounded-none bg-destructive/10 text-destructive text-sm">
                {generationError}
              </div>
            )}

            {/* Generate Button */}
            <Button 
              className="w-full" 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isRu ? 'Генерация...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  {isRu ? 'Сгенерировать варианты' : 'Generate Variants'}
                </>
              )}
            </Button>

            {/* Generated Content */}
            {generatedVariants.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium">{isRu ? 'Сгенерированные варианты:' : 'Generated Variants:'}</p>
                {generatedVariants.map((variant) => (
                  <div key={variant.index} className="p-3 rounded-none bg-muted/50 relative group">
                    <Badge variant="outline" className="absolute top-2 left-2 text-xs">
                      #{variant.index}
                    </Badge>
                    <p className="text-sm pt-6 pr-16 whitespace-pre-wrap">{variant.content}</p>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopy(variant.index, variant.content)}
                        title={isRu ? 'Копировать' : 'Copy'}
                      >
                        {copiedIndex === variant.index ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleSaveClick(variant)}
                        title={isRu ? 'Сохранить' : 'Save'}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Creatives */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isRu ? 'Сохранённые креативы' : 'Saved Creatives'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingCreatives ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : creatives && creatives.length > 0 ? (
              <>
                {creatives.slice(0, 10).map((creative) => (
                  <div 
                    key={creative.id} 
                    className="p-3 rounded-none border hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{creative.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{creative.creative_type}</Badge>
                          {creative.language && (
                            <Badge variant="secondary" className="text-xs">{creative.language.toUpperCase()}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {getCreativeText(creative.content as Record<string, unknown>)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => deleteCreative(creative.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {creatives.length > 10 && (
                  <Button variant="outline" className="w-full mt-4">
                    {isRu ? `Показать все (${creatives.length})` : `View All (${creatives.length})`}
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {isRu ? 'Нет сохранённых креативов' : 'No saved creatives yet'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col"
          onClick={() => {
            setContentType('ad');
            setPrompt(isRu 
              ? 'Google Ads тексты для привлечения туристов в Пхукет'
              : 'Google Ads copy to attract tourists to Phuket'
            );
          }}
        >
          <FileText className="h-6 w-6 mb-2" />
          <span>{isRu ? 'Google Ads тексты' : 'Google Ads Copy'}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col"
          onClick={() => {
            setContentType('social');
            setPrompt(isRu 
              ? 'Посты для Instagram о виллах и отдыхе на Пхукете'
              : 'Instagram posts about villas and vacation in Phuket'
            );
          }}
        >
          <MessageSquare className="h-6 w-6 mb-2" />
          <span>{isRu ? 'Instagram посты' : 'Instagram Posts'}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col"
          onClick={() => {
            setContentType('email');
            setPrompt(isRu 
              ? 'Welcome email для новых пользователей myUNO'
              : 'Welcome email for new myUNO users'
            );
          }}
        >
          <Mail className="h-6 w-6 mb-2" />
          <span>{isRu ? 'Welcome Email' : 'Welcome Email'}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col"
          onClick={() => {
            setContentType('landing');
            setPrompt(isRu 
              ? 'Заголовки и CTA для лендинга аренды вилл'
              : 'Headlines and CTAs for villa rental landing page'
            );
          }}
        >
          <Globe className="h-6 w-6 mb-2" />
          <span>{isRu ? 'Landing Page' : 'Landing Page'}</span>
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Сохранить креатив' : 'Save Creative'}</DialogTitle>
            <DialogDescription>
              {isRu ? 'Введите название для сохранения' : 'Enter a name to save this creative'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={isRu ? 'Название креатива' : 'Creative name'}
              value={creativeName}
              onChange={(e) => setCreativeName(e.target.value)}
            />
            {selectedVariant && (
              <div className="p-3 rounded-none bg-muted/50 text-sm max-h-32 overflow-y-auto">
                {selectedVariant.content}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveConfirm} disabled={isSaving || !creativeName.trim()}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
