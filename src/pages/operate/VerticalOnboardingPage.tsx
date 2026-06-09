import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVerticalSpec } from '@/lib/vertical-specs';
import { formToDb } from '@/lib/vertical-specs/adapters/restaurantAdapter';
import { VerticalWizard } from '@/components/vertical-wizard/VerticalWizard';
import { BackButton } from '@/components/uno/BackButton';

/**
 * Industry-specific onboarding wizard.
 * Route: /mc/listings/new/:vertical
 */
export default function VerticalOnboardingPage() {
  const { vertical = 'restaurant' } = useParams<{ vertical: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const spec = getVerticalSpec(vertical);
  const [submitting, setSubmitting] = useState(false);

  if (!spec) {
    return (
      <div className="container py-10">
        <p className="text-sm text-muted-foreground">
          {language === 'ru' ? `Вертикаль «${vertical}» пока без spec.` : `No spec yet for «${vertical}».`}
        </p>
      </div>
    );
  }

  const handleSubmit = async (row: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const dbRow = formToDb(row, vertical);
      const { data, error } = await supabase
        .from('listings')
        .insert(dbRow as never)
        .select('id')
        .single();
      if (error) throw error;
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

  const draftKey = `vertical-draft:${vertical}`;
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
