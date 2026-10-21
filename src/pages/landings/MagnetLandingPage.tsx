/**
 * MagnetLandingPage — public route /l/:slug. Renders a builder-generated landing.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMagnetLandingBySlug } from '@/hooks/useMagnetLandings';
import { MagnetLandingRenderer } from '@/components/magnets/MagnetLandingRenderer';
import NotFound from '@/pages/NotFound';

export default function MagnetLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useMagnetLandingBySlug(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) return <NotFound />;

  const seoTitle = (isRu ? data.seo_title_ru : data.seo_title_en) || (isRu ? data.title_ru : data.title_en);
  const seoDesc =
    (isRu ? data.seo_description_ru : data.seo_description_en) ||
    (isRu ? data.subtitle_ru : data.subtitle_en) ||
    undefined;

  return (
    <>
      <SEOHead title={seoTitle} description={seoDesc ?? ''} />
      <MagnetLandingRenderer landing={data} />
    </>
  );
}
