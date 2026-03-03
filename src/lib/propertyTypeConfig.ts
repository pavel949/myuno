/**
 * Property-type-aware labels and field visibility
 * Single Source of Truth for adapting the UI to condo vs villa vs house etc.
 */

const STANDALONE_TYPES = ['villa', 'house', 'townhouse'];
const MULTI_UNIT_TYPES = ['apartment', 'condo', 'studio', 'penthouse'];

export function isStandaloneType(propertyType?: string): boolean {
  return STANDALONE_TYPES.includes(propertyType || '');
}

export function isMultiUnitType(propertyType?: string): boolean {
  return MULTI_UNIT_TYPES.includes(propertyType || '') || !propertyType;
}

interface TypeAwareLabels {
  areaLabel: string;
  areaLabelRu: string;
  specsTitle: string;
  specsTitleRu: string;
  projectLabel: string;
  projectLabelRu: string;
  /** Show floor / unit number fields */
  showFloorUnit: boolean;
  /** Show plot size / pool / garden fields prominently */
  showLandFeatures: boolean;
}

export function getTypeAwareLabels(propertyType?: string): TypeAwareLabels {
  const standalone = isStandaloneType(propertyType);

  return {
    areaLabel: standalone ? 'Living Area (m²)' : 'Area (m²)',
    areaLabelRu: standalone ? 'Жилая площадь (м²)' : 'Площадь (м²)',
    specsTitle: standalone ? 'Property & Land' : 'Unit Details',
    specsTitleRu: standalone ? 'Объект и участок' : 'Квартира',
    projectLabel: standalone ? 'Village / Estate' : 'Project / Complex',
    projectLabelRu: standalone ? 'Посёлок / Комплекс' : 'Проект / ЖК',
    showFloorUnit: !standalone,
    showLandFeatures: standalone,
  };
}

/**
 * Returns a short spec string for property cards, adapting to type.
 * Condo: "Floor 5 · Unit 12A"
 * Villa: "Plot 400m² · Private Pool"
 */
export function getTypeSpecBadges(
  propertyType: string | undefined,
  data: {
    floor?: number;
    unitNumber?: string;
    plotSizeSqm?: number;
    poolType?: string;
    totalFloors?: number;
  },
  isRu: boolean
): string[] {
  const badges: string[] = [];
  const standalone = isStandaloneType(propertyType);

  if (standalone) {
    if (data.plotSizeSqm) {
      badges.push(`${isRu ? 'Участок' : 'Plot'} ${data.plotSizeSqm}м²`);
    }
    if (data.totalFloors && data.totalFloors > 1) {
      badges.push(`${data.totalFloors} ${isRu ? 'этажей' : 'floors'}`);
    }
    if (data.poolType && data.poolType !== 'none' && data.poolType !== 'shared') {
      const poolLabels: Record<string, string> = {
        private: isRu ? 'Частный бассейн' : 'Private Pool',
        infinity: isRu ? 'Инфинити-бассейн' : 'Infinity Pool',
        plunge: isRu ? 'Плунж-бассейн' : 'Plunge Pool',
      };
      badges.push(poolLabels[data.poolType] || data.poolType);
    }
  } else {
    if (data.floor) {
      badges.push(`${isRu ? 'Этаж' : 'Floor'} ${data.floor}`);
    }
    if (data.unitNumber) {
      badges.push(`${isRu ? '№' : '#'}${data.unitNumber}`);
    }
  }

  return badges;
}
