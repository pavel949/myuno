import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/hooks/useCategories';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function Categories() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { groups, getName, isLoading } = useCategories();
  
  return (
    <AppLayout showBottomNav>
      <PageContainer className="pb-24">
        <PageHeader 
          title={language === 'ru' ? 'Каталог сервисов' : 'Service Catalog'}
          showBack
          fallbackPath="/"
        />
        
        {/* Search bar */}
        <div 
          className="relative cursor-pointer mt-4 mb-6"
          onClick={() => navigate('/search')}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder={language === 'ru' ? 'Поиск сервисов...' : 'Search services...'}
            className="pl-11 h-12 text-base rounded-xl bg-muted/50 border-0 cursor-pointer"
            readOnly
          />
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, gi) => (
              <div key={gi}>
                <Skeleton className="h-5 w-40 mb-4" />
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, ci) => (
                    <Skeleton key={ci} className="aspect-square rounded-2xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Category groups */}
        {!isLoading && (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.id}>
                {/* Group header */}
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  {getName(group)}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({group.categories?.length || 0})
                  </span>
                </h2>
                
                {/* Category grid - 4 columns */}
                <div className="grid grid-cols-4 gap-3">
                  {(group.categories || []).map((cat) => {
                    const Icon = cat.icon || Package;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => navigate(cat.path)}
                        className={cn(
                          "relative flex flex-col items-center justify-center",
                          "aspect-square rounded-2xl p-2",
                          "bg-card border border-border/50",
                          "hover:border-primary/40 hover:shadow-md hover:scale-[1.02]",
                          "active:scale-95 transition-all duration-200",
                          "group"
                        )}
                      >
                        {/* Badges */}
                        {(cat.isNew || cat.isHot) && (
                          <span className={cn(
                            "absolute -top-1.5 -right-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold shadow-sm",
                            cat.isNew ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"
                          )}>
                            {cat.isNew ? 'NEW' : (language === 'ru' ? 'ТОП' : 'HOT')}
                          </span>
                        )}
                        
                        {/* Icon */}
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
                          "bg-gradient-to-br shadow-sm",
                          cat.color || "from-primary/20 to-primary/10",
                          "group-hover:scale-110 transition-transform"
                        )}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Name */}
                        <span className="text-[11px] font-medium text-center leading-tight line-clamp-2 px-1">
                          {getName(cat)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {language === 'ru' ? 'Категории не найдены' : 'No categories found'}
            </p>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
