import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories, CategoryGroup, Category } from '@/hooks/useCategories';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ChevronRight, Sparkles, Plane, Waves, Heart, Home, Globe, Briefcase, Zap, LucideIcon, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Group icons mapping
const GROUP_ICONS: Record<string, LucideIcon> = {
  'lifestyle': Sparkles,
  'lifestyle-leisure': Sparkles,
  'travel': Plane,
  'travel-transport': Plane,
  'water': Waves,
  'water-sports': Waves,
  'health': Heart,
  'health-care': Heart,
  'home': Home,
  'home-services': Home,
  'expat': Globe,
  'expat-services': Globe,
  'professional': Briefcase,
  'quick': Zap,
  'quick-services': Zap,
  'shopping': ShoppingBag,
  'other': Sparkles,
};

// Group gradient colors
const GROUP_GRADIENTS: Record<string, string> = {
  'lifestyle': 'from-purple-500/20 to-pink-500/10',
  'lifestyle-leisure': 'from-purple-500/20 to-pink-500/10',
  'travel': 'from-blue-500/20 to-cyan-500/10',
  'travel-transport': 'from-blue-500/20 to-cyan-500/10',
  'water': 'from-cyan-500/20 to-teal-500/10',
  'water-sports': 'from-cyan-500/20 to-teal-500/10',
  'health': 'from-emerald-500/20 to-green-500/10',
  'health-care': 'from-emerald-500/20 to-green-500/10',
  'home': 'from-amber-500/20 to-orange-500/10',
  'home-services': 'from-amber-500/20 to-orange-500/10',
  'expat': 'from-indigo-500/20 to-violet-500/10',
  'expat-services': 'from-indigo-500/20 to-violet-500/10',
  'professional': 'from-slate-500/20 to-gray-500/10',
  'quick': 'from-rose-500/20 to-red-500/10',
  'quick-services': 'from-rose-500/20 to-red-500/10',
  'shopping': 'from-orange-500/20 to-amber-500/10',
};

// Get group icon
function getGroupIcon(slug: string): LucideIcon {
  return GROUP_ICONS[slug] || GROUP_ICONS[slug.split('-')[0]] || Sparkles;
}

// Get group gradient
function getGroupGradient(slug: string): string {
  return GROUP_GRADIENTS[slug] || GROUP_GRADIENTS[slug.split('-')[0]] || 'from-primary/20 to-primary/10';
}

interface ServiceCategoryAccordionProps {
  searchQuery: string;
  onNavigate: () => void;
}

export function ServiceCategoryAccordion({ searchQuery, onNavigate }: ServiceCategoryAccordionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { groups, getName } = useCategories();

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    
    const query = searchQuery.toLowerCase();
    return groups
      .map(group => ({
        ...group,
        categories: group.categories.filter(cat =>
          cat.nameEn.toLowerCase().includes(query) ||
          cat.nameRu.toLowerCase().includes(query)
        ),
      }))
      .filter(group => 
        group.categories.length > 0 ||
        group.nameEn.toLowerCase().includes(query) ||
        group.nameRu.toLowerCase().includes(query)
      );
  }, [groups, searchQuery]);

  const handleCategoryClick = (category: Category) => {
    onNavigate();
    navigate(category.path);
  };

  const handleGroupClick = (group: CategoryGroup) => {
    onNavigate();
    navigate(`/discover?group=${group.slug}`);
  };

  if (filteredGroups.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-muted-foreground text-sm">
        {language === 'ru' ? 'Ничего не найдено' : 'Nothing found'}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {filteredGroups.map((group) => {
        const hasCategories = group.categories.length > 0;
        const GroupIcon = getGroupIcon(group.slug);
        const groupGradient = getGroupGradient(group.slug);

        if (!hasCategories) {
          return (
            <button
              key={group.id}
              onClick={() => handleGroupClick(group)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3",
                "hover:bg-muted/50 active:bg-muted transition-colors",
                "text-left"
              )}
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", `bg-gradient-to-br ${groupGradient}`)}>
                <GroupIcon className="w-5 h-5 text-primary" />
              </div>
              <span className="flex-1 font-medium text-sm">
                {getName(group)}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        }

        return (
          <AccordionItem 
            key={group.id} 
            value={group.slug}
            className="border-0"
          >
            <AccordionTrigger 
              className={cn(
                "px-4 py-3 hover:bg-muted/50 hover:no-underline",
                "[&>svg]:text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", `bg-gradient-to-br ${groupGradient}`)}>
                  <GroupIcon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-sm">
                  {getName(group)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {group.categories.length}
                </Badge>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="pb-0">
              <div className="pl-4 border-l-2 border-primary/20 ml-8 space-y-0.5 py-1">
                {group.categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5",
                        "hover:bg-muted/50 active:bg-muted rounded-lg transition-colors",
                        "text-left text-sm"
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="flex-1 text-muted-foreground">
                        {getName(category)}
                      </span>
                      {category.isNew && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-success">
                          NEW
                        </Badge>
                      )}
                      {category.isHot && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          HOT
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
