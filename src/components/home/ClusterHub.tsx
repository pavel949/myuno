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
import { getClusterById, getClusterHeaderLabel, getClusterValueLine } from '@/lib/nav/clusterCatalog';
import type { Language } from '@/i18n';

interface HubCluster {
  id: 'arrive' | 'live' | 'legal' | 'invest' | 'manage' | 'build';
  icon: React.ElementType;
  /** CSS variable name from tokens.css §7.4 cluster accents (M11.5). */
  accentVar: string;
  path: string;
  apps: string[];
  appsRu: string[];
  appsTh: string[];
}

/** Resolve cluster CSS-var to inline color string (HSL token from tokens.css). */
export const clusterAccent = (varName: string): string => `hsl(var(${varName}))`;

const CLUSTERS: HubCluster[] = [
  { id: 'arrive', icon: Plane,      accentVar: '--cluster-arrive', path: APP_ROUTES.ARRIVE_CLUSTER,
    apps: ['Transfers','SIM Cards','Exchange','Car Rental'],
    appsRu: ['Трансферы','SIM-карты','Обмен валют','Аренда авто'],
    appsTh: ['รับส่ง','SIM','แลกเงิน','เช่ารถ'] },
  { id: 'live',   icon: Home,       accentVar: '--cluster-live',   path: APP_ROUTES.DISCOVER,
    apps: ['Restaurants','Cleaning','Medical','Flowers'],
    appsRu: ['Рестораны','Уборка','Медицина','Цветы'],
    appsTh: ['ร้านอาหาร','ทำความสะอาด','การแพทย์','ดอกไม้'] },
  { id: 'legal',  icon: Scale,      accentVar: '--cluster-legal',  path: APP_ROUTES.LEGAL_CLUSTER,
    apps: ['Visas','Taxes','Contracts','Insurance'],
    appsRu: ['Визы','Налоги','Договоры','Страховка'],
    appsTh: ['วีซ่า','ภาษี','สัญญา','ประกัน'] },
  { id: 'invest', icon: TrendingUp, accentVar: '--cluster-invest', path: APP_ROUTES.INVEST,
    apps: ['Property search','Off-plan','ROI','Due diligence'],
    appsRu: ['Поиск','Off-plan','ROI','Проверка'],
    appsTh: ['ค้นหา','โครงการใหม่','ROI','ตรวจสอบ'] },
  { id: 'manage', icon: Building2,  accentVar: '--cluster-manage', path: APP_ROUTES.MC,
    apps: ['Dashboard','Calendar','Finances','CRM'],
    appsRu: ['Кабинет','Календарь','Финансы','CRM'],
    appsTh: ['แดชบอร์ด','ปฏิทิน','การเงิน','CRM'] },
  { id: 'build',  icon: HardHat,    accentVar: '--cluster-build',  path: APP_ROUTES.OFFPLAN,
    apps: ['Portal','Program','Showcase','Advisory'],
    appsRu: ['Портал','Программа','Витрина','Консультация'],
    appsTh: ['พอร์ทัล','โปรแกรม','โชว์รูม','ปรึกษา'] },
];

function appTagsForLang(c: HubCluster, language: Language): string[] {
  if (language === 'ru') return c.appsRu;
  if (language === 'th') return c.appsTh;
  return c.apps;
}

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
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  return (
    <section className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-foreground text-lg md:text-xl">
          {language === 'ru'
            ? 'Один аккаунт — весь Пхукет'
            : language === 'th'
              ? 'บัญชีเดียว — ทั้งภูเก็ต'
              : 'One account — all of Phuket'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {language === 'ru'
            ? '6 кластеров. 40+ сервисов. Одна экосистема.'
            : language === 'th'
              ? '6 กลุ่ม · 40+ บริการ · ระบบเดียว'
              : '6 clusters. 40+ services. One ecosystem.'}
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {CLUSTERS.map((cluster) => {
          const Icon = cluster.icon;
          const cat = getClusterById(cluster.id);
          const title = cat ? getClusterHeaderLabel(cat, language) : cluster.id;
          const blurb = cat ? getClusterValueLine(cat, language) : '';
          const tagList = appTagsForLang(cluster, language);
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

              <h3
                className="text-sm font-semibold leading-tight mb-0.5 font-display"
                style={{ color: cluster.accentColor }}
              >
                {title}
              </h3>
              
              {/* Description — hidden on mobile */}
              {isDesktop && blurb && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{blurb}</p>
              )}

              {/* Tags — max 2 on mobile */}
              <div className="flex flex-wrap gap-1 mt-2">
                {tagList.slice(0, isDesktop ? 3 : 2).map((app) => (
                  <span key={app} className="text-[10px] px-2 py-0.5 rounded-[var(--radius-full)] text-muted-foreground"
                    style={{ background: 'hsl(var(--bg-elevated))' }}
                  >
                    {app}
                  </span>
                ))}
                {tagList.length > (isDesktop ? 3 : 2) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-[var(--radius-full)] text-muted-foreground"
                    style={{ background: 'hsl(var(--bg-elevated))' }}
                  >
                    +{tagList.length - (isDesktop ? 3 : 2)}
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
