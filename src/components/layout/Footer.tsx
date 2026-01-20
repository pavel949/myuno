import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Info, 
  HelpCircle, 
  FileText, 
  Shield, 
  Users, 
  Lightbulb,
  Handshake,
  Download,
  Mail
} from 'lucide-react';

export function Footer() {
  const { t, language } = useLanguage();

  const infoLinks = [
    { to: '/about', icon: Info, label: language === 'ru' ? 'О нас' : 'About Us' },
    { to: '/how-it-works', icon: Lightbulb, label: language === 'ru' ? 'Как это работает' : 'How It Works' },
    { to: '/g-trust', icon: Shield, label: language === 'ru' ? 'G-Trust Гарантии' : 'G-Trust Guarantees' },
    { to: '/faq', icon: HelpCircle, label: language === 'ru' ? 'FAQ' : 'FAQ' },
    { to: '/partners', icon: Users, label: language === 'ru' ? 'Партнёры' : 'Partners' },
  ];

  const legalLinks = [
    { to: '/terms', icon: FileText, label: language === 'ru' ? 'Условия' : 'Terms' },
    { to: '/privacy', icon: Shield, label: language === 'ru' ? 'Конфиденциальность' : 'Privacy' },
    { to: '/cookies', icon: FileText, label: 'Cookie' },
    { to: '/refund-policy', icon: FileText, label: language === 'ru' ? 'Возврат' : 'Refunds' },
  ];

  return (
    <footer className="bg-secondary/50 border-t border-border/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Become a Partner CTA */}
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
                <Handshake className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {language === 'ru' ? 'Станьте партнёром myUNO' : 'Become a myUNO Partner'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' 
                    ? 'Предлагайте свои услуги и товары миллионам клиентов' 
                    : 'Offer your services and products to millions of customers'}
                </p>
              </div>
            </div>
            <Link 
              to="/become-partner"
              className="px-6 py-2.5 rounded-lg gradient-gold text-primary-foreground font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {language === 'ru' ? 'Подать заявку' : 'Apply Now'}
            </Link>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          {/* Info Links */}
          <div className="col-span-2 sm:col-span-2">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {language === 'ru' ? 'Информация' : 'Information'}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {infoLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {language === 'ru' ? 'Правовая информация' : 'Legal'}
            </h4>
            <div className="space-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {language === 'ru' ? 'Поддержка' : 'Support'}
            </h4>
            <Link
              to="/contact"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Mail className="w-4 h-4" />
              {language === 'ru' ? 'Контакты' : 'Contact Us'}
            </Link>
            <Link
              to="/support"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <HelpCircle className="w-4 h-4" />
              {language === 'ru' ? 'Центр помощи' : 'Help Center'}
            </Link>
            <Link
              to="/sos"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Shield className="w-4 h-4" />
              {language === 'ru' ? 'SOS' : 'Emergency'}
            </Link>
            <Link
              to="/install"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Download className="w-4 h-4" />
              {language === 'ru' ? 'Установить' : 'Install App'}
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">my</span>
            <div className="w-6 h-6 rounded-md gradient-gold flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">U</span>
            </div>
            <span className="text-sm font-medium text-foreground">UNO</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} myUNO. {language === 'ru' ? 'Все права защищены.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
