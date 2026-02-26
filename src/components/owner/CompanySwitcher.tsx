import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function CompanySwitcher() {
  const { companies, activeCompany, setActiveCompanyId } = useActiveCompany();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [open, setOpen] = useState(false);

  if (companies.length <= 1) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 max-w-[200px]"
        >
          <Avatar className="h-5 w-5">
            <AvatarImage src={activeCompany?.logo || undefined} />
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
              {(activeCompany ? (isRu ? activeCompany.name_ru : activeCompany.name_en) : '?').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs">
            {activeCompany ? (isRu ? activeCompany.name_ru : activeCompany.name_en) : '—'}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
          {isRu ? 'Управляющая компания' : 'Management Company'}
        </div>
        {companies.map((c) => {
          const name = isRu ? c.name_ru : c.name_en;
          const isActive = c.company_id === activeCompany?.company_id;
          return (
            <button
              key={c.company_id}
              onClick={() => { setActiveCompanyId(c.company_id); setOpen(false); }}
              className={cn(
                'flex items-center gap-3 w-full rounded-md px-2 py-2 text-sm transition-colors',
                isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              )}
            >
              <Avatar className="h-7 w-7">
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
      </PopoverContent>
    </Popover>
  );
}
