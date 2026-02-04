import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, Search, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ServiceCategoryAccordion,
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 px-3 py-2 h-auto",
            "bg-gradient-to-r from-primary/10 to-amber-500/10",
            "border border-primary/20 hover:border-primary/40",
            "text-primary font-medium text-xs rounded-xl",
            "transition-all duration-200",
            className
          )}
        >
          <Menu className="w-4 h-4" />
          <span>{language === 'ru' ? 'Каталог' : 'Catalog'}</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[320px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-left text-base">
                {language === 'ru' ? 'myUNO Каталог' : 'myUNO Catalog'}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Все сервисы для жизни' : 'All services for living abroad'}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border/50">
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
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1">
          {/* Quick Access */}
          <ServiceQuickAccess onNavigate={handleNavigate} />
          
          {/* Divider */}
          <div className="h-2 bg-muted/30" />
          
          {/* Categories Accordion */}
          <div className="py-1">
            <div className="px-4 py-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {language === 'ru' ? 'Категории' : 'Categories'}
              </span>
            </div>
            <ServiceCategoryAccordion 
              searchQuery={searchQuery} 
              onNavigate={handleNavigate} 
            />
          </div>
          
          {/* Divider */}
          <div className="h-2 bg-muted/30" />
          
          {/* Provider Section */}
          <ProviderSection onNavigate={handleNavigate} />
        </ScrollArea>

        {/* Footer */}
        <ServiceDrawerFooter />
      </SheetContent>
    </Sheet>
  );
}
