import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ListingApplicationDraft } from '@/hooks/useListingApplication';

interface BasicInfoStepProps {
  draft: ListingApplicationDraft;
  onChange: (updates: Partial<ListingApplicationDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BasicInfoStep({ draft, onChange, onNext, onBack }: BasicInfoStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const getTitlePlaceholder = () => {
    if (draft.listing_type === 'property') {
      return isRu ? 'Например: Уютная вилла с бассейном' : 'e.g. Cozy villa with pool';
    }
    if (draft.listing_type === 'service') {
      return isRu ? 'Например: Профессиональный массаж' : 'e.g. Professional massage';
    }
    return isRu ? 'Например: Органическое кокосовое масло' : 'e.g. Organic coconut oil';
  };
  
  const isValid = draft.title_en && draft.title_en.length >= 5;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title_en">
          {isRu ? 'Название (EN)' : 'Title (English)'} *
        </Label>
        <Input
          id="title_en"
          value={draft.title_en || ''}
          onChange={(e) => onChange({ title_en: e.target.value })}
          placeholder={getTitlePlaceholder()}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="title_ru">
          {isRu ? 'Название (RU)' : 'Title (Russian)'}
        </Label>
        <Input
          id="title_ru"
          value={draft.title_ru || ''}
          onChange={(e) => onChange({ title_ru: e.target.value })}
          placeholder={isRu ? 'Необязательно' : 'Optional'}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description_en">
          {isRu ? 'Описание (EN)' : 'Description (English)'}
        </Label>
        <Textarea
          id="description_en"
          value={draft.description_en || ''}
          onChange={(e) => onChange({ description_en: e.target.value })}
          placeholder={isRu ? 'Расскажите подробнее...' : 'Tell us more...'}
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description_ru">
          {isRu ? 'Описание (RU)' : 'Description (Russian)'}
        </Label>
        <Textarea
          id="description_ru"
          value={draft.description_ru || ''}
          onChange={(e) => onChange({ description_ru: e.target.value })}
          placeholder={isRu ? 'Необязательно' : 'Optional'}
          rows={4}
        />
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {isRu ? 'Назад' : 'Back'}
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!isValid}>
          {isRu ? 'Продолжить' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
