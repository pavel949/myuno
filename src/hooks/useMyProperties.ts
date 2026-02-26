/**
 * @module useMyProperties
 * @description Unified hook combining owned + managed properties
 */

import { useMemo } from 'react';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { useAssignedProperties, type AssignedProperty } from '@/hooks/useAssignedProperties';
import { useUserContext } from '@/hooks/useUserContext';

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
  source: 'owned' | 'managed';
  complex_id: string | null;
  project_id: string | null;
  property_type: string | null;
}

export function useMyProperties() {
  const { hasRole } = useUserContext();
  const isOwner = hasRole('owner') || hasRole('property_owner');
  const isManager = hasRole('property_manager');

  const { data: ownedRaw, isLoading: ownedLoading } = useOwnerProperties();
  const { properties: managedRaw, isLoading: managedLoading } = useAssignedProperties();

  const ownedProperties = useMemo<UnifiedProperty[]>(() => {
    if (!ownedRaw) return [];
    return ownedRaw.map(p => ({
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
    }));
  }, [ownedRaw]);

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
      property_type: (p as any).property_type || null,
    }));
  }, [managedRaw]);

  // Deduplicate: if a property appears in both owned and managed, keep owned
  const allProperties = useMemo(() => {
    const ownedIds = new Set(ownedProperties.map(p => p.property_id));
    const uniqueManaged = managedProperties.filter(p => !ownedIds.has(p.property_id));
    return [...ownedProperties, ...uniqueManaged];
  }, [ownedProperties, managedProperties]);

  const accessRole: PropertyAccessRole = useMemo(() => {
    const hasOwned = ownedProperties.length > 0 || isOwner;
    const hasManaged = managedProperties.length > 0 || isManager;
    if (hasOwned && hasManaged) return 'both';
    if (hasManaged) return 'manager';
    if (hasOwned) return 'owner';
    return 'owner'; // default fallback when user has neither role yet
  }, [ownedProperties, managedProperties, isOwner, isManager]);

  return {
    ownedProperties,
    managedProperties,
    allProperties,
    accessRole,
    isLoading: ownedLoading || managedLoading,
    isOwner,
    isManager,
    hasProperties: allProperties.length > 0,
  };
}
