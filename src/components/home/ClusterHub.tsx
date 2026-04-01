/**
 * ClusterHub — Bible v2.0 "6 cluster cards" hub section
 * Shows ARRIVE / LIVE / LEGAL / INVEST / MANAGE / BUILD clusters
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, Home, Scale, TrendingUp, Building2, HardHat,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface Cluster {
  id: string;
  icon: React.ElementType;
  label: string;
  labelRu: string;
  description: string;
  descriptionRu: string;
  color: string;
  bgColor: string;
  path: string;
  apps: string[];
  appsRu: string[];
}

const CLUSTERS: Cluster[] = [
  {
    id: 'arrive',
    icon: Plane,
    label: 'ARRIVE',
    labelRu: 'ПРИЕХАТЬ',
    description: 'First day on the island',
    descriptionRu: 'Первый день на острове',
    color: 'text-cluster-arrive',
    bgColor: 'bg-cluster-arrive/10',
    path: APP_ROUTES.ARRIVE_CLUSTER,
    apps: ['Transfers', 'SIM Cards', 'Exchange', 'Car Rental'],
    appsRu: ['Трансферы', 'SIM-карты', 'Обмен валют', 'Аренда авто'],
  },
  {
    id: 'live',
    icon: Home,
    label: 'LIVE',
    labelRu: 'ЖИТЬ',
    description: 'Daily life services',
    descriptionRu: 'Сервисы на каждый день',
    color: 'text-cluster-live',
    bgColor: 'bg-cluster-live/10',
    path: APP_ROUTES.DISCOVER,
    apps: ['Restaurants', 'Cleaning', 'Medical', 'Flowers'],
    appsRu: ['Рестораны', 'Уборка', 'Медицина', 'Цветы'],
  },
  {
    id: 'legal',
    icon: Scale,
    label: 'STAY LEGAL',
    labelRu: 'ЛЕГАЛЬНО',
    description: 'Visas, taxes & contracts',
    descriptionRu: 'Визы, налоги и документы',
    color: 'text-cluster-legal',
    bgColor: 'bg-cluster-legal/10',
    path: APP_ROUTES.VISA_IMMIGRATION,
    apps: ['VisaTrack', 'TaxNav', 'ContractAI', 'Insurance'],
    appsRu: ['Визы', 'Налоги', 'Договоры', 'Страховка'],
  },
  {
    id: 'invest',
    icon: TrendingUp,
    label: 'INVEST',
    labelRu: 'КУПИТЬ',
    description: 'Buy & invest in Phuket',
    descriptionRu: 'Покупка и инвестиции',
    color: 'text-cluster-invest',
    bgColor: 'bg-cluster-invest/10',
    path: APP_ROUTES.PROPERTY,
    apps: ['Property Search', 'Off-Plan', 'ROI Calculator', 'Due Diligence'],
    appsRu: ['Поиск недвижимости', 'Off-Plan', 'ROI калькулятор', 'Проверка'],
  },
  {
    id: 'manage',
    icon: Building2,
    label: 'MANAGE',
    labelRu: 'УПРАВЛЯТЬ',
    description: 'Property management',
    descriptionRu: 'Управление недвижимостью',
    color: 'text-cluster-manage',
    bgColor: 'bg-cluster-manage/10',
    path: APP_ROUTES.MC,
    apps: ['StaySync', 'Calendar', 'Financials', 'Team'],
    appsRu: ['StaySync', 'Календарь', 'Финансы', 'Команда'],
  },
  {
    id: 'build',
    icon: HardHat,
    label: 'BUILD & SELL',
    labelRu: 'ДЕВЕЛОПЕРАМ',
    description: 'For developers & agents',
    descriptionRu: 'Для застройщиков и агентов',
    color: 'text-cluster-build',
    bgColor: 'bg-cluster-build/10',
    path: APP_ROUTES.OFFPLAN,
    apps: ['Sales Dashboard', 'Construction', 'Pricing', 'Agent CRM'],
    appsRu: ['Продажи', 'Стройка', 'Ценообразование', 'CRM агентов'],
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
};

export const ClusterHub: React.FC = () => {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg md:text-xl font-display font-semibold text-foreground">
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
        className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
      >
        {CLUSTERS.map(cluster => {
          const Icon = cluster.icon;
          return (
            <motion.button
              key={cluster.id}
              variants={itemVariants}
              onClick={() => navigate(cluster.path)}
              className={cn(
                'group relative overflow-hidden rounded-xl border border-border p-4 text-left',
                'transition-all duration-200 hover:border-transparent',
                'hover:[box-shadow:var(--shadow-elevation-3)]',
                'active:scale-[0.98]',
              )}
            >
              {/* Colored accent bar */}
              <div className={cn('absolute inset-x-0 top-0 h-1', cluster.bgColor.replace('/10', ''))} />

              <div className={cn('inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3', cluster.bgColor)}>
                <Icon className={cn('w-5 h-5', cluster.color)} />
              </div>

              <h3 className={cn('text-xs font-bold tracking-wider uppercase mb-0.5', cluster.color)}>
                {t ? cluster.labelRu : cluster.label}
              </h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {t ? cluster.descriptionRu : cluster.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {(t ? cluster.appsRu : cluster.apps).slice(0, 3).map(app => (
                  <span key={app} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {app}
                  </span>
                ))}
                {cluster.apps.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    +{cluster.apps.length - 3}
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
