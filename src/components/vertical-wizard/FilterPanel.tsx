import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import type { VerticalSpec, FilterSpec, LocalizedText } from '@/lib/vertical-specs/types';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ActiveFilters } from '@/hooks/useVerticalListings';

const t = (l: LocalizedText, lang: 'en' | 'ru') => l[lang] ?? l.en;

interface Props {
  spec: VerticalSpec;
  onChange?: (filters: ActiveFilters, sort?: string) => void;
}

/**
 * Spec-driven catalog FilterPanel. Persists state in URL search params so
 * filters are deep-linkable, shareable, and SSR-friendly.
 */
export function FilterPanel({ spec, onChange }: Props) {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const [params, setParams] = useSearchParams();

  const { filters, sort } = useMemo(() => parseParams(spec, params), [spec, params]);

  const update = (next: ActiveFilters, nextSort?: string) => {
    const p = new URLSearchParams(params);
    spec.filters.forEach((f) => p.delete(f.key));
    p.delete('sort');
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
      if (typeof v === 'boolean') p.set(k, v ? '1' : '');
      else if (Array.isArray(v)) p.set(k, v.join(','));
      else if (typeof v === 'object') {
        if ('min' in v || 'max' in v) {
          if (v.min !== undefined) p.set(`${k}_min`, String(v.min));
          if (v.max !== undefined) p.set(`${k}_max`, String(v.max));
        } else if ('from' in v || 'to' in v) {
          if (v.from) p.set(`${k}_from`, v.from);
          if (v.to) p.set(`${k}_to`, v.to);
        }
      } else p.set(k, String(v));
    }
    if (nextSort) p.set('sort', nextSort);
    setParams(p, { replace: true });
    onChange?.(next, nextSort);
  };

  const reset = () => {
    const p = new URLSearchParams(params);
    spec.filters.forEach((f) => {
      p.delete(f.key);
      p.delete(`${f.key}_min`);
      p.delete(`${f.key}_max`);
      p.delete(`${f.key}_from`);
      p.delete(`${f.key}_to`);
    });
    p.delete('sort');
    setParams(p, { replace: true });
    onChange?.({}, undefined);
  };

  const activeCount = Object.values(filters).filter((v) =>
    v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0),
  ).length;

  const sortFilter = spec.filters.find((f) => f.type === 'sort');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {lang === 'ru' ? 'Фильтры' : 'Filters'}
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2">{activeCount}</Badge>
          )}
        </h3>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="h-3 w-3 mr-1" />
            {lang === 'ru' ? 'Сброс' : 'Reset'}
          </Button>
        )}
      </div>

      {sortFilter && (
        <FilterRow
          spec={sortFilter}
          value={sort}
          lang={lang}
          onSet={(v) => update(filters, v as string)}
        />
      )}

      {spec.filters
        .filter((f) => f.type !== 'sort')
        .map((f) => (
          <FilterRow
            key={f.key}
            spec={f}
            value={filters[f.key]}
            lang={lang}
            onSet={(v) => update({ ...filters, [f.key]: v }, sort)}
          />
        ))}
    </div>
  );
}

function FilterRow({
  spec,
  value,
  lang,
  onSet,
}: {
  spec: FilterSpec;
  value: unknown;
  lang: 'en' | 'ru';
  onSet: (v: unknown) => void;
}) {
  const label = t(spec.label, lang);

  switch (spec.type) {
    case 'sort':
    case 'enum': {
      if (spec.type === 'sort' || (spec.options && spec.options.length <= 5)) {
        return (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
            <Select value={(value as string) ?? ''} onValueChange={(v) => onSet(v || undefined)}>
              <SelectTrigger><SelectValue placeholder={lang === 'ru' ? 'Любое' : 'Any'} /></SelectTrigger>
              <SelectContent>
                {spec.options?.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{t(o.label, lang)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }
      // multi-enum as toggle chips
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (v: string) =>
        onSet(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
      return (
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
          <div className="flex flex-wrap gap-1.5">
            {spec.options?.map((o) => {
              const on = selected.includes(o.value);
              return (
                <Badge
                  key={o.value}
                  variant={on ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => toggle(o.value)}
                >
                  {t(o.label, lang)}
                </Badge>
              );
            })}
          </div>
        </div>
      );
    }

    case 'bool':
      return (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5">
          <Label className="text-sm">{label}</Label>
          <Switch checked={!!value} onCheckedChange={(v) => onSet(v || undefined)} />
        </div>
      );

    case 'range': {
      const v = (value as { min?: number; max?: number }) ?? {};
      return (
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}{spec.unit ? ` (${spec.unit})` : ''}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder={lang === 'ru' ? 'от' : 'min'}
              value={v.min ?? ''}
              min={spec.min}
              max={spec.max}
              step={spec.step ?? 1}
              onChange={(e) => onSet({ ...v, min: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
            <Input
              type="number"
              placeholder={lang === 'ru' ? 'до' : 'max'}
              value={v.max ?? ''}
              min={spec.min}
              max={spec.max}
              step={spec.step ?? 1}
              onChange={(e) => onSet({ ...v, max: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </div>
        </div>
      );
    }

    case 'distance':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {label} ({spec.unit ?? 'km'})
          </Label>
          <Input
            type="number"
            placeholder={spec.max ? `≤ ${spec.max}` : '—'}
            value={(value as number) ?? ''}
            min={spec.min ?? 1}
            max={spec.max}
            step={spec.step ?? 1}
            onChange={(e) => onSet(e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </div>
      );

    case 'daterange': {
      const v = (value as { from?: string; to?: string }) ?? {};
      return (
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={v.from ?? ''} onChange={(e) => onSet({ ...v, from: e.target.value || undefined })} />
            <Input type="date" value={v.to ?? ''} onChange={(e) => onSet({ ...v, to: e.target.value || undefined })} />
          </div>
        </div>
      );
    }

    case 'text':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
          <Input
            value={(value as string) ?? ''}
            onChange={(e) => onSet(e.target.value || undefined)}
            placeholder={lang === 'ru' ? 'Поиск…' : 'Search…'}
          />
        </div>
      );

    default:
      return null;
  }
}

function parseParams(spec: VerticalSpec, params: URLSearchParams) {
  const filters: ActiveFilters = {};
  for (const f of spec.filters) {
    if (f.type === 'sort') continue;
    if (f.type === 'range') {
      const min = params.get(`${f.key}_min`);
      const max = params.get(`${f.key}_max`);
      if (min !== null || max !== null) {
        filters[f.key] = {
          min: min !== null ? Number(min) : undefined,
          max: max !== null ? Number(max) : undefined,
        };
      }
    } else if (f.type === 'daterange') {
      const from = params.get(`${f.key}_from`);
      const to = params.get(`${f.key}_to`);
      if (from || to) filters[f.key] = { from: from ?? undefined, to: to ?? undefined };
    } else if (f.type === 'bool') {
      const v = params.get(f.key);
      if (v) filters[f.key] = true;
    } else if (f.type === 'distance') {
      const v = params.get(f.key);
      if (v) filters[f.key] = Number(v);
    } else {
      const v = params.get(f.key);
      if (!v) continue;
      // multi-enum stored as comma-list
      if (f.type === 'enum' && f.options && f.options.length > 5) {
        filters[f.key] = v.split(',').filter(Boolean);
      } else {
        filters[f.key] = v;
      }
    }
  }
  const sort = params.get('sort') ?? undefined;
  return { filters, sort };
}
