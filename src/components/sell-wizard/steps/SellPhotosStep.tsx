import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserListingDraft } from '@/types/userListing';
import { cn } from '@/lib/utils';
import { Camera, Plus, X, Image as ImageIcon } from 'lucide-react';

interface SellPhotosStepProps {
  draft: UserListingDraft;
  onChange: (updates: Partial<UserListingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SellPhotosStep({ draft, onChange, onNext, onBack }: SellPhotosStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [isUploading, setIsUploading] = useState(false);
  
  const images = draft.images || [];
  const maxImages = 10;
  
  // Placeholder for image upload - in real implementation, this would use Supabase Storage
  const handleAddImage = () => {
    // Simulate adding a placeholder image
    const placeholderUrls = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    ];
    
    if (images.length < maxImages) {
      const newImage = placeholderUrls[images.length % placeholderUrls.length];
      const newImages = [...images, newImage];
      onChange({ 
        images: newImages,
        cover_image: draft.cover_image || newImage
      });
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const removedImage = images[index];
    
    onChange({ 
      images: newImages,
      cover_image: draft.cover_image === removedImage 
        ? newImages[0] || ''
        : draft.cover_image
    });
  };
  
  const handleSetCover = (url: string) => {
    onChange({ cover_image: url });
  };
  
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {isRu 
          ? 'Добавьте до 10 фотографий. Первое фото будет главным.' 
          : 'Add up to 10 photos. The first photo will be your cover image.'}
      </p>
      
      <div className="grid grid-cols-3 gap-3">
        {/* Existing images */}
        {images.map((url, index) => (
          <div 
            key={index}
            className={cn(
              'relative aspect-square rounded-xl overflow-hidden border-2',
              draft.cover_image === url ? 'border-primary' : 'border-transparent'
            )}
          >
            <img 
              src={url} 
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Cover badge */}
            {draft.cover_image === url && (
              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                {isRu ? 'Главное' : 'Cover'}
              </div>
            )}
            
            {/* Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {draft.cover_image !== url && (
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleSetCover(url)}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              )}
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {/* Add photo button */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={handleAddImage}
            className={cn(
              'aspect-square rounded-xl border-2 border-dashed',
              'flex flex-col items-center justify-center gap-2',
              'text-muted-foreground hover:text-foreground',
              'hover:border-primary/50 hover:bg-accent/50 transition-all'
            )}
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs">
              {isRu ? 'Добавить' : 'Add'}
            </span>
          </button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        {images.length}/{maxImages} {isRu ? 'фото добавлено' : 'photos added'}
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
