import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  Wand2, 
  Copy, 
  Check,
  FileText,
  Mail,
  MessageSquare,
  Image,
  Globe
} from 'lucide-react';

export function MCCContentLabTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [contentType, setContentType] = useState('ad');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const contentTypes = [
    { id: 'ad', label: isRu ? 'Рекламный текст' : 'Ad Copy', icon: FileText },
    { id: 'email', label: isRu ? 'Email шаблон' : 'Email Template', icon: Mail },
    { id: 'social', label: isRu ? 'Соц. сети' : 'Social Post', icon: MessageSquare },
    { id: 'landing', label: isRu ? 'Лендинг' : 'Landing Page', icon: Globe },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Mock generation - in production would call AI agent
    setTimeout(() => {
      setGeneratedContent([
        "🌴 Discover Phuket's Hidden Gems with myUNO! Book verified tours, villas & experiences. Your trusted travel companion abroad. Download now!",
        "Tired of tourist traps? myUNO connects you with verified local services in Phuket. From beach villas to Thai cooking classes – all in one app!",
        "✨ New to Phuket? Make it easy with myUNO. 500+ verified providers • Instant booking • 24/7 support. Join 10,000+ happy travelers!",
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  const handleCopy = (index: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Mock templates
  const templates = [
    { name: 'Summer Campaign 2026', type: 'ad', variants: 5, language: 'en' },
    { name: 'Welcome Email Series', type: 'email', variants: 3, language: 'en' },
    { name: 'Русская кампания', type: 'ad', variants: 4, language: 'ru' },
    { name: 'Instagram Stories', type: 'social', variants: 8, language: 'en' },
  ];

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
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
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

            {/* Generate Button */}
            <Button 
              className="w-full" 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
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
            {generatedContent.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium">{isRu ? 'Сгенерированные варианты:' : 'Generated Variants:'}</p>
                {generatedContent.map((content, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/50 relative group">
                    <p className="text-sm pr-8">{content}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(idx, content)}
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates Library */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isRu ? 'Библиотека шаблонов' : 'Templates Library'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.map((template, idx) => (
              <div 
                key={idx} 
                className="p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{template.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.variants} {isRu ? 'вариантов' : 'variants'}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary">{template.language.toUpperCase()}</Badge>
              </div>
            ))}

            <Button variant="outline" className="w-full mt-4">
              {isRu ? 'Все шаблоны' : 'View All Templates'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 flex-col">
          <FileText className="h-6 w-6 mb-2" />
          <span>{isRu ? 'Google Ads тексты' : 'Google Ads Copy'}</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col">
          <Image className="h-6 w-6 mb-2" />
          <span>{isRu ? 'Meta Ads креативы' : 'Meta Ads Creatives'}</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col">
          <Mail className="h-6 w-6 mb-2" />
          <span>{isRu ? 'Email последовательность' : 'Email Sequence'}</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col">
          <MessageSquare className="h-6 w-6 mb-2" />
          <span>{isRu ? 'WhatsApp шаблоны' : 'WhatsApp Templates'}</span>
        </Button>
      </div>
    </div>
  );
}
