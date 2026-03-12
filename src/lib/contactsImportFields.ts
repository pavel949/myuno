/**
 * Config for CRM contact import: all mappable fields with RU/EN labels.
 * Used by ContactImportPage, ContactImportSheet, and Admin Data Import.
 * Aliases include Odoo res.partner and Google Contacts column names.
 */
export interface ContactImportFieldConfig {
  key: string;
  labelEn: string;
  labelRu: string;
  required: boolean;
}

export const CONTACT_IMPORT_FIELDS: ContactImportFieldConfig[] = [
  { key: 'first_name', labelEn: 'First Name', labelRu: 'Имя', required: true },
  { key: 'last_name', labelEn: 'Last Name', labelRu: 'Фамилия', required: true },
  { key: 'phone', labelEn: 'Phone', labelRu: 'Телефон', required: false },
  { key: 'phone2', labelEn: 'Phone 2', labelRu: 'Телефон 2', required: false },
  { key: 'mobile', labelEn: 'Mobile', labelRu: 'Мобильный', required: false },
  { key: 'email', labelEn: 'Email', labelRu: 'Email', required: false },
  { key: 'whatsapp', labelEn: 'WhatsApp', labelRu: 'WhatsApp', required: false },
  { key: 'telegram', labelEn: 'Telegram', labelRu: 'Telegram', required: false },
  { key: 'line_id', labelEn: 'Line ID', labelRu: 'Line ID', required: false },
  { key: 'contact_type', labelEn: 'Type', labelRu: 'Тип контакта', required: false },
  { key: 'source', labelEn: 'Source', labelRu: 'Источник', required: false },
  { key: 'company_name', labelEn: 'Company', labelRu: 'Компания', required: false },
  { key: 'job_title', labelEn: 'Job Title', labelRu: 'Должность', required: false },
  { key: 'website', labelEn: 'Website', labelRu: 'Сайт', required: false },
  { key: 'facebook', labelEn: 'Facebook', labelRu: 'Facebook', required: false },
  { key: 'instagram', labelEn: 'Instagram', labelRu: 'Instagram', required: false },
  { key: 'linkedin', labelEn: 'LinkedIn', labelRu: 'LinkedIn', required: false },
  { key: 'address_street', labelEn: 'Address', labelRu: 'Адрес', required: false },
  { key: 'address_street2', labelEn: 'Address 2', labelRu: 'Адрес 2', required: false },
  { key: 'address_city', labelEn: 'City', labelRu: 'Город', required: false },
  { key: 'address_state', labelEn: 'State/Region', labelRu: 'Регион', required: false },
  { key: 'address_zip', labelEn: 'ZIP', labelRu: 'Индекс', required: false },
  { key: 'address_country', labelEn: 'Country', labelRu: 'Страна', required: false },
  { key: 'birthday', labelEn: 'Birthday', labelRu: 'День рождения', required: false },
  { key: 'nationality', labelEn: 'Nationality', labelRu: 'Гражданство', required: false },
  { key: 'language', labelEn: 'Language', labelRu: 'Язык', required: false },
  { key: 'notes', labelEn: 'Notes', labelRu: 'Заметки', required: false },
  { key: 'tags', labelEn: 'Tags', labelRu: 'Теги', required: false },
  { key: 'special_notes', labelEn: 'Special Notes', labelRu: 'Особые заметки', required: false },
  { key: 'lifecycle_stage', labelEn: 'Lifecycle Stage', labelRu: 'Стадия', required: false },
  { key: 'currency', labelEn: 'Currency', labelRu: 'Валюта', required: false },
  { key: 'budget_min', labelEn: 'Budget Min', labelRu: 'Бюджет от', required: false },
  { key: 'budget_max', labelEn: 'Budget Max', labelRu: 'Бюджет до', required: false },
  { key: 'bedrooms_min', labelEn: 'Bedrooms Min', labelRu: 'Спален от', required: false },
  { key: 'tax_id', labelEn: 'Tax ID / VAT', labelRu: 'ИНН / НДС', required: false },
];

/** Keys that are required for a valid contact row (at least one of first_name or last_name in practice). */
export const CONTACT_IMPORT_REQUIRED_KEYS = CONTACT_IMPORT_FIELDS.filter((f) => f.required).map((f) => f.key);

/**
 * Alias map for auto-mapping column names to field keys.
 * Supports: plain field names, Odoo res.partner, Google Contacts CSV export.
 *
 * Google Contacts uses "Phone 1 - Value", "E-mail 1 - Value", "Address 1 - Street", etc.
 * Normalized (lowercased, no special chars) these become "phone1value", "email1value",
 * "address1street", etc. We add these as high-priority aliases.
 *
 * IMPORTANT: "Phone 1 - Type" columns contain labels ("Mobile", "Home") — NOT data.
 * These are excluded via HEADER_BLACKLIST_PATTERNS below.
 */
