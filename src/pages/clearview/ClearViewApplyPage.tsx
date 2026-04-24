/**
 * ClearViewApplyPage — order a paid ClearView™ Full Report (฿4,900) for a
 * specific off-plan project. Primary trigger for P8 (Passive Investor) hot-lead
 * escalation per IPP.md §12 step 5–6.
 *
 * Connect-before-Create:
 *  - Reuses NbLeadForm (nb_leads insert + attribution + RLN)
 *  - Reuses analytics_events for the +50 IPP score event
 *  - No new tables, no new top-level routes (lives under /property/clearview/apply)
 *
 * Query params:
 *  - ?project=<uuid>  preselects the target project
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, Clock, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CLEARVIEW_LABELS } from '@/lib/copy/govStyle';
import { APP_ROUTES } from '@/lib/config/routes';
import { NbLeadForm } from '@/components/newbuilds/NbLeadForm';
import { useIPPLeadEvent } from '@/hooks/useIPPLeadEvent';
import { supabase } from '@/integrations/supabase/client';

interface PreselectedProject {
  id: string;
  name_en: string | null;
  name_ru: string | null;
}

export default function ClearViewApplyPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [params] = useSearchParams();
  const projectId = params.get('project') || undefined;
  const { track } = useIPPLeadEvent();

  const [project, setProject] = useState<PreselectedProject | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) return;
    (async () => {
      const { data } = await supabase
        .from('property_projects')
        .select('id, name_en, name_ru')
        .eq('id', projectId)
        .maybeSingle();
      if (!cancelled && data) setProject(data as PreselectedProject);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  // Track the page view as a Full Report intent (not the +50 — that fires on
  // submit). Mirrors IPP §3 "ClearView Summary" tier (+20 equiv intent).
  useEffect(() => {
    track({ eventType: 'clearview_summary_open', projectId: projectId ?? null });
  }, [projectId, track]);

  const projectLabel = useMemo(() => {
    if (!project) return null;
    return isRu ? (project.name_ru || project.name_en) : (project.name_en || project.name_ru);
  }, [project, isRu]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 bg-background/95 border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to={APP_ROUTES.CLEARVIEW} aria-label={isRu ? 'Назад' : 'Back'}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="font-display text-[16px] font-semibold text-foreground truncate">
            {isRu ? 'Заказать полный отчёт ClearView™' : 'Order ClearView™ Full Report'}
          </h1>
        </div>
      </header>

      <section className="px-4 py-5">
        <div className="rounded-[14px] border border-border bg-card p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-foreground mt-0.5 shrink-0" />
            <div>
              <h2 className="font-display text-[18px] font-semibold text-foreground tracking-[-0.01em]">
                {isRu ? CLEARVIEW_LABELS.productName.ru : CLEARVIEW_LABELS.productName.en}
              </h2>
              <p className="text-[13px] text-muted-foreground mt-1 leading-snug">
                {isRu
                  ? 'Независимая 8-критериальная экспертиза проекта: юр. статус, репутация девелопера, ход стройки, ROI, ликвидность.'
                  : 'Independent 8-criteria project assessment: legal status, developer reputation, construction progress, ROI, liquidity.'}
              </p>
            </div>
          </div>

          {projectLabel && (
            <div className="rounded-[10px] bg-muted/40 border border-border px-3 py-2 text-[13px] text-foreground">
              <span className="text-muted-foreground">{isRu ? 'Проект: ' : 'Project: '}</span>
              <span className="font-semibold">{projectLabel}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[12.5px]">
            <div className="flex items-center gap-1.5 text-foreground">
              <BadgeCheck className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono">฿4,900</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{isRu ? '15 рабочих дней' : '15 business days'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-5">
        <h3 className="font-display text-[14px] font-semibold text-foreground mb-2">
          {isRu ? 'Что входит' : 'What is included'}
        </h3>
        <ul className="space-y-1.5 text-[13px] text-foreground/90">
          {[
            { ru: 'Рейтинг AAA–BB по 8 категориям', en: 'AAA–BB rating across 8 categories' },
            { ru: 'Юридическая верификация (title, escrow, FET)', en: 'Legal verification (title, escrow, FET)' },
            { ru: 'История девелопера и завершённые проекты', en: 'Developer track record and delivered projects' },
            { ru: 'ROI с учётом текущего STR-рынка района', en: 'ROI based on current district STR market data' },
            { ru: 'Red/green flags + персональные рекомендации', en: 'Red/green flags + personal recommendations' },
          ].map((line, i) => (
            <li key={i} className="flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground mt-1 shrink-0" />
              <span>{isRu ? line.ru : line.en}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pb-6">
        <div className="rounded-[14px] border border-border bg-card p-4">
          <h3 className="font-display text-[14px] font-semibold text-foreground mb-3">
            {isRu ? 'Контактные данные' : 'Contact details'}
          </h3>
          <NbLeadForm
            projectId={projectId}
            source={projectId ? `clearview_full_report:${projectId}` : 'clearview_full_report'}
          />
          <p className="text-[11.5px] text-muted-foreground mt-3 leading-snug">
            {isRu
              ? 'После заявки мы пришлём счёт на ฿4,900 и стартуем DD. Отчёт высылается в PDF и в личный кабинет.'
              : 'After your request we will send a ฿4,900 invoice and start DD. The report is delivered as PDF and in your account.'}
          </p>
        </div>
      </section>
    </div>
  );
}
