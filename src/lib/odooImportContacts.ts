/**
 * ODOO contact import — parsing, cleaning, mapping for Contact__res_partner___7_.xlsx format.
 * Columns: Complete Name, Phone, Email, Salesperson, Activities, City, Country, Tags
 */

export const ODOO_COLUMNS = [
  'Complete Name',
  'Phone',
  'Email',
  'Salesperson',
  'Activities',
  'City',
  'Country',
  'Tags',
] as const;

const COMPANY_INDICATORS = [
  'Co.', 'Ltd', 'LLC', 'Corp', 'Partners', 'Capital', 'Fund', 'Group', 'Bank',
  'Investment', 'Estate', 'Office', 'Pte', 'Inc', 'SA', 'BV', 'GmbH', 'Holdings',
];

const TAG_MAPPING: Record<string, { tag: string; lifecycle_stage?: string; contact_type?: string }> = {
  'capital markets': { tag: 'capital_markets', lifecycle_stage: 'lead' },
  'family office': { tag: 'family_office', contact_type: 'investor' },
  'investors': { tag: 'investor', lifecycle_stage: 'lead' },
  'tenant': { tag: 'tenant' },
  'clients': { tag: 'client', lifecycle_stage: 'customer' },
  'rent': { tag: 'rental' },
  'gulf area': { tag: 'gulf_area' },
};

function isCompanyName(name: string): boolean {
  const lower = name.toLowerCase();
  return COMPANY_INDICATORS.some((ind) => lower.includes(ind.toLowerCase()));
}

function parseName(name: string): { first_name: string; last_name: string; is_company: boolean; company_name?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { first_name: '—', last_name: '', is_company: false };

  const isCompany = isCompanyName(trimmed);
  if (isCompany) {
    return {
      first_name: trimmed,
      last_name: '',
      is_company: true,
      company_name: trimmed,
    };
  }

  const parts = trimmed.split(/\s+/);
  const first = parts[0] || '—';
  const last = parts.slice(1).join(' ') || '';
  return { first_name: first, last_name: last, is_company: false };
}

export function normalizePhone(raw: string): string | null {
  let s = (raw || '').replace(/[\s-()]/g, '');
  if (!s) return null;
  s = s.replace(/\D/g, '');
  if (s.length < 7) return null;
  if (s.startsWith('0') && s.length >= 9 && s.length <= 10) {
    s = '66' + s.slice(1);
  }
  return '+' + s;
}

export function normalizeEmail(raw: string): string | null {
  const s = (raw || '').trim().toLowerCase();
  if (!s || !s.includes('@') || !s.includes('.')) return null;
  return s;
}

