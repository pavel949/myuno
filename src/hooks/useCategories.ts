import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { CACHE_PROFILES } from '@/lib/queryConfig';

// Icon mapping from string to component
const iconMap: Record<string, LucideIcon> = {
  Home: LucideIcons.Home,
  Car: LucideIcons.Car,
  UtensilsCrossed: LucideIcons.UtensilsCrossed,
  Compass: LucideIcons.Compass,
  Waves: LucideIcons.Waves,
  Ship: LucideIcons.Ship,
  Anchor: LucideIcons.Anchor,
  Sparkles: LucideIcons.Sparkles,
  Dumbbell: LucideIcons.Dumbbell,
  Stethoscope: LucideIcons.Stethoscope,
  GraduationCap: LucideIcons.GraduationCap,
  Ticket: LucideIcons.Ticket,
  Flower2: LucideIcons.Flower2,
  Pill: LucideIcons.Pill,
  PawPrint: LucideIcons.PawPrint,
  Wrench: LucideIcons.Wrench,
  Scale: LucideIcons.Scale,
  Baby: LucideIcons.Baby,
  Shirt: LucideIcons.Shirt,
  Package: LucideIcons.Package,
  Bike: LucideIcons.Bike,
  Plane: LucideIcons.Plane,
  Brush: LucideIcons.Brush,
  ShoppingBag: LucideIcons.ShoppingBag,
  Zap: LucideIcons.Zap,
  Wind: LucideIcons.Wind,
  Bug: LucideIcons.Bug,
  Hammer: LucideIcons.Hammer,
  Key: LucideIcons.Key,
  CarFront: LucideIcons.CarFront,
  Building: LucideIcons.Building,
};

export interface CategoryGroup {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  sortOrder: number;
  isActive: boolean;
  categories: Category[];
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  icon: LucideIcon;
  iconName: string;
  color: string;
  path: string;
  miniAppType: string | null;
  parentId: string | null;
  groupId: string | null;
  sortOrder: number;
  isActive: boolean;
  isNew: boolean;
  isHot: boolean;
  subcategories?: Category[];
}

interface RawCategoryGroup {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  sort_order: number;
  is_active: boolean;
}

interface RawCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  icon: string | null;
  color: string | null;
  mini_app_type: string | null;
  parent_id: string | null;
  group_id: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  is_new: boolean | null;
  is_hot: boolean | null;
}

// Get path from slug or mini_app_type
function getPath(category: RawCategory): string {
  const type = category.mini_app_type || category.slug;
  const pathMap: Record<string, string> = {
    'beauty': '/beauty',
    'beauty-spa': '/beauty',
    'food': '/restaurants',
    'restaurants': '/restaurants',
    'fitness': '/fitness',
    'medical': '/medical',
    'kids': '/education',
    'kids-education': '/education',
    'education': '/education',
    'property': '/property',
    'real-estate': '/property',
    'transport': '/transport',
    'events': '/events',
    'marketplace': '/market',
    'market': '/market',
    'shopping': '/market',
    'services': '/services',
    'cleaning': '/cleaning',
    'laundry': '/cleaning',
    'tours': '/tours',
    'yachts': '/yachts',
    'water': '/water',
    'flowers': '/flowers',
    'pharmacy': '/pharmacy',
    'pets': '/pets',
    'babysitter': '/babysitter',
    'delivery': '/delivery',
    'legal': '/legal',
    'plumbing': '/services?category=plumbing',
    'electrical': '/services?category=electrical',
    'ac-repair': '/services?category=ac-repair',
    'gardening': '/services?category=gardening',
    'pest-control': '/services?category=pest-control',
    'handyman': '/services?category=handyman',
    'locksmith': '/services?category=locksmith',
    'road-assistance': '/services?category=road-assistance',
  };
  return pathMap[type] || pathMap[category.slug] || `/${category.slug}`;
}

