import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  agentFilter: string;
  onAgentFilterChange: (v: string) => void;
  dealVipFilter: 'all' | 'yes' | 'no';
  onDealVipFilterChange: (v: 'all' | 'yes' | 'no') => void;
  contactVipFilter: 'all' | 'yes' | 'no';
  onContactVipFilterChange: (v: 'all' | 'yes' | 'no') => void;
  agents: { user_id: string; name: string }[];
  activePreset: 'none' | 'hot_vip' | 'no_contact' | 'high_budget' | 'follow_up_today';
  onApplyPreset: (preset: 'none' | 'hot_vip' | 'no_contact' | 'high_budget' | 'follow_up_today') => void;
}

export function DealSearchBar({
  search,
  onSearchChange,
  agentFilter,
  onAgentFilterChange,
  dealVipFilter,
  onDealVipFilterChange,
  contactVipFilter,
  onContactVipFilterChange,
  agents,
  activePreset,
  onApplyPreset,
}: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'none', labelRu: 'Без пресета', labelEn: 'No preset' },
          { id: 'hot_vip', labelRu: 'Горячие VIP', labelEn: 'Hot & VIP' },
          { id: 'no_contact', labelRu: 'Без контакта', labelEn: 'No Contact' },
          { id: 'high_budget', labelRu: 'Высокий бюджет', labelEn: 'High Budget' },
          { id: 'follow_up_today', labelRu: 'Фоллоу-ап сегодня', labelEn: 'Follow-up Today' },
        ] as const).map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApplyPreset(preset.id)}
            className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
              activePreset === preset.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {isRu ? preset.labelRu : preset.labelEn}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Поиск: имя, телефон, email, source, notes...' : 'Search: name, phone, email, source, notes...'}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9 pr-8 h-9"
        />
        {search && (
          <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Select value={dealVipFilter} onValueChange={(v) => onDealVipFilterChange(v as 'all' | 'yes' | 'no')}>
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder={isRu ? 'VIP сделки' : 'Deal VIP'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{isRu ? 'VIP сделки: все' : 'Deal VIP: all'}</SelectItem>
          <SelectItem value="yes">{isRu ? 'Только VIP' : 'Only VIP'}</SelectItem>
          <SelectItem value="no">{isRu ? 'Не VIP' : 'Not VIP'}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={contactVipFilter} onValueChange={(v) => onContactVipFilterChange(v as 'all' | 'yes' | 'no')}>
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder={isRu ? 'VIP контакт' : 'Contact VIP'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{isRu ? 'VIP контакт: все' : 'Contact VIP: all'}</SelectItem>
          <SelectItem value="yes">{isRu ? 'Контакт VIP' : 'Contact VIP only'}</SelectItem>
          <SelectItem value="no">{isRu ? 'Контакт не VIP' : 'Contact not VIP'}</SelectItem>
        </SelectContent>
      </Select>
      {agents.length > 1 && (
        <Select value={agentFilter} onValueChange={onAgentFilterChange}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder={isRu ? 'Агент' : 'Agent'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все агенты' : 'All Agents'}</SelectItem>
            {agents.map(a => (
              <SelectItem key={a.user_id} value={a.user_id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      </div>
    </div>
  );
}
