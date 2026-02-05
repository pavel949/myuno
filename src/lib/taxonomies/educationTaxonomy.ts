 /**
  * Education Taxonomy - Single Source of Truth
  * Covers: Schools, Courses, Tutoring, Language Learning
  */
 
 export type EducationType =
   | 'language'
   | 'academic'
   | 'professional'
   | 'creative'
   | 'sports'
   | 'music'
   | 'technology'
   | 'business'
   | 'kids';
 
 export type InstitutionType = 'school' | 'university' | 'language_school' | 'tutoring_center' | 'online' | 'private_tutor' | 'workshop';
 export type AgeGroup = 'kids' | 'teens' | 'adults' | 'all_ages';
 export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';
 
 export interface EducationTypeConfig {
   id: EducationType;
   labelEn: string;
   labelRu: string;
   icon: string;
   popular?: boolean;
 }
 
 export interface InstitutionTypeConfig {
   id: InstitutionType;
   labelEn: string;
   labelRu: string;
   icon: string;
 }
 
 export interface AgeGroupConfig {
   id: AgeGroup;
   labelEn: string;
   labelRu: string;
   ageRange: string;
 }
 
 // ====== EDUCATION TYPES ======
 export const EDUCATION_TYPES: EducationTypeConfig[] = [
   { id: 'language', labelEn: 'Language', labelRu: 'Языки', icon: '🗣️', popular: true },
   { id: 'academic', labelEn: 'Academic', labelRu: 'Академические', icon: '📚' },
   { id: 'professional', labelEn: 'Professional', labelRu: 'Профессиональные', icon: '💼' },
   { id: 'creative', labelEn: 'Creative', labelRu: 'Творческие', icon: '🎨', popular: true },
   { id: 'sports', labelEn: 'Sports', labelRu: 'Спорт', icon: '⚽', popular: true },
   { id: 'music', labelEn: 'Music', labelRu: 'Музыка', icon: '🎵' },
   { id: 'technology', labelEn: 'Technology', labelRu: 'Технологии', icon: '💻', popular: true },
   { id: 'business', labelEn: 'Business', labelRu: 'Бизнес', icon: '📈' },
   { id: 'kids', labelEn: 'Kids Programs', labelRu: 'Детские программы', icon: '👶', popular: true },
 ];
 
 // ====== INSTITUTION TYPES ======
 export const INSTITUTION_TYPES: InstitutionTypeConfig[] = [
   { id: 'school', labelEn: 'School', labelRu: 'Школа', icon: '🏫' },
   { id: 'university', labelEn: 'University', labelRu: 'Университет', icon: '🎓' },
   { id: 'language_school', labelEn: 'Language School', labelRu: 'Языковая школа', icon: '🗣️' },
   { id: 'tutoring_center', labelEn: 'Tutoring Center', labelRu: 'Учебный центр', icon: '✏️' },
   { id: 'online', labelEn: 'Online Course', labelRu: 'Онлайн-курс', icon: '💻' },
   { id: 'private_tutor', labelEn: 'Private Tutor', labelRu: 'Репетитор', icon: '👨‍🏫' },
   { id: 'workshop', labelEn: 'Workshop', labelRu: 'Мастер-класс', icon: '🛠️' },
 ];
 
 // ====== AGE GROUPS ======
 export const AGE_GROUPS: AgeGroupConfig[] = [
   { id: 'kids', labelEn: 'Kids', labelRu: 'Дети', ageRange: '3-12' },
   { id: 'teens', labelEn: 'Teens', labelRu: 'Подростки', ageRange: '13-17' },
   { id: 'adults', labelEn: 'Adults', labelRu: 'Взрослые', ageRange: '18+' },
   { id: 'all_ages', labelEn: 'All Ages', labelRu: 'Все возрасты', ageRange: '3+' },
 ];
 
 // ====== SKILL LEVELS ======
 export const SKILL_LEVELS: { id: SkillLevel; labelEn: string; labelRu: string; icon: string }[] = [
   { id: 'beginner', labelEn: 'Beginner', labelRu: 'Начинающий', icon: '🌱' },
   { id: 'intermediate', labelEn: 'Intermediate', labelRu: 'Средний', icon: '🌿' },
   { id: 'advanced', labelEn: 'Advanced', labelRu: 'Продвинутый', icon: '🌳' },
   { id: 'professional', labelEn: 'Professional', labelRu: 'Профессионал', icon: '🏆' },
 ];
 
 // ====== LANGUAGES OFFERED ======
 export const TEACHING_LANGUAGES = [
   { id: 'english', labelEn: 'English', labelRu: 'Английский', icon: '🇬🇧' },
   { id: 'thai', labelEn: 'Thai', labelRu: 'Тайский', icon: '🇹🇭' },
   { id: 'russian', labelEn: 'Russian', labelRu: 'Русский', icon: '🇷🇺' },
   { id: 'chinese', labelEn: 'Chinese', labelRu: 'Китайский', icon: '🇨🇳' },
   { id: 'french', labelEn: 'French', labelRu: 'Французский', icon: '🇫🇷' },
   { id: 'german', labelEn: 'German', labelRu: 'Немецкий', icon: '🇩🇪' },
   { id: 'spanish', labelEn: 'Spanish', labelRu: 'Испанский', icon: '🇪🇸' },
   { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японский', icon: '🇯🇵' },
 ] as const;
 
 // ====== COURSE FORMATS ======
 export const COURSE_FORMATS = [
   { id: 'group', labelEn: 'Group Class', labelRu: 'Группа', icon: '👥' },
   { id: 'private', labelEn: 'Private Lesson', labelRu: 'Индивидуально', icon: '👤' },
   { id: 'online', labelEn: 'Online', labelRu: 'Онлайн', icon: '💻' },
   { id: 'hybrid', labelEn: 'Hybrid', labelRu: 'Гибрид', icon: '🔄' },
   { id: 'intensive', labelEn: 'Intensive', labelRu: 'Интенсив', icon: '⚡' },
 ] as const;
 
 // ====== CERTIFICATIONS ======
 export const CERTIFICATIONS = [
   { id: 'certificate', labelEn: 'Certificate', labelRu: 'Сертификат', icon: '📜' },
   { id: 'diploma', labelEn: 'Diploma', labelRu: 'Диплом', icon: '🎓' },
   { id: 'degree', labelEn: 'Degree', labelRu: 'Степень', icon: '🏅' },
   { id: 'none', labelEn: 'No Certification', labelRu: 'Без сертификата', icon: '📋' },
 ] as const;
 
 // ====== MAPS ======
 export const EDUCATION_TYPE_MAP: Record<string, EducationTypeConfig> = Object.fromEntries(
   EDUCATION_TYPES.map(e => [e.id, e])
 );
 
 export const INSTITUTION_TYPE_MAP: Record<string, InstitutionTypeConfig> = Object.fromEntries(
   INSTITUTION_TYPES.map(i => [i.id, i])
 );
 
 // ====== HELPER FUNCTIONS ======
 export function getEducationTypeLabel(id: string, language: 'en' | 'ru'): string {
   const type = EDUCATION_TYPE_MAP[id];
   return language === 'ru' ? (type?.labelRu || id) : (type?.labelEn || id);
 }
 
 export function getInstitutionTypeLabel(id: string, language: 'en' | 'ru'): string {
   const type = INSTITUTION_TYPE_MAP[id];
   return language === 'ru' ? (type?.labelRu || id) : (type?.labelEn || id);
 }
 
 export function getPopularEducationTypes(): EducationTypeConfig[] {
   return EDUCATION_TYPES.filter(e => e.popular);
 }