/** Cinematic public front door. Existing authenticated workspace stays in HomeRouter. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LifeBuoy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { BottomBar } from '@/components/nav/BottomBar';
import { ConsumerHeader } from '@/components/nav/ConsumerHeader';
import { SEOHead } from '@/components/seo/SEOHead';
import { LegalCopyright } from '@/components/legal/LegalEntityInfo';
import { ConciergeHelpSheet } from '@/components/concierge/ConciergeHelpSheet';
import { HomeHousingPreview, HomeNewbuildsPreview } from '@/components/home/HomeDiscoveryPreview';
import { HomeSearchEntry, HomePlanLinks } from '@/components/home/HomeSearchEntry';
import { HomeLocationGallery, HomeServiceGallery } from '@/components/home/HomeCatalogGalleries';
import { homeCopy as copy } from '@/content/home/cinematicHome';
import hero from '@/assets/hero-phuket-desktop.webp';
import '@/styles/cinematic-home.css';
import '@/styles/premium-public.css';
import '@/styles/homepage-refinement.css';

const publicNavigationRole = 'guest' as const;


export default function Landing() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = (v: LangValues) => pickLang(language, v);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSubject, setRequestSubject] = useState<string | undefined>();

  return (
    <div className="cinematic-home premium-home home-refined" data-testid="cinematic-home">
      <SEOHead title={t({ ru: 'Ваш дом и жизнь на Пхукете — myUNO', en: 'Your home and life in Phuket — myUNO', th: 'บ้านและชีวิตของคุณในภูเก็ต — myUNO' })} description={t(copy.lead)} />
      <section className="home-hero" aria-labelledby="home-title">
        <img
          className="home-hero-image"
          src={hero} alt="" loading="eager" width="1920" height="1080"
        />
        <div className="home-hero-shade" aria-hidden="true" />
        <ConsumerHeader overlay onSearch={() => navigate(R.SEARCH)} />
        <div className="home-hero-copy home-container">
          <h1 id="home-title"><span>{t(copy.place)}</span><span>{t(copy.headline)}</span></h1>
          <p>{t(copy.lead)}</p>
        </div>
      </section>
      <div className="home-search-wrap home-container"><HomeSearchEntry /></div>
      <HomePlanLinks />
      <HomeHousingPreview />
      <HomeNewbuildsPreview />
      <HomeServiceGallery />
      <HomeLocationGallery />
      <section className="home-closing home-container"><div><h2>{t(copy.closing)}</h2><p>{t({ ru: 'Не нашли подходящий вариант? Расскажите о планах и задайте вопрос команде.', en: 'Still looking? Tell the team about your plans and what you need.', th: 'ยังไม่พบที่พักที่เหมาะสม บอกแผนและคำถามของคุณกับทีมงาน' })}</p></div><button type="button" className="home-text-link" onClick={() => { setRequestSubject(undefined); setRequestOpen(true); }}>{t(copy.contact)}<ArrowRight size={18} aria-hidden="true" /></button></section>
      <section className="home-owner-prompt home-container"><div><h2>{t(copy.ownersPrompt)}</h2><p>{t({ ru: 'Познакомимся с объектом и вашими ожиданиями. Если сможем управлять — предложим индивидуальные условия.', en: 'We review your property and expectations. If we can manage it, we propose individual terms.', th: 'ศึกษาทรัพย์สินและความคาดหวัง หากเรารับจัดการได้จะเสนอเงื่อนไขเฉพาะ' })}</p></div><Link className="home-text-link" to={R.OWNER_MANAGEMENT_LANDING}>{t(copy.forOwners)}<ArrowRight size={18} aria-hidden="true" /></Link></section>
      <footer className="home-footer home-container">
        <Link className="home-emergency" to={R.SOS}><LifeBuoy size={19} aria-hidden="true" />{t(copy.urgent)}</Link>
        <nav aria-label={t({ ru: 'Дополнительные разделы', en: 'More links', th: 'ลิงก์เพิ่มเติม' })}>
          <Link to={R.FOR_OWNERS}>{t(copy.owners)}</Link><Link to={R.FOR_BUSINESS}>{t(copy.business)}</Link><Link to={R.VENDOR_JOIN}>{t(copy.partners)}</Link><Link to={R.FOR_REAL_ESTATE_DEVELOPERS}>{t({ ru: 'Застройщикам', en: 'For developers', th: 'สำหรับผู้พัฒนา' })}</Link>
          <Link to={R.PRIVACY}>{t({ ru: 'Конфиденциальность', en: 'Privacy', th: 'ความเป็นส่วนตัว' })}</Link><Link to={R.TERMS}>{t({ ru: 'Условия', en: 'Terms', th: 'ข้อกำหนด' })}</Link>
        </nav><LegalCopyright />
      </footer>
      <BottomBar role={publicNavigationRole} aria-label={t({ ru: 'Основная навигация', en: 'Main navigation', th: 'เมนูหลัก' })} />
      <ConciergeHelpSheet open={requestOpen} onOpenChange={setRequestOpen} topic="property" initialSubject={requestSubject} />
    </div>
  );
}
