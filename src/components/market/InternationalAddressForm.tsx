import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface InternationalAddressFormProps {
  formData: {
    name: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    postalCode: string;
    notes: string;
  };
  onChange: (field: string, value: string) => void;
}

export const InternationalAddressForm = ({ formData, onChange }: InternationalAddressFormProps) => {
  const { language } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">
          {language === 'ru' ? 'Адрес доставки' : 'Shipping Address'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>{language === 'ru' ? 'Имя получателя' : 'Recipient Name'} *</Label>
          <Input
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder={language === 'ru' ? 'Полное имя' : 'Full name'}
            className="mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label>{language === 'ru' ? 'Телефон' : 'Phone'} *</Label>
          <Input
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+7 XXX XXX XX XX"
            className="mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label>{language === 'ru' ? 'Страна' : 'Country'} *</Label>
          <Input
            value={formData.country}
            onChange={(e) => onChange('country', e.target.value)}
            placeholder={language === 'ru' ? 'Россия' : 'Russia'}
            className="mt-1"
          />
        </div>

        <div>
          <Label>{language === 'ru' ? 'Город' : 'City'} *</Label>
          <Input
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder={language === 'ru' ? 'Москва' : 'Moscow'}
            className="mt-1"
          />
        </div>

        <div>
          <Label>{language === 'ru' ? 'Индекс' : 'Postal Code'} *</Label>
          <Input
            value={formData.postalCode}
            onChange={(e) => onChange('postalCode', e.target.value)}
            placeholder="123456"
            className="mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label>{language === 'ru' ? 'Полный адрес' : 'Full Address'} *</Label>
          <Textarea
            value={formData.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder={language === 'ru' 
              ? 'Улица, дом, квартира' 
              : 'Street, building, apartment'}
            rows={2}
            className="mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label>{language === 'ru' ? 'Комментарий' : 'Notes'}</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder={language === 'ru' 
              ? 'Дополнительная информация для доставки' 
              : 'Additional delivery instructions'}
            rows={2}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};
