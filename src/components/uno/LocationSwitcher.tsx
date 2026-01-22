import { useState, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const locations = [
  { id: 'phuket', nameEn: 'Phuket', nameRu: 'Пхукет' },
  { id: 'bangkok', nameEn: 'Bangkok', nameRu: 'Бангкок' },
  { id: 'samui', nameEn: 'Koh Samui', nameRu: 'Ко Самуи' },
  { id: 'pattaya', nameEn: 'Pattaya', nameRu: 'Паттайя' },
  { id: 'chiang-mai', nameEn: 'Chiang Mai', nameRu: 'Чианг Май' },
];

export function LocationSwitcher() {
  const { language } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState(() => 
    localStorage.getItem('myuno-user-location') || 'phuket'
  );

  const handleSelect = (locationId: string) => {
    setSelectedLocation(locationId);
    localStorage.setItem('myuno-user-location', locationId);
  };

  const currentLocation = locations.find(l => l.id === selectedLocation) || locations[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          {language === 'ru' ? currentLocation.nameRu : currentLocation.nameEn}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locations.map((loc) => (
          <DropdownMenuItem
            key={loc.id}
            onClick={() => handleSelect(loc.id)}
            className="flex items-center justify-between"
          >
            <span>{language === 'ru' ? loc.nameRu : loc.nameEn}</span>
            {selectedLocation === loc.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
