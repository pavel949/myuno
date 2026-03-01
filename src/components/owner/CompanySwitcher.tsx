import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, ChevronsUpDown, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function CompanySwitcher() {
  const { companies, activeCompany, setActiveCompanyId } = useActiveCompany();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Show search when 5+ companies
  const showSearch = companies.length >= 5;

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(c => {
      const name = isRu ? c.name_ru : c.name_en;
      return name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q);
    });
  }, [companies, search, isRu]);

  if (companies.length <= 1) return null;

  const getName = (c: typeof activeCompany) =>
    c ? (isRu ? c.name_ru : c.name_en) : '—';

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(''); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 max-w-[200px]"
        >
          <Avatar className="h-5 w-5">
            <AvatarImage src={activeCompany?.logo || undefined} />
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
              {getName(activeCompany).charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs">
            {getName(activeCompany)}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5 flex items-center justify-between">
          <span>{isRu ? 'Управляющая компания' : 'Management Company'}</span>
          <span className="text-[10px] tabular-nums">{companies.length}</span>
        </div>

        {showSearch && (
          <div className="relative px-1 pb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isRu ? 'Поиск...' : 'Search...'}
              className="h-8 pl-8 text-xs"
              autoFocus
            />
          </div>
        )}

        <ScrollArea className={companies.length > 8 ? 'max-h-[320px]' : ''}>
          <div className="space-y-0.5">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {isRu ? 'Ничего не найдено' : 'No results'}
              </p>
            )}
            {filtered.map((c) => {
              const name = getName(c);
              const isActive = c.company_id === activeCompany?.company_id;
              return (
                <button
                  key={c.company_id}
                  onClick={() => { setActiveCompanyId(c.company_id); setOpen(false); setSearch(''); }}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-md px-2 py-2 text-sm transition-colors',
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  )}
                >
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={c.logo || undefined} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="truncate font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{c.role}</div>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <Separator className="my-1" />
        <button
          onClick={() => { navigate('/mc/onboarding'); setOpen(false); }}
          className="flex items-center gap-2 w-full rounded-md px-2 py-2 text-sm text-primary hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          {isRu ? 'Создать УК' : 'Create Company'}
        </button>
      </PopoverContent>
    </Popover>
  );
}
