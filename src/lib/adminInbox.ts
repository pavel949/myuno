import { supabase } from '@/integrations/supabase/client';
import { typedFrom } from '@/lib/untypedTables';
import { LEAD_STATUS_BUCKETS, LEAD_STATUS_NEW, type InboxStatusBucket } from '@/config/leadStatus';
import { APP_ROUTES } from '@/lib/config/routes';

export type InboxSource = 'partner_applications' | 'listing_applications' | 'consultation_requests' | 'nb_leads' | 'property_inquiries' | 'help_requests' | 'service_orders';

export type InboxStatus = InboxStatusBucket;

const MARKETPLACE_SERVICE_TYPE = 'marketplace';

export const INBOX_SOURCES: readonly InboxSource[] = ['partner_applications', 'listing_applications', 'consultation_requests', 'nb_leads', 'property_inquiries', 'help_requests', 'service_orders'];
export function isInboxSource(value: string | null): value is InboxSource {
  return INBOX_SOURCES.some(source => source === value);
}
export function isInboxRequestId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
}
export function inboxRequestHref(source: InboxSource, id: string) {
  return `${APP_ROUTES.ADMIN_INBOX}?${new URLSearchParams({ source, request: id })}`;
}

// Explicit display projections, not a new request model. RLS and the existing
// admin route remain authoritative; an ID is only a selection, never a grant.
export const INBOX_DETAIL_FIELDS: Record<InboxSource, readonly (readonly [string, string, string])[]> = {
  partner_applications: [['business_name', 'Business', 'Компания'], ['contact_name', 'Contact', 'Контактное лицо'], ['contact_email', 'Email', 'Email'], ['contact_phone', 'Phone', 'Телефон'], ['business_category', 'Category', 'Категория'], ['business_description', 'Description', 'Описание'], ['notes', 'Notes', 'Заметки']],
  listing_applications: [['applicant_name', 'Name', 'Имя'], ['applicant_email', 'Email', 'Email'], ['applicant_phone', 'Phone', 'Телефон'], ['listing_type', 'Listing type', 'Тип объявления'], ['property_type', 'Property type', 'Тип жилья'], ['service_category', 'Service category', 'Категория услуги'], ['product_category', 'Product category', 'Категория товара'], ['city', 'City', 'Город'], ['address', 'Address', 'Адрес'], ['admin_notes', 'Notes', 'Заметки'], ['rejection_reason', 'Rejection reason', 'Причина отклонения']],
  consultation_requests: [['name', 'Name', 'Имя'], ['email', 'Email', 'Email'], ['phone', 'Phone', 'Телефон'], ['request_type', 'Request type', 'Тип обращения'], ['vertical_id', 'Service', 'Направление'], ['notes', 'Client notes', 'Пожелания клиента'], ['admin_notes', 'Admin notes', 'Внутренние заметки']],
  nb_leads: [['full_name', 'Name', 'Имя'], ['email', 'Email', 'Email'], ['phone', 'Phone', 'Телефон'], ['project_id', 'Project ID', 'ID проекта'], ['source', 'Source', 'Источник'], ['message', 'Message', 'Сообщение']],
  help_requests: [['subject', 'Subject', 'Тема'], ['topic', 'Category', 'Категория'], ['urgency', 'Urgency', 'Срочность'], ['message', 'Message', 'Сообщение'], ['contact_email', 'Customer email', 'Email клиента'], ['contact_phone', 'Customer phone', 'Телефон клиента'], ['preferred_channel', 'Preferred channel', 'Канал связи'], ['language', 'Language', 'Язык'], ['source_page', 'Source page', 'Страница'], ['source_route', 'Source route', 'Маршрут']],
  service_orders: [['order_number', 'Reference', 'Номер'], ['service_name', 'Service', 'Услуга'], ['scheduled_at', 'Requested time', 'Запрошенное время'], ['guest_name', 'Customer', 'Клиент'], ['guest_phone', 'Customer phone', 'Телефон клиента'], ['notes', 'Request details', 'Детали заявки']],
  property_inquiries: [['name', 'Name', 'Имя'], ['email', 'Email', 'Email'], ['phone', 'Phone', 'Телефон'], ['property_id', 'Property ID', 'ID объекта'], ['check_in', 'Check-in', 'Заезд'], ['check_out', 'Check-out', 'Выезд'], ['guests', 'Guests', 'Гости'], ['message', 'Message', 'Сообщение']],
};
export async function fetchInboxRequest(source: InboxSource, id: string): Promise<Record<string, unknown> | null> {
  if (!isInboxSource(source) || !isInboxRequestId(id)) throw new Error('Invalid request selection');
  const fields = ['id', 'status', 'created_at', ...INBOX_DETAIL_FIELDS[source].map(([field]) => field)];
  if (source === 'consultation_requests') fields.push('vertical_metadata');
  if (source === 'service_orders') fields.push('service_type');
  const query = source === 'help_requests'
    ? typedFrom('help_requests').select(fields.join(','))
    : supabase.from(source).select(fields.join(','));
  const exact = query.eq('id', id);
  const { data, error } = await (source === 'service_orders' ? exact.eq('service_type', MARKETPLACE_SERVICE_TYPE) : exact).maybeSingle();
  if (error) throw error;
  const record: unknown = data;
  if (record === null) return null;
  if (typeof record !== 'object' || Array.isArray(record) || !('id' in record) || record.id !== id) throw new Error('Request identity mismatch');
  if (source === 'service_orders' && (!('service_type' in record) || record.service_type !== MARKETPLACE_SERVICE_TYPE)) throw new Error('Request type mismatch');
  return record as Record<string, unknown>;
}

