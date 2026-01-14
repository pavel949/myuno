import React, { useState, useEffect } from 'react';
import { MapPin, Globe, DollarSign, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const locations = [
  { id: 'phuket', nameEn: 'Phuket', nameRu: 'Пхукет' },
  { id: 'bangkok', nameEn: 'Bangkok', nameRu: 'Бангкок' },
  { id: 'samui', nameEn: 'Koh Samui', nameRu: 'Ко Самуи' },
  { id: 'pattaya', nameEn: 'Pattaya', nameRu: 'Паттайя' },
  { id: 'chiang-mai', nameEn: 'Chiang Mai', nameRu: 'Чианг Май' },
];

const currencies = [
  { id: 'THB', symbol: '฿', nameEn: 'Thai Baht', nameRu: 'Тайский бат' },
  { id: 'USD', symbol: '$', nameEn: 'US Dollar', nameRu: 'Доллар США' },
  { id: 'EUR', symbol: '€', nameEn: 'Euro', nameRu: 'Евро' },
  { id: 'RUB', symbol: '₽', nameEn: 'Russian Ruble', nameRu: 'Российский рубль' },
];

interface UserPreferencesProps {
  onSave?: () => void;
}

export function UserPreferences({ onSave }: UserPreferencesProps) {
  const { language } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState(() => 
    localStorage.getItem('myuno-user-location') || 'phuket'
  );
  const [selectedCurrency, setSelectedCurrency] = useState(() => 
    localStorage.getItem('myuno-user-currency') || 'THB'
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const savedLocation = localStorage.getItem('myuno-user-location') || 'phuket';
    const savedCurrency = localStorage.getItem('myuno-user-currency') || 'THB';
    setHasChanges(
      selectedLocation !== savedLocation || selectedCurrency !== savedCurrency
    );
  }, [selectedLocation, selectedCurrency]);

  const handleSave = () => {
    localStorage.setItem('myuno-user-location', selectedLocation);
    localStorage.setItem('myuno-user-currency', selectedCurrency);
    setHasChanges(false);
    toast.success(language === 'ru' ? 'Настройки сохранены' : 'Settings saved');
    onSave?.();
  };

  return (
    <div className="space-y-4">
      {/* Location */}
      <SectionCard>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">
            {language === 'ru' ? 'Ваш город' : 'Your Location'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all",
                selectedLocation === loc.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              {language === 'ru' ? loc.nameRu : loc.nameEn}
              {selectedLocation === loc.id && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Currency */}
      <SectionCard>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">
            {language === 'ru' ? 'Валюта' : 'Currency'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {currencies.map(curr => (
            <button
              key={curr.id}
              onClick={() => setSelectedCurrency(curr.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all",
                selectedCurrency === curr.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="font-medium">{curr.symbol}</span>
              {language === 'ru' ? curr.nameRu : curr.nameEn}
              {selectedCurrency === curr.id && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Save Button */}
      {hasChanges && (
        <Button onClick={handleSave} className="w-full">
          {language === 'ru' ? 'Сохранить настройки' : 'Save Settings'}
        </Button>
      )}
    </div>
  );
}
