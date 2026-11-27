/** Cinematic public front door. Existing authenticated workspace stays in HomeRouter. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LifeBuoy, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { prefetchRoute } from '@/lib/prefetchRoute';
import { DEFAULT_HOME_SALE_MAX_PRICE, propertySaleBudgetLabel, propertySearchHref } from '@/lib/propertySearchQuery';
import { BottomBar } from '@/components/nav/BottomBar';
import { ConsumerTopBar } from '@/components/nav/ConsumerTopBar';
import { SEOHead } from '@/components/seo/SEOHead';
import { FooterSocialLinks } from '@/components/layout/FooterSocialLinks';
import { PublicFooterDirectory } from '@/components/layout/PublicFooterDirectory';
import { BrandWordmark } from '@/components/uno/BrandWordmark';
import { LegalCopyright } from '@/components/legal/LegalEntityInfo';
import { ConciergeHelpSheet } from '@/components/concierge/ConciergeHelpSheet';
import { HomeHousingPreview, HomeNewbuildsPreview, HomeSalePreview } from '@/components/home/HomeDiscoveryPreview';
import { HomeExperienceGallery, HomeLocationGallery, HomeServiceGallery } from '@/components/home/HomeCatalogGalleries';
import { HomeAudienceGrid, HomeTrustBar } from '@/components/home/HomeAudienceGrid';
import { HomeDiscoverySearch } from '@/components/home/HomeDiscoverySearch';
import { HomeUrgentHelp } from '@/components/home/HomeUrgentHelp';
import { homeCopy as copy } from '@/content/home/cinematicHome';
import hero from '@/assets/hero-phuket-coast-editorial.webp';
import '@/styles/cinematic-home.css';
import '@/styles/premium-public.css';
import '@/styles/homepage-refinement.css';
import '@/styles/home-reference.css';
import '@/styles/home-mobile-polish.css';

const publicNavigationRole = 'guest' as const;


export default function Landing() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <div className="cinematic-home premium-home home-refined" data-testid="cinematic-home" data-home-visual="mobile-grid-20261122">
      <SEOHead title={t({ ru: 'Жильё и услуги на Пхукете — myUNO', en: 'Your home and life in Phuket — myUNO', th: 'บ้านและชีวิตของคุณในภูเก็ต — myUNO' })} description={t(copy.lead)} />
      <a href="#home-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[170] focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:ring-2 focus:ring-ring" onClick={(event) => { event.preventDefault(); document.getElementById('home-main')?.focus(); }}>{t({ ru: 'Перейти к содержимому', en: 'Skip to content', th: 'ข้ามไปยังเนื้อหา' })}</a>
      <ConsumerTopBar />
      <main id="home-main" tabIndex={-1} className="outline-none">
      <section className="home-hero-section home-container" aria-labelledby="home-title">
        <div className="home-hero-banner">
          <img className="home-hero-banner-photo" src={hero} alt="" loading="eager" width="1672" height="941" />
          <div className="home-hero-copy">
            <h1 id="home-title">{t(copy.heroTitle)}</h1>
            <p>{t(copy.heroSubtitle)}</p>
          </div>
          <HomeUrgentHelp />
        </div>
      </section>
      <div className="home-hero-search home-container">
        <div className="home-reference-search">
          <HomeDiscoverySearch showGuestsInline progressive allowActivities />
        </div>
      </div>
      <div className="home-container md:hidden">
        <Link
          to={propertySearchHref('', { mode: 'buy', maxPrice: String(DEFAULT_HOME_SALE_MAX_PRICE) })}
          onPointerEnter={() => prefetchRoute(R.PROPERTY_SEARCH)}
          onFocus={() => prefetchRoute(R.PROPERTY_SEARCH)}
          className="ds-focus flex min-h-11 items-center gap-3 rounded-[var(--bible-radius-card)] bg-primary px-4 py-3 text-primary-foreground"
        >
          <Building2 className="size-5 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            {t({ ru: 'Купить жильё', en: 'Homes for sale', th: 'บ้านสำหรับขาย' })}
            <small className="block">{propertySaleBudgetLabel(DEFAULT_HOME_SALE_MAX_PRICE, language)}</small>
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
      <HomeHousingPreview />
      <HomeSalePreview />
      <HomeNewbuildsPreview />
      <div className="home-life-group">
        <HomeExperienceGallery />
        <HomeServiceGallery />
      </div>
      <HomeLocationGallery />
      <section className="home-partners-group" aria-labelledby="home-partners-title">
        <div className="home-container home-group-heading">
          <h2 id="home-partners-title">{t({ ru: 'Собственникам и партнёрам', en: 'For owners and partners', th: 'สำหรับเจ้าของและพาร์ทเนอร์' })}</h2>
        </div>
        <HomeAudienceGrid />
        <HomeTrustBar />
      </section>
      <section className="home-closing home-container"><div><h2>{t(copy.closing)}</h2><p>{t({ ru: 'Расскажите, что вы ищете. Команда myUNO подскажет, с чего начать.', en: 'Still looking? Tell the team about your plans and what you need.', th: 'ยังไม่พบที่พักที่เหมาะสม บอกแผนและคำถามของคุณกับทีมงาน' })}</p></div><button type="button" className="home-text-link" onClick={() => setRequestOpen(true)}>{t(copy.contact)}<ArrowRight size={18} aria-hidden="true" /></button></section>
      </main>
      <footer className="myuno-public-footer">
        <div className="home-footer home-container">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <BrandWordmark as="static" tone="onNavy" />
            <FooterSocialLinks />
          </div>
          <PublicFooterDirectory />
          <Link className="ds-focus home-emergency" to={R.SOS}><LifeBuoy size={19} aria-hidden="true" />{t(copy.urgent)}</Link>
          <LegalCopyright />
        </div>
      </footer>
      <BottomBar role={publicNavigationRole} aria-label={t({ ru: 'Основная навигация', en: 'Main navigation', th: 'เมนูหลัก' })} />
      <ConciergeHelpSheet open={requestOpen} onOpenChange={setRequestOpen} topic="property" />
    </div>
  );
}