export interface InboxItem {
  id: string;
  source: InboxSource;
  status: InboxStatus | 'other';
  rawStatus: string;
  createdAt: string;
  title: string;
  subtitle: string | null;
  contact: string | null;
  href: string;
  vertical?: string | null;
}

const LISTING_STATUSES = ['draft', 'pending', 'under_review', 'approved', 'rejected', 'revision_requested'];
const HELP_STATUSES: Record<InboxStatus, string[]> = {
  new: ['new'], in_progress: ['triaged', 'in_progress', 'waiting_user'], closed: ['closed', 'spam'], escalated: [],
};
const SERVICE_STATUSES: Record<InboxStatus, string[]> = {
  new: ['pending'], in_progress: ['assigned', 'in_progress'], closed: ['completed', 'cancelled'], escalated: [],
};
function storedStatuses(source: InboxSource, bucket: InboxStatus) {
  if (source === 'help_requests') return HELP_STATUSES[bucket];
  if (source === 'service_orders') return SERVICE_STATUSES[bucket];
  const statuses = bucket === 'new' ? LEAD_STATUS_NEW : LEAD_STATUS_BUCKETS[bucket];
  return source === 'listing_applications' ? statuses.filter(status => LISTING_STATUSES.includes(status)) : statuses;
}
export function inboxStatusForStoredValue(source: InboxSource, raw: string | null): InboxStatus | 'other' {
  // Match the server predicates exactly. Domain-specific, padded and differently
  // cased statuses remain visible under All instead of being relabelled New.
  if (raw === null && !['listing_applications', 'help_requests', 'service_orders'].includes(source)) return 'new';
  for (const bucket of ['new', 'closed', 'escalated', 'in_progress'] as const) {
    if (raw !== null && storedStatuses(source, bucket).includes(raw)) return bucket;
  }
  return 'other';
}

