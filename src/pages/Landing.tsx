/** Cinematic public front door. Existing authenticated workspace stays in HomeRouter. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LifeBuoy, Plane, CarFront, Ship, Flower2, KeyRound } from 'lucide-react';
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
import { HomeHeroChoices } from '@/components/home/HomeHeroChoices';
import { HomeDiscoverySearch } from '@/components/home/HomeDiscoverySearch';
import { trackEvent } from '@/lib/analytics/track';
import { homeCopy as copy } from '@/content/home/cinematicHome';
import hero from '@/assets/hero-phuket-coast-editorial.webp';
import '@/styles/cinematic-home.css';
import '@/styles/premium-public.css';
import '@/styles/homepage-refinement.css';
import '@/styles/home-mobile-redesign.css';

const publicNavigationRole = 'guest' as const;


export default function Landing() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = (v: LangValues) => pickLang(language, v);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSubject, setRequestSubject] = useState<string | undefined>();
  const [requestTopic, setRequestTopic] = useState<'property' | 'general' | 'invest'>('property');
  const [requestVersion, setRequestVersion] = useState(0);
  const openRequest = (subject?: string, topic: 'property' | 'general' | 'invest' = 'property') => {
    trackEvent('homepage_lead_intent', { topic, source: 'guided_intake' });
    setRequestSubject(subject);
    setRequestTopic(topic);
    setRequestVersion((version) => version + 1);
    setRequestOpen(true);
  };

  return (
    <div className="cinematic-home premium-home home-refined" data-testid="cinematic-home">
      <SEOHead title={t({ ru: 'Ваш дом и жизнь на Пхукете — myUNO', en: 'Your home and life in Phuket — myUNO', th: 'บ้านและชีวิตของคุณในภูเก็ต — myUNO' })} description={t(copy.lead)} />
      <a href="#home-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[170] focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:ring-2 focus:ring-ring" onClick={(event) => { event.preventDefault(); document.getElementById('home-main')?.focus(); }}>{t({ ru: 'Перейти к содержимому', en: 'Skip to content', th: 'ข้ามไปยังเนื้อหา' })}</a>
      <main id="home-main" tabIndex={-1} className="outline-none">
      <section className="home-hero" aria-labelledby="home-title">
        <ConsumerHeader overlay onSearch={() => navigate(R.SEARCH)} />
        <div className="home-hero-layout home-container">
          <div className="home-hero-copy">
            <span className="home-hero-eyebrow">{t({ ru: 'ПХУКЕТ · ВСЁ В ОДНОМ МЕСТЕ', en: 'PHUKET · ALL IN ONE PLACE', th: 'ภูเก็ต · ครบในที่เดียว' })}</span>
            <h1 id="home-title"><span>{t(copy.place)}</span><span>{t(copy.headline)}</span></h1>
            <p>{t({ ru: 'Аренда и покупка жилья, впечатления и услуги на Пхукете. Команда myUNO поможет выбрать и всё организовать.', en: 'Rent or buy a home, discover experiences, or find a service in Phuket. The myUNO team can help you choose and make arrangements.', th: 'เช่าหรือซื้อที่พัก ค้นหาประสบการณ์และบริการในภูเก็ต ทีม myUNO ช่วยคุณเลือกและจัดการ' })}</p>
            <HomeHeroChoices />
            <div className="home-hero-live-search" aria-label={t({ ru: 'Поиск недвижимости с параметрами', en: 'Property search with filters', th: 'ค้นหาอสังหาริมทรัพย์พร้อมตัวกรอง' })}>
              <HomeDiscoverySearch showGuestsInline progressive />
            </div>
            <div className="home-hero-actions">
              <Link className="home-hero-secondary" to={R.FOR_OWNERS}>{t({ ru: 'У меня есть недвижимость', en: 'I own property', th: 'ฉันเป็นเจ้าของอสังหาริมทรัพย์' })}<ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          </div>
          <div className="home-hero-media" aria-hidden="true">
            <img className="home-hero-image" src={hero} alt="" loading="eager" width="1672" height="941" />
          </div>
        </div>
      </section>
      <nav className="home-container home-quick-links" aria-label={t({ ru: 'Популярные услуги', en: 'Popular services', th: 'บริการยอดนิยม' })}>
        {([
          { icon: Plane, href: R.AIRPORT_TRANSFER, text: { ru: 'Трансфер из аэропорта', en: 'Airport transfer', th: 'รถรับส่งสนามบิน' } },
          { icon: CarFront, href: R.TRANSPORT, text: { ru: 'Аренда транспорта', en: 'Vehicle rental', th: 'เช่ารถ' } },
          { icon: Ship, href: R.YACHTS, text: { ru: 'Яхты и катера', en: 'Yachts and boats', th: 'เรือยอชต์และเรือ' } },
          { icon: Flower2, href: R.FLOWERS, text: { ru: 'Цветы и подарки', en: 'Flowers and gifts', th: 'ดอกไม้และของขวัญ' } },
          { icon: KeyRound, href: R.FOR_OWNERS, text: { ru: 'Управление недвижимостью', en: 'Property management', th: 'บริหารอสังหาริมทรัพย์' } },
        ] as const).map(({ icon: Icon, href, text }) => (
          <Link key={href} to={href} className="home-quick-link" onClick={() => trackEvent('homepage_quick_link', { destination: href })}>
            <Icon size={17} aria-hidden="true" />{t(text)}
          </Link>
        ))}
      </nav>
      <HomeHousingPreview />
      <HomeNewbuildsPreview />
      <div className="home-life-group">
        <HomeExperienceGallery />
        <HomeServiceGallery />
      </div>
      <HomeLocationGallery />
      {/* Conversion entry points reuse the existing concierge intake and CRM workflow.
          No parallel lead storage or unverified promises are introduced. */}
      <section className="home-container py-12 sm:py-20" aria-labelledby="home-guided-title" data-testid="home-guided-intake">
        <div className="home-group-heading">
          <p className="home-group-eyebrow">{t({ ru: 'Подбор с командой myUNO', en: 'Personal assistance', th: 'ให้ทีม myUNO ช่วยเลือก' })}</p>
          <h2 id="home-guided-title">{t({ ru: 'Расскажите, что ищете. Поможем найти подходящее.', en: 'Tell us what you need. We will help you find it.', th: 'บอกสิ่งที่คุณกำลังมองหา เราจะช่วยคุณค้นหา' })}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t({ ru: 'Не нужно просматривать сотни вариантов. Выберите задачу и отправьте запрос команде.', en: 'Skip the endless browsing. Choose a goal and send your request to the team.', th: 'ไม่ต้องค้นหาหลายร้อยรายการ เลือกสิ่งที่ต้องการแล้วส่งคำขอถึงทีมงาน' })}</p>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {([
            { key: 'buy', title: { ru: 'Подобрать недвижимость', en: 'Find a property', th: 'ค้นหาอสังหาริมทรัพย์' }, detail: { ru: 'Покупка, инвестиции и новостройки', en: 'Buying, investing and new developments', th: 'ซื้อ ลงทุน และโครงการใหม่' }, subject: { ru: 'Подбор недвижимости: цель, бюджет, район и сроки', en: 'Property search: goal, budget, area and timing', th: 'ค้นหาอสังหาริมทรัพย์: วัตถุประสงค์ งบประมาณ พื้นที่ และเวลา' } },
            { key: 'rent', title: { ru: 'Найти жильё', en: 'Find a place to stay', th: 'ค้นหาที่พัก' }, detail: { ru: 'Виллы и квартиры на нужные даты', en: 'Villas and condos for your dates', th: 'วิลล่าและคอนโดตามวันที่ต้องการ' }, subject: { ru: 'Подбор аренды: даты, гости, район и бюджет', en: 'Rental search: dates, guests, area and budget', th: 'ค้นหาที่พัก: วันที่ ผู้เข้าพัก พื้นที่ และงบประมาณ' } },
            { key: 'service', title: { ru: 'Организовать услуги', en: 'Arrange a service', th: 'จัดหาบริการ' }, detail: { ru: 'Трансфер, впечатления и помощь', en: 'Transfers, experiences and assistance', th: 'รถรับส่ง กิจกรรม และความช่วยเหลือ' }, subject: { ru: 'Запрос услуг: что требуется и когда', en: 'Service request: what is needed and when', th: 'คำขอบริการ: สิ่งที่ต้องการและเวลา' } },
          ] as const).map((item) => (
            <article key={item.key} className="flex min-w-0 flex-col justify-between gap-6 border border-border bg-card p-6 sm:p-7">
              <div>
                <h3 className="font-display text-xl text-foreground">{t(item.title)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(item.detail)}</p>
              </div>
              <button type="button" className="inline-flex min-h-11 items-center justify-between gap-3 border-b border-foreground pb-2 text-left font-semibold text-foreground transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openRequest(t(item.subject), item.key === 'service' ? 'general' : item.key === 'buy' ? 'invest' : 'property')}>
                {t({ ru: 'Оставить запрос', en: 'Send a request', th: 'ส่งคำขอ' })}<ArrowRight size={18} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="home-partners-group" aria-labelledby="home-partners-title">
        <div className="home-container home-group-heading">
          <p className="home-group-eyebrow">{t({ ru: 'Собственникам и партнёрам', en: 'For owners and partners', th: 'สำหรับเจ้าของและพาร์ทเนอร์' })}</p>
          <h2 id="home-partners-title">{t({ ru: 'Развивайте недвижимость и сервисы вместе с myUNO', en: 'Grow your property and services with myUNO', th: 'เติบโตไปกับ myUNO' })}</h2>
        </div>
        <HomeAudienceGrid />
        <HomeTrustBar />
      </section>
      <section className="home-closing home-container"><div><h2>{t(copy.closing)}</h2><p>{t({ ru: 'Не нашли подходящий вариант? Расскажите о планах и задайте вопрос команде.', en: 'Still looking? Tell the team about your plans and what you need.', th: 'ยังไม่พบที่พักที่เหมาะสม บอกแผนและคำถามของคุณกับทีมงาน' })}</p></div><button type="button" className="home-text-link" onClick={() => openRequest()}>{t(copy.contact)}<ArrowRight size={18} aria-hidden="true" /></button></section>
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
      <ConciergeHelpSheet key={requestVersion} open={requestOpen} onOpenChange={setRequestOpen} topic={requestTopic} initialSubject={requestSubject} sourceData={{ source: 'homepage_guided_intake', intent: requestTopic }} />
    </div>
  );
}
