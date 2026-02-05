 /**
  * Hook to fetch yacht experiences from database
  * Replaces hardcoded YACHT_EXPERIENCES array
  */
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 
 export interface YachtExperience {
   id: string;
   icon: string;
   labelEn: string;
   labelRu: string;
   descEn: string;
   descRu: string;
   price: number;
   popular?: boolean;
 }
 
 // Fallback data for when DB is unavailable
 const FALLBACK_EXPERIENCES: YachtExperience[] = [
   { id: 'sunset-dinner', icon: '🌅', labelEn: 'Sunset Dinner', labelRu: 'Ужин на закате', descEn: 'Romantic dinner with sea view', descRu: 'Романтический ужин с видом на море', price: 8000, popular: true },
   { id: 'fishing', icon: '🎣', labelEn: 'Fishing Trip', labelRu: 'Рыбалка', descEn: 'Deep sea fishing with equipment', descRu: 'Морская рыбалка со снаряжением', price: 5000 },
   { id: 'water-toys', icon: '🎢', labelEn: 'Water Toys', labelRu: 'Водные игрушки', descEn: 'Banana, tube, wakeboard & more', descRu: 'Банан, ватрушка, вейкборд и др.', price: 6000, popular: true },
   { id: 'snorkeling', icon: '🤿', labelEn: 'Snorkeling', labelRu: 'Снорклинг', descEn: 'Equipment & guide to best spots', descRu: 'Снаряжение и гид к лучшим местам', price: 3000 },
   { id: 'romantic', icon: '🥂', labelEn: 'Romantic Date', labelRu: 'Романтика', descEn: 'Champagne, flowers & private setup', descRu: 'Шампанское, цветы и приватная обстановка', price: 12000, popular: true },
   { id: 'birthday', icon: '🎂', labelEn: 'Birthday Party', labelRu: 'День рождения', descEn: 'Cake, decorations & celebration', descRu: 'Торт, декор и праздник', price: 10000 },
 ];
 
 export function useYachtExperiences() {
   return useQuery({
     queryKey: ['yacht-experiences'],
     queryFn: async (): Promise<YachtExperience[]> => {
       // Fetch from lookup_values with metadata containing prices
       const { data, error } = await supabase
         .from('lookup_values')
         .select('id, value_key, value_en, value_ru, icon, metadata, sort_order')
         .eq('lookup_type', 'yacht_experience')
         .eq('is_active', true)
         .order('sort_order');
 
       if (error || !data?.length) {
         console.warn('Using fallback yacht experiences');
         return FALLBACK_EXPERIENCES;
       }
 
       return data.map((item) => {
         const meta = item.metadata as Record<string, unknown> || {};
         return {
           id: item.value_key,
           icon: item.icon || '🚤',
           labelEn: item.value_en,
           labelRu: item.value_ru,
           descEn: (meta.desc_en as string) || item.value_en,
           descRu: (meta.desc_ru as string) || item.value_ru,
           price: (meta.price as number) || 5000,
           popular: (meta.popular as boolean) || false,
         };
       });
     },
     staleTime: 1000 * 60 * 10, // 10 minutes
   });
 }