import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ListingApplicationDraft } from '@/hooks/useListingApplication';

interface DetailsStepProps {
  draft: ListingApplicationDraft;
  onChange: (updates: Partial<ListingApplicationDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PROPERTY_TYPES = [
  { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла' },
  { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо' },
  { value: 'apartment', labelEn: 'Apartment', labelRu: 'Квартира' },
  { value: 'house', labelEn: 'House', labelRu: 'Дом' },
  { value: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
];

const SERVICE_CATEGORIES = [
  { value: 'beauty', labelEn: 'Beauty & Wellness', labelRu: 'Красота и здоровье' },
  { value: 'tours', labelEn: 'Tours & Experiences', labelRu: 'Туры и развлечения' },
  { value: 'cleaning', labelEn: 'Cleaning', labelRu: 'Уборка' },
  { value: 'repairs', labelEn: 'Repairs & Maintenance', labelRu: 'Ремонт и обслуживание' },
  { value: 'transport', labelEn: 'Transport', labelRu: 'Транспорт' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
];

const PRODUCT_CATEGORIES = [
  { value: 'food', labelEn: 'Food & Grocery', labelRu: 'Еда и продукты' },
  { value: 'health', labelEn: 'Health & Beauty', labelRu: 'Здоровье и красота' },
  { value: 'home', labelEn: 'Home & Garden', labelRu: 'Дом и сад' },
  { value: 'fashion', labelEn: 'Fashion', labelRu: 'Мода' },
  { value: 'electronics', labelEn: 'Electronics', labelRu: 'Электроника' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
];

export function DetailsStep({ draft, onChange, onNext, onBack }: DetailsStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const renderPropertyDetails = () => (
    <>
      <div className="space-y-2">
        <Label>{isRu ? 'Тип жилья' : 'Property type'}</Label>
        <Select
          value={draft.property_type}
          onValueChange={(v) => onChange({ property_type: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Выберите тип' : 'Select type'} />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {isRu ? t.labelRu : t.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>{isRu ? 'Спален' : 'Bedrooms'}</Label>
          <Input
            type="number"
            min={0}
            value={draft.bedrooms ?? ''}
            onChange={(e) => onChange({ bedrooms: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>{isRu ? 'Ванных' : 'Bathrooms'}</Label>
          <Input
            type="number"
            min={0}
            value={draft.bathrooms ?? ''}
            onChange={(e) => onChange({ bathrooms: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>{isRu ? 'Гостей' : 'Guests'}</Label>
          <Input
            type="number"
            min={1}
            value={draft.max_guests ?? ''}
            onChange={(e) => onChange({ max_guests: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>
    </>
  );
  
  const renderServiceDetails = () => (
    <>
      <div className="space-y-2">
        <Label>{isRu ? 'Категория услуги' : 'Service category'}</Label>
        <Select
          value={draft.service_category}
          onValueChange={(v) => onChange({ service_category: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Выберите категорию' : 'Select category'} />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {isRu ? c.labelRu : c.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>{isRu ? 'Длительность (мин)' : 'Duration (minutes)'}</Label>
        <Input
          type="number"
          min={15}
          step={15}
          value={draft.duration_minutes ?? ''}
          onChange={(e) => onChange({ duration_minutes: parseInt(e.target.value) || 60 })}
          placeholder="60"
        />
      </div>
    </>
  );
  
  const renderProductDetails = () => (
    <>
      <div className="space-y-2">
        <Label>{isRu ? 'Категория товара' : 'Product category'}</Label>
        <Select
          value={draft.product_category}
          onValueChange={(v) => onChange({ product_category: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Выберите категорию' : 'Select category'} />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {isRu ? c.labelRu : c.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>{isRu ? 'Количество в наличии' : 'Stock quantity'}</Label>
        <Input
          type="number"
          min={1}
          value={draft.stock_quantity ?? ''}
          onChange={(e) => onChange({ stock_quantity: parseInt(e.target.value) || 1 })}
          placeholder="10"
        />
      </div>
    </>
  );
  
  return (
    <div className="space-y-6">
      {draft.listing_type === 'property' && renderPropertyDetails()}
      {draft.listing_type === 'service' && renderServiceDetails()}
      {draft.listing_type === 'product' && renderProductDetails()}
      
      {/* Location - common */}
      <div className="space-y-2">
        <Label>{isRu ? 'Город' : 'City'}</Label>
        <Select
          value={draft.city}
          onValueChange={(v) => onChange({ city: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Выберите город' : 'Select city'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="phuket">Phuket</SelectItem>
            <SelectItem value="bangkok">Bangkok</SelectItem>
            <SelectItem value="pattaya">Pattaya</SelectItem>
            <SelectItem value="samui">Koh Samui</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>{isRu ? 'Район' : 'District'}</Label>
        <Input
          value={draft.district || ''}
          onChange={(e) => onChange({ district: e.target.value })}
          placeholder={isRu ? 'Например: Rawai' : 'e.g. Rawai'}
        />
      </div>
      
      <div className="space-y-2">
        <Label>{isRu ? 'Адрес' : 'Address'}</Label>
        <Input
          value={draft.address || ''}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder={isRu ? 'Улица, дом' : 'Street, building'}
        />
      </div>
      
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
