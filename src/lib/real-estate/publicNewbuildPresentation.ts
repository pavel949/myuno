import { pickLang } from '@/lib/i18n/pickLang';
/**
 * Temporary, owner-approved public presentation restriction while project
 * construction/performance facts lack field-level provenance. Never mutates
 * inventory, changes eligibility, or judges a particular project's truth.
 * Keep this boundary shared by API projections and persisted comparison items.
 */
export function projectStartingPrice(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

export function publicNewbuildPresentation<T extends object>(project: T) {
  // price_from is the existing THB field edited by the project CMS. Never
  // resurrect its legacy alias after an editor clears or corrects it.
  const amount = projectStartingPrice('price_from' in project ? project.price_from : 'priceFrom' in project ? project.priceFrom : null);
  return {
    ...project,
    priceFrom: amount, priceTo: null, price_from: amount, price_to: null,
    price_from_thb: null, price_to_thb: null, price_usd: null, price_per_sqm: null,
    projectStatus: null, project_status: null,
    completionDate: null, completion_date: null,
    constructionProgress: null, construction_progress: null,
    unitsAvailable: null, unitsSold: null, units_available: null, units_sold: null,
    roiProjected: null, roi_projected: null,
    riskLevel: null, risk_level: null,
    yieldEstimate: null, yield_estimate: null,
    muunoScore: null, muuno_score: null, developerScore: null,
    fundingGoal: null, funding_goal: null, amountRaised: null,
    minInvestment: null, min_investment: null, min_price_per_sqm: null,
    investmentEnabled: false, investment_enabled: false,
    isClearviewRated: false, is_clearview_rated: false,
    offplanCatalog: null, offplan_catalog: null,
    payment_plan: null, commission_pct: null,
  };
}

/** Public newbuild unit prices/statuses follow the same presentation hold. */
export function publicNewbuildUnit<T extends object>(unit: T) {
  return { ...unit, price: null, price_thb: null, price_per_sqm: null,
    asking_price_thb: null, asking_price_usd: null,
    status: null, unit_status: null, available_units: null };
}

/** Existing metadata columns only; public requests need not retrieve withheld
 * commercial facts. Private editing continues to use its original projection. */
export const PUBLIC_NEWBUILD_COLUMNS = `id, slug, name_en, name_ru, tagline,
  description_en, description_ru, cover_image, gallery_urls, images, video_url,
  location_area, district, address, lat, lng, unit_types, total_units, price_from,
  is_featured, is_approved, developer_id, developer_name, amenities, created_at,
  management_company_id, contact_id, ownership_types, landing_enabled, og_image_url`;

export function projectStartingPriceText(value: unknown, language: string): string {
  const amount = projectStartingPrice(value);
  const locale = language === 'ru' ? 'ru' : language === 'th' ? 'th' : 'en';
  const ru = locale === 'ru', th = locale === 'th';
  if (amount == null) return pickLang(locale, { ru: 'Цена уточняется', en: 'Price to be confirmed', th: 'อยู่ระหว่างยืนยันราคา' });
  const number = new Intl.NumberFormat(ru ? 'ru-RU' : th ? 'th-TH' : 'en-US', { maximumFractionDigits: 2 }).format(amount);
  return `${pickLang(locale, { ru: 'от', en: 'From', th: 'เริ่มต้น' })} ${number} THB · ${pickLang(locale, { ru: 'Цена требует уточнения', en: 'Price requires confirmation', th: 'ต้องยืนยันราคา' })}`;
}
