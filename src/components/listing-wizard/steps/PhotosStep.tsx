import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import type { ListingApplicationDraft } from '@/hooks/useListingApplication';
import { AlertCircle } from 'lucide-react';

interface PhotosStepProps {
  draft: ListingApplicationDraft;
  onChange: (updates: Partial<ListingApplicationDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PhotosStep({ draft, onChange, onNext, onBack }: PhotosStepProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const images = draft.images || [];
  
  const handleImagesChange = (urls: string | string[]) => {
    const imageArray = Array.isArray(urls) ? urls : urls ? [urls] : [];
    onChange({ 
      images: imageArray,
      cover_image: imageArray[0] || undefined 
    });
  };
  
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {isRu 
          ? 'Добавьте фотографии для вашего листинга. Первое фото станет обложкой.'
          : 'Add photos for your listing. The first photo will be the cover.'}
      </p>
      
      {!user && (
        <div className="flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">
              {isRu ? 'Войдите для загрузки фото' : 'Sign in to upload photos'}
            </p>
            <p className="text-muted-foreground mt-1">
              {isRu 
                ? 'Вы сможете добавить фотографии после авторизации.'
                : 'You can add photos after signing in.'}
            </p>
          </div>
        </div>
      )}
      
      <UnifiedMediaUploader
        mode="gallery"
        value={images}
        onChange={handleImagesChange}
        folder="listing-applications"
        maxItems={10}
        enableCloudImport={true}
        enableUrlImport={true}
        enableEditing={true}
        enableQualityTips={true}
        disabled={!user}
      />
      
      <p className="text-xs text-muted-foreground">
        {isRu 
          ? 'Рекомендуем добавить минимум 3 фотографии. Максимум 10.'
          : 'We recommend adding at least 3 photos. Maximum 10.'}
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
