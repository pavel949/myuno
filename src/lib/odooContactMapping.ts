/**
 * Odoo res.partner <-> myUNO crm_contacts field mapping.
 * Use this for import (Odoo CSV -> myUNO) and export (myUNO -> Odoo-compatible CSV).
 *
 * Odoo res.partner: name, email, phone, mobile, street, street2, city, state_id, zip,
 *   country_id, website, comment, function, parent_id, ref, lang, vat, birthdate, etc.
 */

export type MyUnoContactField =
  | 'first_name'
  | 'last_name'
  | 'phone'
  | 'phone2'
  | 'mobile'
  | 'email'
  | 'whatsapp'
  | 'telegram'
  | 'line_id'
  | 'contact_type'
  | 'source'
  | 'company_name'
  | 'job_title'
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'address_street'
  | 'address_street2'
  | 'address_city'
  | 'address_state'
  | 'address_zip'
  | 'address_country'
  | 'birthday'
  | 'nationality'
  | 'language'
  | 'notes'
  | 'special_notes'
  | 'lifecycle_stage'
  | 'currency'
  | 'budget_min'
  | 'budget_max'
  | 'bedrooms_min'
  | 'tax_id';

/** Odoo res.partner technical field names (CSV export with technical names) */
export const ODOO_PARTNER_FIELDS = [
  'name',
  'firstname',
  'lastname',
  'email',
  'phone',
  'mobile',
  'street',
  'street2',
  'city',
  'state_id',
  'zip',
  'country_id',
  'website',
  'comment',
  'function',
  'parent_id',
  'ref',
  'lang',
  'vat',
  'birthdate',
  'company_type',
] as const;

/**
 * Map Odoo res.partner field (technical or common label) -> myUNO crm_contacts field.
 * Multiple Odoo names can map to one myUNO field (e.g. "Comment" and "comment" -> notes).
 */
export const ODOO_TO_MYUNO: Record<string, MyUnoContactField> = {
  // Name: Odoo often has single "name"; we map to first_name for import (last name can be set separately or from name split)
  name: 'first_name',
  contact_name: 'first_name',
  display_name: 'first_name',
  firstname: 'first_name',
  first_name: 'first_name',
  lastname: 'last_name',
  last_name: 'last_name',
  surname: 'last_name',
  // Contact
  email: 'email',
  phone: 'phone',
  telephone: 'phone',
  mobile: 'mobile',
  // Address (Odoo technical names)
  street: 'address_street',
  street2: 'address_street2',
  address: 'address_street',
  city: 'address_city',
  state_id: 'address_state',
  state: 'address_state',
  zip: 'address_zip',
  postal: 'address_zip',
  country_id: 'address_country',
  country: 'address_country',
  // Web & social
  website: 'website',
  website_url: 'website',
  comment: 'notes',
  notes: 'notes',
  description: 'notes',
  internal_notes: 'notes',
  function: 'job_title',
  job_position: 'job_title',
  job_title: 'job_title',
  parent_id: 'company_name',
  company: 'company_name',
  company_name: 'company_name',
  parent_name: 'company_name',
  ref: 'notes', // Odoo internal ref -> we can append to notes or ignore
  lang: 'language',
  language: 'language',
  vat: 'tax_id',
  tax_id: 'tax_id',
  birthdate: 'birthday',
  birthday: 'birthday',
  date_of_birth: 'birthday',
};

/**
 * Map myUNO crm_contacts field -> preferred Odoo res.partner export column name.
 * Used when exporting from myUNO for re-import into Odoo.
 */
