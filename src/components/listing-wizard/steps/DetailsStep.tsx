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
  { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла', labelTh: 'วิลล่า' },
  { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо', labelTh: 'คอนโด' },
  { value: 'apartment', labelEn: 'Apartment', labelRu: 'Квартира', labelTh: 'อพาร์ตเมนต์' },
  { value: 'house', labelEn: 'House', labelRu: 'Дом', labelTh: 'บ้าน' },
  { value: 'studio', labelEn: 'Studio', labelRu: 'Студия', labelTh: 'สตูดิโอ' },
];

const SERVICE_CATEGORIES = [
  { value: 'beauty', labelEn: 'Beauty & Wellness', labelRu: 'Красота и здоровье', labelTh: 'ความงามและสุขภาพ' },
  { value: 'tours', labelEn: 'Tours & Experiences', labelRu: 'Туры и развлечения', labelTh: 'ทัวร์และกิจกรรม' },
  { value: 'cleaning', labelEn: 'Cleaning', labelRu: 'Уборка', labelTh: 'ทำความสะอาด' },
  { value: 'repairs', labelEn: 'Repairs & Maintenance', labelRu: 'Ремонт и обслуживание', labelTh: 'ซ่อมแซมและบำรุงรักษา' },
  { value: 'transport', labelEn: 'Transport', labelRu: 'Транспорт', labelTh: 'ขนส่ง' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое', labelTh: 'อื่น ๆ' },
];

const PRODUCT_CATEGORIES = [
  { value: 'food', labelEn: 'Food & Grocery', labelRu: 'Еда и продукты', labelTh: 'อาหารและของชำ' },
  { value: 'health', labelEn: 'Health & Beauty', labelRu: 'Здоровье и красота', labelTh: 'สุขภาพและความงาม' },
  { value: 'home', labelEn: 'Home & Garden', labelRu: 'Дом и сад', labelTh: 'บ้านและสวน' },
  { value: 'fashion', labelEn: 'Fashion', labelRu: 'Мода', labelTh: 'แฟชั่น' },
  { value: 'electronics', labelEn: 'Electronics', labelRu: 'Электроника', labelTh: 'อิเล็กทรอนิกส์' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое', labelTh: 'อื่น ๆ' },
];

export function DetailsStep({ draft, onChange, onNext, onBack }: DetailsStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  
  const renderPropertyDetails = () => (
    <>
      <div className="space-y-2">
        <Label>{isRu ? 'Тип жилья' : isTh ? 'ประเภทที่พัก' : 'Property type'}</Label>
        <Select
          value={draft.property_type}
          onValueChange={(v) => onChange({ property_type: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Выберите тип' : isTh ? 'เลือกประเภท' : 'Select type'} />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {isRu ? t.labelRu : isTh ? t.labelTh : t.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>{isRu ? 'Спален' : isTh ? 'ห้องนอน' : 'Bedrooms'}</Label>
          <Input
            type="number"
            min={0}
            value={draft.bedrooms ?? ''}
            onChange={(e) => onChange({ bedrooms: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>{isRu ? 'Ванных' : isTh ? 'ห้องน้ำ' : 'Bathrooms'}</Label>
          <Input
            type="number"
            min={0}
            value={draft.bathrooms ?? ''}
            onChange={(e) => onChange({ bathrooms: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>{isRu ? 'Гостей' : isTh ? 'จำนวนแขก' : 'Guests'}</Label>
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
        <Label>{isRu ? 'Категория услуги' : isTh ? 'หมวดหมู่บริการ' : 'Service category'}</Label>
        <Select
          value={draft.service_category}
          onValueChange={(v) => onChange({ service_category: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Выберите категорию' : isTh ? 'เลือกหมวดหมู่' : 'Select category'} />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {isRu ? c.labelRu : isTh ? c.labelTh : c.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>{isRu ? 'Длительность (мин)' : isTh ? 'ระยะเวลา (นาที)' : 'Duration (minutes)'}</Label>
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
        <Label>{isRu ? 'Категория товара' : isTh ? 'หมวดหมู่สินค้า' : 'Product category'}</Label>
        <Select
          value={draft.product_category}
          onValueChange={(v) => onChange({ product_category: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Выберите категорию' : isTh ? 'เลือกหมวดหมู่' : 'Select category'} />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {isRu ? c.labelRu : isTh ? c.labelTh : c.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>{isRu ? 'Количество в наличии' : isTh ? 'จำนวนสินค้าคงเหลือ' : 'Stock quantity'}</Label>
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
        <Label>{isRu ? 'Город' : isTh ? 'เมือง' : 'City'}</Label>
        <Select
          value={draft.city}
          onValueChange={(v) => onChange({ city: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Выберите город' : isTh ? 'เลือกเมือง' : 'Select city'} />
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
        <Label>{isRu ? 'Район' : isTh ? 'อำเภอ/ตำบล' : 'District'}</Label>
        <Input
          value={draft.district || ''}
          onChange={(e) => onChange({ district: e.target.value })}
          placeholder={isRu ? 'Например: Rawai' : isTh ? 'เช่น ราไวย์' : 'e.g. Rawai'}
        />
      </div>
      
      <div className="space-y-2">
        <Label>{isRu ? 'Адрес' : isTh ? 'ที่อยู่' : 'Address'}</Label>
        <Input
          value={draft.address || ''}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder={isRu ? 'Улица, дом' : isTh ? 'ถนน อาคาร' : 'Street, building'}
        />
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {isRu ? 'Назад' : isTh ? 'ย้อนกลับ' : 'Back'}
        </Button>
        <Button onClick={onNext} className="flex-1">
          {isRu ? 'Продолжить' : isTh ? 'ดำเนินการต่อ' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
