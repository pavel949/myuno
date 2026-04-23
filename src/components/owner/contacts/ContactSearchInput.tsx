import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useContactSearch, CrmContact } from '@/hooks/useCrmContacts';
import { cn } from '@/lib/utils';
import { UserCircle, X } from 'lucide-react';

interface Props {
  companyId: string;
  onSelect: (contact: CrmContact) => void;
  onClear: () => void;
  selectedContact: CrmContact | null;
  isRu: boolean;
}

export function ContactSearchInput({ companyId, onSelect, onClear, selectedContact, isRu }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: results = [] } = useContactSearch(companyId, query);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (selectedContact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-none border bg-primary/5">
        <UserCircle className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium flex-1">{selectedContact.first_name} {selectedContact.last_name}</span>
        <button onClick={onClear} className="p-0.5 rounded-none hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={isRu ? 'Поиск: имя, телефон, email, компания...' : 'Search: name, phone, email, company...'}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => query.length >= 1 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-none shadow-lg max-h-48 overflow-y-auto">
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelect(c); setQuery(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
            >
              <span className="font-medium">{c.first_name} {c.last_name}</span>
              {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
