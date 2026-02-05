 /**
  * PropertyCategoryRibbon - Airbnb-style unified category ribbon
  * Combines Rent/Buy mode toggle with property type icons
  */
 
 import { memo } from 'react';
 import { Home, Building2 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { triggerHaptic } from '@/hooks/useHapticFeedback';
 
 export type PropertyMode = 'rent' | 'buy';
 
 export interface PropertyTypeOption {
   id: string;
   labelEn: string;
   labelRu: string;
  icon?: string | React.ComponentType<{ className?: string }>;
 }
 
 interface PropertyCategoryRibbonProps {
   mode: PropertyMode;
   onModeChange: (mode: PropertyMode) => void;
   selectedType: string;
   onTypeChange: (type: string) => void;
   propertyTypes: PropertyTypeOption[];
   className?: string;
 }
 
 // Default property types with icons
 const DEFAULT_TYPES: PropertyTypeOption[] = [
   { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🏠' },
 ];
 
 export const PropertyCategoryRibbon = memo(function PropertyCategoryRibbon({
   mode,
   onModeChange,
   selectedType,
   onTypeChange,
   propertyTypes,
   className,
 }: PropertyCategoryRibbonProps) {
   const { language } = useLanguage();
   const isRu = language === 'ru';
 
   const allTypes = [...DEFAULT_TYPES, ...propertyTypes];
 
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
 
   return (
     <div className={cn("flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-y pb-1", className)}>
       {/* Mode Toggle - Rent/Buy */}
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
 
       {/* Divider */}
       <div className="w-px h-6 bg-border shrink-0" />
 
       {/* Property Type Categories - Airbnb style */}
       {allTypes.map((type) => {
         const isActive = selectedType === type.id;
         return (
           <button
             key={type.id}
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
       })}
     </div>
   );
 });
 
 export default PropertyCategoryRibbon;