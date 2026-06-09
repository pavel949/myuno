import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

const DAYS: { key: string; en: string; ru: string }[] = [
  { key: 'mon', en: 'Mon', ru: 'Пн' },
  { key: 'tue', en: 'Tue', ru: 'Вт' },
  { key: 'wed', en: 'Wed', ru: 'Ср' },
  { key: 'thu', en: 'Thu', ru: 'Чт' },
  { key: 'fri', en: 'Fri', ru: 'Пт' },
  { key: 'sat', en: 'Sat', ru: 'Сб' },
  { key: 'sun', en: 'Sun', ru: 'Вс' },
];

export interface WeeklyHours {
  [day: string]: { open?: string; close?: string; closed?: boolean } | undefined;
}

interface Props {
  value: WeeklyHours | undefined;
  onChange: (v: WeeklyHours) => void;
}

export function WeeklyHoursEditor({ value, onChange }: Props) {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const v: WeeklyHours = value && typeof value === 'object' ? value : {};

  const set = (day: string, patch: Partial<{ open: string; close: string; closed: boolean }>) => {
    onChange({ ...v, [day]: { ...(v[day] ?? { open: '09:00', close: '22:00' }), ...patch } });
  };

  return (
    <div className="space-y-1.5">
      {DAYS.map((d) => {
        const row = v[d.key] ?? { open: '09:00', close: '22:00', closed: false };
        const closed = !!row.closed;
        return (
          <div key={d.key} className="grid grid-cols-[60px,1fr,1fr,auto] items-center gap-2">
            <span className="text-sm font-medium">{lang === 'ru' ? d.ru : d.en}</span>
            <Input
              type="time"
              value={row.open ?? ''}
              disabled={closed}
              onChange={(e) => set(d.key, { open: e.target.value })}
            />
            <Input
              type="time"
              value={row.close ?? ''}
              disabled={closed}
              onChange={(e) => set(d.key, { close: e.target.value })}
            />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Switch checked={closed} onCheckedChange={(c) => set(d.key, { closed: c })} />
              {lang === 'ru' ? 'Закрыто' : 'Closed'}
            </label>
          </div>
        );
      })}
    </div>
  );
}
