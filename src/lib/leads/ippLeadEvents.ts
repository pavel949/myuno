/**
 * IPP Lead Event Scoring — IPP.md §3 reference table.
 *
 * Single source of truth for P5–P11 lead scoring deltas tracked in
 * `analytics_events` (event_name = 'ipp_lead_event'). Scores are aggregated
 * server-side by `auto-lead-scoring` for nb_leads / consultation_requests.
 *
 * Connect-before-Create: no new tables, reuses analytics_events + nb_leads.score.
 */
export const IPP_LEAD_EVENTS = {
  card_view_3plus: 15,
  clearview_summary_open: 20,
  clearview_full_report_purchased: 50,
  roi_calculator_run: 25,
  watchlist_add: 30,
  comparison_open: 20,
  reservation_created: 100,
  spa_signed: 200,
} as const;

export type IPPLeadEventType = keyof typeof IPP_LEAD_EVENTS;

/** Threshold at which a P8 lead becomes WhatsApp-escalation-worthy (IPP §12 step 6). */
export const P8_HOT_LEAD_SCORE_THRESHOLD = 100;
