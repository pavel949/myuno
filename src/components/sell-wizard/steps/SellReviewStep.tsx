import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserListingDraft, CONDITION_LABELS } from '@/types/userListing';
import { MarketplaceCategory } from '@/hooks/useMarketplace';
import { Pencil, Loader2, Package, Tag, Camera, BadgeDollarSign, Phone } from 'lucide-react';

interface SellReviewStepProps {
  draft: UserListingDraft;
  categories: MarketplaceCategory[];
  onEdit: (step: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const CURRENCIES: Record<string, string> = {
  THB: '฿',
  USD: '$',
  RUB: '₽',
};

export function SellReviewStep({ draft, categories, onEdit, onSubmit, onBack, isLoading }: SellReviewStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const category = categories.find(c => c.slug === draft.category_slug);
  const conditionLabel = CONDITION_LABELS[draft.condition];
  const currencySymbol = CURRENCIES[draft.currency] || draft.currency;
  
  const sections = [
    {
      step: 0,
      icon: <Package className="h-4 w-4" />,
      title: isRu ? 'Основная информация' : 'Basic Info',
      content: (
        <div>
          <p className="font-medium">{draft.title_en}</p>
          {category && (
            <p className="text-sm text-muted-foreground">
              {isRu ? category.name_ru : category.name_en}
            </p>
          )}
          {draft.description_en && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {draft.description_en}
            </p>
          )}
        </div>
      ),
    },
    {
      step: 1,
      icon: <Tag className="h-4 w-4" />,
      title: isRu ? 'Состояние' : 'Condition',
      content: (
        <p className="font-medium">
          {isRu ? conditionLabel.ru : conditionLabel.en}
        </p>
      ),
    },
    {
      step: 2,
      icon: <Camera className="h-4 w-4" />,
      title: isRu ? 'Фотографии' : 'Photos',
      content: (
        <div className="flex gap-2">
          {(draft.images || []).slice(0, 4).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="w-12 h-12 rounded-lg object-cover"
            />
          ))}
          {(draft.images?.length || 0) > 4 && (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
              +{(draft.images?.length || 0) - 4}
            </div>
          )}
          {(!draft.images || draft.images.length === 0) && (
            <p className="text-muted-foreground text-sm">
              {isRu ? 'Фото не добавлены' : 'No photos added'}
            </p>
          )}
        </div>
      ),
    },
    {
      step: 3,
      icon: <BadgeDollarSign className="h-4 w-4" />,
      title: isRu ? 'Цена' : 'Price',
      content: (
        <div>
          <p className="font-medium text-lg">
            {currencySymbol}{draft.price?.toLocaleString()}
          </p>
          {draft.is_negotiable && (
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Торг уместен' : 'Negotiable'}
            </p>
          )}
        </div>
      ),
    },
    {
      step: 4,
      icon: <Phone className="h-4 w-4" />,
      title: isRu ? 'Контакты' : 'Contact',
      content: (
        <div className="space-y-1">
          {draft.contact_phone && (
            <p className="text-sm">{draft.contact_phone}</p>
          )}
          {draft.contact_whatsapp && (
            <p className="text-sm">WhatsApp: {draft.contact_whatsapp}</p>
          )}
          {draft.location && (
            <p className="text-sm text-muted-foreground">{draft.location}</p>
          )}
        </div>
      ),
    },
  ];
  
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {isRu 
          ? 'Проверьте информацию перед публикацией' 
          : 'Review your listing before publishing'}
      </p>
      
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.step}
            className="p-4 rounded-xl border bg-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  {section.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    {section.title}
                  </p>
                  {section.content}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(section.step)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <p className="text-sm">
          {isRu 
            ? '⏳ После публикации объявление будет проверено модератором. Обычно это занимает до 24 часов.' 
            : '⏳ Your listing will be reviewed by a moderator after publishing. This usually takes up to 24 hours.'}
        </p>
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={isLoading}>
          {isRu ? 'Назад' : 'Back'}
        </Button>
        <Button onClick={onSubmit} className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isRu ? 'Публикация...' : 'Publishing...'}
            </>
          ) : (
            isRu ? 'Опубликовать' : 'Publish Listing'
          )}
        </Button>
      </div>
    </div>
  );
}
