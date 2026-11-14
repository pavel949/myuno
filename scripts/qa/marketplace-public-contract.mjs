// Read-only anonymous production contract check. Never sends orders or private queries.
import { readFile } from 'node:fs/promises';
const config = await readFile(new URL('../../vite.config.ts', import.meta.url), 'utf8');
const url = 'https://kakkwibljrjsawxgnupk.supabase.co';
if (!config.includes(url)) throw Error('Expected production public configuration not found');
const key = config.match(/eyJ[A-Za-z0-9_.-]{50,}/)?.[0] ?? config.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
if (!key) throw Error('Public application key not found; no requests sent');
const headers = { apikey: key, Authorization: `Bearer ${key}` };
async function publicRead(table, params) {
  const endpoint = new URL(`${url}/rest/v1/${table}`);
  endpoint.search = new URLSearchParams(params).toString();
  const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw Error(`${table}: HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw Error(`${table}: invalid public response`);
  return data;
}
const services = await publicRead('public_service_catalog', {
  select: 'id,provider_id,name_en,name_ru,description_en,description_ru,price,currency,duration_minutes,images,lead_time_hours,is_active,approval_status,unit,pricing_model,provider,location:locations(district)',
  is_active: 'eq.true', approval_status: 'eq.approved', provider_id: 'not.is.null', order: 'created_at.desc', limit: '60',
});
const ids = [...new Set(services.map(service => service.provider_id))];
const providerRows = ids.length ? await publicRead('public_provider_catalog', {
  select: 'id,name,rating,is_verified,review_count,coverage_areas,is_demo', id: `in.(${ids.join(',')})`, limit: '60',
}) : [];
const providers = new Map(providerRows.map(provider => [provider.id, provider]));
const visible = services.filter(service => providers.has(service.provider_id) && providers.get(service.provider_id).is_demo !== true);
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), mode: 'anonymous-public-read-only', projectionContract: 'passed', approvedServiceRows: services.length,
  linkedProviderIds: ids.length, visiblePublicProviders: providerRows.length, demoProviders: providerRows.filter(provider => provider.is_demo === true).length,
  unpublishedOrInvisibleLinkedProviders: ids.filter(id => !providers.has(id)).length, nonDemoOffers: visible.length,
  embeddedProviderMissing: services.filter(service => !service.provider).length,
  offersWithRecordedPhoto: visible.filter(service => service.images?.length).length,
  offersWithRecordedLocation: visible.filter(service => service.location?.district).length,
  offersWithReviewEvidence: visible.filter(service => (providers.get(service.provider_id)?.review_count ?? 0) > 0).length,
  requiresProviderSupply: visible.length === 0,
}, null, 2));
