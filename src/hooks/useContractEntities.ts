 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 
 interface EntityOption {
   id: string;
   name: string;
   name_ru?: string;
 }
 
 interface EntityData {
   providers: EntityOption[];
   vendors: EntityOption[];
   pm_companies: EntityOption[];
   projects: EntityOption[];
 }
 
 export function useContractEntities() {
   const [entities, setEntities] = useState<EntityData>({
     providers: [],
     vendors: [],
     pm_companies: [],
     projects: [],
   });
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     const fetchEntities = async () => {
       setIsLoading(true);
       try {
         // Fetch providers
         const { data: providers } = await supabase
           .from('providers')
           .select('id, name')
           .eq('is_active', true)
           .order('name');
 
         // Fetch vendors
         const { data: vendors } = await supabase
           .from('marketplace_vendors')
           .select('id, name_en, name_ru')
           .eq('is_active', true)
           .order('name_en');
 
         // Fetch PM companies
         const { data: pmCompanies } = await supabase
           .from('property_management_companies')
           .select('id, name, name_ru')
           .eq('is_active', true)
           .order('name');
 
         setEntities({
           providers: (providers || []).map(p => ({ id: p.id, name: p.name })),
           vendors: (vendors || []).map(v => ({ id: v.id, name: v.name_en, name_ru: v.name_ru })),
           pm_companies: (pmCompanies || []).map(c => ({ id: c.id, name: c.name, name_ru: c.name_ru })),
           projects: [], // No projects table yet
         });
       } catch (error) {
         console.error('Error fetching entities:', error);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchEntities();
   }, []);
 
   const getEntityName = (entityType: string, entityId: string, isRu: boolean = false): string => {
     const list = entities[entityType as keyof EntityData] || [];
     const entity = list.find(e => e.id === entityId);
     if (!entity) return entityId.slice(0, 8) + '...';
     return isRu && entity.name_ru ? entity.name_ru : entity.name;
   };
 
   const getEntitiesByType = (entityType: string): EntityOption[] => {
     return entities[entityType as keyof EntityData] || [];
   };
 
   return {
     entities,
     isLoading,
     getEntityName,
     getEntitiesByType,
   };
 }