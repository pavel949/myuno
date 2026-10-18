import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { GlobalPreferencesControls } from '@/components/uno/GlobalPreferencesControls';
import { UserAvatarMenu } from '@/components/layout/UserAvatarMenu';
import { GUEST_TOP_NAV, isBottomBarItemActive } from '@/lib/nav/navigationModel';
import { MiniCart } from '@/components/market/MiniCart';

/** One public navigation, shared by the homepage and consumer route shells. */
export function ConsumerHeader({ overlay = false, onSearch }: { overlay?: boolean; onSearch?: () => void }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { pathname } = useLocation();
  const links = GUEST_TOP_NAV.map(item => ({
    to: item.path,
    label: pickLang(language, { ru: item.labelRu, en: item.labelEn, th: item.labelTh }),
    active: isBottomBarItemActive(item, pathname),
  }));
  return (
    <header className={`consumer-header${overlay ? ' consumer-header-overlay' : ''}`}>
      <div className="consumer-header-inner">
        <Link to={R.HOME} className="consumer-wordmark" aria-label="myUNO">myUNO</Link>
        <nav className="consumer-nav" aria-label={t('Основные разделы', 'Main navigation', 'เมนูหลัก')}>
          {links.map(l => <Link key={l.to} to={l.to} aria-current={l.active ? "page" : undefined}>{l.label}</Link>)}
        </nav>
        <div className="consumer-utilities">
          <Link className="consumer-owner" to={R.FOR_OWNERS}>{t('Собственникам', 'For owners', 'สำหรับเจ้าของ')}</Link>
          {onSearch && <button type="button" onClick={onSearch} className="consumer-icon" aria-label={t('Поиск', 'Search', 'ค้นหา')}><Search aria-hidden="true" /></button>}
          <GlobalPreferencesControls showCurrency={!overlay} />
          {!overlay && <MiniCart />}
          {user ? <UserAvatarMenu /> : <Link className="consumer-login" to={R.AUTH}>{t('Войти', 'Sign in', 'เข้าสู่ระบบ')}</Link>}
          <button type="button" className="consumer-menu" aria-label={open ? t('Закрыть меню', 'Close menu', 'ปิดเมนู') : t('Открыть меню', 'Open menu', 'เปิดเมนู')} aria-expanded={open} aria-controls="consumer-mobile-menu" onClick={() => setOpen(v => !v)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && <nav id="consumer-mobile-menu" className="consumer-mobile-menu" aria-label={t('Меню', 'Menu', 'เมนู')} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}>
        {onSearch && <button type="button" className="consumer-mobile-search" onClick={() => { setOpen(false); onSearch(); }}>{t('Поиск по сайту', 'Search the site', 'ค้นหาเว็บไซต์')}</button>}
        {[...links, { to: R.FOR_OWNERS, label: t('Собственникам', 'For owners', 'สำหรับเจ้าของ') }, { to: R.SOS, label: t('Нужна помощь', 'Get help', 'ขอความช่วยเหลือ') }].map(l => <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>)}
      </nav>}
    </header>
  );
}
