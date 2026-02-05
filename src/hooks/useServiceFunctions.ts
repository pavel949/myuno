 import { useMemo } from 'react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import {
   HOME_SERVICE_FUNCTIONS,
   SERVICE_CATEGORIES,
   getServiceFunctionById,
   getServiceFunctionsByCategory,
   getPopularServiceFunctions,
   searchServiceFunctions,
   type ServiceFunction,
   type ServiceCategory,
   type ServiceCategoryConfig,
 } from '@/lib/config/homeServiceFunctions';
 
 export interface LocalizedServiceFunction {
   id: string;
   category: ServiceCategory;
   name: string;
   description: string;
   icon: string;
   basePrice: number;
   currency: string;
   estimatedTime: string;
   includes: string[];
   isPopular?: boolean;
   isUrgent?: boolean;
   sortOrder: number;
   // Keep originals for reference
   raw: ServiceFunction;
 }
 
 export interface LocalizedCategoryConfig {
   id: ServiceCategory;
   name: string;
   icon: string;
   color: string;
   sortOrder: number;
 }
 
 export function useServiceFunctions() {
   const { language } = useLanguage();
   const isRu = language === 'ru';
 
   // Localize all functions
   const functions = useMemo<LocalizedServiceFunction[]>(() => {
     return HOME_SERVICE_FUNCTIONS.map(f => ({
       id: f.id,
       category: f.category,
       name: isRu ? f.nameRu : f.nameEn,
       description: isRu ? f.descriptionRu : f.descriptionEn,
       icon: f.icon,
       basePrice: f.basePrice,
       currency: f.currency,
       estimatedTime: isRu ? f.estimatedTimeRu : f.estimatedTimeEn,
       includes: isRu ? f.includesRu : f.includesEn,
       isPopular: f.isPopular,
       isUrgent: f.isUrgent,
       sortOrder: f.sortOrder,
       raw: f,
     }));
   }, [isRu]);
 
   // Localize categories
   const categories = useMemo<LocalizedCategoryConfig[]>(() => {
     return SERVICE_CATEGORIES.map(c => ({
       id: c.id,
       name: isRu ? c.nameRu : c.nameEn,
       icon: c.icon,
       color: c.color,
       sortOrder: c.sortOrder,
     }));
   }, [isRu]);
 
   // Group by category
   const byCategory = useMemo(() => {
     const grouped: Record<ServiceCategory, LocalizedServiceFunction[]> = {} as Record<ServiceCategory, LocalizedServiceFunction[]>;
     
     SERVICE_CATEGORIES.forEach(cat => {
       grouped[cat.id] = functions.filter(f => f.category === cat.id).sort((a, b) => a.sortOrder - b.sortOrder);
     });
     
     return grouped;
   }, [functions]);
 
   // Popular functions
   const popular = useMemo(() => {
     return functions.filter(f => f.isPopular).slice(0, 8);
   }, [functions]);
 
   // Get function by ID with localization
   const getFunction = (id: string): LocalizedServiceFunction | undefined => {
     return functions.find(f => f.id === id);
   };
 
   // Get raw function by ID
   const getRawFunction = (id: string): ServiceFunction | undefined => {
     return getServiceFunctionById(id);
   };
 
   // Search functions
   const search = (query: string): LocalizedServiceFunction[] => {
     if (!query.trim()) return functions;
     
     const lowerQuery = query.toLowerCase();
     return functions.filter(f => 
       f.name.toLowerCase().includes(lowerQuery) || 
       f.description.toLowerCase().includes(lowerQuery)
     );
   };
 
   // Get functions by category
   const getFunctionsByCategory = (category: ServiceCategory): LocalizedServiceFunction[] => {
     return byCategory[category] || [];
   };
 
   return {
     functions,
     categories,
     byCategory,
     popular,
     getFunction,
     getRawFunction,
     search,
     getFunctionsByCategory,
     isLoading: false, // Static data, always loaded
   };
 }