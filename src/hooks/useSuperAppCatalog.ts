/**
 * Super-App Catalog Hook
 * Aggregates taxonomy data from taxonomy_definitions and lookup_values
 * to build the unified catalog structure
 */

import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaxonomyDefinitions, TaxonomyVertical, VERTICAL_CONFIG } from './useTaxonomyDefinitions';
import { useTaxonomy, TaxonomyOption } from './useTaxonomy';

export interface CatalogItem {
  id: string;
  value: string;
  label: string;
  icon?: string;
  path: string;
  isNew?: boolean;
  isHot?: boolean;
  children?: CatalogItem[];
}

export interface CatalogSection {
  id: string;
  vertical: TaxonomyVertical;
  icon: string;
  nameEn: string;
  nameRu: string;
  path: string;
  children: CatalogItem[];
  hasHierarchy: boolean;
}

// Mapping of verticals to their primary taxonomy types for the catalog
const VERTICAL_CATALOG_CONFIG: Record<TaxonomyVertical, {
  primaryTaxonomy?: string;
  hierarchyParent?: string;
  hierarchyChild?: string;
  path: string;
  queryParam?: string;
}> = {
  yachts: { 
    primaryTaxonomy: 'yacht_type', 
    path: '/yachts',
    queryParam: 'type',
  },
  tours: { 
    primaryTaxonomy: 'tour_type', 
    path: '/tours',
    queryParam: 'type',
  },
  restaurants: { 
    primaryTaxonomy: 'restaurant_cuisine', 
    path: '/restaurants',
    queryParam: 'cuisine',
  },
  home_services: { 
    hierarchyParent: 'home_service_domain',
    hierarchyChild: 'home_service_category',
    path: '/services',
    queryParam: 'category',
  },
  transport: { 
    primaryTaxonomy: 'vehicle_category', 
    path: '/transport',
    queryParam: 'category',
  },
  property: { 
    primaryTaxonomy: 'property_type', 
    path: '/properties',
    queryParam: 'type',
  },
  medical: { 
    primaryTaxonomy: 'clinic_specialty', 
    path: '/medical',
    queryParam: 'specialty',
  },
  salons: { 
    primaryTaxonomy: 'salon_type', 
    path: '/salons',
    queryParam: 'type',
  },
  pets: { 
    primaryTaxonomy: 'pet_type', 
    path: '/pets',
    queryParam: 'type',
  },
  events: { 
    primaryTaxonomy: 'event_category', 
    path: '/events',
    queryParam: 'category',
  },
  general: { 
    path: '/discover',
  },
};

// Vertical display order
const VERTICAL_ORDER: TaxonomyVertical[] = [
  'yachts',
  'tours',
  'restaurants',
  'property',
  'transport',
  'home_services',
  'salons',
  'medical',
  'pets',
  'events',
];

