import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVerticalSpec } from '@/lib/vertical-specs';
import { adapterDbToForm, adapterFormToDb } from '@/lib/vertical-specs/adapters';
import { ListingEditor } from '@/components/vertical-wizard/ListingEditor';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { BackButton } from '@/components/uno/BackButton';

/**
 * Pro tab-style editor for an existing listing.
 * Route: /mc/listings/:id/edit
 */
export default function ListingEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const qc = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listings', 'edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const save = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const vertical = (listing as { vertical?: string } | undefined)?.vertical ?? 'restaurant';
      const dbRow = adapterFormToDb(vertical, row);
      const { error } = await supabase
        .from('listings')
        .update(dbRow as never)
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === 'ru' ? 'Сохранено' : 'Saved');
      qc.invalidateQueries({ queryKey: ['listings', 'edit', id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !listing) return <LoadingState />;
  const spec = getVerticalSpec((listing as { vertical: string }).vertical);
  if (!spec) {
    return (
      <div className="container py-10">
        <p className="text-sm text-muted-foreground">
          {language === 'ru'
            ? `Spec для «${(listing as { vertical: string }).vertical}» пока не подключён.`
            : `Spec for «${(listing as { vertical: string }).vertical}» not wired yet.`}
        </p>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-6xl">
      <BackButton />
      <ListingEditor
        spec={spec}
        initial={adapterDbToForm((listing as { vertical: string }).vertical, listing as Record<string, unknown>)}
        saving={save.isPending}
        onSave={(row) => save.mutateAsync(row)}
      />
    </div>
  );
}