export const CONTACT_IMPORT_ALIASES: Record<string, string[]> = {
  first_name: [
    'firstname', 'first', 'givenname', 'имя', 'prénom',
    'contactname', 'displayname', 'first_name', 'name',
  ],
  last_name: [
    'lastname', 'last', 'surname', 'фамилия', 'family',
    'familyname', 'last_name', 'additionalname',
  ],
  phone: [
    'phone1value', 'phone', 'tel', 'telephone', 'телефон',
    'моб', 'номер', 'phonenumber', 'primaryphone',
  ],
  phone2: [
    'phone2value', 'phone2', 'tel2', 'телефон2', 'telephone2',
  ],
  mobile: [
    'phone3value', 'mobile', 'cell', 'мобильный', 'mobilephone', 'cellphone',
  ],
  email: [
    'email1value', 'emailvalue', 'email', 'mail', 'почта',
    'емейл', 'correo', 'emailaddress', 'primaryemail',
  ],
  whatsapp: ['whatsapp', 'wa', 'ватсап'],
  telegram: ['telegram', 'tg', 'телеграм'],
  line_id: ['line', 'lineid', 'line_id'],
  contact_type: ['contacttype', 'тип', 'типконтакта', 'partnertype'],
  source: ['source', 'источник', 'откуда', 'leadsource', 'source_id', 'referral'],
  company_name: [
    'organization1name', 'organizationname', 'company', 'companyname',
    'компания', 'организация', 'org', 'parent_id', 'parentname', 'company_id',
  ],
  job_title: [
    'organization1title', 'organizationtitle', 'jobtitle', 'position',
    'должность', 'function', 'jobposition', 'job_title',
  ],
  website: [
    'website1value', 'websitevalue', 'website', 'url', 'site', 'сайт', 'website_url',
  ],
  facebook: ['facebook', 'fb'],
  instagram: ['instagram', 'ig'],
  linkedin: ['linkedin'],
  address_street: [
    'address1street', 'address1formatted', 'addressstreet',
    'street', 'адрес', 'улица', 'streetaddress', 'addressline1',
  ],
  address_street2: [
    'address1pobox', 'address1extendedaddress',
    'address2', 'street2', 'addressline2',
  ],
  address_city: ['address1city', 'city', 'город', 'town'],
  address_state: ['address1region', 'state', 'state_id', 'region', 'province'],
  address_zip: [
    'address1postalcode', 'zip', 'postal', 'индекс',
    'postcode', 'zipcode', 'postalcode',
  ],
  address_country: [
    'address1country', 'country', 'страна', 'countrycode',
    'country_id', 'countryname',
  ],
  birthday: [
    'birthday', 'dob', 'dateofbirth', 'др', 'деньрождения',
    'birthdate', 'date_of_birth',
  ],
  nationality: ['nationality', 'гражданство', 'nation', 'countryoforigin'],
  language: ['language', 'lang', 'язык', 'locale'],
  notes: [
    'notes', 'note', 'заметки', 'comment', 'comments',
    'комментарий', 'internalnotes', 'description', 'remarks',
  ],
  tags: ['groupmembership', 'tags', 'tag', 'labels', 'теги', 'метки'],
  special_notes: ['specialnotes', 'особыезаметки', 'special_notes', 'additionalnotes'],
  lifecycle_stage: [
    'lifecyclestage', 'stage', 'стадия', 'этап', 'lifecycle',
    'lifecycle_stage', 'leadstage',
  ],
  currency: ['currency', 'валюта', 'curr', 'currency_id'],
  budget_min: ['budgetmin', 'budget_min', 'бюджетот', 'minbudget'],
  budget_max: ['budgetmax', 'budget_max', 'бюджетдо', 'maxbudget'],
  bedrooms_min: ['bedrooms', 'bedroomsmin', 'спален', 'спаленот', 'bedrooms_min'],
  tax_id: ['vat', 'taxid', 'tax_id', 'inn', 'taxnumber', 'nds'],
};

/**
 * Normalized header substrings that should NEVER be auto-mapped to data fields.
 * Google Contacts exports "Phone 1 - Type", "E-mail 1 - Type", "Address 1 - Type"
 * which contain labels ("Mobile", "Home", "Work") — not actual data.
 */
export const HEADER_BLACKLIST_PATTERNS = ['type'];
