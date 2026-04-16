import React from 'react';
import { Stethoscope } from 'lucide-react';
import { AdminVerticalCRUD, type AdminVerticalConfig } from '@/components/admin/AdminVerticalCRUD';
import { useAdminClinics } from '@/hooks/useAdminContent';

const clinicTypes = [
  { value: 'general', label: 'General Clinic', labelRu: 'Общая клиника' },
  { value: 'dental', label: 'Dental', labelRu: 'Стоматология' },
  { value: 'hospital', label: 'Hospital', labelRu: 'Госпиталь' },
  { value: 'pediatric', label: 'Pediatric', labelRu: 'Педиатрия' },
  { value: 'dermatology', label: 'Dermatology', labelRu: 'Дерматология' },
  { value: 'eye', label: 'Eye Clinic', labelRu: 'Офтальмология' },
  { value: 'wellness', label: 'Wellness Center', labelRu: 'Велнес центр' },
];

const config: AdminVerticalConfig = {
  titleEn: 'Clinic Management',
  titleRu: 'Управление клиниками',
  icon: Stethoscope,
  typeField: 'clinic_type',
  typeOptions: clinicTypes,
  subtitleField: 'district',
  priceField: 'consultation_price',
  fields: [
    { key: 'name_en', type: 'text', labelEn: 'Name (EN)', labelRu: 'Название (EN)', required: true },
    { key: 'name_ru', type: 'text', labelEn: 'Name (RU)', labelRu: 'Название (RU)' },
    { key: 'clinic_type', type: 'select', labelEn: 'Type', labelRu: 'Тип', options: clinicTypes, defaultValue: 'general', colSpan: 12 },
    { key: 'description_en', type: 'textarea', labelEn: 'Description (EN)', labelRu: 'Описание (EN)' },
    { key: 'description_ru', type: 'textarea', labelEn: 'Description (RU)', labelRu: 'Описание (RU)' },
    { key: 'cover_image', type: 'image', labelEn: 'Cover Image', labelRu: 'Обложка', colSpan: 12 },
    { key: 'images', type: 'multi-image', labelEn: 'Gallery', labelRu: 'Галерея', colSpan: 12 },
    { key: 'address', type: 'text', labelEn: 'Address', labelRu: 'Адрес' },
    { key: 'district', type: 'text', labelEn: 'District', labelRu: 'Район' },
    { key: 'phone', type: 'text', labelEn: 'Phone', labelRu: 'Телефон' },
    { key: 'email', type: 'text', labelEn: 'Email', labelRu: 'Email' },
    { key: 'consultation_price', type: 'number', labelEn: 'Consultation ฿', labelRu: 'Консультация ฿' },
    { key: 'specialty', type: 'comma-list', labelEn: 'Specialties', labelRu: 'Специализации' },
    { key: 'languages', type: 'comma-list', labelEn: 'Languages', labelRu: 'Языки' },
    { key: 'is_24h', type: 'switch', labelEn: '24/7', labelRu: '24/7' },
    { key: 'is_featured', type: 'switch', labelEn: 'Featured', labelRu: 'Рекомендуем' },
    { key: 'is_active', type: 'switch', labelEn: 'Active', labelRu: 'Активно', defaultValue: true },
  ],
};

export default function AdminClinics() {
  const hook = useAdminClinics();
  const adapted = {
    items: (hook as any).clinics || (hook as any).items || [],
    isLoading: hook.isLoading,
    createItem: async (data: any) => (hook as any).createClinic?.(data) ?? (hook as any).createItem?.(data),
    updateItem: async (data: any) => {
      const { id, ...rest } = data;
      return (hook as any).updateClinic?.(id, rest) ?? (hook as any).updateItem?.(data);
    },
    deleteItem: async (id: string) => (hook as any).deleteClinic?.(id) ?? (hook as any).deleteItem?.(id),
  };
  return <AdminVerticalCRUD config={config} hook={adapted} />;
}
