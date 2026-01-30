import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Handshake, ChevronRight, Shield, HelpCircle, FileText, Download } from 'lucide-react';

export function CompactFooter() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const quickLinks = [
    { to: '/about', label: isRu ? 'О нас' : 'About' },
    { to: '/how-it-works', label: isRu ? 'Как работает' : 'How It Works' },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: isRu ? 'Контакты' : 'Contact' },
  ];

  const legalLinks = [
    { to: '/terms', label: isRu ? 'Условия' : 'Terms' },
    { to: '/privacy', label: isRu ? 'Конфиденциальность' : 'Privacy' },
    { to: '/refund-policy', label: isRu ? 'Возврат' : 'Refunds' },
    { to: '/cookies', label: 'Cookies' },
  ];

  const supportLinks = [
    { to: '/support', label: isRu ? 'Помощь' : 'Help', icon: HelpCircle },
    { to: '/sos', label: 'SOS', icon: Shield },
    { to: '/install', label: isRu ? 'Приложение' : 'App', icon: Download },
  ];

  return (
    <footer className="bg-secondary/50 border-t border-border/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Compact Partner CTA */}
        <button
          onClick={() => navigate('/provider/onboarding')}
          className="w-full mb-5 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
              <Handshake className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium text-foreground">
                {isRu ? 'Стать партнёром' : 'Become a Partner'}
              </span>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Предложите свои услуги на myUNO' : 'Offer your services on myUNO'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        {/* Links Row */}
        <div className="flex flex-wrap items-start justify-between gap-6 mb-5">
          {/* Quick Links */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Support Icons */}
          <div className="flex items-center gap-2">
            {supportLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Legal + Copyright Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
          {/* Logo */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">my</span>
            <div className="w-5 h-5 rounded-md gradient-gold flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">U</span>
            </div>
            <span className="text-sm font-medium text-foreground">UNO</span>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center gap-3">
            {legalLinks.map((link, i) => (
              <span key={link.to} className="flex items-center gap-3">
                <Link
                  to={link.to}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
                {i < legalLinks.length - 1 && (
                  <span className="text-border">•</span>
                )}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} myUNO
          </p>
        </div>
      </div>
    </footer>
  );
}
