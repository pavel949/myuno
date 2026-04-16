import React from 'react';
import { Baby } from 'lucide-react';
import { AdminVerticalCRUD, type AdminVerticalConfig } from '@/components/admin/AdminVerticalCRUD';
import { useAdminBabysitters } from '@/hooks/useAdminContent';

const config: AdminVerticalConfig = {
  titleEn: 'Babysitter Management',
  titleRu: 'Управление нянями',
  icon: Baby,
  priceField: 'price_per_hour',
  fields: [
    { key: 'name_en', type: 'text', labelEn: 'Name (EN)', labelRu: 'Имя (EN)', required: true },
    { key: 'name_ru', type: 'text', labelEn: 'Name (RU)', labelRu: 'Имя (RU)' },
    { key: 'bio_en', type: 'textarea', labelEn: 'Bio (EN)', labelRu: 'О себе (EN)' },
    { key: 'bio_ru', type: 'textarea', labelEn: 'Bio (RU)', labelRu: 'О себе (RU)' },
    { key: 'age_groups', type: 'comma-list', labelEn: 'Age Groups', labelRu: 'Возрастные группы', placeholder: '0-1, 1-3, 3-6, 6-12' },
    { key: 'languages', type: 'comma-list', labelEn: 'Languages', labelRu: 'Языки', defaultValue: 'English' },
    { key: 'experience_years', type: 'number', labelEn: 'Experience (years)', labelRu: 'Опыт (лет)' },
    { key: 'certifications', type: 'comma-list', labelEn: 'Certifications', labelRu: 'Сертификаты' },
    { key: 'price_per_hour', type: 'number', labelEn: 'Price/hour', labelRu: 'Цена/час' },
    { key: 'price_per_day', type: 'number', labelEn: 'Price/day', labelRu: 'Цена/день' },
    { key: 'currency', type: 'text', labelEn: 'Currency', labelRu: 'Валюта', defaultValue: 'THB' },
    { key: 'photo', type: 'image', labelEn: 'Profile Photo', labelRu: 'Фото', colSpan: 12 },
    { key: 'images', type: 'multi-image', labelEn: 'Gallery', labelRu: 'Галерея', colSpan: 12 },
    { key: 'can_cook', type: 'switch', labelEn: 'Can Cook', labelRu: 'Готовит' },
    { key: 'can_drive', type: 'switch', labelEn: 'Can Drive', labelRu: 'Водит авто' },
    { key: 'first_aid_certified', type: 'switch', labelEn: 'First Aid', labelRu: 'Первая помощь' },
    { key: 'background_checked', type: 'switch', labelEn: 'Background Check', labelRu: 'Проверена' },
    { key: 'is_featured', type: 'switch', labelEn: 'Featured', labelRu: 'Рекомендуем' },
    { key: 'is_active', type: 'switch', labelEn: 'Active', labelRu: 'Активно', defaultValue: true },
  ],
};

export default function AdminBabysitters() {
  const hook = useAdminBabysitters();
  return <AdminVerticalCRUD config={config} hook={hook} />;
}
