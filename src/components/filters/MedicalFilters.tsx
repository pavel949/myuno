import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== SPECIALTIES ======
export const medicalSpecialtyOptions: FilterOption[] = [
  { id: 'general', labelEn: 'General Practice', labelRu: 'Терапевт', icon: '🏥' },
  { id: 'dentist', labelEn: 'Dentist', labelRu: 'Стоматолог', icon: '🦷' },
  { id: 'dermatology', labelEn: 'Dermatology', labelRu: 'Дерматолог', icon: '🧴' },
  { id: 'pediatrics', labelEn: 'Pediatrics', labelRu: 'Педиатр', icon: '👶' },
  { id: 'orthopedics', labelEn: 'Orthopedics', labelRu: 'Ортопед', icon: '🦴' },
  { id: 'cardiology', labelEn: 'Cardiology', labelRu: 'Кардиолог', icon: '❤️' },
  { id: 'ophthalmology', labelEn: 'Ophthalmology', labelRu: 'Офтальмолог', icon: '👁️' },
  { id: 'gynecology', labelEn: 'Gynecology', labelRu: 'Гинеколог', icon: '👩‍⚕️' },
  { id: 'ent', labelEn: 'ENT', labelRu: 'ЛОР', icon: '👂' },
  { id: 'psychology', labelEn: 'Psychology', labelRu: 'Психолог', icon: '🧠' },
];

// ====== CLINIC FEATURES ======
export const clinicFeatureOptions: FilterOption[] = [
  { id: 'english-speaking', labelEn: 'English Speaking', labelRu: 'Говорят по-английски', icon: '🇬🇧' },
  { id: 'russian-speaking', labelEn: 'Russian Speaking', labelRu: 'Говорят по-русски', icon: '🇷🇺' },
  { id: '24-7', labelEn: '24/7 Available', labelRu: 'Круглосуточно', icon: '🕐' },
  { id: 'insurance', labelEn: 'Insurance Accepted', labelRu: 'Принимают страховку', icon: '🛡️' },
  { id: 'lab', labelEn: 'Lab On-Site', labelRu: 'Лаборатория', icon: '🧪' },
  { id: 'pharmacy', labelEn: 'Pharmacy On-Site', labelRu: 'Аптека', icon: '💊' },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
  { id: 'home-visit', labelEn: 'Home Visit', labelRu: 'Визит на дом', icon: '🏠' },
];

// ====== CLINIC TYPES ======
export const clinicTypeOptions: FilterOption[] = [
  { id: 'hospital', labelEn: 'Hospital', labelRu: 'Госпиталь', icon: '🏥' },
  { id: 'clinic', labelEn: 'Clinic', labelRu: 'Клиника', icon: '🩺' },
  { id: 'dental', labelEn: 'Dental Clinic', labelRu: 'Стоматология', icon: '🦷' },
  { id: 'diagnostic', labelEn: 'Diagnostic Center', labelRu: 'Диагностика', icon: '🔬' },
  { id: 'wellness', labelEn: 'Wellness Center', labelRu: 'Велнес центр', icon: '🧘' },
];

// ====== AVAILABILITY ======
export const medicalAvailabilityOptions: FilterOption[] = [
  { id: 'today', labelEn: 'Available Today', labelRu: 'Есть запись сегодня', icon: '📅' },
  { id: 'emergency', labelEn: 'Emergency', labelRu: 'Срочный приём', icon: '🚨' },
  { id: 'weekend', labelEn: 'Weekend Hours', labelRu: 'Работает в выходные', icon: '🗓️' },
];

// ====== COMPLETE MEDICAL FILTER CONFIG ======
export const medicalFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'specialty',
      titleEn: 'Specialty',
      titleRu: 'Специализация',
      type: 'multi',
      options: medicalSpecialtyOptions,
    },
    {
      id: 'clinicType',
      titleEn: 'Clinic Type',
      titleRu: 'Тип учреждения',
      type: 'single',
      options: clinicTypeOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: clinicFeatureOptions,
    },
    {
      id: 'availability',
      titleEn: 'Availability',
      titleRu: 'Доступность',
      type: 'multi',
      options: medicalAvailabilityOptions,
    },
  ],
};
