import React from 'react';
import { Scissors } from 'lucide-react';
import { AdminVerticalCRUD, type AdminVerticalConfig } from '@/components/admin/AdminVerticalCRUD';
import { useAdminSalons } from '@/hooks/useAdminContent';

const salonTypes = [
  { value: 'hair', label: 'Hair Salon', labelRu: 'Парикмахерская' },
  { value: 'nail', label: 'Nail Salon', labelRu: 'Ногтевой сервис' },
  { value: 'spa', label: 'Spa', labelRu: 'Спа' },
  { value: 'beauty', label: 'Beauty Salon', labelRu: 'Салон красоты' },
  { value: 'massage', label: 'Massage', labelRu: 'Массаж' },
  { value: 'barbershop', label: 'Barbershop', labelRu: 'Барбершоп' },
];

const config: AdminVerticalConfig = {
  titleEn: 'Salon Management',
  titleRu: 'Управление салонами',
  icon: Scissors,
  typeField: 'salon_type',
  typeOptions: salonTypes,
  subtitleField: 'district',
  priceField: 'price_from',
  fields: [
    { key: 'name_en', type: 'text', labelEn: 'Name (EN)', labelRu: 'Название (EN)', required: true },
    { key: 'name_ru', type: 'text', labelEn: 'Name (RU)', labelRu: 'Название (RU)' },
    { key: 'salon_type', type: 'select', labelEn: 'Type', labelRu: 'Тип', options: salonTypes, defaultValue: 'beauty', colSpan: 12 },
    { key: 'description_en', type: 'textarea', labelEn: 'Description (EN)', labelRu: 'Описание (EN)' },
    { key: 'description_ru', type: 'textarea', labelEn: 'Description (RU)', labelRu: 'Описание (RU)' },
    { key: 'cover_image', type: 'image', labelEn: 'Cover Image', labelRu: 'Обложка', colSpan: 12 },
    { key: 'images', type: 'multi-image', labelEn: 'Gallery', labelRu: 'Галерея', colSpan: 12 },
    { key: 'address', type: 'text', labelEn: 'Address', labelRu: 'Адрес' },
    { key: 'district', type: 'text', labelEn: 'District', labelRu: 'Район' },
    { key: 'phone', type: 'text', labelEn: 'Phone', labelRu: 'Телефон' },
    { key: 'email', type: 'text', labelEn: 'Email', labelRu: 'Email' },
    { key: 'price_from', type: 'number', labelEn: 'Price From ฿', labelRu: 'Цена от ฿' },
    { key: 'is_featured', type: 'switch', labelEn: 'Featured', labelRu: 'Рекомендуем' },
    { key: 'is_active', type: 'switch', labelEn: 'Active', labelRu: 'Активно', defaultValue: true },
  ],
};

export default function AdminSalons() {
  const hook = useAdminSalons();
  // Adapt hook shape: useAdminSalons returns { salons, createSalon, updateSalon, deleteSalon }
  const adapted = {
    items: (hook as any).salons || (hook as any).items || [],
    isLoading: hook.isLoading,
    createItem: async (data: any) => (hook as any).createSalon?.(data) ?? (hook as any).createItem?.(data),
    updateItem: async (data: any) => {
      const { id, ...rest } = data;
      return (hook as any).updateSalon?.(id, rest) ?? (hook as any).updateItem?.(data);
    },
    deleteItem: async (id: string) => (hook as any).deleteSalon?.(id) ?? (hook as any).deleteItem?.(id),
  };
  return <AdminVerticalCRUD config={config} hook={adapted} />;
}
