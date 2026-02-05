 import React, { useEffect, useState } from 'react';
 import { useNavigate, useSearchParams } from 'react-router-dom';
 import { Check, Shield, Plane, MapPin, Clock, User, Loader2 } from 'lucide-react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { supabase } from '@/integrations/supabase/client';
 
 interface OrderDetails {
   order_number: string;
   total_amount: number;
   currency: string;
   start_at: string | null;
   metadata: Record<string, unknown>;
   order_addresses?: Array<{
     address_type: string;
     address_text: string;
   }>;
   order_participants?: Array<{
     name: string;
     phone: string | null;
   }>;
 }
 
 export default function TransferSuccess() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const { language } = useLanguage();
   const [order, setOrder] = useState<OrderDetails | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   const orderId = searchParams.get('order_id');
 
   useEffect(() => {
     if (!orderId) {
       setIsLoading(false);
       return;
     }
 
     const fetchOrder = async () => {
       const { data, error } = await supabase
         .from('orders')
         .select(`
           order_number,
           total_amount,
           currency,
           start_at,
           metadata,
           order_addresses(address_type, address_text),
           order_participants(name, phone)
         `)
         .eq('id', orderId)
         .single();
 
       if (!error && data) {
         setOrder(data as OrderDetails);
       }
       setIsLoading(false);
     };
 
     fetchOrder();
   }, [orderId]);
 
   if (isLoading) {
     return (
       <AppLayout showBottomNav={false}>
         <div className="flex items-center justify-center min-h-[60vh]">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
         </div>
       </AppLayout>
     );
   }
 
   const metadata = order?.metadata || {};
   const pickupAddress = order?.order_addresses?.find(a => a.address_type === 'pickup')?.address_text;
   const dropoffAddress = order?.order_addresses?.find(a => a.address_type === 'dropoff')?.address_text;
   const primaryContact = order?.order_participants?.[0];
   const flightNumber = metadata.flight_number as string;
   const meetingSignName = metadata.meeting_sign_name as string;
   const scheduledDate = order?.start_at ? new Date(order.start_at).toLocaleDateString() : '';
   const scheduledTime = order?.start_at ? new Date(order.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
 
   return (
     <AppLayout showBottomNav={false}>
       <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[80vh]">
         <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/40 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
           <Check className="w-12 h-12 text-success" />
         </div>
         
         <h2 className="text-2xl font-display font-bold mb-2 text-center">
           {language === 'ru' ? 'Трансфер оплачен!' : 'Transfer Paid!'}
         </h2>
         
         {order?.order_number && (
           <p className="text-lg font-semibold text-primary mb-2">#{order.order_number}</p>
         )}
         
         <p className="text-muted-foreground text-center max-w-sm mb-2">
           {flightNumber && `${language === 'ru' ? 'Рейс' : 'Flight'} ${flightNumber}`}
           {scheduledDate && ` • ${scheduledDate}`}
         </p>
         
         <div className="flex items-center gap-2 mb-4">
           <Badge variant="secondary" className="bg-success/10 text-success">
             <Shield className="w-3 h-3 mr-1" />
             {language === 'ru' ? 'Оплачено' : 'Paid'}
           </Badge>
         </div>
 
         {/* Transfer Details Card */}
         <div className="w-full max-w-sm p-4 rounded-xl bg-card border border-border/50 mb-4 space-y-3">
           {meetingSignName && (
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                 <User className="w-5 h-5 text-primary" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">
                   {language === 'ru' ? 'Имя на табличке' : 'Name on sign'}
                 </p>
                 <p className="font-semibold text-lg">{meetingSignName}</p>
               </div>
             </div>
           )}
           
           {pickupAddress && (
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                 <Plane className="w-5 h-5 text-muted-foreground" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">
                   {language === 'ru' ? 'Откуда' : 'From'}
                 </p>
                 <p className="font-medium text-sm">{pickupAddress}</p>
               </div>
             </div>
           )}
           
           {dropoffAddress && (
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                 <MapPin className="w-5 h-5 text-muted-foreground" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">
                   {language === 'ru' ? 'Куда' : 'To'}
                 </p>
                 <p className="font-medium text-sm">{dropoffAddress}</p>
               </div>
             </div>
           )}
           
           {scheduledTime && (
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                 <Clock className="w-5 h-5 text-muted-foreground" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">
                   {language === 'ru' ? 'Время' : 'Time'}
                 </p>
                 <p className="font-medium">{scheduledTime}</p>
               </div>
             </div>
           )}
         </div>
 
         <p className="text-muted-foreground text-center max-w-sm mb-8">
           {language === 'ru' 
             ? 'Водитель встретит вас с табличкой у выхода из терминала.'
             : 'Driver will meet you with a sign at the terminal exit.'}
         </p>
         
         <div className="flex gap-3">
           <Button variant="outline" onClick={() => navigate('/transport')}>
             {language === 'ru' ? 'К транспорту' : 'Browse More'}
           </Button>
           <Button onClick={() => navigate('/bookings')}>
             {language === 'ru' ? 'Мои брони' : 'My Bookings'}
           </Button>
         </div>
       </div>
     </AppLayout>
   );
 }