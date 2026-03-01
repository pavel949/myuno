import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Sparkles, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SuperAppCatalogAccordion,
  ServiceQuickAccess,
  ProviderSection,
  ServiceDrawerFooter,
} from './drawer';

interface ServiceCategoryDrawerProps {
  className?: string;
}

export function ServiceCategoryDrawer({ className }: ServiceCategoryDrawerProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigate = () => {
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-1.5 px-3 py-2 h-auto rounded-xl shrink-0",
          "border-primary/30 bg-primary/5 hover:bg-primary/10",
          "text-primary font-medium text-xs",
          "transition-all duration-200 shadow-sm hover:shadow",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>{language === 'ru' ? 'Каталог' : 'Catalog'}</span>
      </Button>

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title={language === 'ru' ? 'myUNO Каталог' : 'myUNO Catalog'}
        description={language === 'ru' ? 'Все сервисы для жизни' : 'All services for living abroad'}
        icon={<Sparkles className="w-5 h-5 text-primary" />}
        size="lg"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ru' ? 'Поиск категорий...' : 'Search categories...'}
            className="pl-9 pr-9 h-10 bg-muted/50 border-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Quick Access */}
        <ServiceQuickAccess onNavigate={handleNavigate} />
        
        {/* Divider */}
        <div className="h-px bg-border/50" />
        
        {/* Categories Accordion */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {language === 'ru' ? 'Категории' : 'Categories'}
          </span>
          <SuperAppCatalogAccordion 
            searchQuery={searchQuery} 
            onNavigate={handleNavigate} 
          />
        </div>
        
        {/* Divider */}
        <div className="h-px bg-border/50" />
        
        {/* Provider Section */}
        <ProviderSection onNavigate={handleNavigate} />

        {/* Footer */}
        <ServiceDrawerFooter />
      </ResponsiveModal>
    </>
  );
}
