 /**
  * Medical Taxonomy - Single Source of Truth
  * Covers: Clinics, Hospitals, Pharmacies, Wellness
  */
 
 export type MedicalSpecialty =
   | 'general'
   | 'dental'
   | 'dermatology'
   | 'cardiology'
   | 'orthopedics'
   | 'pediatrics'
   | 'gynecology'
   | 'ophthalmology'
   | 'ent'
   | 'neurology'
   | 'psychology'
   | 'physiotherapy'
   | 'aesthetics'
   | 'emergency';
 
 export type FacilityType = 'hospital' | 'clinic' | 'dental_clinic' | 'pharmacy' | 'wellness_center' | 'lab' | 'medical_spa';
 export type ServiceLevel = 'basic' | 'standard' | 'premium' | 'vip';
 
 export interface MedicalSpecialtyConfig {
   id: MedicalSpecialty;
   labelEn: string;
   labelRu: string;
   icon: string;
   popular?: boolean;
 }
 
 export interface FacilityTypeConfig {
   id: FacilityType;
   labelEn: string;
   labelRu: string;
   icon: string;
 }
 
 // ====== SPECIALTIES ======
 export const MEDICAL_SPECIALTIES: MedicalSpecialtyConfig[] = [
   { id: 'general', labelEn: 'General Practice', labelRu: 'Общая практика', icon: '🩺', popular: true },
   { id: 'dental', labelEn: 'Dental', labelRu: 'Стоматология', icon: '🦷', popular: true },
   { id: 'dermatology', labelEn: 'Dermatology', labelRu: 'Дерматология', icon: '🧴', popular: true },
   { id: 'cardiology', labelEn: 'Cardiology', labelRu: 'Кардиология', icon: '❤️' },
   { id: 'orthopedics', labelEn: 'Orthopedics', labelRu: 'Ортопедия', icon: '🦴' },
   { id: 'pediatrics', labelEn: 'Pediatrics', labelRu: 'Педиатрия', icon: '👶' },
   { id: 'gynecology', labelEn: 'Gynecology', labelRu: 'Гинекология', icon: '🌸' },
   { id: 'ophthalmology', labelEn: 'Ophthalmology', labelRu: 'Офтальмология', icon: '👁️' },
   { id: 'ent', labelEn: 'ENT', labelRu: 'ЛОР', icon: '👂' },
   { id: 'neurology', labelEn: 'Neurology', labelRu: 'Неврология', icon: '🧠' },
   { id: 'psychology', labelEn: 'Psychology', labelRu: 'Психология', icon: '🧘' },
   { id: 'physiotherapy', labelEn: 'Physiotherapy', labelRu: 'Физиотерапия', icon: '💆' },
   { id: 'aesthetics', labelEn: 'Aesthetics', labelRu: 'Эстетика', icon: '✨', popular: true },
   { id: 'emergency', labelEn: 'Emergency', labelRu: 'Скорая помощь', icon: '🚑' },
 ];
 
 // ====== FACILITY TYPES ======
 export const FACILITY_TYPES: FacilityTypeConfig[] = [
   { id: 'hospital', labelEn: 'Hospital', labelRu: 'Больница', icon: '🏥' },
   { id: 'clinic', labelEn: 'Clinic', labelRu: 'Клиника', icon: '🏨' },
   { id: 'dental_clinic', labelEn: 'Dental Clinic', labelRu: 'Стоматология', icon: '🦷' },
   { id: 'pharmacy', labelEn: 'Pharmacy', labelRu: 'Аптека', icon: '💊' },
   { id: 'wellness_center', labelEn: 'Wellness Center', labelRu: 'Велнес-центр', icon: '🧘' },
   { id: 'lab', labelEn: 'Laboratory', labelRu: 'Лаборатория', icon: '🔬' },
   { id: 'medical_spa', labelEn: 'Medical Spa', labelRu: 'Мед. СПА', icon: '💆' },
 ];
 
 // ====== SERVICE LEVELS ======
 export const SERVICE_LEVELS: { id: ServiceLevel; labelEn: string; labelRu: string; icon: string }[] = [
   { id: 'basic', labelEn: 'Basic', labelRu: 'Базовый', icon: '⭐' },
   { id: 'standard', labelEn: 'Standard', labelRu: 'Стандарт', icon: '⭐⭐' },
   { id: 'premium', labelEn: 'Premium', labelRu: 'Премиум', icon: '⭐⭐⭐' },
   { id: 'vip', labelEn: 'VIP', labelRu: 'VIP', icon: '👑' },
 ];
 
 // ====== LANGUAGES ======
 export const MEDICAL_LANGUAGES = [
   { id: 'en', labelEn: 'English', labelRu: 'Английский', icon: '🇬🇧' },
   { id: 'ru', labelEn: 'Russian', labelRu: 'Русский', icon: '🇷🇺' },
   { id: 'th', labelEn: 'Thai', labelRu: 'Тайский', icon: '🇹🇭' },
   { id: 'zh', labelEn: 'Chinese', labelRu: 'Китайский', icon: '🇨🇳' },
   { id: 'de', labelEn: 'German', labelRu: 'Немецкий', icon: '🇩🇪' },
   { id: 'fr', labelEn: 'French', labelRu: 'Французский', icon: '🇫🇷' },
 ] as const;
 
 // ====== AMENITIES ======
 export const MEDICAL_AMENITIES = [
   { id: '24h', labelEn: '24/7 Service', labelRu: 'Круглосуточно', icon: '🕐' },
   { id: 'insurance', labelEn: 'Insurance Accepted', labelRu: 'Принимаем страховку', icon: '🛡️' },
   { id: 'home_visit', labelEn: 'Home Visit', labelRu: 'Выезд на дом', icon: '🏠' },
   { id: 'telemedicine', labelEn: 'Telemedicine', labelRu: 'Телемедицина', icon: '💻' },
   { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
   { id: 'wheelchair', labelEn: 'Wheelchair Access', labelRu: 'Доступ для колясок', icon: '♿' },
   { id: 'pharmacy_onsite', labelEn: 'Pharmacy On-site', labelRu: 'Аптека на месте', icon: '💊' },
   { id: 'lab_onsite', labelEn: 'Lab On-site', labelRu: 'Лаборатория', icon: '🔬' },
 ] as const;
 
 // ====== MAPS ======
 export const SPECIALTY_MAP: Record<string, MedicalSpecialtyConfig> = Object.fromEntries(
   MEDICAL_SPECIALTIES.map(s => [s.id, s])
 );
 
 export const FACILITY_MAP: Record<string, FacilityTypeConfig> = Object.fromEntries(
   FACILITY_TYPES.map(f => [f.id, f])
 );
 
 // ====== HELPER FUNCTIONS ======
 export function getSpecialtyLabel(id: string, language: 'en' | 'ru'): string {
   const specialty = SPECIALTY_MAP[id];
   return language === 'ru' ? (specialty?.labelRu || id) : (specialty?.labelEn || id);
 }
 
 export function getFacilityTypeLabel(id: string, language: 'en' | 'ru'): string {
   const facility = FACILITY_MAP[id];
   return language === 'ru' ? (facility?.labelRu || id) : (facility?.labelEn || id);
 }
 
 export function getPopularSpecialties(): MedicalSpecialtyConfig[] {
   return MEDICAL_SPECIALTIES.filter(s => s.popular);
 }