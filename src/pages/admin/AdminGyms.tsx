import React from 'react';
import { Dumbbell } from 'lucide-react';
import { AdminVerticalCRUD, type AdminVerticalConfig } from '@/components/admin/AdminVerticalCRUD';
import { useAdminGyms } from '@/hooks/useAdminContent';

const gymTypes = [
  { value: 'gym', label: 'Gym', labelRu: 'Спортзал' },
  { value: 'fitness', label: 'Fitness Center', labelRu: 'Фитнес-центр' },
  { value: 'crossfit', label: 'CrossFit', labelRu: 'КроссФит' },
  { value: 'yoga', label: 'Yoga Studio', labelRu: 'Йога-студия' },
  { value: 'martial_arts', label: 'Martial Arts', labelRu: 'Единоборства' },
  { value: 'pool', label: 'Swimming Pool', labelRu: 'Бассейн' },
];

const config: AdminVerticalConfig = {
  titleEn: 'Gym Management',
  titleRu: 'Управление залами',
  icon: Dumbbell,
  typeField: 'gym_type',
  typeOptions: gymTypes,
  subtitleField: 'district',
  priceField: 'price_day_pass',
  fields: [
    { key: 'name_en', type: 'text', labelEn: 'Name (EN)', labelRu: 'Название (EN)', required: true },
    { key: 'name_ru', type: 'text', labelEn: 'Name (RU)', labelRu: 'Название (RU)' },
    { key: 'gym_type', type: 'select', labelEn: 'Type', labelRu: 'Тип', options: gymTypes, defaultValue: 'gym', colSpan: 12 },
    { key: 'description_en', type: 'textarea', labelEn: 'Description (EN)', labelRu: 'Описание (EN)' },
    { key: 'description_ru', type: 'textarea', labelEn: 'Description (RU)', labelRu: 'Описание (RU)' },
    { key: 'cover_image', type: 'image', labelEn: 'Cover Image', labelRu: 'Обложка', colSpan: 12 },
    { key: 'images', type: 'multi-image', labelEn: 'Gallery', labelRu: 'Галерея', colSpan: 12 },
    { key: 'address', type: 'text', labelEn: 'Address', labelRu: 'Адрес' },
    { key: 'district', type: 'text', labelEn: 'District', labelRu: 'Район' },
    { key: 'price_day_pass', type: 'number', labelEn: 'Day Pass ฿', labelRu: 'День ฿' },
    { key: 'price_week_pass', type: 'number', labelEn: 'Week Pass ฿', labelRu: 'Неделя ฿' },
    { key: 'price_month_pass', type: 'number', labelEn: 'Month Pass ฿', labelRu: 'Месяц ฿' },
    { key: 'amenities', type: 'comma-list', labelEn: 'Amenities', labelRu: 'Удобства' },
    { key: 'classes', type: 'comma-list', labelEn: 'Classes', labelRu: 'Классы' },
    { key: 'is_featured', type: 'switch', labelEn: 'Featured', labelRu: 'Рекомендуем' },
    { key: 'is_active', type: 'switch', labelEn: 'Active', labelRu: 'Активно', defaultValue: true },
  ],
};

export default function AdminGyms() {
  const hook = useAdminGyms();
  const adapted = {
    items: (hook as any).gyms || (hook as any).items || [],
    isLoading: hook.isLoading,
    createItem: async (data: any) => (hook as any).createGym?.(data) ?? (hook as any).createItem?.(data),
    updateItem: async (data: any) => {
      const { id, ...rest } = data;
      return (hook as any).updateGym?.(id, rest) ?? (hook as any).updateItem?.(data);
    },
    deleteItem: async (id: string) => (hook as any).deleteGym?.(id) ?? (hook as any).deleteItem?.(id),
  };
  return <AdminVerticalCRUD config={config} hook={adapted} />;
}
