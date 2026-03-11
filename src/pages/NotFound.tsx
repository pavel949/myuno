import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { getLegacyRedirect, APP_ROUTES } from "@/lib/config/routes";
import { logger } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  useEffect(() => {
    const redirect = getLegacyRedirect(location.pathname);
    if (redirect) {
      navigate(redirect, { replace: true });
      return;
    }
    logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname, navigate]);

  return (
    <AppLayout showFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        {/* 404 — calm, not aggressive */}
        <div className="mb-8">
          <span className="text-7xl font-bold leading-none tracking-tight text-muted-foreground/30 select-none">
            404
          </span>
        </div>
        
        <h1 className="text-xl font-semibold text-foreground mb-2">
          {isRu ? 'Страница не найдена' : 'Page not found'}
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-8">
          {isRu 
            ? 'Возможно, страница была перемещена или временно недоступна.'
            : 'This page may have been moved or is temporarily unavailable.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button
            onClick={() => navigate(APP_ROUTES.HOME)}
            className="flex-1 gap-2"
          >
            <Home className="w-4 h-4" />
            {isRu ? 'На главную' : 'Go Home'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {isRu ? 'Назад' : 'Go Back'}
          </Button>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate(APP_ROUTES.DISCOVER)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            {isRu ? 'Поиск услуг' : 'Browse Services'}
          </button>
          <button
            onClick={() => navigate(APP_ROUTES.CONTACT)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {isRu ? 'Помощь' : 'Get Help'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotFound;