export function useSuperAppCatalog() {
  const { language } = useLanguage();
  const { groupedByVertical, isLoading: isLoadingDefinitions } = useTaxonomyDefinitions();

  // Fetch all taxonomies we need for the catalog
  const yachtTypes = useTaxonomy('yacht_type');
  const tourTypes = useTaxonomy('tour_type');
  const cuisines = useTaxonomy('restaurant_cuisine');
  const propertyTypes = useTaxonomy('property_type');
  const vehicleCategories = useTaxonomy('vehicle_category');
  const serviceDomains = useTaxonomy('home_service_domain');
  const serviceCategories = useTaxonomy('home_service_category');
  const clinicSpecialties = useTaxonomy('clinic_specialty');
  const salonTypes = useTaxonomy('salon_type');
  const petTypes = useTaxonomy('pet_type');
  const eventCategories = useTaxonomy('event_category');

  // Map taxonomy type to data
  const taxonomyDataMap: Record<string, TaxonomyOption[]> = useMemo(() => ({
    yacht_type: yachtTypes.options,
    tour_type: tourTypes.options,
    restaurant_cuisine: cuisines.options,
    property_type: propertyTypes.options,
    vehicle_category: vehicleCategories.options,
    home_service_domain: serviceDomains.options,
    home_service_category: serviceCategories.options,
    clinic_specialty: clinicSpecialties.options,
    salon_type: salonTypes.options,
    pet_type: petTypes.options,
    event_category: eventCategories.options,
  }), [
    yachtTypes.options, tourTypes.options, cuisines.options, propertyTypes.options,
    vehicleCategories.options, serviceDomains.options, serviceCategories.options,
    clinicSpecialties.options, salonTypes.options, petTypes.options, eventCategories.options,
  ]);

  const isLoading = isLoadingDefinitions || 
    yachtTypes.isLoading || tourTypes.isLoading || cuisines.isLoading ||
    propertyTypes.isLoading || vehicleCategories.isLoading || 
    serviceDomains.isLoading || serviceCategories.isLoading ||
    clinicSpecialties.isLoading || salonTypes.isLoading || 
    petTypes.isLoading || eventCategories.isLoading;

  // Build catalog sections
  const catalog = useMemo((): CatalogSection[] => {
    const sections: CatalogSection[] = [];

    for (const vertical of VERTICAL_ORDER) {
      const config = VERTICAL_CATALOG_CONFIG[vertical];
      const verticalConfig = VERTICAL_CONFIG[vertical];
      const definitions = groupedByVertical[vertical] || [];
      
      // Get the main definition for this vertical (first one usually)
      const mainDef = definitions[0];
      const icon = mainDef?.icon || verticalConfig.icon;

      // Build children based on config
      let children: CatalogItem[] = [];
      let hasHierarchy = false;

      if (config.hierarchyParent && config.hierarchyChild) {
        // Two-level hierarchy (e.g., home_services: domain → category)
        hasHierarchy = true;
        const parents = taxonomyDataMap[config.hierarchyParent] || [];
        const allChildren = taxonomyDataMap[config.hierarchyChild] || [];

        children = parents.map(parent => ({
          id: parent.id,
          value: parent.value,
          label: language === 'ru' ? parent.labelRu : parent.labelEn,
          icon: parent.icon,
          path: `${config.path}?domain=${parent.value}`,
          children: allChildren
            .filter(child => child.metadata?.domain === parent.value)
            .map(child => ({
              id: child.id,
              value: child.value,
              label: language === 'ru' ? child.labelRu : child.labelEn,
              icon: child.icon,
              path: `${config.path}?${config.queryParam}=${child.value}`,
            })),
        }));
      } else if (config.primaryTaxonomy) {
        // Simple list
        const options = taxonomyDataMap[config.primaryTaxonomy] || [];
        children = options.map(opt => ({
          id: opt.id,
          value: opt.value,
          label: language === 'ru' ? opt.labelRu : opt.labelEn,
          icon: opt.icon,
          path: `${config.path}?${config.queryParam}=${opt.value}`,
        }));
      }

      // Only add section if it has content or is a main vertical
      if (children.length > 0 || ['yachts', 'tours', 'restaurants', 'property', 'transport', 'home_services'].includes(vertical)) {
        sections.push({
          id: vertical,
          vertical,
          icon,
          nameEn: verticalConfig.labelEn,
          nameRu: verticalConfig.labelRu,
          path: config.path,
          children,
          hasHierarchy,
        });
      }
    }

    return sections;
  }, [groupedByVertical, taxonomyDataMap, language]);

  // Filter function for search
  const filterCatalog = (searchQuery: string): CatalogSection[] => {
    if (!searchQuery.trim()) return catalog;

    const query = searchQuery.toLowerCase();

    return catalog
      .map(section => {
        // Check if section name matches
        const sectionMatches = 
          section.nameEn.toLowerCase().includes(query) ||
          section.nameRu.toLowerCase().includes(query);

        // Filter children
        const filteredChildren = section.children
          .map(child => {
            const childMatches = child.label.toLowerCase().includes(query);
            
            // If this child has nested children, filter them too
            if (child.children) {
              const filteredNestedChildren = child.children.filter(nested =>
                nested.label.toLowerCase().includes(query)
              );
              
              if (childMatches || filteredNestedChildren.length > 0) {
                return {
                  ...child,
                  children: childMatches ? child.children : filteredNestedChildren,
                };
              }
              return null;
            }

            return childMatches ? child : null;
          })
          .filter((child): child is CatalogItem => child !== null);

        // Include section if it matches or has matching children
        if (sectionMatches || filteredChildren.length > 0) {
          return {
            ...section,
            children: sectionMatches ? section.children : filteredChildren,
          };
        }

        return null;
      })
      .filter((section): section is CatalogSection => section !== null);
  };

  return {
    catalog,
    filterCatalog,
    isLoading,
  };
}

// Export for use in quick access components
export function useFeaturedCategories() {
  const { catalog, isLoading } = useSuperAppCatalog();
  const { language } = useLanguage();

  // Get first few items from main verticals for featured display
  const featured = useMemo(() => {
    const result: Array<{
      id: string;
      label: string;
      icon: string;
      path: string;
      vertical: string;
    }> = [];

    // Priority verticals for featured
    const priorityVerticals: TaxonomyVertical[] = [
      'yachts', 'tours', 'restaurants', 'transport', 
      'home_services', 'salons', 'medical', 'property',
    ];

    for (const vertical of priorityVerticals) {
      const section = catalog.find(s => s.vertical === vertical);
      if (section) {
        result.push({
          id: section.id,
          label: language === 'ru' ? section.nameRu : section.nameEn,
          icon: section.icon,
          path: section.path,
          vertical: section.vertical,
        });
      }
      if (result.length >= 8) break;
    }

    return result;
  }, [catalog, language]);

  return { featured, isLoading };
}
