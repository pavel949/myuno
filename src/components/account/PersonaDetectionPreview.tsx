/**
 * PersonaDetectionPreview — M5 H.3
 *
 * Self-service block on /account that surfaces the user's current canonical
 * segmentation (lifecycle / persona / active clusters) and offers a CTA to
 * refine it via the canonical onboarding (`/start/v2?return=/account`).
 *
 * States:
 *  - loading → skeleton
 *  - no profile or no detected_persona → empty state with primary CTA
 *  - has data → compact card with badges + secondary "refine" CTA
 *
 * Uses canonical read-model only (`useCanonicalProfile`) — never queries
 * `profiles` directly.
 */
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { useCanonicalProfile } from '@/hooks/useCanonicalProfile';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CLUSTER_META,
  LIFECYCLE_STAGE_LABELS,
  type ClusterId,
  type LifecycleStage,
} from '@/types/canonical';

const RETURN_PATH = '/account';
const TARGET_HREF = `/start/v2?return=${encodeURIComponent(RETURN_PATH)}`;

const COPY = {
  heading: { en: 'Your profile signals', ru: 'Ваш профиль' },
  subEmpty: {
    en: 'Tell us about you in 30 seconds — we will tailor recommendations and routes.',
    ru: 'Расскажите о себе за 30 секунд — подстроим рекомендации и маршрут.',
  },
  startCta: { en: 'Set up in 30 seconds', ru: 'Настроить за 30 секунд' },
  refineCta: { en: 'Refine answers', ru: 'Уточнить ответы' },
  lifecycle: { en: 'Stage', ru: 'Этап' },
  persona: { en: 'Persona', ru: 'Персона' },
  clusters: { en: 'Active clusters', ru: 'Активные направления' },
  noClusters: { en: 'No clusters yet', ru: 'Пока без направлений' },
  noPersona: { en: 'Not detected yet', ru: 'Пока не определена' },
};

function pick<T extends { en: string; ru: string }>(obj: T, lang: 'en' | 'ru'): string {
  return obj[lang];
}

function lifecycleLabel(stage: LifecycleStage | null, lang: 'en' | 'ru'): string {
  if (!stage) return '—';
  return LIFECYCLE_STAGE_LABELS[stage]?.[lang] ?? stage;
}

function clusterLabel(id: ClusterId, lang: 'en' | 'ru'): string {
  const meta = CLUSTER_META[id];
  return lang === 'ru' ? meta.labelRu : meta.labelEn;
}

export function PersonaDetectionPreview() {
  const { language } = useLanguage();
  const lang: 'en' | 'ru' = language === 'ru' ? 'ru' : 'en';
  const { profile, isLoading } = useCanonicalProfile();
  const v2On = useFeatureFlag('concierge_routing_v2_canonical', false);

  // If canonical onboarding flag is off in this environment, hide the block
  // entirely rather than render a CTA that lands on a flag-off splash.
  if (!v2On) return null;

  if (isLoading) {
    return (
      <Card className="p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-9 w-44" />
      </Card>
    );
  }

  const hasPersona = Boolean(profile?.detectedPersona);
  const hasClusters = (profile?.activeClusters?.length ?? 0) > 0;
  const isEmpty = !hasPersona && !hasClusters && !profile?.lifecycleStage;

  if (isEmpty) {
    return (
      <Card className="p-5 sm:p-6" data-testid="persona-preview-empty">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {pick(COPY.heading, lang)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {pick(COPY.subEmpty, lang)}
              </p>
            </div>
            <Button asChild size="sm" data-testid="persona-preview-cta-start">
              <Link to={TARGET_HREF}>
                {pick(COPY.startCta, lang)}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6" data-testid="persona-preview-filled">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground">
              {pick(COPY.heading, lang)}
            </h3>
            <Button asChild variant="ghost" size="sm" className="shrink-0 -mt-1 -mr-1 text-xs" data-testid="persona-preview-cta-refine">
              <Link to={TARGET_HREF}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                {pick(COPY.refineCta, lang)}
              </Link>
            </Button>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {pick(COPY.lifecycle, lang)}
              </dt>
              <dd className="font-medium text-foreground">
                {lifecycleLabel(profile?.lifecycleStage ?? null, lang)}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {pick(COPY.persona, lang)}
              </dt>
              <dd className="font-medium text-foreground">
                {profile?.detectedPersona ?? (
                  <span className="text-muted-foreground font-normal">
                    {pick(COPY.noPersona, lang)}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {pick(COPY.clusters, lang)}
            </p>
            {hasClusters ? (
              <div className="flex flex-wrap gap-1.5">
                {profile!.activeClusters.map((c) => (
                  <Badge key={c} variant="secondary" className="font-normal">
                    {clusterLabel(c, lang)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {pick(COPY.noClusters, lang)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
