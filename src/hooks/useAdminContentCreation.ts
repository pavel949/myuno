/**
 * useAdminContentCreation - Admin-as-Vendor content creation hook
 * 
 * Provides utilities for creating content on behalf of vendors while
 * maintaining proper attribution and audit trail.
 * 
 * PRINCIPLE: Admin provisions, Vendor owns.
 * - vendor_id: Real owner of the content
 * - created_by_user_id: Admin who created it
 * - created_by_role: 'admin' | 'uno_team'
 * - created_on_behalf: true
 * - status: 'draft' | 'published'
 */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from './useAdmin';

export interface OnBehalfContext {
  isOnBehalf: boolean;
  providerId: string | null;
  providerName?: string;
  adminId: string | null;
  adminRole: 'admin' | 'uno_team';
}

export interface OnBehalfData {
  created_by_uno_team: boolean;
  uno_team_creator_id: string | null;
  approval_status: string;
  is_verified: boolean;
}

/**
 * Hook to detect and handle on-behalf context from URL params
 */
export function useOnBehalfContext(): OnBehalfContext {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();

  const isOnBehalf = searchParams.get('on_behalf') === 'true';
  const providerId = searchParams.get('provider');

  return {
    isOnBehalf: isOnBehalf && isAdmin,
    providerId,
    adminId: user?.id || null,
    adminRole: isAdmin ? 'admin' : 'uno_team',
  };
}

/**
 * Hook to prepare data for admin-created content
 */
export function useAdminContentData() {
  const { user } = useAuth();

  const prepareAdminData = useCallback(<T extends Record<string, unknown>>(
    data: T,
    options?: {
      autoApprove?: boolean;
      autoVerify?: boolean;
    }
  ): T & OnBehalfData => {
    const { autoApprove = true, autoVerify = true } = options || {};

    return {
      ...data,
      created_by_uno_team: true,
      uno_team_creator_id: user?.id || null,
      approval_status: autoApprove ? 'approved' : 'pending',
      is_verified: autoVerify,
    };
  }, [user?.id]);

  return { prepareAdminData };
}

/**
 * Hook for complete admin content creation workflow
 */
export function useAdminContentCreation() {
  const context = useOnBehalfContext();
  const { prepareAdminData } = useAdminContentData();
  const { user } = useAuth();

  /**
   * Prepare entity data for insertion with proper attribution
   */
  const prepareEntityData = useCallback(<T extends Record<string, unknown>>(
    data: T,
    entityConfig: {
      providerIdField?: 'provider_id' | 'vendor_id' | 'owner_id' | 'shop_id';
      autoApprove?: boolean;
      status?: 'draft' | 'published';
    } = {}
  ): T & OnBehalfData & Record<string, unknown> => {
    const { 
      providerIdField = 'provider_id',
      autoApprove = true,
      status = 'published',
    } = entityConfig;

    // Base data with attribution
    const result = prepareAdminData(data, { autoApprove });

    // Add provider ID to correct field
    if (context.providerId) {
      (result as Record<string, unknown>)[providerIdField] = context.providerId;
    }

    // Add is_active based on status
    (result as Record<string, unknown>).is_active = status === 'published';

    return result;
  }, [context.providerId, prepareAdminData]);

  /**
   * Get attribution banner text for UI
   */
  const getAttributionText = useCallback((language: 'en' | 'ru') => {
    if (!context.isOnBehalf) return null;

    return {
      title: language === 'ru' 
        ? 'Создание от имени вендора' 
        : 'Creating on behalf of vendor',
      description: language === 'ru'
        ? 'Контент будет принадлежать вендору. Действия записываются в журнал.'
        : 'Content will be owned by vendor. Actions are logged.',
    };
  }, [context.isOnBehalf]);

  return {
    context,
    prepareEntityData,
    getAttributionText,
    isOnBehalf: context.isOnBehalf,
    providerId: context.providerId,
    adminId: user?.id,
  };
}

/**
 * Type for filter options in admin catalog
 */
export interface AdminCatalogFilters {
  createdByAdmin?: boolean;
  status?: 'all' | 'active' | 'pending' | 'inactive';
  providerId?: string;
}

/**
 * Build Supabase filter query based on admin catalog filters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildAdminCatalogQuery<T extends { eq: (...args: any[]) => T }>(
  query: T,
  filters: AdminCatalogFilters
): T {
  let result = query;

  if (filters.createdByAdmin !== undefined) {
    result = result.eq('created_by_uno_team', filters.createdByAdmin);
  }

  if (filters.status && filters.status !== 'all') {
    switch (filters.status) {
      case 'active':
        result = result.eq('is_active', true);
        break;
      case 'pending':
        result = result.eq('approval_status', 'pending');
        break;
      case 'inactive':
        result = result.eq('is_active', false);
        break;
    }
  }

  if (filters.providerId) {
    result = result.eq('provider_id', filters.providerId);
  }

  return result;
}
