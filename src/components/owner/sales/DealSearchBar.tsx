import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  agentFilter: string;
  onAgentFilterChange: (v: string) => void;
  agents: { user_id: string; name: string }[];
}

export function DealSearchBar({ search, onSearchChange, agentFilter, onAgentFilterChange, agents }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Поиск по имени, телефону, email...' : 'Search by name, phone, email...'}
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
  );
}
