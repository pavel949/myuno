import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVerticalSpec } from '@/lib/vertical-specs';
import { adapterDbToForm } from '@/lib/vertical-specs/adapters';
import { DetailRenderer } from '@/components/vertical-wizard/DetailRenderer';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { BackButton } from '@/components/uno/BackButton';

/**
 * Spec-driven public detail page.
 * Route: /mc/catalog/:vertical/:id
 */
export default function VerticalCatalogDetailPage() {
  const { vertical = '', id = '' } = useParams<{ vertical: string; id: string }>();
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const spec = getVerticalSpec(vertical);

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
  const displayName = title[lang] || (data as { name_en?: string; name_ru?: string }).name_en || '';

  /**
   * spec → detail → booking bridge.
   * Prefers WhatsApp (vendor channel-of-record per Bible v2.0), falls back to tel:,
   * then to a logged inquiry stub (toast only) when no contact rail is configured.
   */
  const handleContact = () => {
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
    </div>
  );
}
