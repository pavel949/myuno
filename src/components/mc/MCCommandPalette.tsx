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

export function MCCommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership } = useMyCompanyId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Search across contacts, deals, properties
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
          title: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.primary_email || 'Contact',
          subtitle: c.primary_phone || c.primary_email || '',
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
    setOpen(false);
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
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 w-64 h-9 px-3 rounded-md bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">{isRu ? 'Поиск...' : 'Search...'}</span>
        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
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

          {/* Search results */}
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

          {/* Quick navigation */}
          {!query && (
            <CommandGroup heading={isRu ? 'Навигация' : 'Navigation'}>
              {quickLinks.map(link => (
                <CommandItem
                  key={link.id}
                  onSelect={() => { setOpen(false); navigate(link.path); }}
                >
                  <link.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {isRu ? link.labelRu : link.labelEn}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
