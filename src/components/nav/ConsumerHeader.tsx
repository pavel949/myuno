import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search, Building2, Compass, Wrench, ChevronRight, CalendarDays, ShoppingBag, HelpCircle, LogIn } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { GlobalPreferencesControls } from '@/components/uno/GlobalPreferencesControls';
import { UserAvatarMenu } from '@/components/layout/UserAvatarMenu';
import { GUEST_TOP_NAV, getActiveGuestTopNavItem } from '@/lib/nav/navigationModel';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MiniCart } from '@/components/market/MiniCart';
import { buildAuthPath } from '@/lib/auth/redirectToAuth';
import { publicContentFrame, PUBLIC_CONTENT_WIDTH } from '@/design-system/ecosystemLayout';

/** One public navigation, shared by the homepage and consumer route shells. */
export function ConsumerHeader({ overlay = false, onSearch, headerActions }: { overlay?: boolean; onSearch?: () => void; headerActions?: ReactNode }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const header = headerRef.current;
    const canvas = header?.closest<HTMLElement>('[data-canvas]');
    if (!header || !canvas) return;
    const property = '--consumer-header-height';
    const previous = canvas.style.getPropertyValue(property);
    const priority = canvas.style.getPropertyPriority(property);
    const measure = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      if (height > 0) canvas.style.setProperty(property, `${height}px`);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(header);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      if (previous) canvas.style.setProperty(property, previous, priority);
      else canvas.style.removeProperty(property);
    };
  }, []);
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { pathname, search, hash } = useLocation();
  const frame = publicContentFrame(pathname);
  const signInPath = buildAuthPath({ from: `${pathname}${search}${hash}` });
  const activeDestination = getActiveGuestTopNavItem(pathname);
  const links = GUEST_TOP_NAV.map(item => ({
    to: item.path,
    label: pickLang(language, { ru: item.labelRu, en: item.labelEn, th: item.labelTh }),
    active: activeDestination?.path === item.path,
  }));
  const partnerLinks = [
    { to: R.FOR_OWNERS, label: t('Собственникам', 'For owners', 'สำหรับเจ้าของ') },
    { to: R.FOR_MANAGEMENT_COMPANIES, label: t('Управляющим компаниям', 'For management companies', 'สำหรับบริษัทจัดการ') },
    { to: R.FOR_LOCAL_SERVICE_PROVIDERS, label: t('Поставщикам услуг', 'For service providers', 'สำหรับผู้ให้บริการ') },
    { to: R.FOR_REAL_ESTATE_DEVELOPERS, label: t('Застройщикам', 'For developers', 'สำหรับผู้พัฒนา') },
    { to: R.FOR_BUSINESS, label: t('Для бизнеса', 'For business', 'สำหรับธุรกิจ') },
  ];
  const partnerActive = partnerLinks.some(link => pathname === link.to || pathname.startsWith(`${link.to}/`));
  return (
    <header ref={headerRef} className={`consumer-header${overlay ? ' consumer-header-overlay' : ''}`}>
      <div className="consumer-header-inner" data-public-frame={overlay ? 'overlay' : frame} style={!overlay && frame !== 'default' ? { maxWidth: PUBLIC_CONTENT_WIDTH[frame] } : undefined}>
        <Link to={R.HOME} className="consumer-wordmark" aria-label="myUNO">myUNO</Link>
          <nav className="consumer-nav" aria-label={t('Основные разделы', 'Main navigation', 'เมนูหลัก')}>
            {links.map(l => <Link key={l.to} to={l.to} aria-current={l.active ? "page" : undefined}>{l.label}</Link>)}
          </nav>
          <details className="consumer-partner-menu">
            <summary aria-current={partnerActive ? 'page' : undefined}>{t('Партнёрам', 'For partners', 'สำหรับพาร์ทเนอร์')}</summary>
            <div className="consumer-partner-menu-panel">
              {partnerLinks.map(link => <Link key={link.to} to={link.to}>{link.label}</Link>)}
            </div>
          </details>
        <div className="consumer-utilities">
          {onSearch && <button type="button" onClick={onSearch} className="consumer-icon" aria-label={t('Поиск', 'Search', 'ค้นหา')}><Search aria-hidden="true" /></button>}
          <div className="consumer-secondary-utilities"><GlobalPreferencesControls showCurrency={!overlay} className={overlay ? 'consumer-overlay-preferences' : undefined} /></div>
          {headerActions}
          {!overlay && <div className="consumer-secondary-utilities"><MiniCart /></div>}
          {user ? <UserAvatarMenu consumerNavigation={[...links, { to: R.FOR_OWNERS, label: t('Собственникам', 'For owners', 'สำหรับเจ้าของ') }, { to: '/cart', label: t('Корзина', 'Cart', 'ตะกร้า') }]} consumerSearch={onSearch} /> : <Link className="consumer-login" to={signInPath}>{t('Войти', 'Sign in', 'เข้าสู่ระบบ')}</Link>}
          {!user && <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><button type="button" className="consumer-menu" aria-label={t('Открыть меню', 'Open menu', 'เปิดเมนู')}><Menu aria-hidden="true" /></button></SheetTrigger>
            <SheetContent closeLabel={t('Закрыть меню', 'Close menu', 'ปิดเมนู')} className={`consumer-task-menu w-[min(100vw,24rem)]${overlay ? '' : ' consumer-header-menu'}`}>
              <div className="consumer-task-menu-heading">
                <SheetTitle>myUNO</SheetTitle>
                <SheetDescription>{t('Что хотите сделать?', 'What would you like to do?', 'คุณต้องการทำอะไร?')}</SheetDescription>
              </div>
              <div className="consumer-task-menu-body">
                {onSearch && <Button variant="outline" className="consumer-task-search" onClick={() => { setOpen(false); onSearch(); }}><Search aria-hidden="true" />{t('Найти на myUNO', 'Search myUNO', 'ค้นหาใน myUNO')}</Button>}
                <nav aria-label={t('Меню', 'Menu', 'เมนู')}>
                  <section className="consumer-task-section" aria-labelledby="consumer-homes-heading">
                    <h2 id="consumer-homes-heading">{t('Найти недвижимость', 'Find a home', 'ค้นหาที่พัก')}</h2>
                    <Link to={R.PROPERTY} onClick={() => setOpen(false)} className="consumer-task-row" aria-current={activeDestination?.path === R.PROPERTY ? 'page' : undefined}><Building2 aria-hidden="true" /><span>{t('Жильё', 'Homes', 'ที่พัก')}</span><ChevronRight aria-hidden="true" /></Link>
                    <div className="consumer-task-options">
                      <Link to={`${R.PROPERTY_SEARCH}?mode=rent&tenancy=short`} onClick={() => setOpen(false)}>{t('На время поездки', 'For a holiday', 'สำหรับวันหยุด')}</Link>
                      <Link to={`${R.PROPERTY_SEARCH}?mode=rent&tenancy=long`} onClick={() => setOpen(false)}>{t('Жить надолго', 'For a longer stay', 'พักระยะยาว')}</Link>
                      <Link to={`${R.PROPERTY_SEARCH}?mode=rent&tenancy=medium`} onClick={() => setOpen(false)}>{t('На несколько месяцев', 'For a few months', 'พักหลายเดือน')}</Link>
                      <Link to={`${R.PROPERTY_SEARCH}?mode=buy`} onClick={() => setOpen(false)}>{t('Купить недвижимость', 'Buy a home', 'ซื้อที่อยู่อาศัย')}</Link>
                    </div>
                  </section>
                  <section className="consumer-task-section" aria-labelledby="consumer-life-heading">
                    <h2 id="consumer-life-heading">{t('Отдыхать и решать дела', 'Enjoy your stay', 'พักผ่อนและใช้ชีวิต')}</h2>
                    {links.filter(l => l.to === R.EXPERIENCES || l.to === R.GOAL_SERVICES).map(l => { const Icon = l.to === R.EXPERIENCES ? Compass : Wrench; return <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="consumer-task-row" aria-current={l.active ? 'page' : undefined}><Icon aria-hidden="true" /><span>{l.label}</span><ChevronRight aria-hidden="true" /></Link>; })}
                  </section>
                  <section className="consumer-task-section" aria-labelledby="consumer-personal-heading">
                    <h2 id="consumer-personal-heading">{t('Мои дела', 'Your plans', 'แผนของคุณ')}</h2>
                    <Link to={R.BOOKINGS} onClick={() => setOpen(false)} className="consumer-task-row" aria-current={activeDestination?.path === R.BOOKINGS ? 'page' : undefined}><CalendarDays aria-hidden="true" /><span>{t('Заявки и бронирования', 'Requests and bookings', 'คำขอและการจอง')}</span><ChevronRight aria-hidden="true" /></Link>
                    <Link to="/cart" onClick={() => setOpen(false)} className="consumer-task-row" aria-current={pathname === '/cart' ? 'page' : undefined}><ShoppingBag aria-hidden="true" /><span>{t('Корзина', 'Cart', 'ตะกร้า')}</span><ChevronRight aria-hidden="true" /></Link>
                    <Link to={signInPath} onClick={() => setOpen(false)} className="consumer-task-row"><LogIn aria-hidden="true" /><span>{t('Войти', 'Sign in', 'เข้าสู่ระบบ')}</span><ChevronRight aria-hidden="true" /></Link>
                  </section>
                  <Link to={R.SUPPORT} onClick={() => setOpen(false)} className="consumer-task-row"><HelpCircle aria-hidden="true" /><span>{t('Помощь myUNO', 'myUNO help', 'ความช่วยเหลือ myUNO')}</span><ChevronRight aria-hidden="true" /></Link>
                  <details className="consumer-task-partners">
                    <summary>{t('Собственникам и партнёрам', 'For owners and partners', 'สำหรับเจ้าของและพาร์ทเนอร์')}<ChevronRight aria-hidden="true" /></summary>
                    {partnerLinks.map(link => <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="consumer-task-row">{link.label}</Link>)}
                  </details>
                </nav>
                <div className="consumer-task-preferences">
                  <p>{t('Настройте под себя', 'Make yourself at home', 'ตั้งค่าตามที่คุณต้องการ')}</p>
                  <GlobalPreferencesControls />
                </div>
              </div>
            </SheetContent>
          </Sheet>}
        </div>
      </div>

    </header>
  );
}