export async function fetchInbox(source: InboxSource, page: number, status: InboxStatus | 'all', search = '') {
  const fields: Record<InboxSource, string[]> = {
    help_requests: ['subject', 'topic', 'contact_email', 'contact_phone'],
    service_orders: ['order_number', 'service_name', 'service_name_ru'],
    partner_applications: ['business_name', 'contact_name', 'contact_email', 'business_category'], listing_applications: ['applicant_name', 'applicant_email', 'service_category', 'product_category', 'property_type'],
    consultation_requests: ['name', 'email', 'request_type', 'vertical_id'], nb_leads: ['full_name', 'email', 'phone'], property_inquiries: ['name', 'email', 'phone', 'message'],
  };
  const term = search.trim().replace(/[,%()_*\\"]/g, ' ').trim().slice(0, 120);
  const searchClauses = fields[source].map(field => field + '.ilike.%' + term + '%');
  if ((source === 'help_requests' || source === 'service_orders') && isInboxRequestId(term)) searchClauses.unshift('id.eq.' + term.toLowerCase());
  if (source === 'listing_applications' && ['property', 'service', 'product'].includes(term)) searchClauses.push('listing_type.eq.' + term);
  const text = term ? 'or(' + searchClauses.join(',') + ')' : '';
  const statuses = status === 'all' ? [] : storedStatuses(source, status).filter(Boolean);
  const hasExplicitStatuses = ['listing_applications', 'help_requests', 'service_orders'].includes(source);
  if (status !== 'all' && hasExplicitStatuses && statuses.length === 0) return { items: [] as InboxItem[], total: 0 };
  const state = status === 'all' ? '' : 'or(status.in.(' + statuses.join(',') + ')' + (status === 'new' && !hasExplicitStatuses ? ',status.is.null,status.eq.""' : '') + ')';
  const expression = state && text ? 'and(' + state + ',' + text + ')' : state || text;
  const filter = <T,>(apply: (expression: string) => T, all: () => T) => expression ? apply(expression) : all();
  const start = Math.max(0, page) * 50;
  if (source === 'help_requests') {
    // The canonical Help table predates generated types. RLS remains authoritative.
    const query = typedFrom('help_requests').select('id,status,created_at,subject,topic,urgency', { count: 'exact' });
    const { data, count, error } = await (expression ? query.or(expression) : query)
      .order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, start + 49) as {
        data: { id: string; status: string; created_at: string; subject: string | null; topic: string; urgency: string }[] | null;
        count: number | null;
        error: unknown;
      };
    if (error) throw error;
    if (count === null) throw new Error('Application count unavailable');
    return {
      items: (data ?? []).map((row): InboxItem => ({
        id: row.id, source: 'help_requests', rawStatus: row.status,
        status: inboxStatusForStoredValue('help_requests', row.status),
        createdAt: row.created_at, title: row.subject || row.topic,
        subtitle: row.topic, contact: null, href: inboxRequestHref('help_requests', row.id),
        vertical: row.urgency,
      })),
      total: count,
    };
  }
  if (source === 'service_orders') {
    // Exclude unrelated stay/staff orders. The operator queue is a read-only
    // projection of marketplace requests, under the existing admin gate and RLS.
    const query = supabase.from('service_orders')
      .select('id, status, created_at, service_type, order_number, service_name', { count: 'exact' })
      .eq('service_type', MARKETPLACE_SERVICE_TYPE);
    const { data, count, error } = await (expression ? query.or(expression) : query)
      .order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, start + 49);
    if (error) throw error;
    if (count === null) throw new Error('Application count unavailable');
    if (data?.some(row => row.service_type !== MARKETPLACE_SERVICE_TYPE)) throw new Error('Request type mismatch');
    return {
      items: (data ?? []).map((row): InboxItem => ({
        id: row.id, source, rawStatus: row.status,
        status: inboxStatusForStoredValue(source, row.status),
        createdAt: row.created_at, title: row.service_name,
        subtitle: row.order_number, contact: null, href: inboxRequestHref(source, row.id),
      })),
      total: count,
    };
  }
  const absent = Promise.resolve({ data: [], count: 0, error: null });
  const [partners, listings, consults, nbLeads, propertyInq] = await Promise.all([
    source === 'partner_applications' ? filter(expression => supabase.from('partner_applications').select('id, status, created_at, business_name, contact_name, contact_email, business_category', { count: 'exact' }).or(expression), () => supabase.from('partner_applications').select('id, status, created_at, business_name, contact_name, contact_email, business_category', { count: 'exact' })).order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, start + 49) : absent,
    source === 'listing_applications' ? filter(expression => supabase.from('listing_applications').select('id, status, created_at, applicant_name, applicant_email, listing_type, service_category, product_category, property_type, city', { count: 'exact' }).or(expression), () => supabase.from('listing_applications').select('id, status, created_at, applicant_name, applicant_email, listing_type, service_category, product_category, property_type, city', { count: 'exact' })).order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, start + 49) : absent,
    source === 'consultation_requests' ? filter(expression => supabase.from('consultation_requests').select('id, status, created_at, name, email, request_type, vertical_id', { count: 'exact' }).or(expression), () => supabase.from('consultation_requests').select('id, status, created_at, name, email, request_type, vertical_id', { count: 'exact' })).order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, start + 49) : absent,
    source === 'nb_leads' ? filter(expression => supabase.from('nb_leads').select('id, status, created_at, full_name, email, phone, project_id', { count: 'exact' }).or(expression), () => supabase.from('nb_leads').select('id, status, created_at, full_name, email, phone, project_id', { count: 'exact' })).order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, start + 49) : absent,
    source === 'property_inquiries' ? filter(expression => supabase.from('property_inquiries').select('id, status, created_at, name, email, phone, property_id, message', { count: 'exact' }).or(expression), () => supabase.from('property_inquiries').select('id, status, created_at, name, email, phone, property_id, message', { count: 'exact' })).order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, start + 49) : absent,
  ]);

  const selected = { partner_applications: partners, listing_applications: listings, consultation_requests: consults, nb_leads: nbLeads, property_inquiries: propertyInq }[source];
  if (selected.error) throw selected.error;
  if (selected.count === null) throw new Error('Application count unavailable');
  const items: InboxItem[] = [];

  for (const r of partners.data ?? []) {
    items.push({
      id: r.id, source: 'partner_applications',
      rawStatus: r.status || 'new', status: inboxStatusForStoredValue('partner_applications', r.status),
      createdAt: r.created_at!, title: r.business_name || r.contact_name || 'Partner',
      subtitle: r.business_category || null,
      contact: r.contact_email || null,
      href: inboxRequestHref('partner_applications', r.id),
      vertical: r.business_category,
    });
  }
  for (const r of listings.data ?? []) {
    items.push({
      id: r.id, source: 'listing_applications',
      rawStatus: r.status || 'new', status: inboxStatusForStoredValue('listing_applications', r.status),
      createdAt: r.created_at!, title: r.applicant_name || `Listing ${r.listing_type}`,
      subtitle: r.service_category || r.product_category || r.property_type || r.listing_type,
      contact: r.applicant_email || null,
      href: inboxRequestHref('listing_applications', r.id),
      vertical: r.listing_type,
    });
  }
  for (const r of consults.data ?? []) {
    items.push({
      id: r.id, source: 'consultation_requests',
      rawStatus: r.status || 'new', status: inboxStatusForStoredValue('consultation_requests', r.status),
      createdAt: r.created_at!, title: r.name || 'Consultation',
      subtitle: r.request_type || r.vertical_id,
      contact: r.email || null,
      href: inboxRequestHref('consultation_requests', r.id),
      vertical: r.vertical_id,
    });
  }
  for (const r of nbLeads.data ?? []) {
    items.push({
      id: r.id, source: 'nb_leads',
      rawStatus: r.status || 'new', status: inboxStatusForStoredValue('nb_leads', r.status),
      createdAt: r.created_at!, title: r.full_name || 'Newbuild lead',
      subtitle: r.project_id ? `Project ${r.project_id.slice(0, 8)}` : null,
      contact: r.email || r.phone || null,
      href: inboxRequestHref('nb_leads', r.id),
    });
  }
  for (const r of propertyInq.data ?? []) {
    items.push({
      id: r.id, source: 'property_inquiries',
      rawStatus: r.status || 'new', status: inboxStatusForStoredValue('property_inquiries', r.status),
      createdAt: r.created_at!, title: r.name || 'Property inquiry',
      subtitle: r.message ? r.message.slice(0, 80) : null,
      contact: r.email || r.phone || null,
      href: inboxRequestHref('property_inquiries', r.id),
    });
  }

  return { items: items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)), total: selected.count };
}


export function nextHelpInboxStatus(status: unknown): 'in_progress' | 'closed' | null {
  if (status === 'new') return 'in_progress';
  if (status === 'triaged' || status === 'in_progress' || status === 'waiting_user') return 'closed';
  return null;
}

export async function updateHelpInboxStatus(id: string, expectedStatus: string) {
  const status = nextHelpInboxStatus(expectedStatus);
  if (!status || !isInboxRequestId(id)) throw new Error('Invalid Help request transition');
  // Compare-and-set against the same canonical row; the database still checks RLS.
  // No internal notes, reassignment or outbound action are part of this transition.
  const { data, error } = await typedFrom('help_requests')
    .update({ status })
    .eq('id', id)
    .eq('status', expectedStatus)
    .select('id,status')
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  if (data.id !== id || data.status !== status) throw new Error('Help request update could not be confirmed');
  return true;
}
