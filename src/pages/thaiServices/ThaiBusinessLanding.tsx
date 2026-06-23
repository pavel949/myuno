/**
 * /ts/:slug — standalone Russian landing for a Thai business (no app shell).
 *
 * SPA-rendered microsite (myUNO is Vite, no SSR) modelled on ProjectMicrosite:
 * react-helmet-async OG/canonical tags, hero + gallery + services + map, and
 * CTAs back into the app. Only active businesses render; inactive → 404-ish.
 */
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, MapPin, MessageCircle } from 'lucide-react';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { UnifiedCatalogMap } from '@/components/map/UnifiedCatalogMap';
import { APP_ROUTES } from '@/lib/config/routes';
import { supabase } from '@/integrations/supabase/client';
import { useThaiBusiness } from '@/hooks/thaiServices/useThaiServices';

export default function ThaiBusinessLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useThaiBusiness(slug);

  useEffect(() => {
    if (!data?.business?.id) return;
    supabase.from('analytics_events').insert({
      event_name: 'thai_landing_view',
      page_path: `/ts/${slug}`,
      event_data: { business_id: data.business.id, slug },
    });
  }, [data?.business?.id, slug]);

  if (isLoading) return <LoadingState />;
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground">
        <p>Бизнес не найден</p>
        <Link to="/" className="text-primary underline">myUNO</Link>
      </div>
    );
  }

  const { business, services } = data;
  const name = business.name_ru || business.name_en || business.name_th;
  const title = business.landing_title_ru || name;
  const subtitle = business.landing_subtitle_ru || '';
  const ogImage = business.logo_url || business.gallery_urls?.[0] || '';
  const canonical = typeof window !== 'undefined' ? `${window.location.origin}/ts/${slug}` : '';
  const detailUrl = `${APP_ROUTES.THAI_SERVICES_DETAIL(business.id)}?book=1`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{title} — myUNO</title>
        <meta name="description" content={subtitle || name} />
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={subtitle || name} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="website" />
        {canonical && <meta property="og:url" content={canonical} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Minimal nav */}
      <header className="sticky top-0 z-40 bg-background/90 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1 text-sm text-primary">
            <ChevronLeft className="w-4 h-4" />myUNO
          </Link>
          <Link to={detailUrl} className="bg-accent text-accent-foreground text-sm font-medium px-4 py-2">
            Забронировать сейчас в myUNO
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden bg-muted">
          {ogImage && <img src={ogImage} alt={name} className="w-full h-full object-cover" />}
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl md:text-5xl font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="mt-3 text-lg text-muted-foreground max-w-2xl">{subtitle}</p>}
          <Link to={detailUrl} className="mt-5 inline-block bg-accent text-accent-foreground font-medium px-6 py-3">
            Забронировать сейчас в myUNO
          </Link>
        </div>
      </section>

      {/* Gallery */}
      {business.gallery_urls?.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {business.gallery_urls.slice(0, 6).map((u, i) => (
              <img key={i} src={u} alt="" className="aspect-square object-cover w-full" loading="lazy" />
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-2xl font-semibold mb-4">Услуги и цены</h2>
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex justify-between border border-border p-3">
                <span>{s.name_ru || s.name_th}</span>
                <span className="font-mono">฿{s.price_thb.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Map */}
      {business.lat != null && business.lng != null && (
        <section className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" />Расположение</h2>
          <div className="h-64 border border-border overflow-hidden">
            <UnifiedCatalogMap
              markers={[{ id: business.id, lat: Number(business.lat), lng: Number(business.lng), title: name }]}
              iconChar="🏪"
            />
          </div>
        </section>
      )}

      {/* Secondary CTA */}
      <section className="max-w-4xl mx-auto px-4 py-8 text-center">
        <Link to={APP_ROUTES.THAI_SERVICES_DETAIL(business.id)} className="inline-flex items-center gap-2 border border-border px-6 py-3">
          <MessageCircle className="w-4 h-4" />Написать в чат в myUNO
        </Link>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {name}. Powered by myUNO.
      </footer>
    </div>
  );
}
