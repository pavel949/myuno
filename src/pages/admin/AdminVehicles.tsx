import React from 'react';
import { Car } from 'lucide-react';
import { AdminVerticalCRUD, type AdminVerticalConfig } from '@/components/admin/AdminVerticalCRUD';
import { useAdminVehicles } from '@/hooks/useAdminContent';

const vehicleTypes = [
  { value: 'car', label: 'Car', labelRu: 'Автомобиль' },
  { value: 'suv', label: 'SUV', labelRu: 'Внедорожник' },
  { value: 'motorcycle', label: 'Motorcycle', labelRu: 'Мотоцикл' },
  { value: 'scooter', label: 'Scooter', labelRu: 'Скутер' },
  { value: 'van', label: 'Van', labelRu: 'Минивэн' },
  { value: 'luxury', label: 'Luxury', labelRu: 'Люкс' },
];

const config: AdminVerticalConfig = {
  titleEn: 'Vehicle Management',
  titleRu: 'Управление транспортом',
  icon: Car,
  typeField: 'vehicle_type',
  typeOptions: vehicleTypes,
  subtitleField: 'district',
  priceField: 'price_per_day',
  fields: [
    { key: 'name_en', type: 'text', labelEn: 'Name (EN)', labelRu: 'Название (EN)', required: true },
    { key: 'name_ru', type: 'text', labelEn: 'Name (RU)', labelRu: 'Название (RU)' },
    { key: 'vehicle_type', type: 'select', labelEn: 'Type', labelRu: 'Тип', options: vehicleTypes, defaultValue: 'car', colSpan: 12 },
    { key: 'description_en', type: 'textarea', labelEn: 'Description (EN)', labelRu: 'Описание (EN)' },
    { key: 'description_ru', type: 'textarea', labelEn: 'Description (RU)', labelRu: 'Описание (RU)' },
    { key: 'cover_image', type: 'image', labelEn: 'Cover Image', labelRu: 'Обложка', colSpan: 12 },
    { key: 'images', type: 'multi-image', labelEn: 'Gallery', labelRu: 'Галерея', colSpan: 12 },
    { key: 'brand', type: 'text', labelEn: 'Brand', labelRu: 'Марка' },
    { key: 'model', type: 'text', labelEn: 'Model', labelRu: 'Модель' },
    { key: 'year', type: 'number', labelEn: 'Year', labelRu: 'Год' },
    { key: 'seats', type: 'number', labelEn: 'Seats', labelRu: 'Мест' },
    { key: 'price_per_day', type: 'number', labelEn: 'Price/Day ฿', labelRu: 'Цена/день ฿' },
    { key: 'price_per_week', type: 'number', labelEn: 'Price/Week ฿', labelRu: 'Цена/неделя ฿' },
    { key: 'price_per_month', type: 'number', labelEn: 'Price/Month ฿', labelRu: 'Цена/месяц ฿' },
    { key: 'is_featured', type: 'switch', labelEn: 'Featured', labelRu: 'Рекомендуем' },
    { key: 'is_active', type: 'switch', labelEn: 'Active', labelRu: 'Активно', defaultValue: true },
  ],
};

export default function AdminVehicles() {
  const hook = useAdminVehicles();
  const adapted = {
    items: (hook as any).vehicles || (hook as any).items || [],
    isLoading: hook.isLoading,
    createItem: async (data: any) => (hook as any).createVehicle?.(data) ?? (hook as any).createItem?.(data),
    updateItem: async (data: any) => {
      const { id, ...rest } = data;
      return (hook as any).updateVehicle?.(id, rest) ?? (hook as any).updateItem?.(data);
    },
    deleteItem: async (id: string) => (hook as any).deleteVehicle?.(id) ?? (hook as any).deleteItem?.(id),
  };
  return <AdminVerticalCRUD config={config} hook={adapted} />;
}
