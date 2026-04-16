import React from 'react';
import { GraduationCap } from 'lucide-react';
import { AdminVerticalCRUD, type AdminVerticalConfig } from '@/components/admin/AdminVerticalCRUD';
import { useAdminEducation } from '@/hooks/useAdminContent';

const providerTypes = [
  { value: 'tutor', label: 'Private Tutor', labelRu: 'Репетитор' },
  { value: 'school', label: 'Language School', labelRu: 'Языковая школа' },
  { value: 'international', label: 'International School', labelRu: 'Межд. школа' },
  { value: 'online', label: 'Online Course', labelRu: 'Онлайн курс' },
  { value: 'sports', label: 'Sports Academy', labelRu: 'Спортивная академия' },
  { value: 'arts', label: 'Art School', labelRu: 'Школа искусств' },
];

const config: AdminVerticalConfig = {
  titleEn: 'Education Management',
  titleRu: 'Управление образованием',
  icon: GraduationCap,
  typeField: 'provider_type',
  typeOptions: providerTypes,
  subtitleField: 'district',
  priceField: 'price_per_hour',
  fields: [
    { key: 'name_en', type: 'text', labelEn: 'Name (EN)', labelRu: 'Название (EN)', required: true },
    { key: 'name_ru', type: 'text', labelEn: 'Name (RU)', labelRu: 'Название (RU)' },
    { key: 'provider_type', type: 'select', labelEn: 'Type', labelRu: 'Тип', options: providerTypes, defaultValue: 'tutor', colSpan: 12 },
    { key: 'description_en', type: 'textarea', labelEn: 'Description (EN)', labelRu: 'Описание (EN)' },
    { key: 'description_ru', type: 'textarea', labelEn: 'Description (RU)', labelRu: 'Описание (RU)' },
    { key: 'subjects', type: 'comma-list', labelEn: 'Subjects', labelRu: 'Предметы' },
    { key: 'languages', type: 'comma-list', labelEn: 'Languages', labelRu: 'Языки', defaultValue: 'English' },
    { key: 'age_groups', type: 'comma-list', labelEn: 'Age Groups', labelRu: 'Возрастные группы' },
    { key: 'cover_image', type: 'image', labelEn: 'Cover Image', labelRu: 'Обложка', colSpan: 12 },
    { key: 'images', type: 'multi-image', labelEn: 'Gallery', labelRu: 'Галерея', colSpan: 12 },
    { key: 'address', type: 'text', labelEn: 'Address', labelRu: 'Адрес' },
    { key: 'district', type: 'text', labelEn: 'District', labelRu: 'Район' },
    { key: 'phone', type: 'text', labelEn: 'Phone', labelRu: 'Телефон' },
    { key: 'email', type: 'text', labelEn: 'Email', labelRu: 'Email' },
    { key: 'website', type: 'text', labelEn: 'Website', labelRu: 'Сайт' },
    { key: 'price_per_hour', type: 'number', labelEn: 'Price/hour ฿', labelRu: 'Цена/час ฿' },
    { key: 'price_per_course', type: 'number', labelEn: 'Price/course ฿', labelRu: 'Цена/курс ฿' },
    { key: 'is_online', type: 'switch', labelEn: 'Online Available', labelRu: 'Онлайн' },
    { key: 'is_featured', type: 'switch', labelEn: 'Featured', labelRu: 'Рекомендуем' },
    { key: 'is_active', type: 'switch', labelEn: 'Active', labelRu: 'Активно', defaultValue: true },
  ],
};

export default function AdminEducation() {
  const hook = useAdminEducation();
  return <AdminVerticalCRUD config={config} hook={hook} />;
}