function parseTags(raw: string): string[] {
  return (raw || '')
    .split(/[,;|]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function applyTagMapping(tags: string[]): { tags: string[]; lifecycle_stage?: string; contact_type?: string } {
  const outTags: string[] = [];
  let lifecycleStage: string | undefined;
  let contactType: string | undefined;

  for (const t of tags) {
    const mapped = TAG_MAPPING[t];
    if (mapped) {
      outTags.push(mapped.tag);
      if (mapped.lifecycle_stage) lifecycleStage = mapped.lifecycle_stage;
      if (mapped.contact_type) contactType = mapped.contact_type;
    } else {
      outTags.push(t.replace(/\s+/g, '_'));
    }
  }

  return { tags: [...new Set(outTags)], lifecycle_stage: lifecycleStage, contact_type: contactType };
}

function isTestRecord(name: string): boolean {
  const lower = name.toLowerCase();
  return /^(test|demo|sample|example|foo|bar)$/.test(lower) || lower.includes('test@');
}

export interface OdooRow {
  'Complete Name'?: string;
  'Phone'?: string;
  'Email'?: string;
  'Salesperson'?: string;
  'Activities'?: string;
  'City'?: string;
  'Country'?: string;
  'Tags'?: string;
  [key: string]: string | undefined;
}

export interface CleanedOdooContact {
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  address_city: string | null;
  address_country: string | null;
  tags: string[];
  contact_type: string | null;
  lifecycle_stage: string | null;
  is_company: boolean;
  company_name: string | null;
  salesperson_name?: string;
  rowIndex: number;
  skipReason?: string;
}

export interface OdooImportStats {
  total: number;
  toImport: number;
  toUpdate: number;
  skipped: number;
  skipReasons: Record<string, number>;
}

function getRowVal(row: Record<string, string>, ...keys: string[]): string {
  const rowKeys = Object.keys(row);
  const lowerMap = Object.fromEntries(rowKeys.map((k) => [k.toLowerCase().trim(), k]));
  for (const key of keys) {
    const v = row[key] ?? row[lowerMap[key.toLowerCase().trim()]] ?? '';
    if (v && String(v).trim()) return String(v).trim();
  }
  return '';
}

export function cleanOdooRow(row: Record<string, string>, rowIndex: number): CleanedOdooContact | null {
  const name = getRowVal(row, 'Complete Name', 'Name', 'name', 'contact name', 'display_name');
  const phoneRaw = getRowVal(row, 'Phone', 'phone', 'Phone/Mobile', 'telephone', 'mobile');
  const emailRaw = getRowVal(row, 'Email', 'email');
  const city = getRowVal(row, 'City', 'city');
  const country = getRowVal(row, 'Country', 'country', 'country_id');
  const tagsRaw = getRowVal(row, 'Tags', 'tags');

  if (!name) return null;

  if (isTestRecord(name)) {
    return {
      first_name: name,
      last_name: '',
      phone: null,
      email: null,
      address_city: null,
      address_country: null,
      tags: [],
      contact_type: null,
      lifecycle_stage: null,
      is_company: false,
      company_name: null,
      rowIndex,
      skipReason: 'Test record',
    };
  }

  const phone = normalizePhone(phoneRaw);
  const email = normalizeEmail(emailRaw);

  if (!phone && !email) {
    return {
      first_name: name,
      last_name: '',
      phone: null,
      email: null,
      address_city: null,
      address_country: null,
      tags: [],
      contact_type: null,
      lifecycle_stage: null,
      is_company: false,
      company_name: null,
      rowIndex,
      skipReason: 'No phone or email',
    };
  }

  const parsedName = parseName(name);
  const rawTags = parseTags(tagsRaw);
  const { tags, lifecycle_stage, contact_type } = applyTagMapping(rawTags);

  return {
    first_name: parsedName.first_name,
    last_name: parsedName.last_name,
    phone,
    email,
    address_city: city || null,
    address_country: country || null,
    tags,
    contact_type: contact_type ?? null,
    lifecycle_stage: lifecycle_stage ?? 'lead',
    is_company: parsedName.is_company,
    company_name: parsedName.company_name ?? null,
    salesperson_name: getRowVal(row, 'Salesperson', 'salesperson', 'user_id') || undefined,
    rowIndex,
  };
}

export function processOdooRows(rows: Record<string, string>[]): {
  contacts: CleanedOdooContact[];
  toImport: CleanedOdooContact[];
  skipped: CleanedOdooContact[];
  stats: OdooImportStats;
} {
  const all: CleanedOdooContact[] = [];
  const toImport: CleanedOdooContact[] = [];
  const skipped: CleanedOdooContact[] = [];
  const skipReasons: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const cleaned = cleanOdooRow(rows[i], i + 1);
    if (!cleaned) continue;
    all.push(cleaned);

    if (cleaned.skipReason) {
      skipped.push(cleaned);
      skipReasons[cleaned.skipReason] = (skipReasons[cleaned.skipReason] || 0) + 1;
    } else {
      toImport.push(cleaned);
    }
  }

  return {
    contacts: all,
    toImport,
    skipped,
    stats: {
      total: rows.length,
      toImport: toImport.length,
      toUpdate: 0,
      skipped: skipped.length,
      skipReasons,
    },
  };
}

export function toImportPayload(
  c: CleanedOdooContact,
  salespersonToUserId?: (name: string) => string | null
): Record<string, unknown> {
  const linked_user_id = c.salesperson_name && salespersonToUserId
    ? salespersonToUserId(c.salesperson_name)
    : null;
  return {
    first_name: c.first_name,
    last_name: c.last_name,
    phone: c.phone,
    email: c.email,
    address_city: c.address_city,
    address_country: c.address_country,
    tags: c.tags.length > 0 ? c.tags : null,
    contact_type: c.contact_type,
    lifecycle_stage: c.lifecycle_stage,
    is_company: c.is_company,
    company_name: c.company_name,
    linked_user_id,
  };
}
