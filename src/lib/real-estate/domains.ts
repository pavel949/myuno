/**
 * Real-estate domain model — single source of truth for the three linkable
 * data levels. Read this before adding any table, hook or screen that touches
 * developers, projects or units.
 *
 *   LEVEL 1 · DEVELOPER   `developers`
 *        │                company/brand entity (126 rows). Never stores units.
 *        ▼  property_projects.developer_id
 *   LEVEL 2 · PROJECT     `property_projects`
 *        │                newbuild complex, villa development, off-plan phase.
 *        ▼  properties.project_id · project_units.project_id · resale_properties.development_id
 *   LEVEL 3 · UNIT        `properties` (listing) · `project_units` (sales inventory)
 *                         `resale_properties` (secondary market)
 *
 * Rules
 *  1. A unit NEVER stores `developer_id` — the developer is derived through its
 *     project. Use `v_real_estate_domain_chain` (or `useRealEstateDomainChain`)
 *     instead of denormalising.
 *  2. `property_complexes` and `development_units` are deprecated duplicates of
 *     level 2 / level 3. Read-only for legacy screens; never add new writers.
 *  3. A unit with `project_id = null` is a standalone listing (single villa,
 *     private condo resale). That is valid, but it must be visible in admin as
 *     "needs linking" so the catalogue stays traceable.
 */

/** The three canonical domain levels. */
export type RealEstateDomainLevel = 'developer' | 'project' | 'unit';

/** Unit-level tables surfaced by `v_real_estate_domain_chain.unit_source`. */
export type UnitSource =
  | 'properties'
  | 'project_units'
  | 'development_units'
  | 'resale_properties';

export interface DomainTableInfo {
  table: string;
  level: RealEstateDomainLevel;
  /** What this table owns; empty for deprecated duplicates. */
  role: string;
  /** Column linking this table to its parent level, if any. */
  parentLink?: { column: string; references: string };
  status: 'canonical' | 'deprecated';
  /** Replacement to use when `status === 'deprecated'`. */
  useInstead?: string;
}

/**
 * Table ownership map. Keep this in sync with the SQL COMMENTs on the tables —
 * both are checked during real-estate reviews.
 */
export const REAL_ESTATE_DOMAIN_TABLES: DomainTableInfo[] = [
  {
    table: 'developers',
    level: 'developer',
    role: 'Developer/company profile, verification, track record.',
    status: 'canonical',
  },
  {
    table: 'property_projects',
    level: 'project',
    role: 'Project/development: phases, juristic person, unit mix, ClearView grade.',
    parentLink: { column: 'developer_id', references: 'developers.id' },
    status: 'canonical',
  },
  {
    table: 'property_complexes',
    level: 'project',
    role: '',
    status: 'deprecated',
    useInstead: 'property_projects',
  },
  {
    table: 'properties',
    level: 'unit',
    role: 'Public listing for a rentable/sellable unit (condo, villa, house).',
    parentLink: { column: 'project_id', references: 'property_projects.id' },
    status: 'canonical',
  },
  {
    table: 'project_units',
    level: 'unit',
    role: 'Sales inventory for a project unit: availability, holds, sold-to.',
    parentLink: { column: 'project_id', references: 'property_projects.id' },
    status: 'canonical',
  },
  {
    table: 'resale_properties',
    level: 'unit',
    role: 'Secondary-market unit: asking price, assignment premium, ROI.',
    parentLink: { column: 'development_id', references: 'property_projects.id' },
    status: 'canonical',
  },
  {
    table: 'development_units',
    level: 'unit',
    role: '',
    status: 'deprecated',
    useInstead: 'project_units',
  },
];

export const UNIT_SOURCE_LABELS: Record<UnitSource, { en: string; ru: string }> = {
  properties: { en: 'Listing', ru: 'Листинг' },
  project_units: { en: 'Sales inventory', ru: 'Инвентарь продаж' },
  development_units: { en: 'Legacy developer unit', ru: 'Устаревший юнит застройки' },
  resale_properties: { en: 'Resale', ru: 'Вторичка' },
};

export const DOMAIN_LEVEL_LABELS: Record<RealEstateDomainLevel, { en: string; ru: string }> = {
  developer: { en: 'Developer', ru: 'Застройщик' },
  project: { en: 'Project', ru: 'Проект' },
  unit: { en: 'Unit', ru: 'Юнит' },
};

export const deprecatedDomainTables = () =>
  REAL_ESTATE_DOMAIN_TABLES.filter((t) => t.status === 'deprecated');

export const canonicalUnitSources: UnitSource[] = [
  'properties',
  'project_units',
  'resale_properties',
];
