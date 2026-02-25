/**
 * @module useDayBriefing
 * Unified "Your Day" data aggregator.
 * Collects: birthdays, check-ins/outs, CRM activities, tasks, personal reminders, document expiries.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useDashboardFilter } from '@/contexts/DashboardFilterContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { isToday, isTomorrow, differenceInCalendarDays, format } from 'date-fns';

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
  | 'deadline';

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
} as const;

export function useDayBriefing() {
  const { user } = useAuth();
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;
  const { allProperties } = useMyProperties();
  const { selectedPropertyId } = useDashboardFilter();

  const filteredPropertyIds = selectedPropertyId
    ? allProperties.filter(p => p.property_id === selectedPropertyId).map(p => p.property_id)
    : allProperties.map(p => p.property_id);

  return useQuery({
    queryKey: ['day-briefing', user?.id, companyId, filteredPropertyIds.join(',')],
    queryFn: async (): Promise<DayItem[]> => {
      if (!user?.id) return [];

      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');
      
      // For birthday matching — MM-DD
      const todayMD = format(now, 'MM-dd');
      const weekDates: string[] = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        weekDates.push(format(d, 'MM-dd'));
      }
      const allBirthdayMDs = [todayMD, ...weekDates];

      // Parallel fetches
      const [
        contactsRes,
        staffRes,
        bookingsRes,
        activitiesRes,
        crmTasksRes,
        remindersRes,
        documentsRes,
      ] = await Promise.all([
        // 1) CRM contacts with birthdays this week
        companyId
          ? supabase.from('crm_contacts').select('id, first_name, last_name, birthday, contact_type, avatar_url')
              .eq('company_id', companyId).eq('is_archived', false).not('birthday', 'is', null)
          : Promise.resolve({ data: [] }),

        // 2) Staff with birthdays
        supabase.from('staff_members').select('id, name, date_of_birth, role, photo_url')
          .eq('owner_id', user.id).eq('is_active', true).not('date_of_birth', 'is', null),

        // 3) Today & tomorrow bookings
        filteredPropertyIds.length > 0
          ? supabase.from('property_bookings').select('id, guest_name, property_id, check_in, check_out, status')
              .in('property_id', filteredPropertyIds)
              .in('status', ['confirmed', 'checked_in', 'completed'])
              .or(`check_in.gte.${todayStr},check_out.gte.${todayStr}`)
              .lte('check_in', tomorrowStr + 'T23:59:59')
          : Promise.resolve({ data: [] }),

        // 4) CRM scheduled activities for today/tomorrow
        companyId
          ? supabase.from('deal_scheduled_activities').select('id, summary, activity_type, due_date, due_time, deal_id')
              .eq('company_id', companyId).is('completed_at', null).is('cancelled_at', null)
              .gte('due_date', todayStr).lte('due_date', tomorrowStr)
              .eq('assigned_to', user.id)
              .order('due_date').order('due_time', { ascending: true, nullsFirst: false })
          : Promise.resolve({ data: [] }),

        // 5) CRM tasks — today + overdue
        companyId
          ? supabase.from('crm_tasks').select('id, title, task_type, priority, status, due_date')
              .eq('company_id', companyId).neq('status', 'done')
              .or(`due_date.lte.${todayStr}T23:59:59,due_date.is.null`)
              .limit(20)
          : Promise.resolve({ data: [] }),

        // 6) Personal reminders upcoming (within remind_days_before)
        supabase.from('personal_reminders').select('id, title, reminder_type, due_date, remind_days_before, description')
          .eq('user_id', user.id).eq('status', 'active')
          .lte('due_date', format(new Date(now.getTime() + 30 * 86400000), 'yyyy-MM-dd'))
          .order('due_date'),

        // 7) User documents with upcoming expiry
        supabase.from('user_documents').select('id, document_type, expiry_date, file_name')
          .eq('user_id', user.id).not('expiry_date', 'is', null)
          .gte('expiry_date', todayStr)
          .lte('expiry_date', format(new Date(now.getTime() + 30 * 86400000), 'yyyy-MM-dd'))
          .order('expiry_date'),
      ]);

      const items: DayItem[] = [];

      // ─── Birthdays ───
      const matchesBirthday = (dateStr: string) => {
        try {
          const md = dateStr.slice(5); // MM-DD from YYYY-MM-DD
          return allBirthdayMDs.includes(md);
        } catch { return false; }
      };

      for (const c of (contactsRes.data || []) as any[]) {
        if (!c.birthday || !matchesBirthday(c.birthday)) continue;
        const md = c.birthday.slice(5);
        const isToday_ = md === todayMD;
        const dayIdx = isToday_ ? 0 : weekDates.indexOf(md) + 1;
        items.push({
          id: `bday-contact-${c.id}`,
          type: 'birthday',
          sectionOrder: ORDER.birthday,
          title: `${c.first_name} ${c.last_name}`,
          subtitle: isToday_ ? undefined : `через ${dayIdx} дн.`,
          href: `/owner/crm/contacts/${c.id}`,
          meta: { contactType: c.contact_type, daysUntil: dayIdx, avatarUrl: c.avatar_url },
        });
      }

      for (const s of (staffRes.data || []) as any[]) {
        if (!s.date_of_birth || !matchesBirthday(s.date_of_birth)) continue;
        const md = s.date_of_birth.slice(5);
        const isToday_ = md === todayMD;
        const dayIdx = isToday_ ? 0 : weekDates.indexOf(md) + 1;
        items.push({
          id: `bday-staff-${s.id}`,
          type: 'birthday',
          sectionOrder: ORDER.birthday,
          title: s.name,
          subtitle: isToday_ ? undefined : `через ${dayIdx} дн.`,
          href: '/owner/staff',
          meta: { contactType: 'staff', daysUntil: dayIdx, avatarUrl: s.photo_url },
        });
      }

      // ─── Bookings (check-in/out) ───
      const propNameMap = new Map(allProperties.map(p => [p.property_id, p.title || 'Объект']));
      for (const b of (bookingsRes.data || []) as any[]) {
        const ci = new Date(b.check_in);
        const co = new Date(b.check_out);
        const pName = propNameMap.get(b.property_id) || 'Объект';

        if (isToday(ci)) {
          items.push({
            id: `ci-${b.id}`, type: 'check_in', sectionOrder: ORDER.schedule,
            title: b.guest_name || 'Гость',
            subtitle: pName,
            href: `/owner/bookings/${b.id}`,
            meta: { propertyName: pName },
          });
        } else if (isTomorrow(ci)) {
          items.push({
            id: `ci-tm-${b.id}`, type: 'check_in_tomorrow', sectionOrder: ORDER.tomorrow,
            title: b.guest_name || 'Гость',
            subtitle: pName,
            href: `/owner/bookings/${b.id}`,
            meta: { propertyName: pName },
          });
        }

        if (isToday(co)) {
          items.push({
            id: `co-${b.id}`, type: 'check_out', sectionOrder: ORDER.schedule,
            title: b.guest_name || 'Гость',
            subtitle: pName,
            href: `/owner/bookings/${b.id}`,
            meta: { propertyName: pName },
          });
        } else if (isTomorrow(co)) {
          items.push({
            id: `co-tm-${b.id}`, type: 'check_out_tomorrow', sectionOrder: ORDER.tomorrow,
            title: b.guest_name || 'Гость',
            subtitle: pName,
            href: `/owner/bookings/${b.id}`,
            meta: { propertyName: pName },
          });
        }
      }

      // ─── CRM scheduled activities ───
      for (const a of (activitiesRes.data || []) as any[]) {
        const isToday_ = a.due_date === todayStr;
        items.push({
          id: `act-${a.id}`,
          type: 'crm_activity',
          sectionOrder: isToday_ ? ORDER.schedule : ORDER.tomorrow,
          title: a.summary,
          href: `/owner/crm/deals/${a.deal_id}`,
          meta: { dueTime: a.due_time || undefined },
        });
      }

      // ─── CRM Tasks ───
      for (const t of (crmTasksRes.data || []) as any[]) {
        const isOverdue = t.due_date && t.due_date < todayStr;
        items.push({
          id: `task-${t.id}`,
          type: isOverdue ? 'overdue_task' : 'crm_task',
          sectionOrder: isOverdue ? ORDER.overdue : ORDER.tasks,
          title: t.title,
          href: '/owner/operations',
          meta: { priority: t.priority },
        });
      }

      // ─── Personal reminders ───
      for (const r of (remindersRes.data || []) as any[]) {
        const days = differenceInCalendarDays(new Date(r.due_date), now);
        if (days > (r.remind_days_before || 14)) continue;
        items.push({
          id: `rem-${r.id}`,
          type: 'personal_reminder',
          sectionOrder: days <= 0 ? ORDER.overdue : ORDER.reminders,
          title: r.title,
          subtitle: r.description || undefined,
          meta: { daysUntil: days, reminderType: r.reminder_type },
        });
      }

      // ─── Document expiries ───
      for (const d of (documentsRes.data || []) as any[]) {
        const days = differenceInCalendarDays(new Date(d.expiry_date), now);
        items.push({
          id: `doc-${d.id}`,
          type: 'document_expiry',
          sectionOrder: days <= 3 ? ORDER.overdue : ORDER.reminders,
          title: formatDocType(d.document_type),
          subtitle: d.file_name || undefined,
          meta: { daysUntil: days, reminderType: d.document_type },
        });
      }

      // Sort by section, then within section
      return items.sort((a, b) => {
        if (a.sectionOrder !== b.sectionOrder) return a.sectionOrder - b.sectionOrder;
        // Within birthdays, today first
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
    passport: 'Паспорт',
    driver_license: 'Водительские права',
    insurance: 'Страховка',
    visa: 'Виза',
    other: 'Документ',
  };
  return map[type] || type;
}
