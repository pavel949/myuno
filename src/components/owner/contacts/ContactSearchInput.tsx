import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useContactSearch, CrmContact } from '@/hooks/useCrmContacts';
import { CreateContactSheet } from '@/components/owner/contacts/CreateContactSheet';
import { UserCircle, UserPlus, X } from 'lucide-react';

interface Props {
  companyId: string;
  onSelect: (contact: CrmContact) => void;
  onClear: () => void;
  selectedContact: CrmContact | null;
  isRu: boolean;
}

/** True when the query reads like a person's name (so we can pre-fill it). */
function looksLikeName(query: string): boolean {
  const q = query.trim();
  if (!q || q.includes('@')) return false;
  return /[a-zA-Zа-яА-ЯёЁ]/.test(q) && !/^\+?[\d\s()-]+$/.test(q);
}

export function ContactSearchInput({ companyId, onSelect, onClear, selectedContact, isRu }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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

  const openCreate = () => {
    setCreateOpen(true);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={isRu ? 'Поиск: имя, телефон, email, компания...' : 'Search: name, phone, email, company...'}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-none shadow-lg max-h-60 overflow-y-auto">
          {results.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onSelect(c); setQuery(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
            >
              <span className="font-medium">{c.first_name} {c.last_name}</span>
              {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
            </button>
          ))}
          {query.length >= 1 && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {isRu ? 'Контакты не найдены' : 'No contacts found'}
            </p>
          )}
          {/* Always offer creating a brand-new contact for the opportunity */}
          <button
            type="button"
            onClick={openCreate}
            className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2 border-t text-primary font-medium sticky bottom-0 bg-popover"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            {isRu ? 'Добавить новый контакт' : 'Add new contact'}
          </button>
        </div>
      )}

      <CreateContactSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyId={companyId}
        prefillName={looksLikeName(query) ? query : undefined}
        onCreated={(c) => { onSelect(c); setQuery(''); }}
      />
    </div>
  );
}
