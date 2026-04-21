import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plane, 
  MapPin, 
  ArrowRight, 
  Calendar,
  Dog,
  Cat,
  PawPrint,
  Shield,
  Clock,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const destinations = [
  { id: 'russia', label: 'Russia', labelRu: 'Россия', price: 25000 },
  { id: 'europe', label: 'Europe', labelRu: 'Европа', price: 35000 },
  { id: 'usa', label: 'USA / Canada', labelRu: 'США / Канада', price: 45000 },
  { id: 'asia', label: 'Asia', labelRu: 'Азия', price: 15000 },
  { id: 'australia', label: 'Australia', labelRu: 'Австралия', price: 50000 },
  { id: 'domestic', label: 'Thailand (Domestic)', labelRu: 'Таиланд (внутренний)', price: 5000 },
];

const petSizes = [
  { id: 'small', label: 'Small (up to 8kg)', labelRu: 'Маленький (до 8 кг)', multiplier: 1 },
  { id: 'medium', label: 'Medium (8-23kg)', labelRu: 'Средний (8-23 кг)', multiplier: 1.3 },
  { id: 'large', label: 'Large (23-40kg)', labelRu: 'Большой (23-40 кг)', multiplier: 1.6 },
  { id: 'xlarge', label: 'Extra Large (40kg+)', labelRu: 'Очень большой (40+ кг)', multiplier: 2 },
];

const petTypes = [
  { id: 'dog', label: 'Dog', labelRu: 'Собака', icon: Dog },
  { id: 'cat', label: 'Cat', labelRu: 'Кошка', icon: Cat },
  { id: 'other', label: 'Other', labelRu: 'Другое', icon: PawPrint },
];

const includedServices = [
  { text: 'Door-to-door pickup & delivery', textRu: 'Забор и доставка от двери до двери' },
  { text: 'All documentation & permits', textRu: 'Все документы и разрешения' },
  { text: 'IATA-approved travel crate', textRu: 'Переноска, одобренная IATA' },
  { text: 'Veterinary health certificate', textRu: 'Ветеринарный сертификат' },
  { text: 'Flight booking assistance', textRu: 'Помощь с бронированием рейса' },
  { text: 'Pet insurance during transport', textRu: 'Страховка питомца на время перевозки' },
  { text: 'Quarantine assistance (if needed)', textRu: 'Помощь с карантином (если нужно)' },
];

export default function PetTransport() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [petType, setPetType] = useState('dog');
  const [petSize, setPetSize] = useState('medium');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState<Date | undefined>();
  const [originCity, setOriginCity] = useState('');

  const selectedDestination = destinations.find(d => d.id === destination);
  const selectedSize = petSizes.find(s => s.id === petSize);
  
  const basePrice = selectedDestination?.price || 0;
  const totalPrice = Math.round(basePrice * (selectedSize?.multiplier || 1));

  const handleGetQuote = () => {
    navigate('/pets/transport/quote', {
      state: {
        petType,
        petSize,
        destination,
        travelDate,
        originCity,
        totalPrice,
      }
    });
  };

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        <PageHeader title={language === 'ru' ? 'Перевозка питомцев' : 'Pet Transport'} showBack fallbackPath="/pets" />
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6">
          <img
            src={PLACEHOLDER_IMAGES.pet}
            alt="Pet Transport"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-5 h-5" />
              <span className="text-sm font-medium">
                {language === 'ru' ? 'Международная перевозка' : 'International Transport'}
              </span>
            </div>
            <h1 className="text-xl font-bold">
              {language === 'ru' 
                ? 'Безопасная перевозка по всему миру' 
                : 'Safe Transport Worldwide'}
            </h1>
          </div>
        </div>

        {/* Pet Type */}
        <div className="space-y-3 mb-6">
          <Label className="text-base font-semibold">
            {language === 'ru' ? 'Тип питомца' : 'Pet Type'}
          </Label>
          <RadioGroup value={petType} onValueChange={setPetType} className="flex gap-2">
            {petTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Label
                  key={type.id}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all",
                    petType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <RadioGroupItem value={type.id} className="sr-only" />
                  <Icon className="w-6 h-6" />
                  <span className="font-medium">
                    {language === 'ru' ? type.labelRu : type.label}
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
        </div>

        {/* Pet Size */}
        <div className="space-y-3 mb-6">
          <Label className="text-base font-semibold">
            {language === 'ru' ? 'Размер питомца' : 'Pet Size'}
          </Label>
          <Select value={petSize} onValueChange={setPetSize}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {petSizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {language === 'ru' ? size.labelRu : size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Route */}
        <div className="space-y-3 mb-6">
          <Label className="text-base font-semibold">
            {language === 'ru' ? 'Маршрут' : 'Route'}
          </Label>
          
          <div className="space-y-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-emerald" />
              <Input
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className="pl-10"
                placeholder={language === 'ru' ? 'Город отправления' : 'Origin city'}
              />
            </div>
            
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
            
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="pl-10">
                <MapPin className="absolute left-3 w-5 h-5 text-destructive" />
                <SelectValue placeholder={language === 'ru' ? 'Выберите направление' : 'Select destination'} />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((dest) => (
                  <SelectItem key={dest.id} value={dest.id}>
                    {language === 'ru' ? dest.labelRu : dest.label} — от ฿{dest.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Travel Date */}
        <div className="space-y-3 mb-6">
          <Label className="text-base font-semibold">
            {language === 'ru' ? 'Примерная дата' : 'Approximate Date'}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                {travelDate 
                  ? format(travelDate, 'PPP') 
                  : (language === 'ru' ? 'Выбрать дату' : 'Pick a date')
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={travelDate}
                onSelect={setTravelDate}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* What's Included */}
        <div className="bg-muted/50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Что включено' : "What's Included"}
          </h3>
          <div className="space-y-2">
            {includedServices.map((service, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <span>{language === 'ru' ? service.textRu : service.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Process Timeline */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Процесс' : 'Process'}
          </h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Consultation & quote', textRu: 'Консультация и расчёт' },
              { step: '2', text: 'Document preparation', textRu: 'Подготовка документов' },
              { step: '3', text: 'Veterinary check-up', textRu: 'Ветеринарный осмотр' },
              { step: '4', text: 'Travel day', textRu: 'День перелёта' },
              { step: '5', text: 'Delivery to destination', textRu: 'Доставка в пункт назначения' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {item.step}
                </div>
                <span className="text-sm">
                  {language === 'ru' ? item.textRu : item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="max-w-lg mx-auto">
          {totalPrice > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Примерная стоимость' : 'Estimated price'}
              </span>
              <span className="text-xl font-bold">
                {language === 'ru' ? 'от' : 'from'} ฿{totalPrice.toLocaleString()}
              </span>
            </div>
          )}
          <Button 
            onClick={handleGetQuote} 
            size="lg" 
            className="w-full"
            disabled={!destination}
          >
            <FileText className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Получить точный расчёт' : 'Get Exact Quote'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
