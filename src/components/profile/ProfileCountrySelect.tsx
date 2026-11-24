import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { cn } from '@/lib/utils';

// Preserve the ISO codes already accepted by the two profile editors.
const COUNTRIES = [
  { code: 'RU', en: 'Russia', ru: 'Россия' },
  { code: 'TH', en: 'Thailand', ru: 'Таиланд' },
  { code: 'US', en: 'USA', ru: 'США', aliases: ['United States', 'Соединённые Штаты'] },
  { code: 'DE', en: 'Germany', ru: 'Германия' },
  { code: 'UA', en: 'Ukraine', ru: 'Украина' },
  { code: 'KZ', en: 'Kazakhstan', ru: 'Казахстан' },
  { code: 'BY', en: 'Belarus', ru: 'Беларусь' },
  { code: 'GB', en: 'United Kingdom', ru: 'Великобритания', aliases: ['UK'] },
] as const;

type Props = { id: string; value: string; onChange: (value: string) => void; className?: string };

export function ProfileCountrySelect({ id, value, onChange, className }: Props) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([language], { type: 'region' }) : null;
  const options = COUNTRIES.map(country => ({
    ...country,
    name: language === 'th' ? regionNames?.of(country.code) ?? country.en : pickLang(language, country),
  }));
  const selected = options.find(country => country.code === value);
  const searchLabel = pickLang(language, { en: 'Search countries', ru: 'Поиск страны', th: 'ค้นหาประเทศ' });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className={cn('w-full justify-between gap-2 font-normal', className)}>
          <span className="truncate">{selected?.name ?? (value || pickLang(language, { en: 'Select country', ru: 'Выбрать страну', th: 'เลือกประเทศ' }))}</span>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0" aria-label={searchLabel}>
        <Command label={searchLabel}>
          <CommandInput aria-label={searchLabel} placeholder={searchLabel} />
          <CommandList>
            <CommandEmpty>{pickLang(language, { en: 'No matching countries', ru: 'Страны не найдены', th: 'ไม่พบประเทศที่ตรงกัน' })}</CommandEmpty>
            {options.map(country => (
              <CommandItem
                key={country.code}
                value={country.code}
                keywords={[country.name, country.en, country.ru, ...('aliases' in country ? country.aliases : [])]}
                onSelect={() => { onChange(country.code); setOpen(false); }}
              >
                <Check aria-hidden className={cn('mr-2 size-4 shrink-0', country.code === value ? 'opacity-100' : 'opacity-0')} />
                {country.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
