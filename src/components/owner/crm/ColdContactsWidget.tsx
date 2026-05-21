/**
 * ColdContactsWidget — surfaces contacts not touched in 30+ days, ordered
 * by relationship tier (A first) then by oldest last_activity. The first
 * "save" the founder makes on a cold A-tier contact is the daily action
 * this widget exists to enable.
 */
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColdContacts, type ColdContact } from '@/hooks/useColdContacts';
import { RelationshipTierBadge } from './RelationshipTierBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColdContactsWidgetProps {
  companyId: string;
  daysCold?: number;
  limit?: number;
  className?: string;
}

function contactDisplayName(c: ColdContact): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
  return name || c.company_name || '—';
}

export function ColdContactsWidget({
  companyId,
  daysCold = 30,
  limit = 8,
  className,
}: ColdContactsWidgetProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { data: contacts, isLoading } = useColdContacts(companyId, daysCold, limit);
  const isRu = language === 'ru';

  return (
    <section className={cn('border border-border bg-card', className)}>
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Snowflake className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
          <h3 className="font-display text-sm font-semibold text-foreground">{t('crm.cold.title')}</h3>
          <span className="text-[11px] text-muted-foreground">{t('crm.cold.subtitle')}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/mc/contacts?cold=${daysCold}`)}
          className="text-[11px] font-medium text-primary hover:text-primary/80 inline-flex items-center gap-0.5"
        >
          {t('crm.cold.viewAll')}
          <ArrowRight className="h-3 w-3" />
        </button>
      </header>

      {isLoading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-none" />
          ))}
        </div>
      ) : !contacts || contacts.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('crm.cold.empty')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {contacts.map((c) => {
            const name = contactDisplayName(c);
            const days = c.days_cold === Infinity
              ? (isRu ? 'никогда' : 'never')
              : `${c.days_cold}${isRu ? 'д' : 'd'}`;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/mc/contacts/${c.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted/40 transition-colors"
                >
                  <RelationshipTierBadge tier={c.relationship_tier} size="sm" />
                  <span className="flex-1 min-w-0 text-sm text-foreground truncate">{name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {days}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
