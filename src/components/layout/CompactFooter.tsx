import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Instagram, MessageCircle, Download, Smartphone, Shield, Clock, CheckCircle } from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/config';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsDesktop } from '@/hooks/use-desktop';

export function CompactFooter() {
  const { language } = useLanguage();
  const { isInstalled, canInstall, isIOS, install } = usePWAInstall();
  const isDesktop = useIsDesktop();
  const isRu = language === 'ru';

  const handleInstallClick = async () => {
    if (canInstall) {
      const success = await install();
      if (success) return;
    } else if (!isIOS) {
      // Android: wait up to 3s for beforeinstallprompt
      const installed = await new Promise<boolean>((resolve) => {
        const handler = async (e: Event) => {
          e.preventDefault();
          window.removeEventListener('beforeinstallprompt', handler);
          const success = await install();
          resolve(success);
        };
        window.addEventListener('beforeinstallprompt', handler);
        setTimeout(() => {
          window.removeEventListener('beforeinstallprompt', handler);
          resolve(false);
        }, 3000);
      });
      if (installed) return;
    }
    window.location.href = '/install';
  };

  const serviceLinks = [
    { to: '/property', label: isRu ? 'Недвижимость' : 'Real Estate' },
    { to: '/transport', label: isRu ? 'Транспорт' : 'Transport' },
    { to: '/experiences', label: isRu ? 'Впечатления' : 'Things To Do' },
    { to: '/beauty', label: isRu ? 'Красота' : 'Beauty' },
    { to: '/medical', label: isRu ? 'Медицина' : 'Healthcare' },
    { to: '/yachts', label: isRu ? 'Яхты' : 'Yachts' },
  ];

  const companyLinks = [
    { to: '/about', label: isRu ? 'О нас' : 'About' },
    { to: '/faq', label: 'FAQ' },
    { to: '/support', label: isRu ? 'Помощь' : 'Help' },
    { to: '/terms', label: isRu ? 'Условия' : 'Terms' },
    { to: '/privacy', label: isRu ? 'Конфиденциальность' : 'Privacy' },
    { to: '/cookies', label: 'Cookie' },
    { to: '/refund-policy', label: isRu ? 'Возвраты' : 'Refunds' },
  ];

  const socialLinks = [
    { href: COMPANY_CONTACTS.social.telegram, icon: Send, label: 'Telegram', hoverColor: 'hover:text-info' },
    { href: COMPANY_CONTACTS.social.instagram, icon: Instagram, label: 'Instagram', hoverColor: 'hover:text-accent-purple' },
    { href: COMPANY_CONTACTS.social.whatsapp, icon: MessageCircle, label: 'WhatsApp', hoverColor: 'hover:text-success' },
  ];

  const trustBadges = [
    { icon: CheckCircle, labelEn: 'Verified Providers', labelRu: 'Проверенные партнёры' },
    { icon: Clock, labelEn: '24/7 Support', labelRu: 'Поддержка 24/7' },
    { icon: Shield, labelEn: 'Data Protected', labelRu: 'Защита данных' },
  ];

  // Desktop: professional multi-column footer
  if (isDesktop) {
    return (
      <footer className="border-t border-border/40 bg-muted/10 mt-auto">
        <div className="max-w-[1536px] mx-auto px-8 py-10 lg:py-12">
          {/* Main grid */}
          <div className="grid grid-cols-4 gap-8 mb-8">
            {/* Brand column */}
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                <span className="text-base text-muted-foreground font-light">my</span>
                <span className="text-lg font-semibold text-foreground font-display">UNO</span>
              </div>
              <p className="text-[15px] text-muted-foreground leading-7">
                {isRu 
                  ? 'Ваш дом на Пхукете. Сервисы, недвижимость и жизнь на острове — в одном приложении.' 
                  : 'Your home in Phuket. Services, real estate, and island life — all in one app.'}
              </p>
              {/* Social */}
              <div className="flex gap-3 pt-1">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground transition-all duration-200 ${social.hoverColor}`}
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Services column */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-foreground">
                {isRu ? 'Сервисы' : 'Services'}
              </h4>
              <nav className="flex flex-col gap-2.5">
                {serviceLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Company column */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-foreground">
                {isRu ? 'Компания' : 'Company'}
              </h4>
              <nav className="flex flex-col gap-2.5">
                {companyLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Trust column */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-foreground">
                {isRu ? 'Гарантии' : 'Trust & Safety'}
              </h4>
              <div className="flex flex-col gap-3">
                {trustBadges.map((badge) => (
                  <div key={badge.labelEn} className="flex items-center gap-2">
                    <badge.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-[15px] text-muted-foreground">
                      {isRu ? badge.labelRu : badge.labelEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/30 pt-5 flex items-center justify-between">
            <p className="text-sm text-muted-foreground/70">
              © {new Date().getFullYear()} myUNO · Phuket Edition
            </p>
            <p className="text-sm text-muted-foreground/70">
              {isRu ? 'Сделано с заботой на Пхукете' : 'Made with care in Phuket'}
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Mobile: compact footer (unchanged)
  return (
    <footer className="border-t border-border/50 bg-muted/30 mt-auto pb-20 md:pb-0">
      <div className="max-w-[1536px] mx-auto px-4 py-6 space-y-4">
        {!isInstalled && (
          <div className="flex justify-center">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isIOS ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {isRu ? 'Скачать приложение' : 'Download App'}
            </button>
          </div>
        )}

        <div className="flex justify-center gap-6">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 text-sm text-muted-foreground transition-colors ${social.hoverColor}`}
              aria-label={social.label}
            >
              <social.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{social.label}</span>
            </a>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {companyLinks.map((link, index) => (
            <span key={link.to} className="flex items-center gap-4">
              <Link to={link.to} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
              {index < companyLinks.length - 1 && (
                <span className="text-border hidden sm:inline">·</span>
              )}
            </span>
          ))}
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} myUNO · Phuket Edition
        </p>
      </div>
    </footer>
  );
}
