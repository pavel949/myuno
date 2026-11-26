import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageState } from '@/components/page/PageState';
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
      <div className="flex min-h-[70vh] flex-col justify-center">
        <PageState
          title={title}
          description={language === 'th' ? 'หน้านี้อาจถูกย้ายหรือไม่พร้อมใช้งานชั่วคราว' : isRu
            ? 'Возможно, страница была перемещена или временно недоступна.'
            : 'This page may have been moved or is temporarily unavailable.'}
          icon="404"
          tone="missing"
          heading="h1"
        >
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={APP_ROUTES.HOME}>
                <Home className="size-4" aria-hidden="true" />
                {language === 'th' ? 'กลับหน้าหลัก' : isRu ? 'На главную' : 'Go Home'}
              </Link>
            </Button>
            <BackButton fallbackPath={APP_ROUTES.HOME} variant="default" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" asChild>
              <Link to={APP_ROUTES.DISCOVER}>
                <Search className="size-4" aria-hidden="true" />
                {language === 'th' ? 'ค้นหาบริการ' : isRu ? 'Поиск услуг' : 'Browse Services'}
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to={APP_ROUTES.CONTACT}>
                <HelpCircle className="size-4" aria-hidden="true" />
                {language === 'th' ? 'ขอความช่วยเหลือ' : isRu ? 'Помощь' : 'Get Help'}
              </Link>
            </Button>
          </div>
        </PageState>
      </div>
    </AppLayout>
  );
};

export default NotFound;
