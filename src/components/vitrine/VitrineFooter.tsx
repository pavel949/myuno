import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Instagram, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { COMPANY_CONTACTS } from '@/lib/config';

export function VitrineFooter() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const lifeSituations = [
    { to: '/life/tourist', labelEn: 'Tourist', labelRu: 'Турист' },
    { to: '/life/resident', labelEn: 'Resident', labelRu: 'Резидент' },
    { to: '/life/investor', labelEn: 'Investor', labelRu: 'Инвестор' },
    { to: '/life/owner', labelEn: 'Owner', labelRu: 'Собственник' },
  ];

  const services = [
    { to: '/transport/airport-transfer', labelEn: 'Transfers', labelRu: 'Трансферы' },
    { to: '/yachts', labelEn: 'Yachts', labelRu: 'Яхты' },
    { to: '/experiences', labelEn: 'Tours', labelRu: 'Туры' },
    { to: '/property', labelEn: 'Villas', labelRu: 'Виллы' },
    { to: '/discover', labelEn: 'All Services →', labelRu: 'Все сервисы →' },
  ];

  const company = [
    { to: '/about', labelEn: 'About myUNO', labelRu: 'О myUNO' },
    { to: '/g-trust', labelEn: 'Trust & Safety', labelRu: 'Доверие' },
    { to: '/contact', labelEn: 'Contact', labelRu: 'Контакты' },
    { to: '/become-partner', labelEn: 'Become a Partner', labelRu: 'Стать партнёром' },
    { to: '/terms', labelEn: 'Terms', labelRu: 'Условия' },
    { to: '/privacy', labelEn: 'Privacy', labelRu: 'Конфиденциальность' },
  ];

  const socials = [
    { href: COMPANY_CONTACTS.social.telegram, icon: Send, label: 'Telegram' },
    { href: COMPANY_CONTACTS.social.instagram, icon: Instagram, label: 'Instagram' },
    { href: COMPANY_CONTACTS.social.whatsapp, icon: MessageCircle, label: 'WhatsApp' },
  ];

  return (
    <footer className="border-t border-border/40 bg-muted/10 mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10 lg:py-14">
        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-0.5">
              <span className="text-base text-muted-foreground font-light">my</span>
              <span className="text-lg font-bold text-foreground font-display">UNO</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRu ? 'Ваша операционная система для жизни' : 'Your Life Operating System'}
            </p>
            <div className="flex gap-2 pt-1">
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Life Situations */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {isRu ? 'Жизненные ситуации' : 'Life Situations'}
            </h4>
            <nav className="flex flex-col gap-2">
              {lifeSituations.map(l => (
                <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {isRu ? l.labelRu : l.labelEn}
                </Link>
              ))}
            </nav>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {isRu ? 'Сервисы' : 'Services'}
            </h4>
            <nav className="flex flex-col gap-2">
              {services.map(l => (
                <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {isRu ? l.labelRu : l.labelEn}
                </Link>
              ))}
            </nav>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {isRu ? 'Компания' : 'Company'}
            </h4>
            <nav className="flex flex-col gap-2">
              {company.map(l => (
                <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {isRu ? l.labelRu : l.labelEn}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="md:hidden space-y-4">
          <div className="flex items-baseline justify-center gap-0.5">
            <span className="text-base text-muted-foreground font-light">my</span>
            <span className="text-lg font-bold text-foreground font-display">UNO</span>
          </div>
          <div className="flex justify-center gap-4">
            {socials.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <s.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
            {company.slice(0, 4).map(l => (
              <Link key={l.to} to={l.to} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {isRu ? l.labelRu : l.labelEn}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border/30 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} myUNO Phuket. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            {isRu ? 'Сделано с заботой на Пхукете' : 'Made with care in Phuket'}
          </p>
        </div>
      </div>
    </footer>
  );
}
