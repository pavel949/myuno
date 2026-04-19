/**
 * Developer API keys for management companies — programmatic access tokens.
 * Keys shown in plaintext only once at creation time.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export interface ApiKey {
  id: string;
  company_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  expires_at: string | null;
}

/** Generate a cryptographically random key in plaintext form: muno_live_<32 hex>. */
function generateKey(): { full: string; prefix: string } {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const full = `muno_live_${hex}`;
  const prefix = full.slice(0, 14); // muno_live_xxxx
  return { full, prefix };
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function useApiKeys() {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['api-keys', activeCompany?.company_id],
    queryFn: async (): Promise<ApiKey[]> => {
      if (!activeCompany) return [];
      const { data, error } = await (supabase as any)
        .from('api_keys')
        .select('*')
        .eq('company_id', activeCompany.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ApiKey[];
    },
    enabled: !!activeCompany,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (args: { name: string; scopes?: string[]; expires_at?: string }) => {
      if (!user || !activeCompany) throw new Error('Missing context');
      const { full, prefix } = generateKey();
      const hash = await sha256(full);
      const { data, error } = await (supabase as any)
        .from('api_keys')
        .insert({
          company_id: activeCompany.company_id,
          name: args.name,
          key_prefix: prefix,
          key_hash: hash,
          scopes: args.scopes ?? ['read'],
          created_by: user.id,
          expires_at: args.expires_at ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return { record: data as ApiKey, plaintext: full };
    },
    onSuccess: () => {
      toast.success('API key created');
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('API key revoked');
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });
}
