import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { TrendingUp, Search, Building, BarChart3, Users, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  { icon: Search, label: 'Property Search', labelRu: 'Поиск недвижимости', desc: 'Buy or rent in Phuket', descRu: 'Купить или арендовать', path: APP_ROUTES.PROPERTY, ready: true },
  { icon: Building, label: 'Off-Plan Projects', labelRu: 'Off-Plan проекты', desc: 'New developments from developers', descRu: 'Новостройки от застройщиков', path: APP_ROUTES.OFFPLAN, ready: true },
  { icon: BarChart3, label: 'ROI Calculator', labelRu: 'ROI калькулятор', desc: 'Investment scoring & yields', descRu: 'Доходность и оценка инвестиций', path: APP_ROUTES.INVEST, ready: true },
  { icon: Users, label: 'Developers', labelRu: 'Застройщики', desc: 'Verified developer directory', descRu: 'Каталог верифицированных застройщиков', path: APP_ROUTES.DEVELOPERS, ready: true },
  { icon: FileCheck, label: 'Consultation', labelRu: 'Консультация', desc: 'Free property consultation', descRu: 'Бесплатная консультация', path: APP_ROUTES.PROPERTY_CONSULTATION, ready: true },
];

export default function InvestClusterPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="pb-24">
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 pt-16 pb-10">
          <BackButton fallbackPath="/" variant="overlay" className="absolute top-4 left-4" />
          <div className="text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold mb-1">{t ? 'КУПИТЬ' : 'INVEST'}</h1>
            <p className="text-white/80 text-sm">{t ? 'Покупка и инвестиции в недвижимость Пхукета' : 'Buy & invest in Phuket real estate'}</p>
          </div>
        </div>

        <div className="px-4 -mt-5 space-y-3">
          {APPS.map(app => {
            const Icon = app.icon;
            return (
              <button
                key={app.label}
                onClick={() => navigate(app.path)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left',
                  'transition-all hover:border-cluster-invest/40 hover:[box-shadow:var(--shadow-elevation-2)] active:scale-[0.98]',
                  !app.ready && 'opacity-50 pointer-events-none'
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-cluster-invest/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-cluster-invest" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm text-foreground">{t ? app.labelRu : app.label}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t ? app.descRu : app.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
