import React from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ListingApplicationDraft } from '@/hooks/useListingApplication';

interface PhotosStepProps {
  draft: ListingApplicationDraft;
  onChange: (updates: Partial<ListingApplicationDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PhotosStep({ draft, onChange, onNext, onBack }: PhotosStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const images = draft.images || [];
  
  const handleAddImage = () => {
    // In production, this would open a file picker and upload to storage
    // For now, we'll use a placeholder flow
    const url = prompt(isRu ? 'Введите URL изображения:' : 'Enter image URL:');
    if (url) {
      const updated = [...images, url];
      onChange({ 
        images: updated,
        cover_image: draft.cover_image || url 
      });
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange({ 
      images: updated,
      cover_image: updated[0] || undefined
    });
  };
  
  const handleSetCover = (url: string) => {
    onChange({ cover_image: url });
  };
  
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {isRu 
          ? 'Добавьте фотографии для вашего листинга. Первое фото станет обложкой.'
          : 'Add photos for your listing. The first photo will be the cover.'}
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {images.map((url, index) => (
          <div 
            key={index} 
            className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
          >
            <img 
              src={url} 
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {draft.cover_image === url && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                {isRu ? 'Обложка' : 'Cover'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {draft.cover_image !== url && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSetCover(url)}
                >
                  {isRu ? 'Обложка' : 'Set cover'}
                </Button>
              )}
              <Button
                size="icon"
                variant="destructive"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <button
          onClick={handleAddImage}
          className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isRu ? 'Добавить фото' : 'Add photo'}
          </span>
        </button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        {isRu 
          ? 'Рекомендуем добавить минимум 3 фотографии'
          : 'We recommend adding at least 3 photos'}
      </p>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {isRu ? 'Назад' : 'Back'}
        </Button>
        <Button onClick={onNext} className="flex-1">
          {isRu ? 'Продолжить' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
