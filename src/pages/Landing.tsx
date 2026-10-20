/** Cinematic public front door. Existing authenticated workspace stays in HomeRouter. */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Umbrella, House, Settings2, KeyRound, LifeBuoy, Pause, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { useReducedMotion } from '@/lib/motionConfig';
import { BottomBar } from '@/components/nav/BottomBar';
import { ConsumerHeader } from '@/components/nav/ConsumerHeader';
import { SEOHead } from '@/components/seo/SEOHead';
import { LegalCopyright } from '@/components/legal/LegalEntityInfo';
import { ConciergeHelpSheet } from '@/components/concierge/ConciergeHelpSheet';
import { HomeDiscoverySearch } from '@/components/home/HomeDiscoverySearch';
import { homeCopy as copy, homeJourneys } from '@/content/home/cinematicHome';
import hero from '@/assets/hero-phuket-desktop.webp';
import pool from '@/assets/solutions/pool.webp';
import housing from '@/assets/solutions/housing.webp';
import islands from '@/assets/solutions/islands.webp';
import '@/styles/cinematic-home.css';

const publicNavigationRole = 'guest' as const;
const icons = { holiday: Umbrella, home: House, service: Settings2, key: KeyRound };
const collections = [
  { image: pool, href: `${R.PROPERTY_SEARCH}?mode=rent&amenities=private_pool`, title: { ru: 'Жильё с бассейном', en: 'Homes with a private pool', th: 'ที่พักพร้อมสระว่ายน้ำส่วนตัว' } },
  { image: housing, href: `${R.PROPERTY_SEARCH}?mode=rent&tenancy=long`, title: { ru: 'Жильё для жизни', en: 'A place to call home', th: 'ที่พักสำหรับอยู่อาศัย' } },
  { image: islands, href: R.EXPERIENCES, title: { ru: 'Остров впечатлений', en: 'An island to discover', th: 'เกาะแห่งประสบการณ์' } },
];

