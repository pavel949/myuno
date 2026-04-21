/**
 * useMyDocuments — unified personal-documents view for /me/documents.
 *
 * Aggregates three myUNO ID tables into a single normalized list:
 *   - user_passports         → identity
 *   - user_visa_status       → immigration
 *   - user_documents_vault   → general vault (TM30, contracts, taxes…)
 *
 * Each entry exposes a normalized expiry status (ok / expiring / expired)
 * so the UI can render a single uniform card grid.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type DocCategory =
  | 'passport'
  | 'visa'
  | 'work_permit'
  | 'tm30'
  | 'contract'
  | 'title_deed'
  | 'tax_filing'
  | 'bank_statement'
  | 'medical'
  | 'insurance'
  | 'poa'
  | 'other';

export type DocExpiryStatus = 'ok' | 'expiring' | 'expired' | 'unknown';

export interface MyDocument {
  id: string;
  source: 'passport' | 'visa' | 'vault';
  category: DocCategory;
  title: string;
  subtitle?: string;
  fileUrl?: string | null;
  expiryDate?: string | null;
  expiryStatus: DocExpiryStatus;
  verified?: boolean;
}

function classifyExpiry(expiry?: string | null): DocExpiryStatus {
  if (!expiry) return 'unknown';
  const days = (new Date(expiry).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return 'expired';
  if (days < 90) return 'expiring';
  return 'ok';
}

async function fetchDocs(userId: string): Promise<MyDocument[]> {
  const out: MyDocument[] = [];

  try {
    const { data } = await supabase
      .from('user_passports')
      .select('id, holder_name, passport_number, nationality, expiry_date, scan_url, verified_at')
      .eq('user_id', userId);
    for (const r of data ?? []) {
      out.push({
        id: `passport-${r.id}`,
        source: 'passport',
        category: 'passport',
        title: r.holder_name as string,
        subtitle: `${r.nationality} · ${(r.passport_number as string)?.slice(-4).padStart(8, '•')}`,
        fileUrl: r.scan_url as string | null,
        expiryDate: r.expiry_date as string | null,
        expiryStatus: classifyExpiry(r.expiry_date as string | null),
        verified: !!r.verified_at,
      });
    }
  } catch { /* silent */ }

  try {
    const { data } = await supabase
      .from('user_visa_status')
      .select('id, visa_type, visa_subtype, expiry_date, document_url, is_current')
      .eq('user_id', userId)
      .eq('is_current', true);
    for (const r of data ?? []) {
      out.push({
        id: `visa-${r.id}`,
        source: 'visa',
        category: 'visa',
        title: r.visa_type as string,
        subtitle: (r.visa_subtype as string) ?? undefined,
        fileUrl: r.document_url as string | null,
        expiryDate: r.expiry_date as string | null,
        expiryStatus: classifyExpiry(r.expiry_date as string | null),
      });
    }
  } catch { /* silent */ }

  try {
    const { data } = await supabase
      .from('user_documents_vault')
      .select('id, category, title, description, file_url, expiry_date')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('uploaded_at', { ascending: false });
    for (const r of data ?? []) {
      out.push({
        id: `vault-${r.id}`,
        source: 'vault',
        category: (r.category as DocCategory) ?? 'other',
        title: r.title as string,
        subtitle: (r.description as string) ?? undefined,
        fileUrl: r.file_url as string | null,
        expiryDate: r.expiry_date as string | null,
        expiryStatus: classifyExpiry(r.expiry_date as string | null),
      });
    }
  } catch { /* silent */ }

  return out;
}

export function useMyDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['me-documents', user?.id ?? null],
    queryFn: () => (user ? fetchDocs(user.id) : Promise.resolve([] as MyDocument[])),
    enabled: !!user,
    staleTime: 60_000,
  });
}
