/**
 * OFFPLAN-compatible catalogue facets stored in property_projects.offplan_catalog
 * See github.com/pavel949/OFFPLAN lib/types CatalogProject
 */
export type RecLabel = 'BUY' | 'WATCH' | 'AVOID';

export interface OffplanCatalogFacet {
  legacy_id?: number;
  rec?: RecLabel;
  seg?: string;
  zone?: string;
  type?: string;
  beach?: string;
  own?: string;
  mgmt?: string;
  focus?: string;
  st_k?: string;
  tags?: string[];
  /** Original catalogue rating (legacy UI) */
  rating?: number;
  comp_y?: number;
  comp_q?: string;
  min_br?: number;
}

export type OffplanSortKey =
  | 'score'
  | 'price_asc'
  | 'price_desc'
  | 'completion'
  | 'yield'
  | 'risk'
  | 'beach'
  | 'rating';

export interface OffplanUiFilterState {
  q: string;
  fRec: '' | RecLabel;
  fSeg: string;
  fZone: string;
  fRisk: string;
  fYear: string;
  fBeach: string;
  fOwn: string;
  fMgmt: string;
  fFocus: string;
  fDev: string;
  fSort: OffplanSortKey;
}

export function defaultOffplanUiFilterState(): OffplanUiFilterState {
  return {
    q: '',
    fRec: '',
    fSeg: '',
    fZone: '',
    fRisk: '',
    fYear: '',
    fBeach: '',
    fOwn: '',
    fMgmt: '',
    fFocus: '',
    fDev: '',
    fSort: 'score',
  };
}
