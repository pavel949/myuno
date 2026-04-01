/**
 * ClusterHub — 6 cluster cards with mobile optimizations
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, Home, Scale, TrendingUp, Building2, HardHat,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsDesktop } from '@/hooks/use-desktop';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface Cluster {
  id: string;
  icon: React.ElementType;
  label: string;
  labelRu: string;
  description: string;
  descriptionRu: string;
  accentColor: string;
  path: string;
  apps: string[];
  appsRu: string[];
}

const CLUSTERS: Cluster[] = [
  {
    id: 'arrive', icon: Plane,
    label: 'ARRIVE', labelRu: 'ПРИЕХАТЬ',
    description: 'First day on the island', descriptionRu: 'Первый день на острове',
    accentColor: '#00D68F',
    path: APP_ROUTES.ARRIVE_CLUSTER,
    apps: ['Transfers', 'SIM Cards', 'Exchange', 'Car Rental'],
    appsRu: ['Трансферы', 'SIM-карты', 'Обмен валют', 'Аренда авто'],
  },
  {
    id: 'live', icon: Home,
    label: 'LIVE', labelRu: 'ЖИТЬ',
    description: 'Daily life services', descriptionRu: 'Сервисы на каждый день',
    accentColor: '#4E7BFF',
    path: APP_ROUTES.DISCOVER,
    apps: ['Restaurants', 'Cleaning', 'Medical', 'Flowers'],
    appsRu: ['Рестораны', 'Уборка', 'Медицина', 'Цветы'],
  },
  {
    id: 'legal', icon: Scale,
    label: 'STAY LEGAL', labelRu: 'ЛЕГАЛЬНО',
    description: 'Visas, taxes & contracts', descriptionRu: 'Визы, налоги и документы',
    accentColor: '#F59E0B',
    path: APP_ROUTES.LEGAL_CLUSTER,
    apps: ['VisaTrack', 'TaxNav', 'ContractAI', 'Insurance'],
    appsRu: ['Визы', 'Налоги', 'Договоры', 'Страховка'],
  },
  {
    id: 'invest', icon: TrendingUp,
    label: 'INVEST', labelRu: 'КУПИТЬ',
    description: 'Buy & invest in Phuket', descriptionRu: 'Покупка и инвестиции',
    accentColor: '#A855F7',
    path: APP_ROUTES.INVEST_CLUSTER,
    apps: ['Property Search', 'Off-Plan', 'ROI Calculator', 'Due Diligence'],
    appsRu: ['Поиск недвижимости', 'Off-Plan', 'ROI калькулятор', 'Проверка'],
  },
  {
    id: 'manage', icon: Building2,
    label: 'MANAGE', labelRu: 'УПРАВЛЯТЬ',
    description: 'Property management', descriptionRu: 'Управление недвижимостью',
    accentColor: '#06B6D4',
    path: APP_ROUTES.MC,
    apps: ['StaySync', 'Calendar', 'Financials', 'Team'],
    appsRu: ['StaySync', 'Календарь', 'Финансы', 'Команда'],
  },
  {
    id: 'build', icon: HardHat,
    label: 'BUILD & SELL', labelRu: 'ДЕВЕЛОПЕРАМ',
    description: 'For developers & agents', descriptionRu: 'Для застройщиков и агентов',
    accentColor: '#F43F5E',
    path: APP_ROUTES.OFFPLAN,
    apps: ['Sales Dashboard', 'Construction', 'Pricing', 'Agent CRM'],
    appsRu: ['Продажи', 'Стройка', 'Ценообразование', 'CRM агентов'],
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
};

export const ClusterHub: React.FC = () => {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  return (
    <section className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-foreground text-lg md:text-xl">
          {t ? 'Один аккаунт — весь Пхукет' : 'One account — all of Phuket'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t ? '6 кластеров. 40+ сервисов. Одна экосистема.' : '6 clusters. 40+ services. One ecosystem.'}
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {CLUSTERS.map(cluster => {
          const Icon = cluster.icon;
          return (
            <motion.button
              key={cluster.id}
              variants={itemVariants}
              onClick={() => navigate(cluster.path)}
              className="group relative overflow-hidden text-left rounded-[var(--radius-lg)] p-4 md:p-5 min-h-[140px] transition-all duration-200 active:scale-[0.97]"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(0 0% 100% / 0.07)',
                boxShadow: 'var(--shadow-card)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = cluster.accentColor + '40';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${cluster.accentColor}15`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(0 0% 100% / 0.07)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
              }}
            >
              {/* Icon */}
              <div 
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3"
                style={{ background: cluster.accentColor + '1A' }}
              >
                <Icon className="w-5 h-5" style={{ color: cluster.accentColor }} />
              </div>

              <h3 className="text-xs font-bold tracking-wider uppercase mb-0.5 font-display"
                style={{ color: cluster.accentColor }}
              >
                {t ? cluster.labelRu : cluster.label}
              </h3>
              
              {/* Description — hidden on mobile */}
              {isDesktop && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                  {t ? cluster.descriptionRu : cluster.description}
                </p>
              )}

              {/* Tags — max 2 on mobile */}
              <div className="flex flex-wrap gap-1 mt-2">
                {(t ? cluster.appsRu : cluster.apps).slice(0, isDesktop ? 3 : 2).map(app => (
                  <span key={app} className="text-[10px] px-2 py-0.5 rounded-[var(--radius-full)] text-muted-foreground"
                    style={{ background: 'hsl(var(--bg-elevated))' }}
                  >
                    {app}
                  </span>
                ))}
                {cluster.apps.length > (isDesktop ? 3 : 2) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-[var(--radius-full)] text-muted-foreground"
                    style={{ background: 'hsl(var(--bg-elevated))' }}
                  >
                    +{cluster.apps.length - (isDesktop ? 3 : 2)}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
};
