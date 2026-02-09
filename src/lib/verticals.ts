 /**
  * @module Verticals
  * @description Canonical registry of all business verticals
  * 
  * This is the SINGLE SOURCE OF TRUTH for vertical identifiers.
  * All other files must import from here.
  * 
  * Convention: Use SINGULAR form for `id` (database, orders, internal systems)
  * Use `plural` for URL slugs and UI labels where appropriate
  */
 
 export interface VerticalDefinition {
   /** Singular ID - used in database, orders, internal systems */
   id: string;
   /** Plural form - used in URLs and some UI contexts */
   plural: string;
   /** Primary database table name */
   table: string;
   /** Emoji icon for quick visual identification */
   icon: string;
   /** English label */
   labelEn: string;
   /** Russian label */
   labelRu: string;
   /** Whether this vertical supports booking/ordering */
   bookable: boolean;
   /** Related order_type value (if different from id) */
   orderType?: string;
 }
 
export const VERTICALS = {
 PROPERTY: {
    id: 'property',
    plural: 'properties',
    table: 'properties',
    icon: '🏠',
    labelEn: 'Real Estate',
    labelRu: 'Недвижимость',
    bookable: true,
  },
   YACHT: {
     id: 'yacht',
     plural: 'yachts',
     table: 'yachts',
     icon: '🚤',
     labelEn: 'Yacht Charter',
     labelRu: 'Яхт-чартер',
     bookable: true,
   },
   VEHICLE: {
     id: 'vehicle',
     plural: 'vehicles',
     table: 'vehicles',
     icon: '🚗',
     labelEn: 'Car & Bike Rental',
     labelRu: 'Аренда авто и мото',
     bookable: true,
   },
   EXPERIENCE: {
     id: 'experience',
     plural: 'experiences',
     table: 'experiences',
     icon: '✨',
     labelEn: 'Things To Do',
     labelRu: 'Чем заняться',
     bookable: true,
     orderType: 'activity',
   },
   CLEANING: {
     id: 'cleaning',
     plural: 'cleaning',
     table: 'cleaning_services',
     icon: '🧹',
     labelEn: 'Home Cleaning',
     labelRu: 'Клининг',
     bookable: true,
   },
   BABYSITTER: {
     id: 'babysitter',
     plural: 'babysitters',
     table: 'babysitters',
     icon: '👶',
     labelEn: 'Childcare',
     labelRu: 'Присмотр за детьми',
     bookable: true,
   },
   BEAUTY: {
     id: 'beauty',
     plural: 'salons',
     table: 'salons',
     icon: '💇',
     labelEn: 'Beauty & Wellness',
     labelRu: 'Красота и велнес',
     bookable: true,
   },
   RESTAURANT: {
     id: 'restaurant',
     plural: 'restaurants',
     table: 'restaurants',
     icon: '🍽️',
     labelEn: 'Restaurants',
     labelRu: 'Рестораны',
     bookable: true,
     orderType: 'food',
   },
   MEDICAL: {
     id: 'medical',
     plural: 'clinics',
     table: 'clinics',
     icon: '🏥',
     labelEn: 'Healthcare',
     labelRu: 'Здоровье',
     bookable: true,
   },
   LEGAL: {
     id: 'legal',
     plural: 'legal',
     table: 'legal_services',
     icon: '⚖️',
     labelEn: 'Legal Services',
     labelRu: 'Юридические услуги',
     bookable: true,
   },
   EDUCATION: {
     id: 'education',
     plural: 'education',
     table: 'education_providers',
     icon: '📚',
     labelEn: 'Education & Courses',
     labelRu: 'Образование',
     bookable: true,
   },
   FITNESS: {
     id: 'fitness',
     plural: 'gyms',
     table: 'gyms',
     icon: '🏋️',
     labelEn: 'Fitness & Gyms',
     labelRu: 'Фитнес и залы',
     bookable: true,
     orderType: 'activity',
   },
   EVENT: {
     id: 'event',
     plural: 'events',
     table: 'events',
     icon: '🎉',
     labelEn: 'Events',
     labelRu: 'События',
     bookable: true,
   },
   WATER_ACTIVITY: {
     id: 'water_activity',
     plural: 'water_activities',
     table: 'water_activities',
     icon: '🏄',
     labelEn: 'Water Sports',
     labelRu: 'Водный спорт',
     bookable: true,
     orderType: 'activity',
   },
   PET_SERVICE: {
     id: 'pet_service',
     plural: 'pets',
     table: 'pet_services',
     icon: '🐾',
     labelEn: 'Pet Care',
     labelRu: 'Уход за питомцами',
     bookable: true,
   },
   FLOWER: {
     id: 'flower',
     plural: 'flowers',
     table: 'flower_shops',
     icon: '💐',
     labelEn: 'Flower Delivery',
     labelRu: 'Доставка цветов',
     bookable: true,
     orderType: 'flowers',
   },
   INSURANCE: {
      id: 'insurance',
      plural: 'insurance',
      table: 'insurance_providers',
      icon: '🛡️',
      labelEn: 'Insurance',
      labelRu: 'Страхование',
      bookable: false,
    },
    TRANSFER: {
      id: 'transfer',
      plural: 'transfers',
      table: 'transfers',
      icon: '🚕',
      labelEn: 'Airport & City Transfers',
      labelRu: 'Трансферы',
      bookable: true,
    },
  } as const;
 
 export type VerticalKey = keyof typeof VERTICALS;
 export type VerticalId = typeof VERTICALS[VerticalKey]['id'];
 
 // Helper functions
 export function getVerticalById(id: string): VerticalDefinition | undefined {
   return Object.values(VERTICALS).find(v => v.id === id || v.plural === id);
 }
 
 export function getVerticalByPlural(plural: string): VerticalDefinition | undefined {
   return Object.values(VERTICALS).find(v => v.plural === plural);
 }
 
 export function getVerticalByTable(table: string): VerticalDefinition | undefined {
   return Object.values(VERTICALS).find(v => v.table === table);
 }
 
 /** Get all vertical IDs (singular form) */
 export function getAllVerticalIds(): string[] {
   return Object.values(VERTICALS).map(v => v.id);
 }
 
 /** Get all vertical plurals for URL routing */
 export function getAllVerticalPluralIds(): string[] {
   return Object.values(VERTICALS).map(v => v.plural);
 }
 
 /** Map legacy plural ID to canonical singular ID */
 export function normalizeVerticalId(id: string): string {
   const vertical = getVerticalById(id);
   return vertical?.id || id;
 }
 
 /** Get order_type for a vertical (some verticals map to different order types) */
 export function getOrderTypeForVertical(verticalId: string): string {
   const vertical = getVerticalById(verticalId);
   return vertical?.orderType || vertical?.id || verticalId;
 }