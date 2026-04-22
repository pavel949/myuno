/**
 * AuthValuePanel — calm, informative value proposition shown alongside the auth form.
 *
 * Renders the myUNO wordmark, a soft tagline, six cluster chips (Arrive · Live ·
 * Manage · Invest · Legal · Build), three trust bullets and a quiet social proof
 * line. No marketing shouting — strictly aligned with the "Quiet Trust" Bible §0/§1.
 *
 * On mobile this sits above the form. On desktop (md+) the parent renders it as
 * a sticky left column. When `compact` is true (e.g. long signup step) the panel
 * collapses to a thin wordmark + tagline strip to avoid distracting from the form.
 */
import { motion } from 'framer-motion';
import { Plane, Home, Briefcase, TrendingUp, Scale, Hammer, Check, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { BrandWordmark } from '@/components/uno/BrandWordmark';

interface AuthValuePanelProps {
  compact?: boolean;
}

const CLUSTERS = [
  { key: 'arrive', icon: Plane, color: 'text-cluster-arrive', bg: 'bg-cluster-arrive/10', ring: 'ring-cluster-arrive/30' },
  { key: 'live', icon: Home, color: 'text-cluster-live', bg: 'bg-cluster-live/10', ring: 'ring-cluster-live/30' },
  { key: 'manage', icon: Briefcase, color: 'text-cluster-manage', bg: 'bg-cluster-manage/10', ring: 'ring-cluster-manage/30' },
  { key: 'invest', icon: TrendingUp, color: 'text-cluster-invest', bg: 'bg-cluster-invest/10', ring: 'ring-cluster-invest/30' },
  { key: 'legal', icon: Scale, color: 'text-cluster-legal', bg: 'bg-cluster-legal/10', ring: 'ring-cluster-legal/30' },
  { key: 'build', icon: Hammer, color: 'text-cluster-build', bg: 'bg-cluster-build/10', ring: 'ring-cluster-build/30' },
] as const;

export function AuthValuePanel({ compact = false }: AuthValuePanelProps) {
  const { t } = useLanguage();

  if (compact) {
    return (
      <div className="flex items-baseline gap-3 px-1">
        <BrandWordmark as="static" className="scale-105" />
        <span className="text-xs text-muted-foreground truncate">{t('auth.value.subtitle')}</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto md:mx-0 space-y-7">
      {/* Wordmark + headline */}
      <div className="space-y-3">
        <BrandWordmark as="static" className="scale-125 origin-left" />
        <h1 className="font-display text-2xl md:text-3xl font-semibold leading-tight text-foreground">
          {t('auth.value.title')}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {t('auth.value.subtitle')}
        </p>
      </div>

      {/* Cluster chips */}
      <div className="flex flex-wrap gap-2">
        {CLUSTERS.map((cluster, idx) => {
          const Icon = cluster.icon;
          return (
            <motion.div
              key={cluster.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25, ease: 'easeOut' }}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ring-1',
                cluster.bg,
                cluster.ring,
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', cluster.color)} />
              <span className={cn('text-xs font-medium', cluster.color)}>
                {t(`auth.value.cluster.${cluster.key}`)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Trust bullets */}
      <ul className="space-y-2.5">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex w-5 h-5 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25 shrink-0">
              <Check className="w-3 h-3 text-primary" strokeWidth={3} />
            </span>
            <span className="text-sm text-foreground/90 leading-snug">
              {t(`auth.value.bullets.${n}`)}
            </span>
          </li>
        ))}
      </ul>

      {/* Social proof */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/80 pt-2 border-t border-border/40">
        <span>{t('auth.social.users')}</span>
        <span className="opacity-40">·</span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {t('auth.social.location')}
        </span>
      </div>
    </div>
  );
}
