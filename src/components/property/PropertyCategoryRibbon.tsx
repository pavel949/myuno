 /**
  * PropertyCategoryRibbon - Airbnb-style unified category ribbon
 * Combines Rent/Buy mode toggle with focused property type icons
 * Shows Condo + Villa prominently, others in "More" dropdown
  */
 
import { memo, useState } from 'react';
import { Home, Building2, MoreHorizontal, Check, X } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
 
 export type PropertyMode = 'rent' | 'buy';
 
 export interface PropertyTypeOption {
   id: string;
   labelEn: string;
   labelRu: string;
  icon?: string | React.ComponentType<{ className?: string }>;
 }

// Primary property types to show in ribbon (most searched)
const PRIMARY_TYPE_IDS = ['condo', 'villa', 'apartment'];

 interface PropertyCategoryRibbonProps {
   mode?: PropertyMode;
   onModeChange?: (mode: PropertyMode) => void;
   selectedType: string;
   onTypeChange: (type: string) => void;
   propertyTypes: PropertyTypeOption[];
   className?: string;
   showModeToggle?: boolean;
 }
 
 export const PropertyCategoryRibbon = memo(function PropertyCategoryRibbon({
   mode,
   onModeChange,
   selectedType,
   onTypeChange,
   propertyTypes,
   className,
   showModeToggle = true,
 }: PropertyCategoryRibbonProps) {
   const { language } = useLanguage();
   const isRu = language === 'ru';
  const [moreOpen, setMoreOpen] = useState(false);
 
  // Split types: primary (visible) + secondary (in dropdown)
  const allOption: PropertyTypeOption = { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🏠' };
  
  const primaryTypes = propertyTypes.filter(t => 
    PRIMARY_TYPE_IDS.includes(t.id.toLowerCase())
  );
  
  const secondaryTypes = propertyTypes.filter(t => 
    !PRIMARY_TYPE_IDS.includes(t.id.toLowerCase())
  );
  
  // Check if selected type is in secondary (show it in "More" button)
  const isSecondarySelected = secondaryTypes.some(t => t.id === selectedType);
  const selectedSecondary = secondaryTypes.find(t => t.id === selectedType);
 
   const handleModeChange = (newMode: PropertyMode) => {
     if (newMode !== mode) {
       triggerHaptic('light');
       onModeChange(newMode);
     }
   };
 
   const handleTypeChange = (typeId: string) => {
     triggerHaptic('light');
     onTypeChange(typeId);
   };
 
  const TypeButton = ({ type, isActive }: { type: PropertyTypeOption; isActive: boolean }) => (
    <button
      onClick={() => handleTypeChange(type.id)}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 rounded-xl shrink-0 transition-all min-w-[56px]",
        "border-b-2",
        isActive
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
      )}
    >
      <span className="text-lg leading-none">
        {typeof type.icon === 'string' ? type.icon : '🏠'}
      </span>
      <span className="text-[10px] font-medium whitespace-nowrap">
        {isRu ? type.labelRu : type.labelEn}
      </span>
    </button>
  );

   return (
     <div className={cn("flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-y pb-1", className)}>
       {/* Mode Toggle - Rent/Buy (optional) */}
       {showModeToggle && mode && onModeChange && (
         <>
           <div className="flex p-0.5 bg-muted/60 rounded-xl shrink-0">
             <button
               onClick={() => handleModeChange('rent')}
               className={cn(
                 "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                 mode === 'rent'
                   ? "bg-primary text-primary-foreground shadow-sm"
                   : "text-muted-foreground hover:text-foreground"
               )}
             >
               <Home className="w-3.5 h-3.5" />
               <span>{isRu ? 'Аренда' : 'Rent'}</span>
             </button>
             <button
               onClick={() => handleModeChange('buy')}
               className={cn(
                 "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                 mode === 'buy'
                   ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                   : "text-muted-foreground hover:text-foreground"
               )}
             >
               <Building2 className="w-3.5 h-3.5" />
               <span>{isRu ? 'Покупка' : 'Buy'}</span>
             </button>
           </div>
           <div className="w-px h-6 bg-border shrink-0" />
         </>
       )}
 
      {/* All Types */}
      <TypeButton type={allOption} isActive={selectedType === 'all'} />

      {/* Primary Types - Condo, Villa, Apartment */}
      {primaryTypes.map((type) => (
        <TypeButton key={type.id} type={type} isActive={selectedType === type.id} />
      ))}

      {/* More Types Dropdown */}
      {secondaryTypes.length > 0 && (
        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl shrink-0 transition-all min-w-[56px]",
                "border-b-2",
                isSecondarySelected
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              <span className="text-lg leading-none">
                {isSecondarySelected && selectedSecondary 
                  ? (typeof selectedSecondary.icon === 'string' ? selectedSecondary.icon : '🏠')
                  : <MoreHorizontal className="w-5 h-5" />
                }
              </span>
              <span className="text-[10px] font-medium whitespace-nowrap">
                {isSecondarySelected && selectedSecondary
                  ? (isRu ? selectedSecondary.labelRu : selectedSecondary.labelEn)
                  : (isRu ? 'Ещё' : 'More')
                }
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-56 p-2" 
            align="end"
            sideOffset={8}
          >
            <div className="space-y-1">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                {isRu ? 'Другие типы' : 'More types'}
              </p>
              {secondaryTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    handleTypeChange(type.id);
                    setMoreOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedType === type.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="text-base">
                    {typeof type.icon === 'string' ? type.icon : '🏠'}
                  </span>
                  <span className="flex-1 text-left">
                    {isRu ? type.labelRu : type.labelEn}
                  </span>
                  {selectedType === type.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
     </div>
   );
 });
 
 export default PropertyCategoryRibbon;