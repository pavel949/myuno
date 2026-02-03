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
import { 
  Plus, 
  Package,
  Wrench,
  Sparkles,
  Car,
  Utensils,
  Ship,
  Home,
  Calendar,
  Dumbbell,
  Brush,
  Baby,
  Flower2,
  Stethoscope,
  GraduationCap,
  Scale,
  PawPrint,
  Upload,
  Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  { id: 'product', slug: 'product', icon: Package, labelEn: 'Product', labelRu: 'Товар', color: 'text-emerald-500', path: '/vendor/products?create=true' },
  { id: 'service', slug: 'service', icon: Wrench, labelEn: 'Service', labelRu: 'Услуга', color: 'text-blue-500', path: '/vendor/services?create=true' },
];

const verticalOptions: QuickCreateOption[] = [
  { id: 'beauty', slug: 'beauty', icon: Sparkles, labelEn: 'Beauty', labelRu: 'Красота', color: 'text-pink-500', path: '/vendor/beauty?create=true' },
  { id: 'restaurants', slug: 'restaurants', icon: Utensils, labelEn: 'Restaurant', labelRu: 'Ресторан', color: 'text-amber-500', path: '/vendor/restaurants?create=true' },
  { id: 'transport', slug: 'transport', icon: Car, labelEn: 'Vehicle', labelRu: 'Транспорт', color: 'text-indigo-500', path: '/vendor/transport?create=true' },
  { id: 'yachts', slug: 'yachts', icon: Ship, labelEn: 'Yacht', labelRu: 'Яхта', color: 'text-cyan-500', path: '/vendor/yachts?create=true' },
  { id: 'properties', slug: 'properties', icon: Home, labelEn: 'Property', labelRu: 'Недвижимость', color: 'text-emerald-500', path: '/vendor/properties?create=true' },
  { id: 'tours', slug: 'tours', icon: Calendar, labelEn: 'Tour', labelRu: 'Тур', color: 'text-blue-500', path: '/vendor/tours?create=true' },
  { id: 'fitness', slug: 'fitness', icon: Dumbbell, labelEn: 'Gym', labelRu: 'Фитнес', color: 'text-orange-500', path: '/vendor/fitness?create=true' },
  { id: 'cleaning', slug: 'cleaning', icon: Brush, labelEn: 'Cleaning', labelRu: 'Клининг', color: 'text-teal-500', path: '/vendor/cleaning?create=true' },
  { id: 'babysitters', slug: 'childcare', icon: Baby, labelEn: 'Babysitter', labelRu: 'Няня', color: 'text-rose-500', path: '/vendor/babysitters?create=true' },
  { id: 'flowers', slug: 'flowers', icon: Flower2, labelEn: 'Flowers', labelRu: 'Цветы', color: 'text-fuchsia-500', path: '/vendor/flowers?create=true' },
  { id: 'clinics', slug: 'health', icon: Stethoscope, labelEn: 'Clinic', labelRu: 'Клиника', color: 'text-green-500', path: '/vendor/clinics?create=true' },
  { id: 'education', slug: 'education', icon: GraduationCap, labelEn: 'Education', labelRu: 'Образование', color: 'text-purple-500', path: '/vendor/education?create=true' },
  { id: 'legal', slug: 'legal', icon: Scale, labelEn: 'Legal', labelRu: 'Юридические', color: 'text-slate-500', path: '/vendor/legal?create=true' },
  { id: 'pets', slug: 'pets', icon: PawPrint, labelEn: 'Pets', labelRu: 'Питомцы', color: 'text-yellow-600', path: '/vendor/pets?create=true' },
];

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

  // Get vendor's verticals from org metadata
  const orgMetadata = activeOrg?.metadata as { verticals?: string[] } | null;
  const vendorVerticals = orgMetadata?.verticals || [];

  // Filter vertical options based on vendor's selected verticals
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
              "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50",
              "h-14 w-14 rounded-full shadow-lg",
              "bg-primary hover:bg-primary/90",
              "transition-transform hover:scale-105"
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
        
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
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
