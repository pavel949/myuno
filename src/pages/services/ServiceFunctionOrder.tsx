 import { useState, useEffect } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import { ArrowLeft, Clock, MapPin, Calendar, MessageSquare, Check, LocateFixed, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useServiceFunctions } from '@/hooks/useServiceFunctions';
 import { useUniversalLead } from '@/hooks/useUniversalLead';
 import { useGeolocation } from '@/hooks/useGeolocation';
 import { toast } from 'sonner';
 import { format } from 'date-fns';
 
 export default function ServiceFunctionOrder() {
   const { functionId } = useParams<{ functionId: string }>();
   const navigate = useNavigate();
   const { language, t } = useLanguage();
   const isRu = language === 'ru';
   
   const { getFunction, getRawFunction } = useServiceFunctions();
   const { submitLead, isSubmitting } = useUniversalLead();
   const { latitude, longitude, hasLocation, getPosition, loading: isGeoLoading } = useGeolocation();
   
   const fn = getFunction(functionId || '');
   const rawFn = getRawFunction(functionId || '');
   
   const [formData, setFormData] = useState({
     name: '',
     phone: '',
     address: '',
     preferredDate: '',
     preferredTime: 'morning',
     problemDescription: '',
     contactMethod: 'whatsapp',
   });
   
   const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
 
   // Reverse geocode when location is obtained
   useEffect(() => {
     if (hasLocation && latitude && longitude && isReverseGeocoding) {
       fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
         .then(res => res.json())
         .then(data => {
           if (data.display_name) {
             const parts = data.display_name.split(',').slice(0, 4).join(',').trim();
             setFormData(prev => ({ ...prev, address: parts }));
           }
           setIsReverseGeocoding(false);
         })
         .catch(() => {
           setIsReverseGeocoding(false);
           toast.error(isRu ? 'Не удалось определить адрес' : 'Could not determine address');
         });
     }
   }, [hasLocation, latitude, longitude, isReverseGeocoding, isRu]);
 
   const handleUseCurrentLocation = () => {
     setIsReverseGeocoding(true);
     getPosition();
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!fn || !rawFn) return;
     
     if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
       toast.error(isRu ? 'Заполните обязательные поля' : 'Please fill required fields');
       return;
     }
 
     try {
       await submitLead.mutateAsync({
         vertical_id: 'home_services',
         request_type: 'service_order',
         lead_source: 'cta',
         entry_point: `/services/order/${functionId}`,
         name: formData.name,
         phone: formData.phone,
         preferred_contact_method: formData.contactMethod,
         notes: formData.problemDescription,
         vertical_metadata: {
           function_id: fn.id,
           function_name_en: rawFn.nameEn,
           function_name_ru: rawFn.nameRu,
           category: fn.category,
           service_address: formData.address,
           preferred_date: formData.preferredDate,
           preferred_time: formData.preferredTime,
           base_price: fn.basePrice,
           currency: fn.currency,
           estimated_time: fn.estimatedTime,
           includes: fn.includes,
         },
       });
       
       navigate('/services/order/success', { 
         state: { 
           functionName: fn.name,
           functionIcon: fn.icon,
         } 
       });
     } catch (error) {
       console.error('Order submission failed:', error);
     }
   };
 
   if (!fn || !rawFn) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <p className="text-muted-foreground">{isRu ? 'Услуга не найдена' : 'Service not found'}</p>
       </div>
     );
   }
 
   const formatPrice = (price: number, currency: string) => {
     if (currency === 'THB') return `฿${price.toLocaleString()}`;
     return `${currency} ${price.toLocaleString()}`;
   };
 
   const timeSlots = [
     { value: 'morning', labelEn: 'Morning (9:00-12:00)', labelRu: 'Утро (9:00-12:00)' },
     { value: 'afternoon', labelEn: 'Afternoon (12:00-17:00)', labelRu: 'День (12:00-17:00)' },
     { value: 'evening', labelEn: 'Evening (17:00-20:00)', labelRu: 'Вечер (17:00-20:00)' },
     { value: 'urgent', labelEn: 'ASAP (Urgent)', labelRu: 'Срочно (ASAP)' },
   ];
 
   return (
     <div className="min-h-screen bg-background pb-24">
       {/* Header */}
       <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
         <div className="flex items-center gap-3 px-4 py-3">
           <BackButton fallbackPath={APP_ROUTES.SERVICES} variant="ghost" />
           <div className="flex-1">
             <h1 className="font-semibold">{isRu ? 'Заказать услугу' : 'Order Service'}</h1>
           </div>
         </div>
       </div>
 
       <form onSubmit={handleSubmit} className="p-4 space-y-4">
         {/* Service Info Card */}
         <Card className="border-primary/20 bg-primary/5">
           <CardContent className="p-4">
             <div className="flex gap-4">
               <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-2xl shrink-0">
                 {fn.icon}
               </div>
               <div className="flex-1 min-w-0">
                 <h2 className="font-semibold text-lg">{fn.name}</h2>
                 <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                   <span className="flex items-center gap-1">
                     <Clock className="h-3.5 w-3.5" />
                     {fn.estimatedTime}
                   </span>
                   <span className="font-medium text-primary">
                     {isRu ? 'от' : 'from'} {formatPrice(fn.basePrice, fn.currency)}
                   </span>
                 </div>
               </div>
             </div>
             
             {/* What's included */}
             <div className="mt-4 pt-3 border-t border-primary/10">
               <p className="text-xs font-medium text-muted-foreground mb-2">
                 {isRu ? 'Что входит:' : 'Includes:'}
               </p>
               <div className="flex flex-wrap gap-1.5">
                 {fn.includes.map((item, idx) => (
                   <Badge key={idx} variant="secondary" className="text-xs font-normal">
                     <Check className="h-3 w-3 mr-1" />
                     {item}
                   </Badge>
                 ))}
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Address */}
         <div className="space-y-2">
           <Label className="flex items-center gap-2">
             <MapPin className="h-4 w-4" />
             {isRu ? 'Адрес' : 'Address'} *
           </Label>
           <div className="relative">
             <Input
               value={formData.address}
               onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
               placeholder={isRu ? 'Введите адрес или выберите на карте' : 'Enter address or use location'}
               className="pr-10"
               required
             />
             <Button
               type="button"
               variant="ghost"
               size="icon"
               className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
               onClick={handleUseCurrentLocation}
               disabled={isGeoLoading || isReverseGeocoding}
             >
               {isGeoLoading || isReverseGeocoding ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
               ) : (
                 <LocateFixed className="h-4 w-4" />
               )}
             </Button>
           </div>
           <button
             type="button"
             onClick={handleUseCurrentLocation}
             disabled={isGeoLoading || isReverseGeocoding}
             className="text-xs text-primary hover:underline flex items-center gap-1"
           >
             <LocateFixed className="h-3 w-3" />
             {isRu ? 'Использовать текущее местоположение' : 'Use current location'}
           </button>
         </div>
 
         {/* Preferred Date */}
         <div className="space-y-2">
           <Label className="flex items-center gap-2">
             <Calendar className="h-4 w-4" />
             {isRu ? 'Предпочтительная дата' : 'Preferred Date'}
           </Label>
           <Input
             type="date"
             value={formData.preferredDate}
             onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
             min={format(new Date(), 'yyyy-MM-dd')}
           />
         </div>
 
         {/* Preferred Time */}
         <div className="space-y-2">
           <Label>{isRu ? 'Удобное время' : 'Preferred Time'}</Label>
           <RadioGroup
             value={formData.preferredTime}
             onValueChange={(value) => setFormData(prev => ({ ...prev, preferredTime: value }))}
             className="grid grid-cols-2 gap-2"
           >
             {timeSlots.map(slot => (
               <Label
                 key={slot.value}
                 htmlFor={`time-${slot.value}`}
                 className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                   formData.preferredTime === slot.value
                     ? 'border-primary bg-primary/5'
                     : 'border-border hover:border-primary/30'
                 }`}
               >
                 <RadioGroupItem value={slot.value} id={`time-${slot.value}`} />
                 <span className="text-sm">{isRu ? slot.labelRu : slot.labelEn}</span>
               </Label>
             ))}
           </RadioGroup>
         </div>
 
         {/* Problem Description */}
         <div className="space-y-2">
           <Label className="flex items-center gap-2">
             <MessageSquare className="h-4 w-4" />
             {isRu ? 'Опишите проблему' : 'Describe the problem'}
           </Label>
           <Textarea
             value={formData.problemDescription}
             onChange={(e) => setFormData(prev => ({ ...prev, problemDescription: e.target.value }))}
             placeholder={isRu 
               ? 'Расскажите подробнее о проблеме...' 
               : 'Tell us more about the problem...'}
             rows={3}
           />
         </div>
 
         {/* Contact Info */}
         <Card>
           <CardContent className="p-4 space-y-4">
             <h3 className="font-medium">{isRu ? 'Контактные данные' : 'Contact Information'}</h3>
             
             <div className="space-y-2">
               <Label>{isRu ? 'Ваше имя' : 'Your name'} *</Label>
               <Input
                 value={formData.name}
                 onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                 placeholder={isRu ? 'Иван Петров' : 'John Smith'}
                 required
               />
             </div>
             
             <div className="space-y-2">
               <Label>{isRu ? 'Телефон' : 'Phone'} *</Label>
               <Input
                 type="tel"
                 value={formData.phone}
                 onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                 placeholder="+66 XX XXX XXXX"
                 required
               />
             </div>
             
             <div className="space-y-2">
               <Label>{isRu ? 'Как с вами связаться?' : 'How to contact you?'}</Label>
               <RadioGroup
                 value={formData.contactMethod}
                 onValueChange={(value) => setFormData(prev => ({ ...prev, contactMethod: value }))}
                 className="flex gap-4"
               >
                 <Label htmlFor="contact-whatsapp" className="flex items-center gap-2 cursor-pointer">
                   <RadioGroupItem value="whatsapp" id="contact-whatsapp" />
                   <span className="text-sm">WhatsApp</span>
                 </Label>
                 <Label htmlFor="contact-phone" className="flex items-center gap-2 cursor-pointer">
                   <RadioGroupItem value="phone" id="contact-phone" />
                   <span className="text-sm">{isRu ? 'Звонок' : 'Phone call'}</span>
                 </Label>
                 <Label htmlFor="contact-line" className="flex items-center gap-2 cursor-pointer">
                   <RadioGroupItem value="line" id="contact-line" />
                   <span className="text-sm">LINE</span>
                 </Label>
               </RadioGroup>
             </div>
           </CardContent>
         </Card>
 
         {/* Submit Button */}
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
           <Button 
             type="submit" 
             className="w-full h-12 text-base"
             disabled={isSubmitting}
           >
             {isSubmitting ? (
               <Loader2 className="h-5 w-5 animate-spin mr-2" />
             ) : null}
             {isRu ? 'Отправить заявку' : 'Submit Request'}
           </Button>
           <p className="text-xs text-center text-muted-foreground mt-2">
             {isRu 
               ? 'Мы свяжемся с вами в течение 30 минут' 
               : 'We will contact you within 30 minutes'}
           </p>
         </div>
       </form>
     </div>
   );
 }