/**
 * Real Estate zone — wraps existing InvestmentIndex catalog scoped to RE projects,
 * adding a deep-link banner to commercial high-yield assets (Phase 2).
 */
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import InvestmentIndex from './InvestmentIndex';

export default function InvestmentRealEstateZone() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-4">
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => navigate(`${APP_ROUTES.COMMERCIAL}?intent=sale`)}
          className="w-full text-left rounded-none border border-success/40 bg-gradient-to-br from-success/10 to-primary/5 hover:from-success/15 transition-colors p-4 flex items-center gap-3"
        >
          <div className="p-2 rounded-none bg-success/20 text-success dark:text-success">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {isRu ? 'Высокодоходные коммерческие активы' : 'High-yield commercial assets'}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {isRu
                ? 'Cap rate 6–9%, действующие арендаторы, прозрачный NOI.'
                : 'Cap rate 6–9%, active tenants, transparent NOI.'}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </div>
      <InvestmentIndex />
    </div>
  );
}
