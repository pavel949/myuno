import { describe, expect, it } from 'vitest';
import { P23_PROPERTY_OWNER } from '../personas/P23_PROPERTY_OWNER';
import { P21_PROVIDERS } from '../personas/P21_PROVIDERS';
import { P22_DEVELOPER_PARTNER } from '../personas/P22_DEVELOPER_PARTNER';
import { P8_PASSIVE_INVESTORS } from '../personas/P8_PASSIVE_INVESTORS';
import { P11_MN_INVESTORS } from '../personas/P11_MN_INVESTORS';
import { getPersonaTheme } from '@/lib/landings/personaTheme';
import { getBundleForPersona } from '@/lib/segmentation/bundles';

// Published persona copy must not turn a fixed example into an agreed
// commercial term, a verified payment route, or an assured investment return.
describe('Persona commercial introductions', () => {
 it('keeps owner management and deposit terms individually agreed', () => {
  const copy = JSON.stringify(P23_PROPERTY_OWNER);
  expect(copy).not.toMatch(/\$25|15%|8[–-]15%|5[–-]8%|First month free|первый месяц бесплатно|within 7 days|в течение 7 дней/i);
  expect(P23_PROPERTY_OWNER.subtitle.en).toContain('agreed individually');
  expect(P23_PROPERTY_OWNER.primaryCta.href).toBe('/owner/onboarding');
 });

 it('does not promise weekly provider payouts or contradict subscription tools', () => {
  const terms = JSON.stringify({ services: P21_PROVIDERS.services, faq: P21_PROVIDERS.faq, seo: P21_PROVIDERS.seo });
  expect(terms).not.toMatch(/every 7|7.day payout|каждые 7|No subscriptions|Никаких подписок/);
  expect(P21_PROVIDERS.primaryCta.href).toBe('/vendor/onboarding');
 });

 it('does not quote developer assessment fees or guaranteed qualified lead counts from literals', () => {
  const copy = JSON.stringify(P22_DEVELOPER_PARTNER);
  expect(copy).not.toMatch(/350[–-]600K|120[–-]180K|15K\/|800\+|5[–-]10%|3[–-]8%|within 5 minutes|за 5 минут/);
  expect(P22_DEVELOPER_PARTNER.primaryCta.href).toBe('/developer-portal/apply');
 });

 it('does not say investors never pay fees or assign the screening price to a different report', () => {
  const terms = JSON.stringify(P8_PASSIVE_INVESTORS.faq);
  expect(terms).not.toMatch(/investor pays no commission|Инвестор не платит комиссию|4,900|990\/|5[–-]7%|3[–-]5%/);
  expect(terms).toContain('Confirm current terms');
 });

 it('does not imply a verified foreign quota, USD rental currency or fixed yield for every listed property', () => {
  const copy = JSON.stringify({ subtitle: P11_MN_INVESTORS.subtitle, services: P11_MN_INVESTORS.services });
  expect(copy).not.toMatch(/6[–-]8%|verified foreign quota|quota подтверждён|STR properties with USD income/);
  expect(P11_MN_INVESTORS.subtitle.en).toContain('specific property');
 });
});

it.each(['property-owner', 'passive-investors', 'developer-partner'])('keeps %s orientation separate from invented proof or return promises', slug => {
 const proof = JSON.stringify(getPersonaTheme(slug).proof);
 expect(proof).not.toMatch(/4\.9|1,200|1 200|24\/7|5[–-]8%|300\+|500\+|no hidden fees|без комиссий/);
});

it('preserves the canonical P8 bundle for its actual investment audience', () => {
 const bundle = getBundleForPersona('P8');
 expect(bundle?.name.en).toBe('Investor Due Diligence');
 expect(bundle?.price.en).toBe('฿7,500');
 expect(P23_PROPERTY_OWNER.personaCode).toBe('P8');
});
