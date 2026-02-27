/**
 * @module useLegalCompliance
 * @description Hook that checks if the current user has accepted all active legal documents.
 * Returns pending documents that need acceptance.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LegalDocument {
  id: string;
  doc_key: string;
  version: string;
  title_en: string;
  title_ru: string;
  applies_to: string[];
  content_md: string;
  content_hash: string;
}

export function useLegalCompliance() {
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['legal-compliance', user?.id],
    queryFn: async () => {
      if (!user?.id) return { pendingDocs: [], allAccepted: true };

      // Fetch active legal documents
      const { data: activeDocs, error: docsError } = await supabase
        .from('legal_documents')
        .select('id, doc_key, version, title_en, title_ru, applies_to, content_md, content_hash')
        .eq('is_active', true);

      if (docsError) throw docsError;
      if (!activeDocs?.length) return { pendingDocs: [], allAccepted: true };

      // Fetch user's acceptances
      const { data: acceptances, error: accError } = await supabase
        .from('legal_acceptances')
        .select('doc_key, version')
        .eq('user_id', user.id);

      if (accError) throw accError;

      // Build set of accepted doc_key+version
      const acceptedSet = new Set(
        (acceptances || []).map((a: any) => `${a.doc_key}::${a.version}`)
      );

      // Filter to pending (not yet accepted)
      const pendingDocs = activeDocs.filter(
        (doc: any) => !acceptedSet.has(`${doc.doc_key}::${doc.version}`)
      ) as LegalDocument[];

      return {
        pendingDocs,
        allAccepted: pendingDocs.length === 0,
      };
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 5 * 60 * 1000,
  });

  const acceptDocuments = async (docIds: string[]) => {
    const { data: result, error } = await supabase.functions.invoke('legal-accept', {
      body: {
        acceptances: docIds.map(id => ({ doc_id: id })),
        acceptance_source: 'app_init',
      },
    });

    if (error) throw error;
    return result;
  };

  return {
    pendingDocs: data?.pendingDocs || [],
    allAccepted: data?.allAccepted ?? true,
    isLoading: isLoading || authLoading,
    acceptDocuments,
  };
}
