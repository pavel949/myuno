import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  normalizeOfferings,
  providerEligibility,
  resolveProviderOrg,
  type Offering,
  type OrgResolution,
  type ProviderRow,
} from '@/lib/services/serviceBookingModel';

export type CatalogueState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'inactive'; provider: ProviderRow }
  | { status: 'error'; message: string }
  | { status: 'empty'; provider: ProviderRow; org: OrgResolution }
  | { status: 'ready'; provider: ProviderRow; offerings: Offering[]; org: OrgResolution };

/**
 * Loads one provider and its active services for booking.
 * State resets on every provider change; responses for a stale provider are ignored.
 */
export function useServiceBookingCatalogue(providerId: string | null | undefined): CatalogueState {
  const [state, setState] = useState<CatalogueState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState(providerId ? { status: 'loading' } : { status: 'missing' });
    if (!providerId) return;

    (async () => {
      try {
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id, name, logo_url, business_category, is_active, approval_status, is_demo')
          .eq('id', providerId)
          .maybeSingle();
        if (providerError) throw providerError;
        if (cancelled) return;

        const eligibility = providerEligibility(provider as ProviderRow | null);
        if (eligibility === 'missing') { setState({ status: 'missing' }); return; }
        if (eligibility === 'inactive') { setState({ status: 'inactive', provider: provider as ProviderRow }); return; }

        const { data: rows, error: servicesError } = await supabase
          .from('services')
          .select('id, name_en, name_ru, price, currency, is_active')
          .eq('provider_id', providerId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (servicesError) throw servicesError;
        if (cancelled) return;

        const { data: links, error: linkError } = await supabase
          .from('provider_org_links')
          .select('org_id')
          .eq('provider_id', providerId);
        if (linkError) throw linkError;
        if (cancelled) return;
        const org = resolveProviderOrg((links ?? []).map((l) => l.org_id));
        const { offerings } = normalizeOfferings(rows);
        setState(
          offerings.length === 0
            ? { status: 'empty', provider: provider as ProviderRow, org }
            : { status: 'ready', provider: provider as ProviderRow, offerings, org },
        );
      } catch (err: unknown) {
        if (cancelled) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : 'catalogue_load_failed' });
      }
    })();

    return () => { cancelled = true; };
  }, [providerId]);

  return state;
}
