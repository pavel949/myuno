import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalmClusterHero } from '@/components/uno/CalmClusterHero';
import { APP_ROUTES } from '@/lib/config/routes';
import { Scale, Plane, Calculator, FileSearch, Shield, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClusterBreadcrumb } from '@/components/navigation/ClusterBreadcrumb';
import { ExploreMoreRail } from '@/components/navigation/ExploreMoreRail';

interface ClusterApp {
  icon: React.ElementType;
  label: string;
  labelRu: string;
  desc: string;
  descRu: string;
  path: string;
  ready: boolean;
}

const APPS: ClusterApp[] = [
  { icon: Plane, label: 'VisaTrack', labelRu: 'Визы', desc: 'Track visa expiry & renewals', descRu: 'Отслеживайте сроки визы', path: APP_ROUTES.VISA_IMMIGRATION, ready: true },
  { icon: Calculator, label: 'TaxNav', labelRu: 'Налоги', desc: 'Tax obligations navigator', descRu: 'Навигатор налоговых обязательств', path: APP_ROUTES.TAX_NAV, ready: true },
  { icon: FileSearch, label: 'ContractAI', labelRu: 'Анализ договоров', desc: 'AI contract analysis', descRu: 'AI-анализ договоров', path: APP_ROUTES.CONTRACT_ANALYSIS, ready: true },
  { icon: Shield, label: 'Insurance', labelRu: 'Страхование', desc: 'Health & property insurance', descRu: 'Медицинское и имущественное', path: APP_ROUTES.INSURANCE, ready: true },
  { icon: FileText, label: 'Legal Services', labelRu: 'Юридические услуги', desc: 'Lawyers & notaries', descRu: 'Юристы и нотариусы', path: APP_ROUTES.LEGAL, ready: true },
];

export default function LegalClusterPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="pb-24">
        <CalmClusterHero
          clusterId="legal"
          icon={Scale}
          title={t ? 'Юридические сервисы' : 'Legal services'}
          subtitle={t ? 'Визы, налоги, договоры, страхование, юристы' : 'Visas, taxes, contracts, insurance, lawyers'}
          fallbackPath="/"
        />

        <div className="px-4 py-3">
          <ClusterBreadcrumb clusterId="legal" serviceLabelRu="Все сервисы" serviceLabelEn="All services" />
        </div>
        <div className="px-4 space-y-3">
          {APPS.map(app => {
            const Icon = app.icon;
            return (
              <button
                key={app.label}
                onClick={() => navigate(app.path)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left',
                  'transition-all hover:border-cluster-legal/40 hover:[box-shadow:var(--shadow-elevation-2)] active:scale-[0.98]',
                  !app.ready && 'opacity-50 pointer-events-none'
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-cluster-legal/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-cluster-legal" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm text-foreground">{t ? app.labelRu : app.label}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t ? app.descRu : app.desc}</p>
                </div>
                {!app.ready && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Soon</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-4 mt-6">
          <ExploreMoreRail clusterId="legal" />
        </div>
      </div>
    </AppLayout>
  );
}
