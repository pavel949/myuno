import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVerticalSpec } from '@/lib/vertical-specs';
import { adapterFormToDb } from '@/lib/vertical-specs/adapters';
import { VerticalWizard } from '@/components/vertical-wizard/VerticalWizard';
import { BackButton } from '@/components/uno/BackButton';

/**
 * Industry-specific onboarding wizard.
 * Route: /mc/listings/new/:vertical
 */
export default function VerticalOnboardingPage() {
  const { vertical = 'restaurant' } = useParams<{ vertical: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const spec = getVerticalSpec(vertical);
  const [submitting, setSubmitting] = useState(false);

  const draftKey = `vertical-draft:${vertical}`;

  if (!spec) {
    return (
      <div className="container py-10">
        <BackButton />
        <p className="mt-4 text-sm text-muted-foreground">
          {language === 'ru' ? `Вертикаль «${vertical}» пока без spec.` : `No spec yet for «${vertical}».`}
        </p>
      </div>
    );
  }

  const handleSubmit = async (row: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const dbRow = adapterFormToDb(vertical, row) as Record<string, unknown>;

      // listings RLS allows INSERT either as the owning provider (needs
      // provider_id) OR as admin/uno_team (any row). Attach the caller's
      // provider_id when they have one so provider/MC users aren't rejected;
      // admin/uno_team callers pass without it.
      if (user?.id) {
        const { data: provider } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (provider?.id) dbRow.provider_id = provider.id;
      }

      const { data, error } = await supabase
        .from('listings')
        .insert(dbRow as never)
        .select('id')
        .single();
      if (error) throw error;
      // Clear the saved draft now that it's persisted.
      try { localStorage.removeItem(draftKey); } catch { /* quota */ }
      toast.success(
        language === 'ru' ? 'Карточка отправлена на модерацию' : 'Submitted for review',
      );
      navigate(`/mc/listings/${(data as { id: string }).id}/edit`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const initial = (() => {
    try {
      const raw = localStorage.getItem(draftKey);
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  })();

  return (
    <div className="container py-6 max-w-6xl">
      <BackButton />
      <VerticalWizard
        spec={spec}
        initial={initial}
        submitting={submitting}
        onSaveDraft={(r) => {
          try {
            localStorage.setItem(draftKey, JSON.stringify(r));
          } catch {
            /* quota */
          }
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