export default function Landing() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const [requestOpen, setRequestOpen] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [motionStarted, setMotionStarted] = useState(false);
  const heroRef = useRef<HTMLImageElement>(null);
  const reducedMotion = useReducedMotion();
  const motionEnabled = heroLoaded && !reducedMotion;

  useEffect(() => {
    const image = heroRef.current;
    if (!image) return;

    const handleMotionStart = (event: AnimationEvent) => {
      if (event.animationName === 'home-drift') setMotionStarted(true);
    };
    const handleMotionStop = (event: AnimationEvent) => {
      if (event.animationName === 'home-drift') setMotionStarted(false);
    };
    const handleLoad = () => setHeroLoaded(image.naturalWidth > 0);
    const handleError = () => { setHeroLoaded(false); setMotionStarted(false); };
    image.addEventListener('animationstart', handleMotionStart);
    image.addEventListener('animationcancel', handleMotionStop);
    image.addEventListener('animationend', handleMotionStop);
    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);

    // A cached image can finish before React receives its load event.
    if (image.complete && image.naturalWidth > 0) setHeroLoaded(true);

    return () => {
      image.removeEventListener('animationstart', handleMotionStart);
      image.removeEventListener('animationcancel', handleMotionStop);
      image.removeEventListener('animationend', handleMotionStop);
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) setMotionStarted(false);
  }, [reducedMotion]);

  return (
    <div className="cinematic-home" data-testid="cinematic-home">
      <SEOHead title={t({ ru: 'Пхукет. Вы дома. — жильё, отдых и услуги', en: 'Phuket. You’re home. — homes and local services', th: 'ภูเก็ต บ้านของคุณ — ที่พักและบริการ' })} description={t(copy.lead)} />
      <section className="home-hero" aria-labelledby="home-title">
        <img
          ref={heroRef}
          className={`home-hero-image${motionEnabled ? ' is-motion-enabled' : ''}${motionPaused ? ' is-paused' : ''}`}
          src={hero} alt="" loading="eager" width="1920" height="1080"
        />
        <div className="home-hero-shade" aria-hidden="true" />
        <ConsumerHeader overlay />
        <div className="home-hero-copy home-container">
          <h1 id="home-title"><span>{t(copy.place)}</span><span>{t(copy.headline)}</span></h1>
          <p>{t(copy.lead)}</p>
        </div>
        {motionEnabled && motionStarted && <div className="home-hero-bottom home-container">
          <button type="button" aria-pressed={motionPaused} onClick={() => setMotionPaused(v => !v)} className="home-motion-control">
            {motionPaused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            {t({ ru: motionPaused ? 'Включить движение' : 'Остановить движение', en: motionPaused ? 'Resume motion' : 'Pause motion', th: motionPaused ? 'เปิดภาพเคลื่อนไหว' : 'หยุดภาพเคลื่อนไหว' })}
          </button>
        </div>}
      </section>
      <div className="home-search-wrap home-container"><HomeDiscoverySearch /></div>
      <section className="home-plans home-container" aria-labelledby="home-plans-title">
        <h2 id="home-plans-title">{t(copy.plans)}</h2><p className="home-section-lead">{t(copy.plansLead)}</p>
        <div className="home-journeys">{homeJourneys.map(j => { const Icon = icons[j.icon as keyof typeof icons]; return (
          <Link key={j.id} to={j.href} className="home-journey"><Icon className="home-journey-icon" size={33} strokeWidth={1.4} aria-hidden="true" />
            <h3>{t(j.title)}<ArrowRight size={17} aria-hidden="true" /></h3><p>{t(j.description)}</p>
          </Link>
        ); })}</div>
      </section>
      <section className="home-discovery home-container" aria-labelledby="home-discovery-title">
        <div className="home-section-heading"><div><h2 id="home-discovery-title">{t(copy.discover)}</h2><p className="home-section-lead">{t(copy.discoverLead)}</p></div><Link className="home-text-link" to={R.GOAL_STAY}>{t(copy.browse)}<ArrowRight size={18} aria-hidden="true" /></Link></div>
        <div className="home-collections">{collections.map(c => <Link key={c.href} to={c.href} className="home-collection"><div className="home-collection-photo"><img src={c.image} loading="lazy" alt="" width="600" height="450" /></div><h3>{t(c.title)}<ArrowRight size={19} aria-hidden="true" /></h3></Link>)}</div>
      </section>
      <section className="home-closing home-container"><h2>{t(copy.closing)}</h2><button type="button" className="home-text-link" onClick={() => setRequestOpen(true)}>{t(copy.contact)}<ArrowRight size={18} aria-hidden="true" /></button></section>
      <footer className="home-footer home-container">
        <Link className="home-emergency" to={R.SOS}><LifeBuoy size={19} aria-hidden="true" />{t(copy.urgent)}</Link>
        <nav aria-label={t({ ru: 'Дополнительные разделы', en: 'More links', th: 'ลิงก์เพิ่มเติม' })}>
          <Link to={R.FOR_OWNERS}>{t(copy.owners)}</Link><Link to={R.FOR_BUSINESS}>{t(copy.business)}</Link><Link to={R.VENDOR_JOIN}>{t(copy.partners)}</Link>
          <Link to={R.PRIVACY}>{t({ ru: 'Конфиденциальность', en: 'Privacy', th: 'ความเป็นส่วนตัว' })}</Link><Link to={R.TERMS}>{t({ ru: 'Условия', en: 'Terms', th: 'ข้อกำหนด' })}</Link>
        </nav><LegalCopyright />
      </footer>
      <BottomBar role={publicNavigationRole} aria-label={t({ ru: 'Основная навигация', en: 'Main navigation', th: 'เมนูหลัก' })} />
      <ConciergeHelpSheet open={requestOpen} onOpenChange={setRequestOpen} topic="general" />
    </div>
  );
}
