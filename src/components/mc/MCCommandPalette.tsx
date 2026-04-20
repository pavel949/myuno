import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  ContactRound, TrendingUp, Building2, Search, Layers, LayoutDashboard,
  CalendarCheck, ClipboardList, DollarSign, Users, FileText, Settings,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'contact' | 'deal' | 'property';
  title: string;
  subtitle: string;
}

const quickLinks = [
  { id: 'dashboard', icon: LayoutDashboard, path: '/mc', labelEn: 'Dashboard', labelRu: 'Обзор' },
  { id: 'pipelines', icon: Layers, path: '/mc/pipelines', labelEn: 'Pipelines', labelRu: 'Воронки' },
  { id: 'sales', icon: TrendingUp, path: '/mc/sales', labelEn: 'Sales Pipeline', labelRu: 'Воронка продаж' },
  { id: 'contacts', icon: ContactRound, path: '/mc/contacts', labelEn: 'Contacts', labelRu: 'Контакты' },
  { id: 'properties', icon: Building2, path: '/mc/properties', labelEn: 'Properties', labelRu: 'Объекты' },
  { id: 'bookings', icon: CalendarCheck, path: '/mc/bookings', labelEn: 'Bookings', labelRu: 'Бронирования' },
  { id: 'tasks', icon: ClipboardList, path: '/mc/tasks', labelEn: 'Tasks', labelRu: 'Задачи' },
  { id: 'finance', icon: DollarSign, path: '/mc/finance', labelEn: 'Finance', labelRu: 'Финансы' },
  { id: 'staff', icon: Users, path: '/mc/staff', labelEn: 'Staff', labelRu: 'Команда' },
  { id: 'reports', icon: FileText, path: '/mc/reports', labelEn: 'Reports', labelRu: 'Отчёты' },
  { id: 'settings', icon: Settings, path: '/mc/settings', labelEn: 'Settings', labelRu: 'Настройки' },
];

export interface MCCommandSearchTriggerProps {
  onOpen: () => void;
  className?: string;
}

/** Desktop search chip — sits in the header fill area; grows up to max width. */
export function MCCommandSearchTrigger({ onOpen, className }: MCCommandSearchTriggerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex h-9 w-full min-w-0 max-w-2xl items-center gap-2 rounded-md bg-muted/50 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted',
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{isRu ? 'Поиск...' : 'Search...'}</span>
      <kbd className="pointer-events-none hidden h-5 shrink-0 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
        ⌘K
      </kbd>
    </button>
  );
}

interface MCCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Command palette dialog (contacts / deals / properties + quick links).
 * State lives in the parent (e.g. MCHeader) so the trigger can live in the header bar.
 */
export function MCCommandPalette({ open, onOpenChange }: MCCommandPaletteProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership } = useMyCompanyId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2 || !membership?.company_id) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const pattern = `%${q}%`;
      const [contactsRes, dealsRes, propertiesRes] = await Promise.all([
        supabase.from('crm_contacts')
          .select('id, first_name, last_name, phone, email')
          .eq('company_id', membership.company_id)
          .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
          .limit(5),
        supabase.from('agent_deals')
          .select('id, client_name, deal_value, stage')
          .eq('company_id', membership.company_id)
          .ilike('client_name', pattern)
          .limit(5),
        supabase.from('properties')
          .select('id, title_en, title_ru, district')
          .or(`title_en.ilike.${pattern},title_ru.ilike.${pattern},district.ilike.${pattern}`)
          .limit(5),
      ]);

      const items: SearchResult[] = [];
      for (const c of contactsRes.data || []) {
        items.push({
          id: c.id,
          type: 'contact',
          title: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Contact',
          subtitle: c.phone || c.email || '',
        });
      }
      for (const d of dealsRes.data || []) {
        items.push({
          id: d.id,
          type: 'deal',
          title: d.client_name,
          subtitle: `${d.stage} · ${d.deal_value ? Number(d.deal_value).toLocaleString() : '—'}`,
        });
      }
      for (const p of propertiesRes.data || []) {
        items.push({
          id: p.id,
          type: 'property',
          title: (isRu ? p.title_ru : p.title_en) || p.title_en || 'Property',
          subtitle: p.district || '',
        });
      }
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [membership?.company_id, isRu]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleSelect = (type: string, id: string) => {
    onOpenChange(false);
    setQuery('');
    if (type === 'contact') navigate(APP_ROUTES.MC_CONTACT_DETAIL(id));
    else if (type === 'deal') navigate(`/mc/sales/${id}`);
    else if (type === 'property') navigate(`/mc/properties/${id}`);
  };

  const typeIcons = { contact: ContactRound, deal: TrendingUp, property: Building2 };
  const typeLabels = {
    contact: isRu ? 'Контакт' : 'Contact',
    deal: isRu ? 'Сделка' : 'Deal',
    property: isRu ? 'Объект' : 'Property',
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={isRu ? 'Контакты, сделки, объекты...' : 'Contacts, deals, properties...'}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searching
            ? (isRu ? 'Поиск...' : 'Searching...')
            : (isRu ? 'Ничего не найдено' : 'No results found')
          }
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading={isRu ? 'Результаты' : 'Results'}>
            {results.map(r => {
              const Icon = typeIcons[r.type];
              return (
                <CommandItem key={`${r.type}-${r.id}`} onSelect={() => handleSelect(r.type, r.id)}>
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{typeLabels[r.type]} · {r.subtitle}</p>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {!query && (
          <CommandGroup heading={isRu ? 'Навигация' : 'Navigation'}>
            {quickLinks.map(link => (
              <CommandItem
                key={link.id}
                onSelect={() => { onOpenChange(false); navigate(link.path); }}
              >
                <link.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {isRu ? link.labelRu : link.labelEn}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
