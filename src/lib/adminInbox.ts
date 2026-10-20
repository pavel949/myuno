import { supabase } from '@/integrations/supabase/client';
import { LEAD_STATUS_BUCKETS, LEAD_STATUS_NEW, type InboxStatusBucket } from '@/config/leadStatus';

export type InboxSource = 'partner_applications' | 'listing_applications' | 'consultation_requests' | 'nb_leads' | 'property_inquiries';

export type InboxStatus = InboxStatusBucket;

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
function storedStatuses(source: InboxSource, bucket: InboxStatus) {
  const statuses = bucket === 'new' ? LEAD_STATUS_NEW : LEAD_STATUS_BUCKETS[bucket];
  return source === 'listing_applications' ? statuses.filter(status => LISTING_STATUSES.includes(status)) : statuses;
}
export function inboxStatusForStoredValue(source: InboxSource, raw: string | null): InboxStatus | 'other' {
  // Match the server predicates exactly. Domain-specific, padded and differently
  // cased statuses remain visible under All instead of being relabelled New.
  if (raw === null && source !== 'listing_applications') return 'new';
  for (const bucket of ['new', 'closed', 'escalated', 'in_progress'] as const) {
    if (raw !== null && storedStatuses(source, bucket).includes(raw)) return bucket;
  }
  return 'other';
}

export async function fetchInbox(source: InboxSource, page: number, status: InboxStatus | 'all', search = '') {
  const fields: Record<InboxSource, string[]> = {
    partner_applications: ['business_name', 'contact_name', 'contact_email', 'business_category'], listing_applications: ['applicant_name', 'applicant_email', 'service_category', 'product_category', 'property_type'],
    consultation_requests: ['name', 'email', 'request_type', 'vertical_id'], nb_leads: ['full_name', 'email', 'phone'], property_inquiries: ['name', 'email', 'phone', 'message'],
  };
  const term = search.trim().replace(/[,%()_*\\"]/g, ' ').trim().slice(0, 120);
  const searchClauses = fields[source].map(field => field + '.ilike.%' + term + '%');
  if (source === 'listing_applications' && ['property', 'service', 'product'].includes(term)) searchClauses.push('listing_type.eq.' + term);
  const text = term ? 'or(' + searchClauses.join(',') + ')' : '';
  const statuses = status === 'all' ? [] : storedStatuses(source, status).filter(Boolean);
  if (status !== 'all' && source === 'listing_applications' && statuses.length === 0) return { items: [] as InboxItem[], total: 0 };
  const state = status === 'all' ? '' : 'or(status.in.(' + statuses.join(',') + ')' + (status === 'new' && source !== 'listing_applications' ? ',status.is.null,status.eq.""' : '') + ')';
  const expression = state && text ? 'and(' + state + ',' + text + ')' : state || text;
  const filter = <T,>(apply: (expression: string) => T, all: () => T) => expression ? apply(expression) : all();
  const start = Math.max(0, page) * 50;
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
      href: '/admin/partner-applications',
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
      href: '/admin/catalog',
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
      href: '/admin/consultations',
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
      href: '/admin/nb-leads',
    });
  }
  for (const r of propertyInq.data ?? []) {
    items.push({
      id: r.id, source: 'property_inquiries',
      rawStatus: r.status || 'new', status: inboxStatusForStoredValue('property_inquiries', r.status),
      createdAt: r.created_at!, title: r.name || 'Property inquiry',
      subtitle: r.message ? r.message.slice(0, 80) : null,
      contact: r.email || r.phone || null,
      href: '/admin/properties',
    });
  }

  return { items: items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)), total: selected.count };
}

