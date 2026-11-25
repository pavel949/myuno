import '@/styles/premium-account.css';
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from '@/components/uno/BackButton';
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { getLegacyRedirect, canonicalRedirectHref, APP_ROUTES } from "@/lib/config/routes";
import { SEOHead } from '@/components/seo/SEOHead';
import { logger } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const title = language === 'th' ? 'ไม่พบหน้านี้' : isRu ? 'Страница не найдена' : 'Page not found';

  useEffect(() => {
    const redirect = getLegacyRedirect(location.pathname);
    const destination = redirect ? canonicalRedirectHref(redirect, location.search, location.hash) : null;
    if (destination && destination !== location.pathname + location.search + location.hash) {
      navigate(destination, { replace: true, state: location.state });
      return;
    }
    logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname, location.search, location.hash, location.state, navigate]);

  return (
    <AppLayout showFooter={false}>
      <SEOHead title={title} noindex />
      <div className="premium-system flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        {/* 404 — calm, not aggressive */}
        {/* S1 · 404 state: brand tile, calm copy, next actions (Design Bible Round 4A) */}
        <div className="mb-8 flex h-20 w-40 items-center justify-center rounded-md bg-primary" aria-hidden="true">
          <span className="font-display text-4xl leading-none tracking-tight text-accent select-none">
            404
          </span>
        </div>

        <h1 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-8">
          {language === 'th' ? 'หน้านี้อาจถูกย้ายหรือไม่พร้อมใช้งานชั่วคราว' : isRu
            ? 'Возможно, страница была перемещена или временно недоступна.'
            : 'This page may have been moved or is temporarily unavailable.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button
            onClick={() => navigate(APP_ROUTES.HOME)}
            className="flex-1 gap-2"
          >
            <Home className="w-4 h-4" />
            {language === 'th' ? 'กลับหน้าหลัก' : isRu ? 'На главную' : 'Go Home'}
          </Button>
          <BackButton fallbackPath={APP_ROUTES.HOME} variant="default" />
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate(APP_ROUTES.DISCOVER)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            {language === 'th' ? 'ค้นหาบริการ' : isRu ? 'Поиск услуг' : 'Browse Services'}
          </button>
          <button
            onClick={() => navigate(APP_ROUTES.CONTACT)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {language === 'th' ? 'ขอความช่วยเหลือ' : isRu ? 'Помощь' : 'Get Help'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotFound;
