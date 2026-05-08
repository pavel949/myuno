/**
 * VendorQuickCreateFAB - Floating Action Button with quick create options
 * Shows on Dashboard for fast entry creation
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Plus, Package, Wrench, Upload, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { VENDOR_ENTRIES, resolveVendorAliases } from '@/lib/verticals/vendorEntries';

interface QuickCreateOption {
  id: string;
  slug: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  color: string;
  path?: string;
  action?: 'wizard' | 'bulk';
}

const createOptions: QuickCreateOption[] = [
  { id: 'product', slug: 'product', icon: Package, labelEn: 'Product', labelRu: 'Товар', color: 'text-success', path: '/vendor/products?create=true' },
  { id: 'service', slug: 'service', icon: Wrench, labelEn: 'Service', labelRu: 'Услуга', color: 'text-info', path: '/vendor/services?create=true' },
];

const verticalOptions: QuickCreateOption[] = VENDOR_ENTRIES
  .filter(e => e.fabEnabled)
  .map(e => ({
    id: e.id,
    slug: e.id,
    icon: e.icon,
    labelEn: e.nameEn,
    labelRu: e.nameRu,
    color: e.color,
    path: `${e.vendorPath}?create=true`,
  }));

const specialActions: QuickCreateOption[] = [
  { id: 'ai-intake', slug: 'ai', icon: Wand2, labelEn: 'AI Import', labelRu: 'AI Импорт', color: 'text-primary', action: 'wizard' },
  { id: 'bulk', slug: 'bulk', icon: Upload, labelEn: 'Bulk Import', labelRu: 'Массовый импорт', color: 'text-muted-foreground', action: 'bulk' },
];

interface VendorQuickCreateFABProps {
  onAiImportClick?: () => void;
  onBulkImportClick?: () => void;
}

export function VendorQuickCreateFAB({ 
  onAiImportClick, 
  onBulkImportClick 
}: VendorQuickCreateFABProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { activeOrg } = useUserContext();
  const [isOpen, setIsOpen] = useState(false);
  
  const isRu = language === 'ru';

  // Resolve vendor verticals through alias index so legacy slugs still match
  const orgMetadata = activeOrg?.metadata as { verticals?: string[] } | null;
  const vendorVerticals = resolveVendorAliases(orgMetadata?.verticals);

  const availableVerticals = vendorVerticals.length > 0
    ? verticalOptions.filter(v => vendorVerticals.includes(v.slug))
    : verticalOptions;

  const handleOptionClick = (option: QuickCreateOption) => {
    if (option.action === 'wizard' && onAiImportClick) {
      onAiImportClick();
    } else if (option.action === 'bulk' && onBulkImportClick) {
      onBulkImportClick();
    } else if (option.path) {
      navigate(option.path);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* FAB Button - Fixed position */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "fixed bottom-[calc(var(--bottom-nav-h)+1rem)] right-4 md:bottom-6 md:right-6 z-50",
              "h-14 w-14 rounded-full shadow-lg",
              "bg-primary hover:bg-primary/90",
              "transition-transform "
            )}
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="h-6 w-6" />
            </motion.div>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="rounded-none max-h-[80vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {isRu ? 'Быстрое создание' : 'Quick Create'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 pb-6">
            {/* Primary Actions */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {isRu ? 'Основное' : 'Main'}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {createOptions.map((option) => (
                  <QuickCreateButton
                    key={option.id}
                    option={option}
                    isRu={isRu}
                    onClick={() => handleOptionClick(option)}
                  />
                ))}
              </div>
            </div>

            {/* Verticals */}
            {availableVerticals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {isRu ? 'По вертикалям' : 'By Vertical'}
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {availableVerticals.map((option) => (
                    <QuickCreateButton
                      key={option.id}
                      option={option}
                      isRu={isRu}
                      onClick={() => handleOptionClick(option)}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Special Actions */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {isRu ? 'Инструменты' : 'Tools'}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {specialActions.map((option) => (
                  <QuickCreateButton
                    key={option.id}
                    option={option}
                    isRu={isRu}
                    onClick={() => handleOptionClick(option)}
                    special
                  />
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface QuickCreateButtonProps {
  option: QuickCreateOption;
  isRu: boolean;
  onClick: () => void;
  compact?: boolean;
  special?: boolean;
}

function QuickCreateButton({ option, isRu, onClick, compact, special }: QuickCreateButtonProps) {
  const Icon = option.icon;
  
  if (compact) {
    return (
      <Button
        variant="ghost"
        className="h-auto flex-col gap-1.5 py-3 hover:bg-muted"
        onClick={onClick}
      >
        <div className={cn("p-2 rounded-full bg-muted", option.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-medium text-center leading-tight">
          {isRu ? option.labelRu : option.labelEn}
        </span>
      </Button>
    );
  }

  return (
    <Button
      variant={special ? "outline" : "secondary"}
      className={cn(
        "h-auto py-4 flex-col gap-2 justify-start",
        special && "border-dashed"
      )}
      onClick={onClick}
    >
      <div className={cn("p-2.5 rounded-full bg-muted", option.color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium">
        {isRu ? option.labelRu : option.labelEn}
      </span>
    </Button>
  );
}
