/**
 * @module useMyProperties
 * @description Unified hook combining owned + managed + company properties
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { useAssignedProperties, type AssignedProperty } from '@/hooks/useAssignedProperties';
import { useUserContext } from '@/hooks/useUserContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useAuth } from '@/contexts/AuthContext';

export type PropertyAccessRole = 'owner' | 'manager' | 'both';

export interface UnifiedProperty {
  id: string;
  property_id: string;
  title: string;
  title_ru: string;
  cover_image: string | null;
  address: string | null;
  district: string | null;
  is_active: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  price_per_night: number | null;
  currency: string;
  source: 'owned' | 'managed' | 'company';
  complex_id: string | null;
  project_id: string | null;
  property_type: string | null;
  asset_class: 'residential' | 'commercial' | 'land' | null;
  lat: number | null;
  lng: number | null;
  approval_status: string | null;
}

/**
 * Fetch properties belonging to the user's active management company.
 */
function useCompanyProperties() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  return useQuery({
    queryKey: ['company-properties', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, title, cover_image, images, address, district, is_active, bedrooms, bathrooms, price_per_night, currency, complex_id, project_id, property_type, asset_class, deposit_currency, lat, lng, approval_status, deleted_at')
        .eq('management_company_id', companyId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!companyId,
    staleTime: 30000,
  });
}

export function useMyProperties() {
  const { hasRole } = useUserContext();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id || null;
  const isOwner = hasRole('owner');
  const isManager = hasRole('property_manager');

  const { data: ownedRaw, isLoading: ownedLoading } = useOwnerProperties();
  const { properties: managedRaw, isLoading: managedLoading } = useAssignedProperties();
  const { data: companyRaw, isLoading: companyLoading } = useCompanyProperties();

  // When an active MC is selected, only show properties belonging to that MC
  const isInMCMode = !!activeCompanyId;

  const ownedProperties = useMemo<UnifiedProperty[]>(() => {
    if (!ownedRaw) return [];
    // In MC mode, only show owned properties that belong to the active company
    const filtered = isInMCMode
      ? ownedRaw.filter(p => p.management_company_id === activeCompanyId)
      : ownedRaw;
    return filtered.map(p => ({
        id: p.id,
        property_id: p.id,
        title: p.title_en || p.title || 'Untitled',
        title_ru: p.title_ru || p.title_en || p.title || 'Без названия',
        cover_image: p.cover_image || p.images?.[0] || null,
        address: p.address || null,
        district: p.district || null,
        is_active: p.is_active ?? true,
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        price_per_night: p.price_per_night ?? null,
        currency: p.deposit_currency || 'THB',
        source: 'owned' as const,
        complex_id: p.complex_id || null,
        project_id: p.project_id || null,
        property_type: p.property_type || null,
        asset_class: ((p as { asset_class?: string }).asset_class as UnifiedProperty['asset_class']) || 'residential',
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        approval_status: p.approval_status || null,
      }));
  }, [ownedRaw, isInMCMode, activeCompanyId]);

  const managedProperties = useMemo<UnifiedProperty[]>(() => {
    return managedRaw.map(p => ({
      id: p.id,
      property_id: p.property_id,
      title: p.title,
      title_ru: p.title_ru,
      cover_image: p.cover_image,
      address: p.address,
      district: p.district,
      is_active: p.is_active,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      price_per_night: p.price_per_night,
      currency: p.currency,
      source: 'managed' as const,
      complex_id: p.complex_id || null,
      project_id: p.project_id || null,
      property_type: 'property_type' in p ? (p as AssignedProperty & { property_type?: string | null }).property_type || null : null,
      asset_class: 'asset_class' in p ? ((p as AssignedProperty & { asset_class?: string }).asset_class as UnifiedProperty['asset_class']) || 'residential' : 'residential',
      lat: 'lat' in p ? (p as any).lat ?? null : null,
      lng: 'lng' in p ? (p as any).lng ?? null : null,
      approval_status: 'approval_status' in p ? (p as any).approval_status || null : null,
    }));
  }, [managedRaw]);

  const companyProperties = useMemo<UnifiedProperty[]>(() => {
    if (!companyRaw) return [];
    return companyRaw.map((p) => ({
      id: p.id,
      property_id: p.id,
      title: p.title_en || p.title || 'Untitled',
      title_ru: p.title_ru || p.title_en || p.title || 'Без названия',
      cover_image: p.cover_image || p.images?.[0] || null,
      address: p.address || null,
      district: p.district || null,
      is_active: p.is_active ?? true,
      bedrooms: p.bedrooms ?? null,
      bathrooms: p.bathrooms ?? null,
      price_per_night: p.price_per_night ?? null,
      currency: p.deposit_currency || p.currency || 'THB',
      source: 'company' as const,
      complex_id: p.complex_id || null,
      project_id: p.project_id || null,
      property_type: p.property_type || null,
      asset_class: ((p as { asset_class?: string }).asset_class as UnifiedProperty['asset_class']) || 'residential',
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      approval_status: p.approval_status || null,
    }));
  }, [companyRaw]);

  // Deduplicate: owned > managed > company
  const allProperties = useMemo(() => {
    const seen = new Set<string>();
    const result: UnifiedProperty[] = [];
    for (const p of ownedProperties) {
      seen.add(p.property_id);
      result.push(p);
    }
    for (const p of managedProperties) {
      if (!seen.has(p.property_id)) {
        seen.add(p.property_id);
        result.push(p);
      }
    }
    for (const p of companyProperties) {
      if (!seen.has(p.property_id)) {
        seen.add(p.property_id);
        result.push(p);
      }
    }
    return result;
  }, [ownedProperties, managedProperties, companyProperties]);

  const activeProperties = useMemo(
    () => allProperties.filter((p) => p.is_active),
    [allProperties]
  );

  const accessRole: PropertyAccessRole = useMemo(() => {
    const hasOwned = ownedProperties.length > 0 || isOwner;
    const hasManaged = managedProperties.length > 0 || companyProperties.length > 0 || isManager;
    if (hasOwned && hasManaged) return 'both';
    if (hasManaged) return 'manager';
    if (hasOwned) return 'owner';
    return 'owner';
  }, [ownedProperties, managedProperties, companyProperties, isOwner, isManager]);

  return {
    ownedProperties,
    managedProperties,
    companyProperties,
    allProperties,
    activeProperties,
    accessRole,
    isLoading: ownedLoading || managedLoading || companyLoading,
    isOwner,
    isManager,
    hasProperties: allProperties.length > 0,
  };
}
