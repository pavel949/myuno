/**
 * ContextualCTA — IPP §25 (M10f) primitive.
 *
 * Renders a "Next steps" cluster of contextual links between modules:
 *   Knowledge → Catalogue, ROI → Catalogue, Comparison → ClearView Apply,
 *   Property card → Knowledge article, etc.
 *
 * Hard rules:
 *  - Never render an action with `count === 0` (no empty matches per §25).
 *  - Never render the block if no actions remain.
 *  - Each click is logged via useIPPLeadEvent → analytics_events for M10a audits.
 *
 * The component is intentionally presentational — the page decides which
 * actions to pass in.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useIPPLeadEvent } from '@/hooks/useIPPLeadEvent';
import type { IPPLeadEventType } from '@/lib/leads/ippLeadEvents';

export interface ContextualAction {
  id: string;
  /** Internal route */
  to: string;
  label: string;
  /** Optional secondary line (e.g. "12 properties · ฿3–8M") */
  hint?: string | null;
  /** lucide-react icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** True when this is a transactional next step (deal / lead / purchase). */
  transactional?: boolean;
  /** Optional IPP scoring event to fire on click. */
  trackEvent?: IPPLeadEventType;
}

interface Props {
  /** Module the user is currently in (e.g. 'roi_calculator', 'knowledge_article'). */
  sourceModule: string;
  /** Header text. */
  title: string;
  actions: ContextualAction[];
  /** Optional context payload appended to every event (project_id, etc.). */
  trackContext?: Record<string, unknown>;
  className?: string;
}

export function ContextualCTA({
  sourceModule,
  title,
  actions,
  trackContext,
  className,
}: Props) {
  const { track } = useIPPLeadEvent();

  // Guard: never render empty CTA blocks. Pages that pass an empty list
  // simply won't show this section.
  const visible = actions.filter(a => !!a.to && !!a.label);
  if (visible.length === 0) return null;

  const handleClick = (action: ContextualAction) => {
    // Always log the cross-module CTA click for M10a audits.
    void (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('analytics_events').insert({
          event_name: 'ipp_cross_cta_click',
          session_id: (() => {
            try {
              return sessionStorage.getItem('myuno_ipp_session_id') || `s_${Date.now()}`;
            } catch { return `s_${Date.now()}`; }
          })(),
          page_path: typeof window !== 'undefined' ? window.location.pathname : null,
          event_data: {
            source_module: sourceModule,
            target: action.to,
            action_id: action.id,
            transactional: !!action.transactional,
            ...(trackContext ?? {}),
          },
        });
      } catch { /* never block UX */ }
    })();

    if (action.trackEvent) {
      track({ eventType: action.trackEvent, meta: { source_module: sourceModule, ...(trackContext ?? {}) } });
    }
  };

  return (
    <section
      className={
        'rounded-[14px] border border-border bg-card p-4 ' + (className ?? '')
      }
      aria-label={title}
    >
      <h3 className="font-display text-[14px] font-semibold text-foreground mb-2.5">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {visible.map(action => {
          const Icon = action.icon;
          return (
            <li key={action.id}>
              <Link
                to={action.to}
                onClick={() => handleClick(action)}
                className={
                  'flex items-center justify-between gap-3 px-3 py-2.5 rounded-[10px] border transition-colors ' +
                  (action.transactional
                    ? 'border-foreground/40 bg-foreground/5 hover:bg-foreground/10'
                    : 'border-border hover:border-foreground/30 bg-background')
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-[13.5px] text-foreground truncate">{action.label}</div>
                    {action.hint && (
                      <div className="text-[11.5px] text-muted-foreground truncate">{action.hint}</div>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
