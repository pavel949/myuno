/**
 * Discover Page — Services Hub with grouped catalog
 * Renders all verticals organized into logical groups
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Input } from '@/components/ui/input';
import { IconBadge } from '@/components/ui/IconBadge';
import { VERTICALS } from '@/lib/verticals';
import { VERTICAL_GROUPS, type VerticalGroupItem } from '@/lib/verticalGroups';
import { cn } from '@/lib/utils';

const VERTICAL_GRADIENTS: Record<string, string> = {
  property: 'from-emerald-500 to-green-400',
  yacht: 'from-blue-500 to-cyan-400',
  vehicle: 'from-indigo-500 to-violet-400',
  experience: 'from-purple-500 to-indigo-400',
  cleaning: 'from-amber-500 to-yellow-400',
  babysitter: 'from-pink-400 to-rose-300',
  beauty: 'from-pink-500 to-purple-400',
  restaurant: 'from-rose-500 to-pink-400',
  medical: 'from-teal-500 to-emerald-400',
  legal: 'from-slate-500 to-gray-400',
  education: 'from-blue-400 to-indigo-300',
  fitness: 'from-orange-500 to-red-400',
  event: 'from-purple-500 to-indigo-400',
  water_activity: 'from-cyan-500 to-blue-400',
  pet_service: 'from-orange-500 to-amber-400',
  flower: 'from-pink-400 to-rose-300',
  insurance: 'from-slate-500 to-blue-400',
  transfer: 'from-indigo-500 to-blue-400',
};

function resolveItem(item: VerticalGroupItem, language: string) {
  if (item.verticalId) {
    const v = Object.values(VERTICALS).find(v => v.id === item.verticalId);
    if (!v) return null;
    return {
      id: v.id,
      icon: v.icon,
      label: language === 'ru' ? v.labelRu : v.labelEn,
      route: `/${v.plural}`,
      gradient: VERTICAL_GRADIENTS[v.id] || 'from-primary to-accent',
    };
  }
  // Standalone screen
  return {
    id: item.route || '',
    icon: item.icon || '📦',
    label: language === 'ru' ? (item.labelRu || '') : (item.labelEn || ''),
    route: item.route || '/',
    gradient: 'from-gray-500 to-gray-400',
  };
}

export default function Discover() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshKey(prev => prev + 1);
  }, []);

  // Resolve all groups with labels
  const resolvedGroups = useMemo(() => {
    return VERTICAL_GROUPS.map(group => ({
      ...group,
      label: isRu ? group.labelRu : group.labelEn,
      resolvedItems: group.items
        .map(item => resolveItem(item, language))
        .filter(Boolean) as ReturnType<typeof resolveItem>[],
    }));
  }, [language, isRu]);

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return resolvedGroups;
    const q = searchQuery.toLowerCase();
    return resolvedGroups
      .map(group => ({
        ...group,
        resolvedItems: group.resolvedItems.filter(item =>
          item && item.label.toLowerCase().includes(q)
        ),
      }))
      .filter(group => group.resolvedItems.length > 0);
  }, [resolvedGroups, searchQuery]);

  return (
    <MiniAppLayout
      title={isRu ? 'Услуги' : 'Services'}
      subtitle={isRu ? 'Все сервисы для жизни' : 'All services for your life'}
      fallbackPath="/"
      showHero={false}
      showCategories={false}
      showFilter={false}
    >
      {/* Search */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Найти услугу...' : 'Search services...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/50 border-border/50"
          />
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="min-h-0">
        <div key={refreshKey} className="space-y-6 pb-24 pt-4">
          {filteredGroups.map((group) => (
            <section key={group.id}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{group.icon}</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h2>
              </div>

              {/* Service items grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {group.resolvedItems.map((item) => {
                  if (!item) return null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.route)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl',
                        'hover:bg-muted/50 active:bg-muted transition-all duration-200',
                        'touch-manipulation active:scale-95'
                      )}
                    >
                      <IconBadge
                        icon={item.icon}
                        size="lg"
                        variant="gradient"
                        gradient={item.gradient}
                        className="shadow-md"
                      />
                      <span className="text-[11px] font-medium text-center text-foreground leading-tight line-clamp-2">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {filteredGroups.length === 0 && searchQuery && (
            <div className="text-center py-12 text-muted-foreground">
              {isRu ? 'Ничего не найдено' : 'Nothing found'}
            </div>
          )}
        </div>
      </PullToRefresh>
    </MiniAppLayout>
  );
}
