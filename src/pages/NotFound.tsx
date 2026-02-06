import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { getLegacyRedirect } from "@/lib/config/routes";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  useEffect(() => {
    // Check for legacy redirect
    const redirect = getLegacyRedirect(location.pathname);
    if (redirect) {
      navigate(redirect, { replace: true });
      return;
    }
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname, navigate]);

  return (
    <AppLayout showFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <span className="text-[120px] font-bold leading-none tracking-tighter bg-gradient-to-b from-primary to-primary/30 bg-clip-text text-transparent select-none">
            404
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isRu ? 'Страница не найдена' : 'Page not found'}
        </h1>
        <p className="text-muted-foreground max-w-sm mb-8">
          {isRu 
            ? 'Эта страница была удалена, переименована, или временно недоступна.'
            : 'This page may have been removed, renamed, or is temporarily unavailable.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button
            onClick={() => navigate('/')}
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
            onClick={() => navigate('/discover')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            {isRu ? 'Поиск услуг' : 'Browse Services'}
          </button>
          <button
            onClick={() => navigate('/contact')}
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
