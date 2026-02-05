 /**
  * Restaurant Taxonomy - Single Source of Truth
  * Covers: Restaurants, Cafes, Food Delivery
  */
 
 export type CuisineType =
   | 'thai'
   | 'japanese'
   | 'chinese'
   | 'korean'
   | 'indian'
   | 'italian'
   | 'french'
   | 'american'
   | 'mexican'
   | 'mediterranean'
   | 'seafood'
   | 'vegetarian'
   | 'vegan'
   | 'fusion'
   | 'international';
 
 export type VenueType = 'restaurant' | 'cafe' | 'bar' | 'beach_club' | 'food_court' | 'street_food' | 'fine_dining';
 export type PriceRange = 'budget' | 'moderate' | 'upscale' | 'fine_dining';
 export type DietaryOption = 'vegetarian' | 'vegan' | 'gluten_free' | 'halal' | 'kosher' | 'organic';
 export type ServiceType = 'dine_in' | 'takeaway' | 'delivery' | 'catering';
 
 export interface CuisineConfig {
   id: CuisineType;
   labelEn: string;
   labelRu: string;
   icon: string;
   popular?: boolean;
 }
 
 export interface VenueTypeConfig {
   id: VenueType;
   labelEn: string;
   labelRu: string;
   icon: string;
 }
 
 export interface PriceRangeConfig {
   id: PriceRange;
   labelEn: string;
   labelRu: string;
   icon: string;
   description: string;
 }
 
 // ====== CUISINES ======
 export const CUISINES: CuisineConfig[] = [
   { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская', icon: '🇹🇭', popular: true },
   { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская', icon: '🍣', popular: true },
   { id: 'chinese', labelEn: 'Chinese', labelRu: 'Китайская', icon: '🥡' },
   { id: 'korean', labelEn: 'Korean', labelRu: 'Корейская', icon: '🍜' },
   { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская', icon: '🍛' },
   { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская', icon: '🍝', popular: true },
   { id: 'french', labelEn: 'French', labelRu: 'Французская', icon: '🥐' },
   { id: 'american', labelEn: 'American', labelRu: 'Американская', icon: '🍔' },
   { id: 'mexican', labelEn: 'Mexican', labelRu: 'Мексиканская', icon: '🌮' },
   { id: 'mediterranean', labelEn: 'Mediterranean', labelRu: 'Средиземноморская', icon: '🫒' },
   { id: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты', icon: '🦐', popular: true },
   { id: 'vegetarian', labelEn: 'Vegetarian', labelRu: 'Вегетарианская', icon: '🥗' },
   { id: 'vegan', labelEn: 'Vegan', labelRu: 'Веганская', icon: '🌱' },
   { id: 'fusion', labelEn: 'Fusion', labelRu: 'Фьюжн', icon: '🍴' },
   { id: 'international', labelEn: 'International', labelRu: 'Интернациональная', icon: '🌍' },
 ];
 
 // ====== VENUE TYPES ======
 export const VENUE_TYPES: VenueTypeConfig[] = [
   { id: 'restaurant', labelEn: 'Restaurant', labelRu: 'Ресторан', icon: '🍽️' },
   { id: 'cafe', labelEn: 'Café', labelRu: 'Кафе', icon: '☕' },
   { id: 'bar', labelEn: 'Bar', labelRu: 'Бар', icon: '🍸' },
   { id: 'beach_club', labelEn: 'Beach Club', labelRu: 'Бич-клуб', icon: '🏖️' },
   { id: 'food_court', labelEn: 'Food Court', labelRu: 'Фуд-корт', icon: '🏬' },
   { id: 'street_food', labelEn: 'Street Food', labelRu: 'Уличная еда', icon: '🍢' },
   { id: 'fine_dining', labelEn: 'Fine Dining', labelRu: 'Изысканная кухня', icon: '🥂' },
 ];
 
 // ====== PRICE RANGES ======
 export const PRICE_RANGES: PriceRangeConfig[] = [
   { id: 'budget', labelEn: '฿', labelRu: '฿', icon: '฿', description: 'Under ฿200/person' },
   { id: 'moderate', labelEn: '฿฿', labelRu: '฿฿', icon: '฿฿', description: '฿200-500/person' },
   { id: 'upscale', labelEn: '฿฿฿', labelRu: '฿฿฿', icon: '฿฿฿', description: '฿500-1500/person' },
   { id: 'fine_dining', labelEn: '฿฿฿฿', labelRu: '฿฿฿฿', icon: '฿฿฿฿', description: 'Over ฿1500/person' },
 ];
 
 // ====== DIETARY OPTIONS ======
 export const DIETARY_OPTIONS: { id: DietaryOption; labelEn: string; labelRu: string; icon: string }[] = [
   { id: 'vegetarian', labelEn: 'Vegetarian', labelRu: 'Вегетарианское', icon: '🥕' },
   { id: 'vegan', labelEn: 'Vegan', labelRu: 'Веганское', icon: '🌱' },
   { id: 'gluten_free', labelEn: 'Gluten-Free', labelRu: 'Без глютена', icon: '🌾' },
   { id: 'halal', labelEn: 'Halal', labelRu: 'Халяль', icon: '🕌' },
   { id: 'kosher', labelEn: 'Kosher', labelRu: 'Кошерное', icon: '✡️' },
   { id: 'organic', labelEn: 'Organic', labelRu: 'Органическое', icon: '🌿' },
 ];
 
 // ====== SERVICE TYPES ======
 export const SERVICE_TYPES: { id: ServiceType; labelEn: string; labelRu: string; icon: string }[] = [
   { id: 'dine_in', labelEn: 'Dine In', labelRu: 'В заведении', icon: '🪑' },
   { id: 'takeaway', labelEn: 'Takeaway', labelRu: 'С собой', icon: '🥡' },
   { id: 'delivery', labelEn: 'Delivery', labelRu: 'Доставка', icon: '🛵' },
   { id: 'catering', labelEn: 'Catering', labelRu: 'Кейтеринг', icon: '🍱' },
 ];
 
 // ====== AMENITIES ======
 export const RESTAURANT_AMENITIES = [
   { id: 'wifi', labelEn: 'Free WiFi', labelRu: 'Бесплатный WiFi', icon: '📶' },
   { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
   { id: 'outdoor_seating', labelEn: 'Outdoor Seating', labelRu: 'Терраса', icon: '🌳' },
   { id: 'live_music', labelEn: 'Live Music', labelRu: 'Живая музыка', icon: '🎵' },
   { id: 'sea_view', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊' },
   { id: 'pool', labelEn: 'Pool', labelRu: 'Бассейн', icon: '🏊' },
   { id: 'kids_friendly', labelEn: 'Kid Friendly', labelRu: 'Для детей', icon: '👶' },
   { id: 'pet_friendly', labelEn: 'Pet Friendly', labelRu: 'С питомцами', icon: '🐕' },
   { id: 'private_room', labelEn: 'Private Room', labelRu: 'Приватный зал', icon: '🚪' },
   { id: 'air_conditioning', labelEn: 'A/C', labelRu: 'Кондиционер', icon: '❄️' },
   { id: 'wheelchair', labelEn: 'Wheelchair Access', labelRu: 'Доступ для колясок', icon: '♿' },
 ] as const;
 
 // ====== MAPS ======
 export const CUISINE_MAP: Record<string, CuisineConfig> = Object.fromEntries(
   CUISINES.map(c => [c.id, c])
 );
 
 export const VENUE_TYPE_MAP: Record<string, VenueTypeConfig> = Object.fromEntries(
   VENUE_TYPES.map(v => [v.id, v])
 );
 
 // ====== HELPER FUNCTIONS ======
 export function getCuisineLabel(id: string, language: 'en' | 'ru'): string {
   const cuisine = CUISINE_MAP[id];
   return language === 'ru' ? (cuisine?.labelRu || id) : (cuisine?.labelEn || id);
 }
 
 export function getVenueTypeLabel(id: string, language: 'en' | 'ru'): string {
   const venue = VENUE_TYPE_MAP[id];
   return language === 'ru' ? (venue?.labelRu || id) : (venue?.labelEn || id);
 }
 
 export function getPopularCuisines(): CuisineConfig[] {
   return CUISINES.filter(c => c.popular);
 }