export const MYUNO_TO_ODOO: Record<MyUnoContactField, string> = {
  first_name: 'firstname',
  last_name: 'lastname',
  phone: 'phone',
  phone2: 'phone',
  mobile: 'mobile',
  email: 'email',
  whatsapp: 'mobile', // Odoo has one mobile; map WhatsApp to mobile if no mobile
  telegram: 'comment', // or custom channel; we put in comment for visibility
  line_id: 'comment',
  contact_type: 'comment', // or custom field in Odoo
  source: 'comment',
  company_name: 'parent_id',
  job_title: 'function',
  website: 'website',
  facebook: 'comment',
  instagram: 'comment',
  linkedin: 'comment',
  address_street: 'street',
  address_street2: 'street2',
  address_city: 'city',
  address_state: 'state_id',
  address_zip: 'zip',
  address_country: 'country_id',
  birthday: 'birthdate',
  nationality: 'comment',
  language: 'lang',
  notes: 'comment',
  special_notes: 'comment',
  lifecycle_stage: 'comment',
  currency: 'comment',
  budget_min: 'comment',
  budget_max: 'comment',
  bedrooms_min: 'comment',
  tax_id: 'vat',
};

/** Odoo CSV column headers (EN) commonly seen when exporting Contacts — for import auto-mapping */
export const ODOO_IMPORT_ALIASES: Record<MyUnoContactField, string[]> = {
  first_name: ['name', 'contact name', 'firstname', 'first name', 'first_name', 'given name', 'prénom'],
  last_name: ['lastname', 'last name', 'last_name', 'surname', 'family name'],
  phone: ['phone', 'telephone', 'tel', 'phone number'],
  phone2: ['phone2', 'phone 2', 'telephone 2'],
  mobile: ['mobile', 'mobile phone', 'cell', 'cell phone'],
  email: ['email', 'e-mail', 'email address'],
  whatsapp: ['whatsapp', 'wa'],
  telegram: ['telegram', 'tg'],
  line_id: ['line', 'line id', 'line_id'],
  contact_type: ['type', 'contact type', 'contact_type', 'partner type'],
  source: ['source', 'lead source', 'source_id', 'referral'],
  company_name: ['company', 'company name', 'parent_id', 'parent name', 'company_id', 'organisation'],
  job_title: ['function', 'job position', 'job title', 'job_title', 'position', 'title'],
  website: ['website', 'website url', 'url', 'site'],
  facebook: ['facebook', 'fb'],
  instagram: ['instagram', 'ig'],
  linkedin: ['linkedin'],
  address_street: ['street', 'address', 'street address', 'address line 1'],
  address_street2: ['street2', 'street 2', 'address line 2', 'address2'],
  address_city: ['city', 'town'],
  address_state: ['state', 'state_id', 'region', 'province'],
  address_zip: ['zip', 'postal', 'postal code', 'postcode', 'zip code'],
  address_country: ['country', 'country_id', 'country name'],
  birthday: ['birthdate', 'birthday', 'date of birth', 'dob'],
  nationality: ['nationality', 'country of origin'],
  language: ['lang', 'language', 'locale'],
  notes: ['comment', 'notes', 'internal notes', 'description', 'remarks'],
  special_notes: ['special notes', 'special_notes', 'additional notes'],
  lifecycle_stage: ['lifecycle', 'lifecycle_stage', 'stage', 'lead stage'],
  currency: ['currency', 'currency_id'],
  budget_min: ['budget min', 'budget_min', 'min budget'],
  budget_max: ['budget max', 'budget_max', 'max budget'],
  bedrooms_min: ['bedrooms', 'bedrooms_min', 'bedrooms min'],
  tax_id: ['vat', 'tax id', 'tax_id', 'inn', 'tax number'],
};

/**
 * Convert a flat Odoo-style CSV row (keys = Odoo column names) to myUNO contact payload keys.
 * Only includes keys that exist in the row and have a mapping.
 */
export function odooRowToMyUnoKeys(odooRow: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  const lowerKeys = Object.keys(odooRow).reduce<Record<string, string>>((acc, k) => {
    acc[k.toLowerCase().trim().replace(/\s+/g, '_')] = k;
    return acc;
  }, {});

  for (const [odooKey, myunoKey] of Object.entries(ODOO_TO_MYUNO)) {
    const normalized = odooKey.toLowerCase().replace(/\s+/g, '_');
    const sourceKey = lowerKeys[normalized] ?? lowerKeys[odooKey];
    if (sourceKey != null && odooRow[sourceKey] != null && String(odooRow[sourceKey]).trim() !== '') {
      out[myunoKey] = String(odooRow[sourceKey]).trim();
    }
  }
  return out;
}
