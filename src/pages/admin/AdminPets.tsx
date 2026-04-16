import React from 'react';
import { PawPrint } from 'lucide-react';
import { AdminVerticalCRUD, type AdminVerticalConfig } from '@/components/admin/AdminVerticalCRUD';
import { useAdminPets } from '@/hooks/useAdminContent';

const serviceTypes = [
  { value: 'grooming', label: 'Grooming', labelRu: 'Груминг' },
  { value: 'sitting', label: 'Pet Sitting', labelRu: 'Передержка' },
  { value: 'walking', label: 'Walking', labelRu: 'Выгул' },
  { value: 'vet', label: 'Veterinary', labelRu: 'Ветеринария' },
  { value: 'training', label: 'Training', labelRu: 'Дрессировка' },
  { value: 'hotel', label: 'Pet Hotel', labelRu: 'Зоогостиница' },
];

const config: AdminVerticalConfig = {
  titleEn: 'Pet Service Management',
  titleRu: 'Управление зоосервисами',
  icon: PawPrint,
  typeField: 'service_type',
  typeOptions: serviceTypes,
  subtitleField: 'district',
  priceField: 'price_per_hour',
  fields: [
    { key: 'name_en', type: 'text', labelEn: 'Name (EN)', labelRu: 'Название (EN)', required: true },
    { key: 'name_ru', type: 'text', labelEn: 'Name (RU)', labelRu: 'Название (RU)' },
    { key: 'service_type', type: 'select', labelEn: 'Service Type', labelRu: 'Тип услуги', options: serviceTypes, defaultValue: 'grooming', colSpan: 12 },
    { key: 'description_en', type: 'textarea', labelEn: 'Description (EN)', labelRu: 'Описание (EN)' },
    { key: 'description_ru', type: 'textarea', labelEn: 'Description (RU)', labelRu: 'Описание (RU)' },
    { key: 'pet_types', type: 'comma-list', labelEn: 'Pet Types', labelRu: 'Типы животных', placeholder: 'dogs, cats', defaultValue: 'dogs, cats' },
    { key: 'cover_image', type: 'image', labelEn: 'Cover Image', labelRu: 'Обложка', colSpan: 12 },
    { key: 'images', type: 'multi-image', labelEn: 'Gallery', labelRu: 'Галерея', colSpan: 12 },
    { key: 'address', type: 'text', labelEn: 'Address', labelRu: 'Адрес' },
    { key: 'district', type: 'text', labelEn: 'District', labelRu: 'Район' },
    { key: 'phone', type: 'text', labelEn: 'Phone', labelRu: 'Телефон' },
    { key: 'email', type: 'text', labelEn: 'Email', labelRu: 'Email' },
    { key: 'price_per_hour', type: 'number', labelEn: 'Price/hour', labelRu: 'Цена/час' },
    { key: 'price_per_day', type: 'number', labelEn: 'Price/day', labelRu: 'Цена/день' },
    { key: 'currency', type: 'text', labelEn: 'Currency', labelRu: 'Валюта', defaultValue: 'THB' },
    { key: 'is_featured', type: 'switch', labelEn: 'Featured', labelRu: 'Рекомендуем' },
    { key: 'is_active', type: 'switch', labelEn: 'Active', labelRu: 'Активно', defaultValue: true },
  ],
};

export default function AdminPets() {
  const hook = useAdminPets();
  return <AdminVerticalCRUD config={config} hook={hook} />;
}
