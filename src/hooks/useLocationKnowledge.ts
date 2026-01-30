import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/contexts/LocationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface KnowledgeSection {
  id: string;
  city_id: string;
  section: string;
  slug: string;
  title_en: string;
  title_ru: string;
  content_en: string | null;
  content_ru: string | null;
  summary_en: string | null;
  summary_ru: string | null;
  icon: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalizedKnowledge {
  id: string;
  section: string;
  slug: string;
  title: string;
  content: string;
  summary: string;
  icon: string | null;
  sort_order: number;
}

// Knowledge section types
export const KNOWLEDGE_SECTIONS = [
  { id: 'overview', icon: 'Globe', labelEn: 'Overview', labelRu: 'Обзор' },
  { id: 'culture', icon: 'Landmark', labelEn: 'Culture & History', labelRu: 'Культура и история' },
  { id: 'dos-donts', icon: 'CheckCircle', labelEn: "Do's & Don'ts", labelRu: 'Что делать / не делать' },
  { id: 'government', icon: 'Building2', labelEn: 'Government & Embassies', labelRu: 'Госорганы и посольства' },
  { id: 'nature', icon: 'TreePine', labelEn: 'Nature & Wildlife', labelRu: 'Природа и фауна' },
  { id: 'practical', icon: 'Briefcase', labelEn: 'Practical Info', labelRu: 'Практическая информация' },
  { id: 'emergency', icon: 'AlertTriangle', labelEn: 'Emergency', labelRu: 'Экстренные случаи' },
] as const;

/**
 * Fetch all knowledge sections for a city (for hub page)
 */
export function useKnowledgeSections() {
  const { currentCity } = useLocation();
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['location-knowledge', 'sections', currentCity?.id],
    queryFn: async (): Promise<LocalizedKnowledge[]> => {
      if (!currentCity?.id) return [];

      const { data, error } = await supabase
        .from('location_knowledge')
        .select('*')
        .eq('city_id', currentCity.id)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Localize the data
      return (data || []).map((item) => ({
        id: item.id,
        section: item.section,
        slug: item.slug,
        title: language === 'ru' ? (item.title_ru || item.title_en) : item.title_en,
        content: language === 'ru' ? (item.content_ru || item.content_en || '') : (item.content_en || ''),
        summary: language === 'ru' ? (item.summary_ru || item.summary_en || '') : (item.summary_en || ''),
        icon: item.icon,
        sort_order: item.sort_order || 0,
      }));
    },
    enabled: !!currentCity?.id,
    ...CACHE_PROFILES.SEMI_STATIC,
  });
}

/**
 * Fetch knowledge items for a specific section
 */
export function useKnowledgeBySection(section: string) {
  const { currentCity } = useLocation();
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['location-knowledge', 'section', currentCity?.id, section],
    queryFn: async (): Promise<LocalizedKnowledge[]> => {
      if (!currentCity?.id) return [];

      const { data, error } = await supabase
        .from('location_knowledge')
        .select('*')
        .eq('city_id', currentCity.id)
        .eq('section', section)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        section: item.section,
        slug: item.slug,
        title: language === 'ru' ? (item.title_ru || item.title_en) : item.title_en,
        content: language === 'ru' ? (item.content_ru || item.content_en || '') : (item.content_en || ''),
        summary: language === 'ru' ? (item.summary_ru || item.summary_en || '') : (item.summary_en || ''),
        icon: item.icon,
        sort_order: item.sort_order || 0,
      }));
    },
    enabled: !!currentCity?.id && !!section,
    ...CACHE_PROFILES.SEMI_STATIC,
  });
}

/**
 * Fetch a single knowledge article by slug
 */
export function useKnowledgeArticle(section: string, slug: string) {
  const { currentCity } = useLocation();
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['location-knowledge', 'article', currentCity?.id, section, slug],
    queryFn: async (): Promise<LocalizedKnowledge | null> => {
      if (!currentCity?.id) return null;

      const { data, error } = await supabase
        .from('location_knowledge')
        .select('*')
        .eq('city_id', currentCity.id)
        .eq('section', section)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        id: data.id,
        section: data.section,
        slug: data.slug,
        title: language === 'ru' ? (data.title_ru || data.title_en) : data.title_en,
        content: language === 'ru' ? (data.content_ru || data.content_en || '') : (data.content_en || ''),
        summary: language === 'ru' ? (data.summary_ru || data.summary_en || '') : (data.summary_en || ''),
        icon: data.icon,
        sort_order: data.sort_order || 0,
      };
    },
    enabled: !!currentCity?.id && !!section && !!slug,
    ...CACHE_PROFILES.SEMI_STATIC,
  });
}

/**
 * Get section metadata
 */
export function getSectionMeta(sectionId: string, language: 'en' | 'ru') {
  const section = KNOWLEDGE_SECTIONS.find(s => s.id === sectionId);
  if (!section) return null;
  
  return {
    id: section.id,
    icon: section.icon,
    label: language === 'ru' ? section.labelRu : section.labelEn,
  };
}
