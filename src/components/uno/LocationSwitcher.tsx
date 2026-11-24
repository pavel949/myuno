import { Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { pickLang } from '@/lib/i18n/pickLang';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LocationSwitcher() {
  const { language } = useLanguage();
  const { currentCitySlug, activeCities, isLoading, getCityName, setCity } = useLocation();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const current = activeCities.some(city => city.slug === currentCitySlug) ? getCityName(language) : '';
  const value = current || (isLoading
    ? t('Загрузка…', 'Loading…', 'กำลังโหลด…')
    : activeCities.length
      ? t('Выбрать город', 'Select city', 'เลือกเมือง')
      : t('Недоступно', 'Unavailable', 'ไม่พร้อมใช้งาน'));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" aria-label={t(`Город: ${value}`, `City: ${value}`, `เมือง: ${value}`)}
          disabled={isLoading || !activeCities.length} className="min-h-11 min-w-11 gap-2">
          <span className="min-w-0 whitespace-normal">{value}</span>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {activeCities.map(city => (
          <DropdownMenuItem key={city.slug} onSelect={() => setCity(city.slug)} className="flex items-center justify-between gap-3">
            {pickLang(language, { ru: city.name_ru || city.name_en, en: city.name_en, th: city.name_th || city.name_en })}
            {currentCitySlug === city.slug && <Check aria-hidden className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
