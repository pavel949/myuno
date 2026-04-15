import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserListingDraft } from '@/types/userListing';
import { MarketplaceCategory } from '@/hooks/useMarketplace';
import { CategorySuggestionDialog } from '@/components/category/CategorySuggestionDialog';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { AITranslateButton } from '@/components/ui/AITranslateButton';

interface SellBasicInfoStepProps {
  draft: UserListingDraft;
  categories: MarketplaceCategory[];
  onChange: (updates: Partial<UserListingDraft>) => void;
  onNext: () => void;
}

export function SellBasicInfoStep({ draft, categories, onChange, onNext }: SellBasicInfoStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  
  const isValid = draft.title_en.trim().length >= 3;
  
  return (
    <div className="space-y-6">
      {/* Title fields — EN + RU with one shared translate button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{isRu ? 'Название товара *' : 'Item title *'}</Label>
          <AITranslateButton
            sourceText={draft.title_ru || draft.title_en}
            sourceLang={draft.title_ru ? 'ru' : 'en'}
            targetLang={draft.title_ru ? 'en' : 'ru'}
            onTranslate={(text) => draft.title_ru
              ? onChange({ title_en: text })
              : onChange({ title_ru: text })
            }
            size="sm"
          />
        </div>
        <Input
          id="title"
          placeholder={isRu ? 'Например: iPhone 15 Pro Max 256GB' : 'e.g., iPhone 15 Pro Max 256GB'}
          value={draft.title_en}
          onChange={(e) => onChange({ title_en: e.target.value })}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">{draft.title_en.length}/100</p>
        <Input
          id="title_ru"
          placeholder={isRu ? 'Название на русском' : 'Russian title (optional)'}
          value={draft.title_ru || ''}
          onChange={(e) => onChange({ title_ru: e.target.value })}
          maxLength={100}
        />
      </div>
      
      {/* Category with suggestion option */}
      <div className="space-y-2">
        <Label htmlFor="category">
          {isRu ? 'Категория' : 'Category'}
        </Label>
        <Select
          value={draft.category_slug}
          onValueChange={(value) => {
            if (value === '__suggest__') {
              setShowSuggestionDialog(true);
            } else {
              onChange({ category_slug: value });
            }
          }}
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
            {/* Suggest category option */}
            <SelectItem 
              value="__suggest__" 
              className="text-primary border-t mt-2 pt-2"
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                {isRu ? 'Предложить новую категорию' : 'Suggest a new category'}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {isRu 
            ? 'Не нашли подходящую? Предложите свою!' 
            : "Can't find the right one? Suggest your own!"}
        </p>
      </div>
      
      {/* Description fields — EN + RU with one shared translate button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{isRu ? 'Описание' : 'Description'}</Label>
          <AITranslateButton
            sourceText={draft.description_ru || draft.description_en || ''}
            sourceLang={draft.description_ru ? 'ru' : 'en'}
            targetLang={draft.description_ru ? 'en' : 'ru'}
            onTranslate={(text) => draft.description_ru
              ? onChange({ description_en: text })
              : onChange({ description_ru: text })
            }
            size="sm"
          />
        </div>
        <Textarea
          id="description"
          placeholder={isRu
            ? 'Опишите товар: состояние, комплектация, причина продажи...'
            : "Describe your item: condition, what's included, reason for selling..."}
          value={draft.description_en || ''}
          onChange={(e) => onChange({ description_en: e.target.value })}
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground">{(draft.description_en || '').length}/2000</p>
        <Textarea
          id="description_ru"
          placeholder={isRu ? 'Описание на русском (опционально)' : 'Russian description (optional)'}
          value={draft.description_ru || ''}
          onChange={(e) => onChange({ description_ru: e.target.value })}
          rows={3}
          maxLength={2000}
        />
      </div>
      
      <Button 
        onClick={onNext} 
        className="w-full" 
        size="lg"
        disabled={!isValid}
      >
        {isRu ? 'Продолжить' : 'Continue'}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      {/* Category suggestion dialog */}
      <CategorySuggestionDialog
        open={showSuggestionDialog}
        onOpenChange={setShowSuggestionDialog}
        type="product"
      />
    </div>
  );
}
