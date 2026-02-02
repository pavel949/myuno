import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserListingDraft } from '@/types/userListing';
import { MarketplaceCategory } from '@/hooks/useMarketplace';

interface SellBasicInfoStepProps {
  draft: UserListingDraft;
  categories: MarketplaceCategory[];
  onChange: (updates: Partial<UserListingDraft>) => void;
  onNext: () => void;
}

export function SellBasicInfoStep({ draft, categories, onChange, onNext }: SellBasicInfoStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const isValid = draft.title_en.trim().length >= 3;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          {isRu ? 'Название товара *' : 'Item title *'}
        </Label>
        <Input
          id="title"
          placeholder={isRu ? 'Например: iPhone 15 Pro Max 256GB' : 'e.g., iPhone 15 Pro Max 256GB'}
          value={draft.title_en}
          onChange={(e) => onChange({ title_en: e.target.value })}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          {draft.title_en.length}/100
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category">
          {isRu ? 'Категория' : 'Category'}
        </Label>
        <Select
          value={draft.category_slug}
          onValueChange={(value) => onChange({ category_slug: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Выберите категорию' : 'Select a category'} />
          </SelectTrigger>
          <SelectContent>
            {categories
              .filter(c => c.is_active)
              .map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {isRu ? category.name_ru : category.name_en}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">
          {isRu ? 'Описание' : 'Description'}
        </Label>
        <Textarea
          id="description"
          placeholder={isRu 
            ? 'Опишите товар: состояние, комплектация, причина продажи...' 
            : 'Describe your item: condition, what\'s included, reason for selling...'}
          value={draft.description_en || ''}
          onChange={(e) => onChange({ description_en: e.target.value })}
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground">
          {(draft.description_en || '').length}/2000
        </p>
      </div>
      
      <Button 
        onClick={onNext} 
        className="w-full" 
        size="lg"
        disabled={!isValid}
      >
        {isRu ? 'Продолжить' : 'Continue'}
      </Button>
    </div>
  );
}
