/**
 * @module useDayBriefing
 * Universal "Your Day" data aggregator — role-aware.
 * Supports: owner/PM, vendor, staff/uno_team, investor, tourist, resident.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useDashboardFilter } from '@/contexts/DashboardFilterContext';
import { useUserContext } from '@/hooks/useUserContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { type AppRole } from '@/types/auth';
import { isToday, isTomorrow, differenceInCalendarDays, format } from 'date-fns';
import { CRM_TASK_ACTIVE_STATUSES } from '@/lib/tasks/taskStatus';

/* ─── Types ─── */
export type DayItemType =
  | 'overdue_task'
  | 'birthday'
  | 'check_in'
  | 'check_out'
  | 'check_in_tomorrow'
  | 'check_out_tomorrow'
  | 'crm_activity'
  | 'crm_task'
  | 'personal_reminder'
  | 'document_expiry'
  | 'deadline'
  | 'recommendation'
  | 'news'
  | 'event'
  // Vendor-specific
  | 'vendor_order'
  | 'vendor_review'
  // Staff-specific
  | 'staff_task'
  // Investor-specific
  | 'investment_update'
  // Client (tourist/resident)
  | 'my_booking'
  // myUNO services for owners
  | 'myuno_service';

export interface DayItem {
  id: string;
  type: DayItemType;
  /** Section priority: lower = more urgent */
  sectionOrder: number;
  title: string;
  subtitle?: string;
  /** For navigation */
  href?: string;
  /** Extra context */
  meta?: {
    contactType?: string;
    daysUntil?: number;
    dueTime?: string;
    propertyName?: string;
    priority?: string;
    reminderType?: string;
    avatarUrl?: string;
    status?: string;
    amount?: number;
  };
}

/* ─── Section order constants ─── */
const ORDER = {
  overdue: 0,
  birthday: 1,
  schedule: 2,
  tasks: 3,
  reminders: 4,
  deadlines: 5,
  tomorrow: 6,
  recommendations: 7,
  news: 8,
  events: 9,
} as const;

/** Roles that need owner/PM business data */
const OWNER_ROLES: AppRole[] = ['owner', 'property_manager'];
/** Roles that see platform content (news, events, recommendations) */
const CONTENT_ROLES: AppRole[] = ['user', 'owner', 'property_manager', 'vendor', 'investor'];

interface UseDayBriefingOptions {
  /** Override role detection */
  role?: AppRole;
}

/* ─── Row shapes (loose) for the briefing aggregator ─── */
type ContactRow = { id: string; first_name: string; last_name: string; birthday: string | null; contact_type: string | null; avatar_url: string | null };
type StaffRow = { id: string; name: string; date_of_birth: string | null; role: string | null; photo_url: string | null };
type BookingRow = { id: string; guest_name: string | null; property_id: string; check_in: string; check_out: string; status: string };
type ActivityRow = { id: string; summary: string; activity_type: string | null; due_date: string; due_time: string | null; deal_id: string; deal: { property_id: string | null } | null };
type CrmTaskRow = { id: string; title: string; task_type: string | null; priority: string | null; status: string; due_date: string | null };
type VendorOrderRow = { id: string; order_number: string | null; status: string; total_amount: number | null; currency: string | null; created_at: string; scheduled_date: string | null };
type StaffTaskRow = { id: string; order_number: string | null; service_name: string | null; status: string; priority: string | null; scheduled_at: string | null; property_id: string | null };
type MyBookingRow = { id: string; status: string; booking_date: string; time_slot: string | null; total_amount: number | null; currency: string | null };
type ReminderRow = { id: string; title: string; reminder_type: string | null; due_date: string; remind_days_before: number | null; description: string | null };
type DocumentRow = { id: string; document_type: string; expiry_date: string; file_name: string };
type RecommendationRow = { id: string; title?: string | null; title_ru?: string | null; title_en?: string | null; description?: string | null; description_ru?: string | null; description_en?: string | null; action_url?: string | null; category?: string | null; icon?: string | null; href?: string | null; cta_label?: string | null; image_url?: string | null };
type NewsRow = { id: string; title?: string | null; title_ru?: string | null; title_en?: string | null; summary?: string | null; summary_ru?: string | null; summary_en?: string | null; href?: string | null; published_at: string; is_pinned: boolean | null; source_name?: string | null; source_url?: string | null; category?: string | null; cover_image?: string | null };
type EventRow = { id: string; title?: string | null; title_ru?: string | null; title_en?: string | null; description?: string | null; description_ru?: string | null; description_en?: string | null; event_date: string; event_time?: string | null; location?: string | null; event_url?: string | null; cover_image?: string | null; category?: string | null; href?: string | null };

