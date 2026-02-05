 /**
  * @module Pricing
  * @description Canonical pricing models for all verticals
  * 
  * This is the SINGLE SOURCE OF TRUTH for pricing model identifiers.
  * All forms, admin editors, and database queries must use these values.
  */
 
 export interface PricingModelDefinition {
   id: string;
   labelEn: string;
   labelRu: string;
   /** Short suffix for display (e.g., "/hour", "/night") */
   suffixEn: string;
   suffixRu: string;
   /** Whether this model requires a quantity input */
   requiresQuantity: boolean;
   /** Applicable verticals (empty = all) */
   verticals?: readonly string[];
 }
 
 export const PRICING_MODELS = {
   FIXED: {
     id: 'fixed',
     labelEn: 'Fixed Price',
     labelRu: 'Фиксированная цена',
     suffixEn: '',
     suffixRu: '',
     requiresQuantity: false,
   },
   HOURLY: {
     id: 'per_hour',
     labelEn: 'Per Hour',
     labelRu: 'За час',
     suffixEn: '/hour',
     suffixRu: '/час',
     requiresQuantity: true,
     verticals: ['cleaning', 'babysitter', 'beauty', 'legal', 'education'],
   },
   DAILY: {
     id: 'per_day',
     labelEn: 'Per Day',
     labelRu: 'За день',
     suffixEn: '/day',
     suffixRu: '/день',
     requiresQuantity: true,
     verticals: ['vehicle', 'yacht', 'babysitter'],
   },
   NIGHTLY: {
     id: 'per_night',
     labelEn: 'Per Night',
     labelRu: 'За ночь',
     suffixEn: '/night',
     suffixRu: '/ночь',
     requiresQuantity: true,
     verticals: ['property'],
   },
   MONTHLY: {
     id: 'per_month',
     labelEn: 'Per Month',
     labelRu: 'В месяц',
     suffixEn: '/month',
     suffixRu: '/мес',
     requiresQuantity: true,
     verticals: ['property', 'fitness', 'education'],
   },
   PER_PERSON: {
     id: 'per_person',
     labelEn: 'Per Person',
     labelRu: 'За человека',
     suffixEn: '/person',
     suffixRu: '/чел',
     requiresQuantity: true,
     verticals: ['tour', 'experience', 'event', 'restaurant'],
   },
   PER_KM: {
     id: 'per_km',
     labelEn: 'Per Kilometer',
     labelRu: 'За километр',
     suffixEn: '/km',
     suffixRu: '/км',
     requiresQuantity: true,
     verticals: ['vehicle'],
   },
   PER_SESSION: {
     id: 'per_session',
     labelEn: 'Per Session',
     labelRu: 'За сеанс',
     suffixEn: '/session',
     suffixRu: '/сеанс',
     requiresQuantity: true,
     verticals: ['beauty', 'fitness', 'medical'],
   },
   PER_COURSE: {
     id: 'per_course',
     labelEn: 'Per Course',
     labelRu: 'За курс',
     suffixEn: '/course',
     suffixRu: '/курс',
     requiresQuantity: false,
     verticals: ['education'],
   },
   NEGOTIABLE: {
     id: 'negotiable',
     labelEn: 'Negotiable',
     labelRu: 'По договорённости',
     suffixEn: '',
     suffixRu: '',
     requiresQuantity: false,
   },
   FROM_PRICE: {
     id: 'from_price',
     labelEn: 'Starting From',
     labelRu: 'От',
     suffixEn: '+',
     suffixRu: '+',
     requiresQuantity: false,
   },
 } as const;
 
 export type PricingModelKey = keyof typeof PRICING_MODELS;
 export type PricingModelId = typeof PRICING_MODELS[PricingModelKey]['id'];
 
 // Helper functions
 export function getPricingModelById(id: string): PricingModelDefinition | undefined {
   const models = Object.values(PRICING_MODELS) as unknown as PricingModelDefinition[];
   return models.find(m => m.id === id);
 }
 
 export function getPricingModelsForVertical(verticalId: string): PricingModelDefinition[] {
   const models = Object.values(PRICING_MODELS) as unknown as PricingModelDefinition[];
   return models.filter(m => 
     !m.verticals || m.verticals.length === 0 || (m.verticals as readonly string[]).includes(verticalId)
   );
 }
 
 export function getAllPricingModelIds(): string[] {
   return Object.values(PRICING_MODELS).map(m => m.id);
 }
 
 /** Format price with suffix based on pricing model */
 export function formatPriceWithModel(
   price: number, 
   modelId: string, 
   currencySymbol: string,
   language: 'en' | 'ru' = 'en'
 ): string {
   const model = getPricingModelById(modelId);
   if (!model) return `${currencySymbol}${price.toLocaleString()}`;
   
   const suffix = language === 'ru' ? model.suffixRu : model.suffixEn;
   
   if (model.id === 'from_price') {
     return `от ${currencySymbol}${price.toLocaleString()}`;
   }
   
   if (model.id === 'negotiable') {
     return language === 'ru' ? 'По договорённости' : 'Negotiable';
   }
   
   return `${currencySymbol}${price.toLocaleString()}${suffix}`;
 }