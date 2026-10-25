/** Cinematic public front door. Existing authenticated workspace stays in HomeRouter. */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LifeBuoy, Pause, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { useReducedMotion } from '@/lib/motionConfig';
import { BottomBar } from '@/components/nav/BottomBar';
import { ConsumerHeader } from '@/components/nav/ConsumerHeader';
import { SEOHead } from '@/components/seo/SEOHead';
import { LegalCopyright } from '@/components/legal/LegalEntityInfo';
import { ConciergeHelpSheet } from '@/components/concierge/ConciergeHelpSheet';
import { HomeSearchEntry } from '@/components/home/HomeSearchEntry';
import { HomeGallery } from '@/components/home/HomeGallery';
import { HomeLocationGallery, HomeServiceGallery } from '@/components/home/HomeCatalogGalleries';
import { HomePopulatedProjects } from '@/components/home/HomePopulatedProjects';
import { HomeListingCard } from '@/components/home/HomeListingCard';
import { selectHomeShowcase } from '@/components/home/homeShowcase';
import { useProperties } from '@/hooks/useProperties';
import { homeCopy as copy } from '@/content/home/cinematicHome';
import hero from '@/assets/hero-phuket-desktop.webp';
import '@/styles/cinematic-home.css';

const publicNavigationRole = 'guest' as const;


export default function Landing() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSubject, setRequestSubject] = useState<string | undefined>();
  const stays = useProperties({ listingType: 'rent' }, 18);
  const [unavailableMedia, setUnavailableMedia] = useState<Set<string>>(() => new Set());
  const homes = selectHomeShowcase((stays.data ?? []).filter(home => !unavailableMedia.has(home.id)));
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
      <SEOHead title={t({ ru: 'Ваш дом и жизнь на Пхукете — myUNO', en: 'Your home and life in Phuket — myUNO', th: 'บ้านและชีวิตของคุณในภูเก็ต — myUNO' })} description={t(copy.lead)} />
      <section className="home-hero" aria-labelledby="home-title">
        <img
          ref={heroRef}
          className={`home-hero-image${motionEnabled ? ' is-motion-enabled' : ''}${motionPaused ? ' is-paused' : ''}`}
          src={hero} alt="" loading="eager" width="1920" height="1080"
        />
        <div className="home-hero-shade" aria-hidden="true" />
        <ConsumerHeader overlay headerActions={motionEnabled && motionStarted && (
          <button type="button" aria-label={t({ ru: motionPaused ? 'Включить движение' : 'Остановить движение', en: motionPaused ? 'Resume motion' : 'Pause motion', th: motionPaused ? 'เปิดภาพเคลื่อนไหว' : 'หยุดภาพเคลื่อนไหว' })} aria-pressed={motionPaused} onClick={() => setMotionPaused(v => !v)} className="home-motion-control">
            {motionPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          </button>
        )} />
        <div className="home-hero-copy home-container">
          <h1 id="home-title"><span>{t(copy.place)}</span><span>{t(copy.headline)}</span></h1>
          <p>{t(copy.lead)}</p>
        </div>
        <div className="home-search-wrap home-container"><HomeSearchEntry /></div>
      </section>
      <HomeLocationGallery />
      {!stays.isError && <HomePopulatedProjects homes={homes} />}
      <HomeGallery id="home-stays-title" className="home-properties" title={t(copy.stays)} description={t(copy.staysLead)}
        href={R.PROPERTY_SEARCH + '?mode=rent'} linkLabel={t(copy.browse)}
        state={stays.isLoading ? <div className="home-properties-loading" role="status">{t({ ru: 'Загружаем варианты…', en: 'Loading homes…', th: 'กำลังโหลดที่พัก…' })}</div> : stays.isError ? <div className="home-properties-empty" role="alert"><p>{t(copy.loadHomesError)}</p><button type="button" className="home-text-link" onClick={() => stays.refetch()}>{t({ ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' })}</button></div> : !homes.length ? <p className="home-properties-empty">{t(copy.emptyHomes)}</p> : undefined}>
        {homes.map(property => <HomeListingCard key={property.id} property={property} onUnavailable={id => setUnavailableMedia(previous => new Set(previous).add(id))} />)}
      </HomeGallery>
      <HomeServiceGallery />
      <section className="home-closing home-container"><div><h2>{t(copy.closing)}</h2><p>{t({ ru: 'Не нашли подходящий вариант? Расскажите о планах и задайте вопрос команде.', en: 'Still looking? Tell the team about your plans and what you need.', th: 'ยังไม่พบที่พักที่เหมาะสม บอกแผนและคำถามของคุณกับทีมงาน' })}</p></div><button type="button" className="home-text-link" onClick={() => { setRequestSubject(undefined); setRequestOpen(true); }}>{t(copy.contact)}<ArrowRight size={18} aria-hidden="true" /></button></section>
      <section className="home-owner-prompt home-container"><div><h2>{t(copy.ownersPrompt)}</h2><p>{t({ ru: 'Познакомимся с объектом и вашими ожиданиями. Если сможем управлять — предложим индивидуальные условия.', en: 'We review your property and expectations. If we can manage it, we propose individual terms.', th: 'ศึกษาทรัพย์สินและความคาดหวัง หากเรารับจัดการได้จะเสนอเงื่อนไขเฉพาะ' })}</p></div><Link className="home-text-link" to={R.OWNER_MANAGEMENT_LANDING}>{t(copy.forOwners)}<ArrowRight size={18} aria-hidden="true" /></Link></section>
      <footer className="home-footer home-container">
        <Link className="home-emergency" to={R.SOS}><LifeBuoy size={19} aria-hidden="true" />{t(copy.urgent)}</Link>
        <nav aria-label={t({ ru: 'Дополнительные разделы', en: 'More links', th: 'ลิงก์เพิ่มเติม' })}>
          <Link to={R.FOR_OWNERS}>{t(copy.owners)}</Link><Link to={R.FOR_BUSINESS}>{t(copy.business)}</Link><Link to={R.VENDOR_JOIN}>{t(copy.partners)}</Link>
          <Link to={R.PRIVACY}>{t({ ru: 'Конфиденциальность', en: 'Privacy', th: 'ความเป็นส่วนตัว' })}</Link><Link to={R.TERMS}>{t({ ru: 'Условия', en: 'Terms', th: 'ข้อกำหนด' })}</Link>
        </nav><LegalCopyright />
      </footer>
      <BottomBar role={publicNavigationRole} aria-label={t({ ru: 'Основная навигация', en: 'Main navigation', th: 'เมนูหลัก' })} />
      <ConciergeHelpSheet open={requestOpen} onOpenChange={setRequestOpen} topic="property" initialSubject={requestSubject} />
    </div>
  );
}
