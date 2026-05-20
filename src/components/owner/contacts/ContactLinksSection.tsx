import { useState } from 'react';
import { Link2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCrmContactLinks,
  useCreateCrmContactLink,
  useDeleteCrmContactLink,
} from '@/hooks/useCrmContactLinks';
import { cn } from '@/lib/utils';

interface ContactLinksSectionProps {
  contactId: string;
  companyId: string;
}

export function ContactLinksSection({ contactId, companyId }: ContactLinksSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { data: links = [], isLoading } = useCrmContactLinks(contactId);
  const createLink = useCreateCrmContactLink();
  const deleteLink = useDeleteCrmContactLink();

  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = async () => {
    if (!label.trim() || !url.trim() || !user) return;
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    await createLink.mutateAsync({
      company_id: companyId,
      contact_id: contactId,
      label: label.trim(),
      url: normalizedUrl,
      created_by: user.id,
    });
    setLabel('');
    setUrl('');
  };

  return (
    <div className="rounded-none border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        {isRu ? 'Ссылки' : 'Links'}
        {links.length > 0 && (
          <span className="text-xs text-muted-foreground font-normal">({links.length})</span>
        )}
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground">{isRu ? 'Загрузка…' : 'Loading…'}</div>
      ) : links.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          {isRu ? 'Нет ссылок. Добавьте первую ниже.' : 'No links yet. Add one below.'}
        </div>
      ) : (
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.id} className="group flex items-center gap-2 py-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 flex items-center gap-1.5 text-sm text-primary hover:underline truncate"
                title={link.url}
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{link.label}</span>
              </a>
              <button
                type="button"
                onClick={() => deleteLink.mutate({ id: link.id, contactId })}
                className={cn(
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  'text-muted-foreground hover:text-destructive shrink-0',
                )}
                aria-label={isRu ? 'Удалить ссылку' : 'Delete link'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 pt-2 border-t">
        <Input
          className="h-8 text-xs"
          placeholder={isRu ? 'Название' : 'Label'}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <Input
          className="h-8 text-xs flex-1"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <Button
          size="sm"
          className="h-8 px-2 shrink-0"
          onClick={handleAdd}
          disabled={createLink.isPending || !label.trim() || !url.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
