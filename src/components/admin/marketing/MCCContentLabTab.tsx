import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { useMCCContent, ContentType, TargetLanguage } from '@/hooks/useMCCContent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
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
                  <div key={variant.index} className="p-3 rounded-lg bg-muted/50 relative group">
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
                          <Check className="h-4 w-4 text-green-500" />
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
                    className="p-3 rounded-lg border hover:bg-muted/30 transition-colors group"
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
              <div className="p-3 rounded-lg bg-muted/50 text-sm max-h-32 overflow-y-auto">
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
