import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Building2, Wrench, Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencySymbol } from '@/lib/currencyUtils';
import type { ListingApplicationDraft } from '@/hooks/useListingApplication';

interface ReviewStepProps {
  draft: ListingApplicationDraft;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function ReviewStep({ draft, onEdit, onSubmit, onBack, isLoading }: ReviewStepProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  
  const getTypeIcon = () => {
    if (draft.listing_type === 'property') return Building2;
    if (draft.listing_type === 'service') return Wrench;
    return Package;
  };
  
  const getTypeLabel = () => {
    if (draft.listing_type === 'property') return isRu ? 'Недвижимость' : 'Property';
    if (draft.listing_type === 'service') return isRu ? 'Услуга' : 'Service';
    return isRu ? 'Товар' : 'Product';
  };
  
  const TypeIcon = getTypeIcon();
  
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {isRu 
          ? 'Проверьте информацию перед отправкой'
          : 'Review your information before submitting'}
      </p>
      
      {/* Preview Card */}
      <Card>
        <CardContent className="p-0">
          {draft.cover_image && (
            <div className="aspect-video relative">
              <img 
                src={draft.cover_image} 
                alt="Cover" 
                className="w-full h-full object-cover rounded-t-lg"
              />
            </div>
          )}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TypeIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{getTypeLabel()}</span>
            </div>
            <h3 className="font-semibold text-lg">{draft.title_en || '—'}</h3>
            {draft.description_en && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {draft.description_en}
              </p>
            )}
            {draft.price && (
              <p className="text-lg font-bold text-primary">
                {getCurrencySymbol(draft.currency || 'THB')}
                {draft.price.toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Edit sections */}
      <div className="space-y-2">
        <ReviewSection
          label={isRu ? 'Тип листинга' : 'Listing type'}
          value={getTypeLabel()}
          onEdit={() => onEdit(0)}
        />
        <ReviewSection
          label={isRu ? 'Название' : 'Title'}
          value={draft.title_en || '—'}
          onEdit={() => onEdit(1)}
        />
        <ReviewSection
          label={isRu ? 'Локация' : 'Location'}
          value={[draft.city, draft.district].filter(Boolean).join(', ') || '—'}
          onEdit={() => onEdit(2)}
        />
        <ReviewSection
          label={isRu ? 'Фотографии' : 'Photos'}
          value={`${draft.images?.length || 0} ${isRu ? 'фото' : 'photos'}`}
          onEdit={() => onEdit(3)}
        />
        <ReviewSection
          label={isRu ? 'Цена' : 'Price'}
          value={draft.price ? `${draft.price} ${draft.currency}` : '—'}
          onEdit={() => onEdit(4)}
        />
        <ReviewSection
          label={isRu ? 'Контакт' : 'Contact'}
          value={draft.applicant_email || '—'}
          onEdit={() => onEdit(5)}
        />
      </div>
      
      {/* Auth notice */}
      {!user && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <p className="text-sm">
            {isRu 
              ? '⚠️ Для отправки заявки потребуется создать аккаунт или войти.'
              : '⚠️ You will need to create an account or sign in to submit.'}
          </p>
        </div>
      )}
      
      {/* What happens next */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <h4 className="font-medium">{isRu ? 'Что дальше?' : 'What happens next?'}</h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>{isRu ? 'Мы рассмотрим вашу заявку в течение 24-48 часов' : 'We\'ll review your application within 24-48 hours'}</li>
          <li>{isRu ? 'Свяжемся с вами для уточнения деталей при необходимости' : 'We\'ll contact you if we need more details'}</li>
          <li>{isRu ? 'После одобрения ваш листинг будет опубликован' : 'Once approved, your listing will go live'}</li>
        </ol>
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {isRu ? 'Назад' : 'Back'}
        </Button>
        <Button 
          onClick={onSubmit} 
          className="flex-1" 
          disabled={isLoading}
        >
          {isLoading 
            ? (isRu ? 'Отправка...' : 'Submitting...') 
            : (isRu ? 'Отправить заявку' : 'Submit Application')}
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({ 
  label, 
  value, 
  onEdit 
}: { 
  label: string; 
  value: string; 
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}
