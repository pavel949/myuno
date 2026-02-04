import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InvestmentProject {
  id: string;
  title_en: string;
  title_ru: string;
  slug: string | null;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  images: string[];
  project_type: string;
  industry: string | null;
  status: string;
  currency: string;
  funding_goal: number | null;
  amount_raised: number | null;
  min_investment: number | null;
  max_investment: number | null;
  roi_projected: number | null;
  investment_term_months: number | null;
  exit_strategy: string | null;
  muuno_score: number | null;
  risk_level: string | null;
  score_breakdown: Record<string, number> | null;
  risk_factors: string[];
  property_project_id: string | null;
  founder_id: string | null;
  developer_id: string | null;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  investors_count: number;
  views_count: number;
  is_featured: boolean;
  is_hot: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface InvestmentFilters {
  projectType?: string;
  minInvestment?: number;
  maxInvestment?: number;
  minRoi?: number;
  riskLevel?: string;
  isFeatured?: boolean;
  isHot?: boolean;
  search?: string;
}

export function useInvestmentProjects(filters?: InvestmentFilters) {
  return useQuery({
    queryKey: ['investment-projects', filters],
    queryFn: async () => {
      let query = supabase
        .from('investment_projects')
        .select('*')
        .in('status', ['active', 'funded'])
        .order('is_featured', { ascending: false })
        .order('muuno_score', { ascending: false, nullsFirst: false });

      if (filters?.projectType) {
        query = query.eq('project_type', filters.projectType);
      }

      if (filters?.minInvestment) {
        query = query.gte('min_investment', filters.minInvestment);
      }

      if (filters?.maxInvestment) {
        query = query.lte('min_investment', filters.maxInvestment);
      }

      if (filters?.minRoi) {
        query = query.gte('roi_projected', filters.minRoi);
      }

      if (filters?.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel);
      }

      if (filters?.isFeatured) {
        query = query.eq('is_featured', true);
      }

      if (filters?.isHot) {
        query = query.eq('is_hot', true);
      }

      if (filters?.search) {
        query = query.or(`title_en.ilike.%${filters.search}%,title_ru.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as InvestmentProject[];
    },
  });
}

export function useInvestmentProject(id: string | undefined) {
  return useQuery({
    queryKey: ['investment-project', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('investment_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as InvestmentProject;
    },
    enabled: !!id,
  });
}

export function useFeaturedInvestments() {
  return useQuery({
    queryKey: ['investment-projects', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_projects')
        .select('*')
        .eq('status', 'active')
        .or('is_featured.eq.true,is_hot.eq.true')
        .order('muuno_score', { ascending: false, nullsFirst: false })
        .limit(6);

      if (error) throw error;
      return (data || []) as InvestmentProject[];
    },
  });
}

export function useInvestmentsByCategory(category: string) {
  return useQuery({
    queryKey: ['investment-projects', 'category', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_projects')
        .select('*')
        .eq('status', 'active')
        .eq('project_type', category)
        .order('muuno_score', { ascending: false, nullsFirst: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as InvestmentProject[];
    },
    enabled: !!category,
  });
}

// Categories helper
export const INVESTMENT_CATEGORIES = [
  { key: 'real_estate_offplan', en: 'Off-Plan Property', ru: 'Новостройки', icon: '🏗️' },
  { key: 'real_estate_rental', en: 'Rental Business', ru: 'Арендный бизнес', icon: '🏠' },
  { key: 'hospitality', en: 'Hospitality', ru: 'Гостиничный бизнес', icon: '🏨' },
  { key: 'restaurant', en: 'Restaurant & F&B', ru: 'Рестораны', icon: '🍽️' },
  { key: 'retail', en: 'Retail', ru: 'Ритейл', icon: '🛍️' },
  { key: 'yacht_charter', en: 'Yacht Charter', ru: 'Яхтенный чартер', icon: '⛵' },
  { key: 'marine_tourism', en: 'Marine Tourism', ru: 'Морской туризм', icon: '🌊' },
  { key: 'wellness', en: 'Wellness & Spa', ru: 'Велнес', icon: '💆' },
  { key: 'tech_startup', en: 'Tech Startup', ru: 'Технологии', icon: '💻' },
  { key: 'franchise', en: 'Franchise', ru: 'Франшиза', icon: '🏪' },
  { key: 'agriculture', en: 'Agriculture', ru: 'Агро', icon: '🌴' },
] as const;

export type InvestmentCategoryKey = typeof INVESTMENT_CATEGORIES[number]['key'];
