/**
 * CompanySwitcher — lets a user who belongs to more than one management company
 * flip the active company context (useActiveCompany). For platform admins who are
 * members of the house MC, this is how they switch between "admin" oversight and
 * operating inside an MC's sales CRM. Switching invalidates company-scoped caches
 * (handled in ActiveCompanyProvider) so no other tenant's data leaks across.
 *
 * Renders nothing when the user has no company; renders a static label when they
 * have exactly one.
 */
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowUpRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';

interface Props {
  /** Show an "Open MC workspace" link next to the switcher. */
  showWorkspaceLink?: boolean;
}

export function CompanySwitcher({ showWorkspaceLink = true }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { companies, activeCompany, setActiveCompanyId, isLoading } = useActiveCompany();

  if (isLoading || companies.length === 0 || !activeCompany) return null;

  const label = (c: { name_en: string; name_ru: string }) => (isRu ? c.name_ru : c.name_en) || c.name_en;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {isRu ? 'Контекст:' : 'Acting as:'}
      </span>
      {companies.length === 1 ? (
        <span className="text-sm font-medium">{label(activeCompany)}</span>
      ) : (
        <Select value={activeCompany.company_id} onValueChange={setActiveCompanyId}>
          <SelectTrigger className="h-8 w-[180px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.company_id} value={c.company_id}>
                {label(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showWorkspaceLink && (
        <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => navigate('/mc')}>
          {isRu ? 'Открыть MC' : 'Open MC'}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
