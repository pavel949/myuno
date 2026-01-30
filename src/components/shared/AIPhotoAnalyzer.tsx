import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Camera, Upload, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoAnalysis {
  category: string;
  subcategory?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  features: string[];
  colors: string[];
  estimatedValues?: {
    bedrooms?: number;
    bathrooms?: number;
    areaSqm?: number;
    furnishingLevel?: string;
  };
  issues: string[];
  recommendations: string[];
}

interface AIPhotoAnalyzerProps {
  context: 'property' | 'product' | 'inspection';
  onAnalysisComplete: (analysis: PhotoAnalysis, description: string, confidence: number) => void;
  existingImageUrl?: string;
}

export function AIPhotoAnalyzer({
  context,
  onAnalysisComplete,
  existingImageUrl,
}: AIPhotoAnalyzerProps) {
  const { language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageUrl, setImageUrl] = useState(existingImageUrl || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const [lastAnalysis, setLastAnalysis] = useState<{
    analysis: PhotoAnalysis;
    description: string;
    confidence: number;
  } | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Convert to base64 for AI analysis
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!imageUrl) return;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-smart-data', {
        body: {
          type: 'photo-analysis',
          imageUrl,
          context,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const result = data.result;
      setLastAnalysis(result);
      
      onAnalysisComplete(result.analysis, result.description, result.confidence);
      
      toast.success(
        language === 'ru'
          ? 'Фото проанализировано'
          : 'Photo analyzed successfully'
      );
    } catch (err) {
      console.error('AI photo analysis error:', err);
      toast.error(
        language === 'ru'
          ? 'Ошибка анализа фото'
          : 'Photo analysis failed'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const conditionLabels = {
    excellent: { en: 'Excellent', ru: 'Отлично' },
    good: { en: 'Good', ru: 'Хорошо' },
    fair: { en: 'Fair', ru: 'Удовлетворительно' },
    poor: { en: 'Poor', ru: 'Плохо' },
    damaged: { en: 'Damaged', ru: 'Повреждено' },
  };

  const conditionColors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-orange-500',
    damaged: 'bg-red-500',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4" />
          {language === 'ru' ? 'AI Анализ фото' : 'AI Photo Analysis'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Image upload/preview */}
        <div className="border-2 border-dashed rounded-lg p-4 text-center">
          {previewUrl ? (
            <div className="space-y-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg object-cover"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPreviewUrl(null);
                  setImageUrl('');
                  setLastAnalysis(null);
                }}
              >
                {language === 'ru' ? 'Удалить' : 'Remove'}
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer block py-8">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {language === 'ru'
                  ? 'Нажмите для загрузки фото'
                  : 'Click to upload a photo'}
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !imageUrl}
          className="w-full gap-2"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {language === 'ru' ? 'Анализировать' : 'Analyze Photo'}
        </Button>

        {/* Analysis results */}
        {lastAnalysis && (
          <div className="space-y-3 pt-3 border-t">
            {/* Confidence and condition */}
            <div className="flex items-center justify-between">
              <Badge className={conditionColors[lastAnalysis.analysis.condition]}>
                {conditionLabels[lastAnalysis.analysis.condition][language === 'ru' ? 'ru' : 'en']}
              </Badge>
              <Badge variant="outline">
                {language === 'ru' ? 'Уверенность' : 'Confidence'}: {Math.round(lastAnalysis.confidence * 100)}%
              </Badge>
            </div>

            {/* Category */}
            <div className="text-sm">
              <span className="font-medium">
                {language === 'ru' ? 'Категория: ' : 'Category: '}
              </span>
              {lastAnalysis.analysis.category}
              {lastAnalysis.analysis.subcategory && (
                <span className="text-muted-foreground">
                  {' → '}{lastAnalysis.analysis.subcategory}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground">
              {lastAnalysis.description}
            </p>

            {/* Features */}
            {lastAnalysis.analysis.features.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {lastAnalysis.analysis.features.map((feature, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    <Check className="h-2 w-2 mr-1" />
                    {feature}
                  </Badge>
                ))}
              </div>
            )}

            {/* Estimated values for property */}
            {context === 'property' && lastAnalysis.analysis.estimatedValues && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {lastAnalysis.analysis.estimatedValues.bedrooms !== undefined && (
                  <div className="p-2 bg-muted/50 rounded">
                    <span className="font-medium">
                      {language === 'ru' ? 'Спальни: ' : 'Bedrooms: '}
                    </span>
                    {lastAnalysis.analysis.estimatedValues.bedrooms}
                  </div>
                )}
                {lastAnalysis.analysis.estimatedValues.bathrooms !== undefined && (
                  <div className="p-2 bg-muted/50 rounded">
                    <span className="font-medium">
                      {language === 'ru' ? 'Ванные: ' : 'Bathrooms: '}
                    </span>
                    {lastAnalysis.analysis.estimatedValues.bathrooms}
                  </div>
                )}
                {lastAnalysis.analysis.estimatedValues.areaSqm !== undefined && (
                  <div className="p-2 bg-muted/50 rounded">
                    <span className="font-medium">
                      {language === 'ru' ? 'Площадь: ' : 'Area: '}
                    </span>
                    ~{lastAnalysis.analysis.estimatedValues.areaSqm} m²
                  </div>
                )}
                {lastAnalysis.analysis.estimatedValues.furnishingLevel && (
                  <div className="p-2 bg-muted/50 rounded">
                    <span className="font-medium">
                      {language === 'ru' ? 'Мебель: ' : 'Furnished: '}
                    </span>
                    {lastAnalysis.analysis.estimatedValues.furnishingLevel}
                  </div>
                )}
              </div>
            )}

            {/* Issues for inspection */}
            {context === 'inspection' && lastAnalysis.analysis.issues.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-destructive">
                  {language === 'ru' ? 'Обнаруженные проблемы:' : 'Issues found:'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {lastAnalysis.analysis.issues.map((issue, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      <AlertTriangle className="h-2 w-2 mr-1" />
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {lastAnalysis.analysis.recommendations.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">
                  {language === 'ru' ? 'Рекомендации: ' : 'Recommendations: '}
                </span>
                {lastAnalysis.analysis.recommendations.join('; ')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
