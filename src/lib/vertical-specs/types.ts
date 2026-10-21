/**
 * Vertical Specification Framework — Wave 0 foundation
 *
 * One spec per industry (restaurant, property, salon, …) describes:
 *  - onboarding steps (industry-specific)
 *  - listing editor fields (tabs + sections + field defs)
 *  - catalog filter facets
 *  - detail-page sections
 *  - quality-score rules (best-practice checklist)
 *
 * Used by: VerticalWizard, ListingEditor, FilterPanel, DetailRenderer.
 */

export type LocalizedText = { en: string; ru: string };

export type FieldType =
  | 'text'
  | 'textarea'
  | 'i18n_text'         // requires RU + EN
  | 'i18n_textarea'
  | 'number'
  | 'currency_thb'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'tags'
  | 'address'           // Google Places
  | 'hours'             // weekly schedule
  | 'media_gallery'
  | 'media_single'
  | 'video_url'
  | 'phone'
  | 'email'
  | 'url'
  | 'date'
  | 'daterange'
  | 'license_upload';   // file + license number

export interface FieldOption {
  value: string;
  label: LocalizedText;
  icon?: string;
}

export interface FieldSpec {
  key: string;                    // e.g. "cuisine_types" → stored at attributes.cuisine_types
  label: LocalizedText;
  hint?: LocalizedText;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];        // for select/multiselect/tags
  min?: number;
  max?: number;
  step?: number;
  placeholder?: LocalizedText;
  /** dotted path inside the row, e.g. "attributes.cuisine_types" or "name" */
  path: string;
  /** show only if predicate true */
  showIf?: { key: string; equals: unknown };
  /** weight in quality-score (0-100 sum across all fields). Optional. */
  qualityWeight?: number;
}

export interface FieldGroup {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  fields: FieldSpec[];
}

export type EditorTabId =
  | 'basics'
  | 'location'
  | 'media'
  | 'details'
  | 'pricing'
  | 'policies'
  | 'booking'
  | 'menu'        // restaurants
  | 'units'       // property
  | 'staff'       // salons/clinics
  | 'compliance'
  | 'seo'
  | 'quality';

export interface EditorTab {
  id: EditorTabId;
  title: LocalizedText;
  groups: FieldGroup[];
}

export type FilterType =
  | 'enum'
  | 'range'
  | 'bool'
  | 'distance'
  | 'daterange'
  | 'text'
  | 'sort';

export interface FilterSpec {
  key: string;                    // URL param + attribute path
  label: LocalizedText;
  type: FilterType;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;                  // ฿, m², km
  /** how to map filter to Supabase query (interpreted by FilterPanel runtime) */
  queryHint?: {
    column?: string;              // e.g. "attributes" + jsonbPath
    jsonbPath?: string;           // e.g. "cuisine_types"
    operator?: 'eq' | 'in' | 'contains' | 'gte' | 'lte' | 'between';
  };
}

export interface OnboardingStep {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  groups: FieldGroup[];
  /** which editor tab/fields this maps to */
  mapsToTab?: EditorTabId;
}

export interface QualityRule {
  id: string;
  label: LocalizedText;
  weight: number;                 // 0-100 sum across rules must equal 100
  /** evaluator key — interpreted by quality-score engine */
  check:
    | { kind: 'field_present'; path: string }
    | { kind: 'field_i18n_complete'; path: string }
    | { kind: 'media_min'; path: string; min: number }
    | { kind: 'array_min'; path: string; min: number }
    | { kind: 'has_value'; path: string };
}

export interface DetailSection {
  id: string;
  title?: LocalizedText;
  /** renderer key — DetailRenderer switches on this */
  render:
    | 'hero'
    | 'description'
    | 'amenities'
    | 'gallery'
    | 'map'
    | 'hours'
    | 'menu'
    | 'pricing'
    | 'reviews'
    | 'policies'
    | 'staff'
    | 'units'
    | 'cta';
  showIf?: { key: string; equals: unknown };
}

export interface VerticalSpec {
  id: string;                     // e.g. "restaurant"
  label: LocalizedText;
  /** Supabase source. listings.<vertical> OR a dedicated table */
  storage:
    | { kind: 'listings_vertical'; vertical: string }
    | { kind: 'dedicated_table'; table: string };
  /** which content cluster this lives under per Master Taxonomy v1.0 */
  surface: 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build';
  icon?: string;
  /** Industry standard references shown in admin/help */
  references?: string[];

  onboarding: OnboardingStep[];
  editorTabs: EditorTab[];
  filters: FilterSpec[];
  detail: DetailSection[];
  quality: QualityRule[];

  /** approval workflow */
  requiresApproval: boolean;
}
