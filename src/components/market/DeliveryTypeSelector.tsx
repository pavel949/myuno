import { useState, useEffect } from 'react';
import { Truck, Plane, Clock, Package, ChevronDown, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type DeliveryType = 'local' | 'international';

export interface InternationalShippingZone {
  id: string;
  zone_code: string;
  zone_name_en: string;
  zone_name_ru: string;
  base_fee: number;
  per_kg_fee: number;
  estimated_days_min: number;
  estimated_days_max: number;
  min_order_amount: number;
  is_active: boolean;
}

interface DeliveryTypeSelectorProps {
  selectedType: DeliveryType;
  onTypeChange: (type: DeliveryType) => void;
  selectedZone?: InternationalShippingZone | null;
  onZoneChange: (zone: InternationalShippingZone | null) => void;
  totalWeight: number;
  subtotal: number;
  localDeliveryFee: number;
  hasNonShippableItems?: boolean;
}

export function useInternationalShippingZones() {
  const [zones, setZones] = useState<InternationalShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchZones = async () => {
      const { data } = await supabase
        .from('marketplace_international_shipping')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      setZones((data || []) as InternationalShippingZone[]);
      setIsLoading(false);
    };

    fetchZones();
  }, []);

  const calculateFee = (zone: InternationalShippingZone, weight: number) => {
    return zone.base_fee + (weight * zone.per_kg_fee);
  };

  return { zones, isLoading, calculateFee };
}

export const DeliveryTypeSelector = ({
  selectedType,
  onTypeChange,
  selectedZone,
  onZoneChange,
  totalWeight,
  subtotal,
  localDeliveryFee,
  hasNonShippableItems = false,
}: DeliveryTypeSelectorProps) => {
  const { language } = useLanguage();
  const { zones, isLoading, calculateFee } = useInternationalShippingZones();

  const handleTypeChange = (value: string) => {
    const newType = value as DeliveryType;
    onTypeChange(newType);
    if (newType === 'local') {
      onZoneChange(null);
    } else if (zones.length > 0 && !selectedZone) {
      onZoneChange(zones[0]);
    }
  };

  const handleZoneChange = (zoneCode: string) => {
    const zone = zones.find(z => z.zone_code === zoneCode);
    onZoneChange(zone || null);
  };

  const internationalFee = selectedZone ? calculateFee(selectedZone, totalWeight) : 0;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        {language === 'ru' ? 'Способ доставки' : 'Delivery Method'}
      </h3>

      <RadioGroup value={selectedType} onValueChange={handleTypeChange} className="space-y-3">
        {/* Local Delivery */}
        <div 
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
            selectedType === 'local' 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}
          onClick={() => handleTypeChange('local')}
        >
          <RadioGroupItem value="local" id="local" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="local" className="text-base font-medium cursor-pointer flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Локальная доставка' : 'Local Delivery'}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'ru' ? 'Пхукет, 1-2 часа' : 'Phuket, 1-2 hours'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {language === 'ru' ? '1-2 ч' : '1-2h'}
              </Badge>
              {localDeliveryFee === 0 ? (
                <Badge className="bg-green-500 text-white text-xs">
                  {language === 'ru' ? 'Бесплатно' : 'Free'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  ฿{localDeliveryFee.toLocaleString()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* International Delivery */}
        <div 
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
            selectedType === 'international' 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50",
            hasNonShippableItems && "opacity-80"
          )}
          onClick={() => handleTypeChange('international')}
        >
          <RadioGroupItem value="international" id="international" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="international" className="text-base font-medium cursor-pointer flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-500" />
              {language === 'ru' ? 'Международная доставка' : 'International Shipping'}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'ru' ? 'Отправка домой за рубеж' : 'Ship to your home abroad'}
            </p>

            {/* Zone Selector - shows when international is selected */}
            {selectedType === 'international' && (
              <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                {hasNonShippableItems && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {language === 'ru' 
                        ? 'Некоторые товары в корзине не подходят для международной доставки' 
                        : 'Some items in your cart cannot be shipped internationally'}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    {language === 'ru' ? 'Выберите регион' : 'Select Region'}
                  </Label>
                  <Select 
                    value={selectedZone?.zone_code || ''} 
                    onValueChange={handleZoneChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={language === 'ru' ? 'Выберите...' : 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.zone_code} value={zone.zone_code}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{language === 'ru' ? zone.zone_name_ru : zone.zone_name_en}</span>
                            <span className="text-muted-foreground text-xs">
                              {zone.estimated_days_min}-{zone.estimated_days_max} {language === 'ru' ? 'дн.' : 'days'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedZone && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === 'ru' ? 'Вес заказа' : 'Order Weight'}
                      </span>
                      <span className="font-medium">~{totalWeight.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === 'ru' ? 'Базовая стоимость' : 'Base Fee'}
                      </span>
                      <span>฿{selectedZone.base_fee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === 'ru' ? 'За вес' : 'Weight Fee'}
                      </span>
                      <span>
                        {totalWeight.toFixed(1)} × ฿{selectedZone.per_kg_fee} = ฿{(totalWeight * selectedZone.per_kg_fee).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                      <span>{language === 'ru' ? 'Итого доставка' : 'Shipping Total'}</span>
                      <span className="text-primary">฿{internationalFee.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {selectedZone.estimated_days_min}-{selectedZone.estimated_days_max} {language === 'ru' ? 'дней' : 'days'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};
