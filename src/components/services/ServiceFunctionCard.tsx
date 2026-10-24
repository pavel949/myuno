import { pickLang } from '@/lib/i18n/pickLang';
 import { Clock, ChevronRight, Zap, Snowflake, Droplets, Wrench, Plug, Brush, Waves, Leaf, Bug, ShieldCheck, Truck, Coins } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { cn } from '@/lib/utils';
 import type { LocalizedServiceFunction } from '@/hooks/useServiceFunctions';
 import { getCurrencySymbol } from '@/lib/config/currencies';

 interface ServiceFunctionCardProps {
   fn: LocalizedServiceFunction;
   onClick?: () => void;
   compact?: boolean;
   catalogue?: boolean;
 }

 export function ServiceFunctionCard({ fn, onClick, compact = false, catalogue = false }: ServiceFunctionCardProps) {
   const { language } = useLanguage();
   const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });

   const formatPrice = (price: number, currency: string) => {
     return `${getCurrencySymbol(currency)}${price.toLocaleString()}`;
   };

   // Category icons avoid implying that editorial images show actual providers.
   // Other placements retain their existing compact/default presentation.
   if (catalogue) {
     const titleId = `service-${fn.id}-title`;
     const actionId = `service-${fn.id}-action`;
     const descriptionId = `service-${fn.id}-description`;
     const termsId = `service-${fn.id}-terms`;
     const Icon = ({ ac: Snowflake, plumbing: Droplets, electrical: Zap, handyman: Wrench,
       appliance_repair: Plug, cleaning: Brush, pool: Waves, garden: Leaf,
       pest_control: Bug, security: ShieldCheck, moving: Truck })[fn.category] ?? Wrench;
     return (
       <article className="min-w-0 border border-border bg-card transition-shadow hover:shadow-md">
         <button type="button" onClick={onClick} data-testid="service-request-card"
           aria-labelledby={`${titleId} ${actionId}`} aria-describedby={`${descriptionId} ${termsId}`}
           className="group flex h-full w-full min-w-0 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">

           <span className="flex w-full flex-1 flex-col p-4">
           <span className="flex items-start gap-3"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center bg-muted text-primary"><Icon className="h-5 w-5" strokeWidth={1.5} /></span><span id={titleId} className="min-w-0 font-display text-h4 leading-snug text-foreground">{fn.name}</span></span>
           <span id={descriptionId} className="mt-2 block text-sm leading-relaxed text-muted-foreground line-clamp-2">
             {fn.includes.slice(0, 3).join(' · ')}
           </span>
           <span className="mt-auto block pt-3">
             <span id={termsId} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-sm">
               <span className="inline-flex items-center gap-2 font-medium text-primary"><Coins className="h-4 w-4 shrink-0" aria-hidden="true" />{t('от', 'from', "เริ่มต้น")} {formatPrice(fn.basePrice, fn.currency)}</span>{' '}
               <span className="inline-flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 shrink-0" aria-hidden="true" />{fn.estimatedTime}</span>{' '}
               {fn.isUrgent && <span className="text-muted-foreground">{t('Срочная заявка', 'Urgent request', "คำขอเร่งด่วน")}</span>}
             </span>
             <span id={actionId} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary group-hover:underline underline-offset-4">
               {t('Оставить заявку', 'Request service', "ส่งคำขอบริการ")}<ChevronRight className="h-4 w-4" aria-hidden="true" />
             </span>
           </span>
           </span>
         </button>
       </article>
     );
   }

   if (compact) {
     return (
       <Card
         className="cursor-pointer hover:shadow-md transition-shadow border-border/50"
         onClick={onClick}
       >
         <CardContent className="p-3">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-none bg-muted flex items-center justify-center text-xl shrink-0">
               {fn.icon}
             </div>
             <div className="flex-1 min-w-0">
               <p className="font-medium text-sm truncate">{fn.name}</p>
               <p className="text-xs text-muted-foreground">
                 {t('от', 'from', "เริ่มต้น")} {formatPrice(fn.basePrice, fn.currency)}
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
           <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center text-2xl shrink-0 group-hover:bg-primary/20 transition-colors">
             {fn.icon}
           </div>

           {/* Content */}
           <div className="flex-1 min-w-0">
             <div className="flex items-start justify-between gap-2 mb-1">
               <h3 className="font-semibold text-base leading-tight">{fn.name}</h3>
               {fn.isUrgent && (
                 <Badge variant="destructive" className="shrink-0 text-xs px-1.5 py-0.5">
                   <Zap className="h-3 w-3 mr-0.5" />
                   {t('Срочно', 'Urgent', "เร่งด่วน")}
                 </Badge>
               )}
             </div>

             {/* Description / Includes */}
             <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
               {fn.includes.slice(0, 3).join(' • ')}
             </p>

             {/* Footer: Time + Price + CTA */}
             <div className="flex flex-wrap items-center justify-between gap-2">
               <div className="flex items-center gap-3 text-sm text-muted-foreground">
                 <span className="flex items-center gap-1">
                   <Clock className="h-3.5 w-3.5" />
                   {fn.estimatedTime}
                 </span>
               </div>

               <div className="flex items-center gap-2">
                 <span className="text-sm font-semibold text-primary">
                   {t('от', 'from', "เริ่มต้น")} {formatPrice(fn.basePrice, fn.currency)}
                 </span>
                 <Button size="sm" variant="default" className="min-h-[44px] px-3 text-xs">
                   {t('Оставить заявку', 'Request service', "ส่งคำขอบริการ")}
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
   const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });

   const formatPrice = (price: number, currency: string) => {
     return `${getCurrencySymbol(currency)}${price.toLocaleString()}`;
   };

   return (
     <button
       onClick={onClick}
       className="flex flex-col items-center p-3 rounded-none bg-card border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all text-center min-w-0"
     >
       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg mb-2">
         {fn.icon}
       </div>
       <p className="text-xs font-medium truncate w-full">{fn.name}</p>
       <p className="text-[10px] text-muted-foreground">
         {t('от', 'from', "เริ่มต้น")} {formatPrice(fn.basePrice, fn.currency)}
       </p>
     </button>
   );
 }