export function useDayBriefing(options?: UseDayBriefingOptions) {
  const { user } = useAuth();
  const { activeRole: contextRole, activeOrgId } = useUserContext();
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;
  const { allProperties } = useMyProperties();

  // Try to use dashboard filter if available (owner context)
  let selectedPropertyId: string | null = null;
  try {
    const filter = useDashboardFilter();
    selectedPropertyId = filter.selectedPropertyId;
  } catch {
    // Not in dashboard filter context — that's fine
  }

  const role = options?.role || contextRole;

  const isOwnerRole = OWNER_ROLES.includes(role);
  const isVendor = role === 'vendor';
  const isStaff = role === 'staff' || role === 'uno_team';
  const isInvestor = role === 'investor';
  const isClient = role === 'user' || role === 'tourist' || role === 'resident';
  const showContent = CONTENT_ROLES.includes(role) || isClient;

  const filteredPropertyIds = isOwnerRole
    ? (selectedPropertyId
      ? allProperties.filter(p => p.property_id === selectedPropertyId).map(p => p.property_id)
      : allProperties.map(p => p.property_id))
    : [];

  return useQuery({
    queryKey: ['day-briefing', user?.id, role, companyId, activeOrgId, filteredPropertyIds.join(',')],
    queryFn: async (): Promise<DayItem[]> => {
      if (!user?.id) return [];

      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');
      const in30Days = format(new Date(now.getTime() + 30 * 86400000), 'yyyy-MM-dd');

      // Birthday matching
      const todayMD = format(now, 'MM-dd');
      const weekDates: string[] = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        weekDates.push(format(d, 'MM-dd'));
      }
      const allBirthdayMDs = [todayMD, ...weekDates];

      // Build parallel queries based on role
      // Helper: wrap supabase query builder into a proper Promise (it's thenable already)
      const q = <T>(builder: PromiseLike<T>): Promise<T> => Promise.resolve(builder);
      const queries: Promise<{ data: unknown[] | null }>[] = [];
      const queryLabels: string[] = [];

      // ── OWNER/PM queries ──
      if (isOwnerRole) {
        queries.push(
          companyId
            ? q(supabase.from('crm_contacts').select('id, first_name, last_name, birthday, contact_type, avatar_url')
                .eq('company_id', companyId).eq('is_archived', false).not('birthday', 'is', null))
            : Promise.resolve({ data: [] })
        );
        queryLabels.push('contacts');

        queries.push(
          q(supabase.from('staff_members').select('id, name, date_of_birth, role, photo_url')
            .eq('owner_id', user.id).eq('is_active', true).not('date_of_birth', 'is', null))
        );
        queryLabels.push('staff');

        queries.push(
          filteredPropertyIds.length > 0
            ? q(supabase.from('property_bookings').select('id, guest_name, property_id, check_in, check_out, status')
                .in('property_id', filteredPropertyIds)
                .in('status', ['confirmed', 'checked_in', 'completed'])
                .or(`check_in.gte.${todayStr},check_out.gte.${todayStr}`)
                .lte('check_in', tomorrowStr + 'T23:59:59'))
            : Promise.resolve({ data: [] })
        );
        queryLabels.push('bookings');

        queries.push(
          companyId
            ? q(supabase.from('deal_scheduled_activities').select('id, summary, activity_type, due_date, due_time, deal_id, deal:agent_deals(property_id)')
                .eq('company_id', companyId).is('completed_at', null).is('cancelled_at', null)
                .gte('due_date', todayStr).lte('due_date', tomorrowStr)
                .eq('assigned_to', user.id)
                .order('due_date').order('due_time', { ascending: true, nullsFirst: false }))
            : Promise.resolve({ data: [] })
        );
        queryLabels.push('activities');

        queries.push(
          companyId
            ? q(supabase.from('crm_tasks').select('id, title, task_type, priority, status, due_date')
                .eq('company_id', companyId)
                .in('status', [...CRM_TASK_ACTIVE_STATUSES])
                .not('due_date', 'is', null)
                .lte('due_date', `${todayStr}T23:59:59`)
                .limit(50))
            : Promise.resolve({ data: [] })
        );
        queryLabels.push('crmTasks');
      }

      // ── VENDOR queries ──
      if (isVendor && activeOrgId) {
        queries.push(
          (async () => {
            const { data } = await (supabase.from('orders').select('id, order_number, status, total_amount, currency, created_at, scheduled_date') as any)
              .eq('vendor_id', activeOrgId)
              .in('status', ['pending', 'confirmed', 'in_progress'])
              .order('created_at', { ascending: false })
              .limit(15);
            return { data: data || [] };
          })()
        );
        queryLabels.push('vendorOrders');
      }

      // ── STAFF queries ──
      if (isStaff) {
        queries.push(
          q(supabase.from('service_orders').select('id, order_number, service_name, status, priority, scheduled_at, property_id')
            .eq('assigned_to', user.id)
            .in('status', ['assigned', 'in_progress'])
            .order('scheduled_at', { ascending: true, nullsFirst: false })
            .limit(20))
        );
        queryLabels.push('staffTasks');
      }

      // ── CLIENT (tourist/resident) queries ──
      if (isClient) {
        queries.push(
          q(supabase.from('bookings').select('id, status, booking_date, time_slot, total_amount, currency')
            .eq('user_id', user.id)
            .in('status', ['confirmed', 'submitted'])
            .gte('booking_date', todayStr)
            .order('booking_date')
            .limit(10))
        );
        queryLabels.push('myBookings');
      }

      // ── UNIVERSAL queries (all roles) ──
      // Personal reminders
      queries.push(
        q(supabase.from('personal_reminders').select('id, title, reminder_type, due_date, remind_days_before, description')
          .eq('user_id', user.id).eq('status', 'active')
          .lte('due_date', in30Days)
          .order('due_date'))
      );
      queryLabels.push('reminders');

      queries.push(
        q(supabase.from('user_documents').select('id, document_type, expiry_date, file_name')
          .eq('user_id', user.id).not('expiry_date', 'is', null)
          .gte('expiry_date', todayStr)
          .lte('expiry_date', in30Days)
          .order('expiry_date'))
      );
      queryLabels.push('documents');

      if (showContent) {
        queries.push(
          q(supabase.from('platform_recommendations').select('*')
            .eq('is_active', true)
            .order('priority', { ascending: false })
            .limit(3))
        );
        queryLabels.push('recommendations');

        queries.push(
          q(supabase.from('platform_news').select('*')
            .eq('is_active', true)
            .order('is_pinned', { ascending: false })
            .order('published_at', { ascending: false })
            .limit(5))
        );
        queryLabels.push('news');

        queries.push(
          q(supabase.from('platform_events').select('*')
            .eq('is_active', true)
            .gte('event_date', todayStr)
            .order('event_date')
            .limit(5))
        );
        queryLabels.push('events');
      }

      // Execute all queries in parallel
      const results = await Promise.all(queries);

      // Map results by label
      const dataMap: Record<string, any[]> = {};
      results.forEach((res, i) => {
        dataMap[queryLabels[i]] = res.data || [];
      });

      const items: DayItem[] = [];

      // ─── Birthdays (owner) ───
      if (isOwnerRole) {
        const matchesBirthday = (dateStr: string) => {
          try {
            const md = dateStr.slice(5);
            return allBirthdayMDs.includes(md);
          } catch { return false; }
        };

        for (const c of (dataMap.contacts || []) as ContactRow[]) {
          if (!c.birthday || !matchesBirthday(c.birthday)) continue;
          const md = c.birthday.slice(5);
          const isToday_ = md === todayMD;
          const dayIdx = isToday_ ? 0 : weekDates.indexOf(md) + 1;
          items.push({
            id: `bday-contact-${c.id}`, type: 'birthday', sectionOrder: ORDER.birthday,
            title: `${c.first_name} ${c.last_name}`,
            subtitle: isToday_ ? undefined : `in ${dayIdx}d`,
            href: `/mc/contacts/${c.id}`,
            meta: { contactType: c.contact_type, daysUntil: dayIdx, avatarUrl: c.avatar_url },
          });
        }

        for (const s of (dataMap.staff || []) as StaffRow[]) {
          if (!s.date_of_birth || !matchesBirthday(s.date_of_birth)) continue;
          const md = s.date_of_birth.slice(5);
          const isToday_ = md === todayMD;
          const dayIdx = isToday_ ? 0 : weekDates.indexOf(md) + 1;
          items.push({
            id: `bday-staff-${s.id}`, type: 'birthday', sectionOrder: ORDER.birthday,
            title: s.name,
            subtitle: isToday_ ? undefined : `in ${dayIdx}d`,
            href: '/mc/staff',
            meta: { contactType: 'staff', daysUntil: dayIdx, avatarUrl: s.photo_url },
          });
        }

        // ─── Bookings (check-in/out) ───
        const propNameMap = new Map(allProperties.map(p => [p.property_id, p.title || 'Property']));
        for (const b of (dataMap.bookings || []) as BookingRow[]) {
          const ci = new Date(b.check_in);
          const co = new Date(b.check_out);
          const pName = propNameMap.get(b.property_id) || 'Property';

          if (isToday(ci)) {
            items.push({
              id: `ci-${b.id}`, type: 'check_in', sectionOrder: ORDER.schedule,
              title: b.guest_name || 'Guest', subtitle: pName,
              href: `/mc/bookings/${b.id}`, meta: { propertyName: pName },
            });
          } else if (isTomorrow(ci)) {
            items.push({
              id: `ci-tm-${b.id}`, type: 'check_in_tomorrow', sectionOrder: ORDER.tomorrow,
              title: b.guest_name || 'Guest', subtitle: pName,
              href: `/mc/bookings/${b.id}`, meta: { propertyName: pName },
            });
          }

          if (isToday(co)) {
            items.push({
              id: `co-${b.id}`, type: 'check_out', sectionOrder: ORDER.schedule,
              title: b.guest_name || 'Guest', subtitle: pName,
              href: `/mc/bookings/${b.id}`, meta: { propertyName: pName },
            });
          } else if (isTomorrow(co)) {
            items.push({
              id: `co-tm-${b.id}`, type: 'check_out_tomorrow', sectionOrder: ORDER.tomorrow,
              title: b.guest_name || 'Guest', subtitle: pName,
              href: `/mc/bookings/${b.id}`, meta: { propertyName: pName },
            });
          }
        }

        // ─── CRM scheduled activities ───
        for (const a of (dataMap.activities || []) as ActivityRow[]) {
          const activityPropertyId = a.deal?.property_id || null;
          if (selectedPropertyId && activityPropertyId && activityPropertyId !== selectedPropertyId) {
            continue;
          }
          if (selectedPropertyId && !activityPropertyId) {
            continue;
          }
          const isToday_ = a.due_date === todayStr;
          items.push({
            id: `act-${a.id}`, type: 'crm_activity',
            sectionOrder: isToday_ ? ORDER.schedule : ORDER.tomorrow,
            title: a.summary,
            href: `/mc/sales/${a.deal_id}`,
            meta: { dueTime: a.due_time || undefined, propertyName: activityPropertyId ? propNameMap.get(activityPropertyId) : undefined },
          });
        }

        // ─── CRM Tasks ───
        for (const t of (dataMap.crmTasks || []) as CrmTaskRow[]) {
          const isOverdue = t.due_date && t.due_date < todayStr;
          items.push({
            id: `task-${t.id}`,
            type: isOverdue ? 'overdue_task' : 'crm_task',
            sectionOrder: isOverdue ? ORDER.overdue : ORDER.tasks,
            title: t.title, href: '/mc/tasks',
            meta: { priority: t.priority },
          });
        }
      }

      // ─── Vendor orders ───
      if (isVendor) {
        for (const o of (dataMap.vendorOrders || []) as VendorOrderRow[]) {
          const isPending = o.status === 'pending';
          items.push({
            id: `vo-${o.id}`, type: 'vendor_order',
            sectionOrder: isPending ? ORDER.overdue : ORDER.schedule,
            title: o.order_number || `Order ${o.id.slice(0, 8)}`,
            subtitle: o.status === 'pending' ? 'Pending confirmation' : 'In progress',
            href: `/vendor/bookings/${o.id}`,
            meta: { status: o.status, amount: o.total_amount },
          });
        }
      }

      // ─── Staff tasks ───
      if (isStaff) {
        for (const t of (dataMap.staffTasks || []) as StaffTaskRow[]) {
          const isInProgress = t.status === 'in_progress';
          items.push({
            id: `st-${t.id}`, type: 'staff_task',
            sectionOrder: isInProgress ? ORDER.schedule : ORDER.tasks,
            title: t.service_name || t.order_number || 'Task',
            subtitle: t.scheduled_at
              ? format(new Date(t.scheduled_at), 'HH:mm')
              : undefined,
            href: '/staff',
            meta: { priority: t.priority, status: t.status },
          });
        }
      }

      // ─── Client bookings ───
      if (isClient) {
        for (const b of (dataMap.myBookings || []) as MyBookingRow[]) {
          const days = differenceInCalendarDays(new Date(b.booking_date), now);
          items.push({
            id: `mb-${b.id}`, type: 'my_booking',
            sectionOrder: days === 0 ? ORDER.schedule : days === 1 ? ORDER.tomorrow : ORDER.reminders,
            title: b.time_slot
              ? `Booking at ${b.time_slot}`
              : 'Booking',
            subtitle: b.booking_date,
            href: `/account/bookings`,
            meta: { daysUntil: days, status: b.status, amount: b.total_amount },
          });
        }
      }

      // ─── Personal reminders (all roles) ───
      for (const r of (dataMap.reminders || []) as ReminderRow[]) {
        const days = differenceInCalendarDays(new Date(r.due_date), now);
        if (days > (r.remind_days_before || 14)) continue;
        items.push({
          id: `rem-${r.id}`, type: 'personal_reminder',
          sectionOrder: days <= 0 ? ORDER.overdue : ORDER.reminders,
          title: r.title, subtitle: r.description || undefined,
          meta: { daysUntil: days, reminderType: r.reminder_type },
        });
      }

      // ─── Document expiries (all roles) ───
      for (const d of (dataMap.documents || []) as DocumentRow[]) {
        const days = differenceInCalendarDays(new Date(d.expiry_date), now);
        items.push({
          id: `doc-${d.id}`, type: 'document_expiry',
          sectionOrder: days <= 3 ? ORDER.overdue : ORDER.reminders,
          title: formatDocType(d.document_type),
          subtitle: d.file_name || undefined,
          meta: { daysUntil: days, reminderType: d.document_type },
        });
      }

      // ─── Platform content ───
      if (showContent) {
        for (const r of (dataMap.recommendations || []) as RecommendationRow[]) {
          items.push({
            id: `rec-${r.id}`, type: 'recommendation', sectionOrder: ORDER.recommendations,
            title: r.title_ru || r.title_en,
            subtitle: r.description_ru || r.description_en || undefined,
            href: r.action_url || undefined,
            meta: { reminderType: r.category, avatarUrl: r.icon },
          });
        }

        for (const n of (dataMap.news || []) as NewsRow[]) {
          items.push({
            id: `news-${n.id}`, type: 'news', sectionOrder: ORDER.news,
            title: n.title_ru || n.title_en,
            subtitle: n.summary_ru || n.summary_en || n.source_name || undefined,
            href: n.source_url || undefined,
            meta: { reminderType: n.category, avatarUrl: n.cover_image },
          });
        }

        for (const e of (dataMap.events || []) as EventRow[]) {
          const days = differenceInCalendarDays(new Date(e.event_date), now);
          items.push({
            id: `evt-${e.id}`, type: 'event', sectionOrder: ORDER.events,
            title: e.title_ru || e.title_en,
            subtitle: e.location || (e.description_ru || e.description_en) || undefined,
            href: e.event_url || undefined,
            meta: {
              daysUntil: days, dueTime: e.event_time || undefined,
              avatarUrl: e.cover_image, reminderType: e.category,
            },
          });
        }
      }

      // Sort by section, then within section
      return items.sort((a, b) => {
        if (a.sectionOrder !== b.sectionOrder) return a.sectionOrder - b.sectionOrder;
        if (a.type === 'birthday' && b.type === 'birthday') {
          return (a.meta?.daysUntil || 0) - (b.meta?.daysUntil || 0);
        }
        return 0;
      });
    },
    enabled: !!user?.id,
    ...CACHE_PROFILES.DYNAMIC,
  });
}

function formatDocType(type: string): string {
  const map: Record<string, string> = {
    passport: 'Passport',
    driver_license: 'Driver License',
    insurance: 'Insurance',
    visa: 'Visa',
    other: 'Document',
  };
  return map[type] || type;
}
