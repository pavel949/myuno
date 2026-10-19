import { pickLang } from '@/lib/i18n/pickLang';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/config/routes';
import { getOwnerSidebarForRole } from '@/lib/nav/navigationModel';
import type { BusinessRole } from '@/lib/businessRoles';

const DESTINATIONS = [APP_ROUTES.MC_PROPERTIES, APP_ROUTES.MC_CALENDAR, APP_ROUTES.MC_TASKS];

/** Reuse existing workspace navigation; this never grants module or property access. */
export function DashboardDestinations({ businessRole, propertyCount }: { businessRole: BusinessRole; propertyCount: number }) {
  const { language } = useLanguage();
  const items = getOwnerSidebarForRole(businessRole, { propertyCount }).flatMap(group => group.items);

  return (
    <nav aria-label={pickLang(language, { en: 'Workspace shortcuts', ru: 'Рабочие разделы', th: 'ทางลัดพื้นที่ทำงาน' })} className="grid grid-cols-3 gap-2 sm:flex">
      {DESTINATIONS.map((path, index) => {
        const item = items.find(candidate => candidate.path === path);
        if (!item) return null;
        const Icon = item.icon;
        return (
          <Button key={path} asChild variant={index === 0 ? 'default' : 'secondary'} size="sm" className="h-auto min-h-11 min-w-0 flex-col gap-1 px-2 py-2 whitespace-normal sm:flex-row sm:px-4">
            <Link to={path}>
              <Icon className="h-4 w-4" aria-hidden />
              <span className="min-w-0 break-words">{pickLang(language, { en: item.labelEn, ru: item.labelRu, th: item.labelTh })}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
