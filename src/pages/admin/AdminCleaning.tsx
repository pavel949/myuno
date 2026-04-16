import React from 'react';
import { Sparkles } from 'lucide-react';
import { AdminVerticalCRUD, type AdminVerticalConfig } from '@/components/admin/AdminVerticalCRUD';
import { useAdminCleaning } from '@/hooks/useAdminContent';

const serviceTypes = [
  { value: 'regular', label: 'Regular Cleaning', labelRu: 'Регулярная уборка' },
  { value: 'deep', label: 'Deep Cleaning', labelRu: 'Генеральная уборка' },
  { value: 'move_in', label: 'Move-in/out', labelRu: 'При заселении/выезде' },
  { value: 'post_construction', label: 'Post-Construction', labelRu: 'После ремонта' },
  { value: 'office', label: 'Office', labelRu: 'Офис' },
  { value: 'pool', label: 'Pool Cleaning', labelRu: 'Чистка бассейна' },
];

const config: AdminVerticalConfig = {
  titleEn: 'Cleaning Service Management',
  titleRu: 'Управление клинингом',
  icon: Sparkles,
  typeField: 'service_type',
  typeOptions: serviceTypes,
  priceField: 'price_per_hour',
  fields: [
    { key: 'name_en', type: 'text', labelEn: 'Name (EN)', labelRu: 'Название (EN)', required: true },
    { key: 'name_ru', type: 'text', labelEn: 'Name (RU)', labelRu: 'Название (RU)' },
    { key: 'service_type', type: 'select', labelEn: 'Type', labelRu: 'Тип', options: serviceTypes, defaultValue: 'regular', colSpan: 12 },
    { key: 'description_en', type: 'textarea', labelEn: 'Description (EN)', labelRu: 'Описание (EN)' },
    { key: 'description_ru', type: 'textarea', labelEn: 'Description (RU)', labelRu: 'Описание (RU)' },
    { key: 'features', type: 'comma-list', labelEn: 'Features', labelRu: 'Особенности' },
    { key: 'areas_served', type: 'comma-list', labelEn: 'Areas Served', labelRu: 'Обслуживаемые районы' },
    { key: 'cover_image', type: 'image', labelEn: 'Cover Image', labelRu: 'Обложка', colSpan: 12 },
    { key: 'images', type: 'multi-image', labelEn: 'Gallery', labelRu: 'Галерея', colSpan: 12 },
    { key: 'price_per_hour', type: 'number', labelEn: 'Price/hour ฿', labelRu: 'Цена/час ฿' },
    { key: 'price_fixed', type: 'number', labelEn: 'Fixed Price ฿', labelRu: 'Фикс. цена ฿' },
    { key: 'duration_hours', type: 'number', labelEn: 'Duration (hours)', labelRu: 'Длительность (часов)' },
    { key: 'currency', type: 'text', labelEn: 'Currency', labelRu: 'Валюта', defaultValue: 'THB' },
    { key: 'is_featured', type: 'switch', labelEn: 'Featured', labelRu: 'Рекомендуем' },
    { key: 'is_active', type: 'switch', labelEn: 'Active', labelRu: 'Активно', defaultValue: true },
  ],
};

export default function AdminCleaning() {
  const hook = useAdminCleaning();
  return <AdminVerticalCRUD config={config} hook={hook} />;
}