// Transform raw DB data to typed interface
function transformCategory(raw: RawCategory): Category {
  const iconName = raw.icon || 'Package';
  return {
    id: raw.id,
    slug: raw.slug,
    nameEn: raw.name_en,
    nameRu: raw.name_ru,
    icon: iconMap[iconName] || LucideIcons.Package,
    iconName,
    color: raw.color || 'from-gray-500 to-gray-600',
    path: getPath(raw),
    miniAppType: raw.mini_app_type,
    parentId: raw.parent_id,
    groupId: raw.group_id,
    sortOrder: raw.sort_order || 0,
    isActive: raw.is_active ?? true,
    isNew: raw.is_new ?? false,
    isHot: raw.is_hot ?? false,
  };
}

function transformGroup(raw: RawCategoryGroup): Omit<CategoryGroup, 'categories'> {
  return {
    id: raw.id,
    slug: raw.slug,
    nameEn: raw.name_en,
    nameRu: raw.name_ru,
    sortOrder: raw.sort_order,
    isActive: raw.is_active,
  };
}

async function fetchCategoryGroups(): Promise<CategoryGroup[]> {
  // Fetch groups
  const { data: groupsData, error: groupsError } = await supabase
    .from('category_groups')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (groupsError) throw groupsError;

  // Fetch all categories
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (categoriesError) throw categoriesError;

  const groups = (groupsData as RawCategoryGroup[]).map(transformGroup);
  const categories = (categoriesData as RawCategory[]).map(transformCategory);

  // Group categories by group_id
  const categoryMap = new Map<string, Category[]>();
  
  categories.forEach(cat => {
    if (cat.groupId) {
      if (!categoryMap.has(cat.groupId)) {
        categoryMap.set(cat.groupId, []);
      }
      categoryMap.get(cat.groupId)!.push(cat);
    }
  });

  // Build structure - show all categories in each group
  const result: CategoryGroup[] = groups.map(group => {
    const groupCategories = categoryMap.get(group.id) || [];

    return {
      ...group,
      categories: groupCategories.sort((a, b) => a.sortOrder - b.sortOrder),
    };
  });

  // Collect ungrouped categories (not in any group, not a subcategory)
  const ungroupedCategories = categories.filter(c => !c.groupId && !c.parentId);

  // Add "Other Services" group if there are ungrouped categories
  if (ungroupedCategories.length > 0) {
    result.push({
      id: 'other',
      slug: 'other',
      nameEn: 'Other Services',
      nameRu: 'Другие сервисы',
      sortOrder: 999,
      isActive: true,
      categories: ungroupedCategories.sort((a, b) => a.sortOrder - b.sortOrder),
    });
  }

  return result;
}

async function fetchAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return (data as RawCategory[]).map(transformCategory);
}

export function useCategories() {
  const { language } = useLanguage();

  const groupsQuery = useQuery({
    queryKey: ['category-groups', 'v3'], // Force cache invalidation
    queryFn: fetchCategoryGroups,
    ...CACHE_PROFILES.STATIC,
  });

  const allCategoriesQuery = useQuery({
    queryKey: ['all-categories', 'v3'], // Force cache invalidation
    queryFn: fetchAllCategories,
    ...CACHE_PROFILES.STATIC,
  });

  // Helper to get localized name
  const getName = (category: Category | CategoryGroup): string => {
    return language === 'ru' ? category.nameRu : category.nameEn;
  };

  // Flatten all categories from groups
  const flatCategories = groupsQuery.data?.flatMap(g => g.categories) || [];

  // Find category by slug
  const getCategoryBySlug = (slug: string): Category | undefined => {
    return flatCategories.find(c => c.slug === slug);
  };

  // Find category by mini_app_type
  const getCategoryByType = (type: string): Category | undefined => {
    return flatCategories.find(c => c.miniAppType === type);
  };

  return {
    // Grouped data
    groups: groupsQuery.data || [],
    isLoading: groupsQuery.isLoading,
    error: groupsQuery.error,

    // Flat list
    allCategories: allCategoriesQuery.data || [],
    flatCategories,

    // Helpers
    getName,
    getCategoryBySlug,
    getCategoryByType,
    
    // Refetch
    refetch: groupsQuery.refetch,
  };
}

// Hook for single category
export function useCategory(slugOrType: string) {
  const { getCategoryBySlug, getCategoryByType, isLoading, error } = useCategories();
  
  const category = getCategoryBySlug(slugOrType) || getCategoryByType(slugOrType);
  
  return { category, isLoading, error };
}
