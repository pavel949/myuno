import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { GlobalPreferencesControls } from '@/components/uno/GlobalPreferencesControls';
import { UserAvatarMenu } from '@/components/layout/UserAvatarMenu';
import { GUEST_TOP_NAV, isBottomBarItemActive } from '@/lib/nav/navigationModel';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
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
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><button type="button" className="consumer-menu" aria-label={t('Открыть меню', 'Open menu', 'เปิดเมนู')}><Menu aria-hidden="true" /></button></SheetTrigger>
            <SheetContent closeLabel={t('Закрыть меню', 'Close menu', 'ปิดเมนู')} className="w-[min(100vw,24rem)] overflow-y-auto">
              <SheetTitle>myUNO</SheetTitle>
              <SheetDescription>{t('Все основные разделы', 'Main destinations', 'เมนูหลัก')}</SheetDescription>
              <nav aria-label={t('Меню', 'Menu', 'เมนู')} className="mt-6 flex flex-col gap-1">
                {onSearch && <Button variant="outline" className="mb-4 justify-start" onClick={() => { setOpen(false); onSearch(); }}><Search aria-hidden="true" />{t('Поиск по сайту', 'Search the site', 'ค้นหาเว็บไซต์')}</Button>}
                {[...links, { to: R.FOR_OWNERS, label: t('Собственникам', 'For owners', 'สำหรับเจ้าของ') }, { to: R.SUPPORT, label: t('Помощь', 'Help', 'ความช่วยเหลือ') }, { to: user ? R.ACCOUNT : R.AUTH, label: user ? t('Мой аккаунт', 'My account', 'บัญชีของฉัน') : t('Войти', 'Sign in', 'เข้าสู่ระบบ') }].map(l => <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-border px-2 py-3 text-base text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{l.label}</Link>)}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

    </header>
  );
}
