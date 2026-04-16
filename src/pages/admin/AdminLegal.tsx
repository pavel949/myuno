import React from 'react';
import { Scale } from 'lucide-react';
import { AdminVerticalCRUD, type AdminVerticalConfig } from '@/components/admin/AdminVerticalCRUD';
import { useAdminLegal } from '@/hooks/useAdminContent';

const serviceTypes = [
  { value: 'law_firm', label: 'Law Firm', labelRu: 'Юрфирма' },
  { value: 'notary', label: 'Notary', labelRu: 'Нотариус' },
  { value: 'immigration', label: 'Immigration', labelRu: 'Иммиграция' },
  { value: 'corporate', label: 'Corporate', labelRu: 'Корпоративное' },
  { value: 'property_law', label: 'Property Law', labelRu: 'Недвижимость' },
  { value: 'family_law', label: 'Family Law', labelRu: 'Семейное право' },
];

const config: AdminVerticalConfig = {
  titleEn: 'Legal Service Management',
  titleRu: 'Управление юр. услугами',
  icon: Scale,
  typeField: 'service_type',
  typeOptions: serviceTypes,
  subtitleField: 'district',
  priceField: 'price_consultation',
  fields: [
    { key: 'name_en', type: 'text', labelEn: 'Name (EN)', labelRu: 'Название (EN)', required: true },
    { key: 'name_ru', type: 'text', labelEn: 'Name (RU)', labelRu: 'Название (RU)' },
    { key: 'service_type', type: 'select', labelEn: 'Type', labelRu: 'Тип', options: serviceTypes, defaultValue: 'law_firm', colSpan: 12 },
    { key: 'description_en', type: 'textarea', labelEn: 'Description (EN)', labelRu: 'Описание (EN)' },
    { key: 'description_ru', type: 'textarea', labelEn: 'Description (RU)', labelRu: 'Описание (RU)' },
    { key: 'specializations', type: 'comma-list', labelEn: 'Specializations', labelRu: 'Специализации' },
    { key: 'languages', type: 'comma-list', labelEn: 'Languages', labelRu: 'Языки', defaultValue: 'English' },
    { key: 'cover_image', type: 'image', labelEn: 'Cover Image', labelRu: 'Обложка', colSpan: 12 },
    { key: 'images', type: 'multi-image', labelEn: 'Gallery', labelRu: 'Галерея', colSpan: 12 },
    { key: 'address', type: 'text', labelEn: 'Address', labelRu: 'Адрес' },
    { key: 'district', type: 'text', labelEn: 'District', labelRu: 'Район' },
    { key: 'phone', type: 'text', labelEn: 'Phone', labelRu: 'Телефон' },
    { key: 'email', type: 'text', labelEn: 'Email', labelRu: 'Email' },
    { key: 'website', type: 'text', labelEn: 'Website', labelRu: 'Сайт' },
    { key: 'price_consultation', type: 'number', labelEn: 'Consultation ฿', labelRu: 'Консультация ฿' },
    { key: 'is_featured', type: 'switch', labelEn: 'Featured', labelRu: 'Рекомендуем' },
    { key: 'is_active', type: 'switch', labelEn: 'Active', labelRu: 'Активно', defaultValue: true },
  ],
};

export default function AdminLegal() {
  const hook = useAdminLegal();
  return <AdminVerticalCRUD config={config} hook={hook} />;
}
