import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVerticalSpec } from '@/lib/vertical-specs';
import { adapterDbToForm } from '@/lib/vertical-specs/adapters';
import { DetailRenderer } from '@/components/vertical-wizard/DetailRenderer';
import { InquiryForm, InquiryStatusBadge, getInquiryStatus } from '@/components/vertical-wizard/InquiryForm';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';

/** Verticals where the unified inquiry form replaces the bare WhatsApp/tel CTA. */
const INQUIRY_VERTICALS = new Set(['beauty', 'fitness', 'tour', 'transport']);

/**
 * Spec-driven public detail page.
 * Route: /mc/catalog/:vertical/:id
 */
export default function VerticalCatalogDetailPage() {
  const { vertical = '', id = '' } = useParams<{ vertical: string; id: string }>();
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const spec = getVerticalSpec(vertical);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [savedStatus, setSavedStatus] = useState(() => (id ? getInquiryStatus(id) : null));

  // Re-check status when sheet closes (form may have just saved).
  useEffect(() => {
    if (!inquiryOpen && id) setSavedStatus(getInquiryStatus(id));
  }, [inquiryOpen, id]);

  const { data, isLoading } = useQuery({
    queryKey: ['vertical-detail', vertical, id],
    enabled: !!spec && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!spec) {
    return (
      <div className="container py-10">
        <BackButton />
        <p className="text-sm text-muted-foreground">
          {lang === 'ru' ? `Spec для «${vertical}» не подключён.` : `Spec for «${vertical}» not wired.`}
        </p>
      </div>
    );
  }

  if (isLoading || !data) return <LoadingState />;

  const form = adapterDbToForm(vertical, data as Record<string, unknown>);
  const attrs = (form.attributes as Record<string, unknown>) ?? {};
  const title = (attrs.title as { en?: string; ru?: string }) ?? {};
  const displayName =
    title[lang] ||
    (data as { name_en?: string; name_ru?: string }).name_en ||
    (data as { name_ru?: string }).name_ru ||
    '';

  const useInquiryForm = INQUIRY_VERTICALS.has(vertical);

  /**
   * spec → detail → booking bridge.
   * For beauty/fitness/tour/transport — open the unified inquiry sheet (validated,
   * persists to consultation_requests + local status). Other verticals fall back to
   * WhatsApp/tel direct contact.
   */
  const handleContact = () => {
    if (useInquiryForm) {
      setInquiryOpen(true);
      return;
    }
    const wa = (attrs.whatsapp as string) || '';
    const phone = (attrs.phone as string) || '';
    const msg = lang === 'ru'
      ? `Здравствуйте! Интересует «${displayName}» (${spec.label.ru}). Хочу узнать подробности и забронировать.`
      : `Hi! I'd like to book «${displayName}» (${spec.label.en}). Could you share details?`;

    const digits = (wa || phone).replace(/[^\d]/g, '');
    if (digits) {
      const url = wa
        ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
        : `tel:${phone}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    toast.info(
      lang === 'ru'
        ? 'Партнёр не указал контакт. Откройте «Связаться» позже.'
        : 'No contact channel configured. Try again later.',
    );
  };

  return (
    <div className="container py-6 max-w-3xl space-y-4">
      <BackButton />

      {savedStatus && useInquiryForm && (
        <div className="flex items-center justify-between border border-border bg-card px-3 py-2">
          <InquiryStatusBadge status={savedStatus} lang={lang} />
          <Button size="sm" variant="ghost" onClick={() => setInquiryOpen(true)}>
            {lang === 'ru' ? 'Отправить ещё раз' : 'Send again'}
          </Button>
        </div>
      )}

      <DetailRenderer
        spec={spec}
        row={{
          ...form,
          name_en: (data as { name_en?: string }).name_en,
          name_ru: (data as { name_ru?: string }).name_ru,
          rating: (data as { rating?: number }).rating,
          review_count: (data as { review_count?: number }).review_count,
        }}
        onContact={handleContact}
      />

      {useInquiryForm && (
        <InquiryForm
          open={inquiryOpen}
          onOpenChange={setInquiryOpen}
          verticalId={vertical}
          listingId={id}
          listingTitle={displayName}
          entryPoint={`mc_catalog:${vertical}`}
        />
      )}
    </div>
  );
}
