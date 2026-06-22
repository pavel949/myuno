import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

const DAYS: { key: string; en: string; ru: string; th: string }[] = [
  { key: 'mon', en: 'Mon', ru: 'Пн', th: 'จ.' },
  { key: 'tue', en: 'Tue', ru: 'Вт', th: 'อ.' },
  { key: 'wed', en: 'Wed', ru: 'Ср', th: 'พ.' },
  { key: 'thu', en: 'Thu', ru: 'Чт', th: 'พฤ.' },
  { key: 'fri', en: 'Fri', ru: 'Пт', th: 'ศ.' },
  { key: 'sat', en: 'Sat', ru: 'Сб', th: 'ส.' },
  { key: 'sun', en: 'Sun', ru: 'Вс', th: 'อา.' },
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
  const lang = language;
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
            <span className="text-sm font-medium">{lang === 'ru' ? d.ru : lang === 'th' ? d.th : d.en}</span>
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
              {lang === 'ru' ? 'Закрыто' : lang === 'th' ? 'ปิด' : 'Closed'}
            </label>
          </div>
        );
      })}
    </div>
  );
}
