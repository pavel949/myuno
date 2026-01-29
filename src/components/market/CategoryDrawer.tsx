import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Menu, Search } from 'lucide-react';
import {
  QuickAccessSection,
  VendorSection,
  DrawerFooter,
  CategoryAccordion,
} from './drawer';

interface CategoryDrawerProps {
  trigger?: React.ReactNode;
}

export function CategoryDrawer({ trigger }: CategoryDrawerProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleClose = () => {
    setOpen(false);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="shrink-0">
      <Menu className="w-5 h-5" />
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      
      <SheetContent 
        side="left" 
        className="w-[85vw] max-w-[340px] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b border-border">
          <SheetTitle className="text-left flex items-center gap-2">
            <Menu className="w-5 h-5" />
            {language === 'ru' ? 'Каталог' : 'Catalog'}
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ru' ? 'Поиск категории...' : 'Search category...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-muted border-0"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="pb-4">
            {/* Quick Access Section */}
            <QuickAccessSection onNavigate={handleClose} />
            
            <Separator className="my-2" />
            
            {/* Catalog Section */}
            <div className="py-1">
              <div className="px-4 py-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {language === 'ru' ? 'Каталог' : 'Catalog'}
                </span>
              </div>
              <CategoryAccordion 
                searchQuery={searchQuery} 
                onNavigate={handleClose} 
              />
            </div>
            
            <Separator className="my-2" />
            
            {/* Vendor Section */}
            <VendorSection onNavigate={handleClose} />
          </div>
        </ScrollArea>

        {/* Footer */}
        <DrawerFooter />
      </SheetContent>
    </Sheet>
  );
}
