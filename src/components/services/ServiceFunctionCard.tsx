 import { Clock, ChevronRight, Zap } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { cn } from '@/lib/utils';
 import type { LocalizedServiceFunction } from '@/hooks/useServiceFunctions';
 
 interface ServiceFunctionCardProps {
   fn: LocalizedServiceFunction;
   onClick?: () => void;
   compact?: boolean;
 }
 
 export function ServiceFunctionCard({ fn, onClick, compact = false }: ServiceFunctionCardProps) {
   const { language } = useLanguage();
   const isRu = language === 'ru';
 
   const formatPrice = (price: number, currency: string) => {
     if (currency === 'THB') {
       return `฿${price.toLocaleString()}`;
     }
     return `${currency} ${price.toLocaleString()}`;
   };
 
   if (compact) {
     return (
       <Card 
         className="cursor-pointer hover:shadow-md transition-shadow border-border/50"
         onClick={onClick}
       >
         <CardContent className="p-3">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
               {fn.icon}
             </div>
             <div className="flex-1 min-w-0">
               <p className="font-medium text-sm truncate">{fn.name}</p>
               <p className="text-xs text-muted-foreground">
                 {isRu ? 'от' : 'from'} {formatPrice(fn.basePrice, fn.currency)}
               </p>
             </div>
             <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card 
       className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 border-border/50 group"
       onClick={onClick}
     >
       <CardContent className="p-4">
         <div className="flex gap-4">
           {/* Icon */}
           <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0 group-hover:bg-primary/20 transition-colors">
             {fn.icon}
           </div>
           
           {/* Content */}
           <div className="flex-1 min-w-0">
             <div className="flex items-start justify-between gap-2 mb-1">
               <h3 className="font-semibold text-base leading-tight">{fn.name}</h3>
               {fn.isUrgent && (
                 <Badge variant="destructive" className="shrink-0 text-xs px-1.5 py-0.5">
                   <Zap className="h-3 w-3 mr-0.5" />
                   {isRu ? 'Срочно' : 'Urgent'}
                 </Badge>
               )}
             </div>
             
             {/* Description / Includes */}
             <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
               {fn.includes.slice(0, 3).join(' • ')}
             </p>
             
             {/* Footer: Time + Price + CTA */}
             <div className="flex items-center justify-between gap-2">
               <div className="flex items-center gap-3 text-sm text-muted-foreground">
                 <span className="flex items-center gap-1">
                   <Clock className="h-3.5 w-3.5" />
                   {fn.estimatedTime}
                 </span>
               </div>
               
               <div className="flex items-center gap-2">
                 <span className="text-sm font-semibold text-primary">
                   {isRu ? 'от' : 'from'} {formatPrice(fn.basePrice, fn.currency)}
                 </span>
                 <Button size="sm" variant="default" className="h-7 px-3 text-xs">
                   {isRu ? 'Заказать' : 'Order'}
                   <ChevronRight className="h-3 w-3 ml-1" />
                 </Button>
               </div>
             </div>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }
 
 // Compact grid variant for quick access
 export function ServiceFunctionQuickCard({ fn, onClick }: { fn: LocalizedServiceFunction; onClick?: () => void }) {
   const { language } = useLanguage();
   const isRu = language === 'ru';
 
   const formatPrice = (price: number, currency: string) => {
     if (currency === 'THB') return `฿${price.toLocaleString()}`;
     return `${currency} ${price.toLocaleString()}`;
   };
 
   return (
     <button
       onClick={onClick}
       className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all text-center min-w-0"
     >
       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg mb-2">
         {fn.icon}
       </div>
       <p className="text-xs font-medium truncate w-full">{fn.name}</p>
       <p className="text-[10px] text-muted-foreground">
         {isRu ? 'от' : 'from'} {formatPrice(fn.basePrice, fn.currency)}
       </p>
     </button>
   );
 }