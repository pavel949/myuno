/** Cinematic public front door. Existing authenticated workspace stays in HomeRouter. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LifeBuoy, Home, Building2, Compass, Plane } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { BottomBar } from '@/components/nav/BottomBar';
import { ConsumerHeader } from '@/components/nav/ConsumerHeader';
import { SEOHead } from '@/components/seo/SEOHead';
import { FooterSocialLinks } from '@/components/layout/FooterSocialLinks';
import { LegalCopyright } from '@/components/legal/LegalEntityInfo';
import { ConciergeHelpSheet } from '@/components/concierge/ConciergeHelpSheet';
import { HomeHousingPreview, HomeNewbuildsPreview } from '@/components/home/HomeDiscoveryPreview';
import { HomeExperienceGallery, HomeLocationGallery, HomeServiceGallery } from '@/components/home/HomeCatalogGalleries';
import { HomeAudienceGrid, HomeTrustBar } from '@/components/home/HomeAudienceGrid';
import { HomeDiscoverySearch } from '@/components/home/HomeDiscoverySearch';
import { homeCopy as copy } from '@/content/home/cinematicHome';
import hero from '@/assets/hero-phuket-coast-editorial.webp';
import homeArt from '@/assets/home-service-categories/home.svg';
import arrivalArt from '@/assets/home-service-categories/arrival.svg';
import '@/styles/cinematic-home.css';
import '@/styles/premium-public.css';
import '@/styles/homepage-refinement.css';
import '@/styles/home-reference.css';

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
      <a href="#home-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[170] focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:ring-2 focus:ring-ring" onClick={(event) => { event.preventDefault(); document.getElementById('home-main')?.focus(); }}>{t({ ru: 'Перейти к содержимому', en: 'Skip to content', th: 'ข้ามไปยังเนื้อหา' })}</a>
      <main id="home-main" tabIndex={-1} className="outline-none">
      <section className="home-hero" aria-labelledby="home-title">
        <ConsumerHeader overlay onSearch={() => navigate(R.SEARCH)} />
        <div className="home-hero-layout home-container">
          <div className="home-hero-copy">
            <h1 id="home-title"><span>{t(copy.place)}</span><span>{t(copy.headline)}</span></h1>
            <p>{t({ ru: 'Аренда и покупка жилья, впечатления и услуги на Пхукете. Команда myUNO поможет выбрать и всё организовать.', en: 'Rent or buy a home, discover experiences, or find a service in Phuket. The myUNO team can help you choose and make arrangements.', th: 'เช่าหรือซื้อที่พัก ค้นหาประสบการณ์และบริการในภูเก็ต ทีม myUNO ช่วยคุณเลือกและจัดการ' })}</p>
            <div className="home-reference-search"><HomeDiscoverySearch showGuestsInline progressive /></div>
            <div className="home-hero-actions">
              <Link className="home-hero-secondary" to={R.FOR_OWNERS}>{t({ ru: 'У меня есть недвижимость', en: 'I own property', th: 'ฉันเป็นเจ้าของอสังหาริมทรัพย์' })}<ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          </div>
          <div className="home-hero-media" aria-hidden="true">
            <img className="home-hero-image" src={hero} alt="" loading="eager" width="1672" height="941" />
          </div>
        </div>
      </section>
      <nav className="home-container home-reference-directions" aria-label={t({ru:'Основные направления',en:'Explore myUNO',th:'สำรวจ myUNO'})}>
        {([
          {href:R.PROPERTY_RENT, icon:Home, image:hero, title:{ru:'Снять жильё',en:'Rent a home',th:'เช่าที่พัก'}, subtitle:{ru:'Виллы и апартаменты на любой срок',en:'Villas and apartments',th:'วิลล่าและอพาร์ตเมนต์'}},
          {href:R.GOAL_BUY, icon:Building2, image:homeArt, title:{ru:'Купить недвижимость',en:'Buy property',th:'ซื้ออสังหาริมทรัพย์'}, subtitle:{ru:'Готовые объекты и новостройки',en:'Homes and new developments',th:'บ้านและโครงการใหม่'}},
          {href:R.EXPERIENCES, icon:Compass, image:'/yachts/catamaran-53-1.webp', title:{ru:'Впечатления',en:'Experiences',th:'ประสบการณ์'}, subtitle:{ru:'Яхты, экскурсии и активный отдых',en:'Yachts and island activities',th:'กิจกรรมบนเกาะ'}},
          {href:R.SERVICES, icon:Plane, image:arrivalArt, title:{ru:'Услуги',en:'Services',th:'บริการ'}, subtitle:{ru:'Трансфер, Fast Track и помощь',en:'Transfers and assistance',th:'รถรับส่งและความช่วยเหลือ'}},
        ] as const).map(({href,icon:Icon,image,title,subtitle})=><Link key={href} to={href} className="home-reference-direction">
          <img src={image} alt="" loading="lazy" /><span className="home-reference-direction-shade" />
          <span className="home-reference-direction-content"><Icon size={25} aria-hidden="true"/><strong>{t(title)}</strong><small>{t(subtitle)}</small></span>
        </Link>)}
      </nav>
      <HomeHousingPreview />
      <HomeNewbuildsPreview />
      <div className="home-life-group">
        <HomeExperienceGallery />
        <HomeServiceGallery />
      </div>
      <HomeLocationGallery />
      <section className="home-partners-group" aria-labelledby="home-partners-title">
        <div className="home-container home-group-heading">
          <p className="home-group-eyebrow">{t({ ru: 'Собственникам и партнёрам', en: 'For owners and partners', th: 'สำหรับเจ้าของและพาร์ทเนอร์' })}</p>
          <h2 id="home-partners-title">{t({ ru: 'Развивайте недвижимость и сервисы вместе с myUNO', en: 'Grow your property and services with myUNO', th: 'เติบโตไปกับ myUNO' })}</h2>
        </div>
        <HomeAudienceGrid />
        <HomeTrustBar />
      </section>
      <section className="home-closing home-container"><div><h2>{t(copy.closing)}</h2><p>{t({ ru: 'Не нашли подходящий вариант? Расскажите о планах и задайте вопрос команде.', en: 'Still looking? Tell the team about your plans and what you need.', th: 'ยังไม่พบที่พักที่เหมาะสม บอกแผนและคำถามของคุณกับทีมงาน' })}</p></div><button type="button" className="home-text-link" onClick={() => { setRequestSubject(undefined); setRequestOpen(true); }}>{t(copy.contact)}<ArrowRight size={18} aria-hidden="true" /></button></section>
      </main>
      <footer className="home-footer home-container">
        <div className="mb-6 flex justify-center lg:justify-start"><FooterSocialLinks /></div>
        <Link className="home-emergency" to={R.SOS}><LifeBuoy size={19} aria-hidden="true" />{t(copy.urgent)}</Link>
        <nav aria-label={t({ ru: 'Дополнительные разделы', en: 'More links', th: 'ลิงก์เพิ่มเติม' })}>
          <Link to={R.FOR_OWNERS}>{t(copy.owners)}</Link><Link to={R.FOR_MANAGEMENT_COMPANIES}>{t({ ru: 'Управляющим компаниям', en: 'Management companies', th: 'สำหรับบริษัทจัดการ' })}</Link><Link to={R.FOR_LOCAL_SERVICE_PROVIDERS}>{t(copy.partners)}</Link><Link to={R.FOR_REAL_ESTATE_DEVELOPERS}>{t({ ru: 'Застройщикам', en: 'For developers', th: 'สำหรับผู้พัฒนา' })}</Link><Link to={R.INVEST}>{t(copy.invest)}</Link><Link to={R.FOR_BUSINESS}>{t(copy.business)}</Link>
          <Link to={R.PRIVACY}>{t({ ru: 'Конфиденциальность', en: 'Privacy', th: 'ความเป็นส่วนตัว' })}</Link><Link to={R.TERMS}>{t({ ru: 'Условия', en: 'Terms', th: 'ข้อกำหนด' })}</Link>
        </nav><LegalCopyright />
      </footer>
      <BottomBar role={publicNavigationRole} aria-label={t({ ru: 'Основная навигация', en: 'Main navigation', th: 'เมนูหลัก' })} />
      <ConciergeHelpSheet open={requestOpen} onOpenChange={setRequestOpen} topic="property" initialSubject={requestSubject} />
    </div>
  );
}
