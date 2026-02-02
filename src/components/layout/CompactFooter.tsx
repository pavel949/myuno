import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Handshake, 
  ChevronRight, 
  Shield, 
  HelpCircle, 
  Download,
  Clock,
  Users,
  BadgeCheck,
  MapPin,
  Send,
  Instagram,
  MessageCircle
} from 'lucide-react';
import { ContextualHint } from '@/components/hints/ContextualHint';

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
    { to: '/install', label: isRu ? 'Приложение' : 'App', icon: Download },
    { to: '/sos', label: 'SOS', icon: Shield },
    { to: '/support', label: isRu ? 'Помощь' : 'Help', icon: HelpCircle },
  ];

  const socialLinks = [
    { 
      href: 'https://t.me/myuno_support', 
      label: 'Telegram', 
      icon: Send,
      color: 'hover:text-[#0088cc]' 
    },
    { 
      href: 'https://instagram.com/myuno.app', 
      label: 'Instagram', 
      icon: Instagram,
      color: 'hover:text-[#E4405F]' 
    },
    { 
      href: 'https://wa.me/66XXXXXXXXX', 
      label: 'WhatsApp', 
      icon: MessageCircle,
      color: 'hover:text-[#25D366]' 
    },
  ];

  const trustBadges = [
    {
      icon: BadgeCheck,
      label: 'G-Trust',
      hint: isRu 
        ? 'Партнёры проходят верификацию G-Trust: проверка документов, аудит качества, реальные отзывы'
        : 'Partners pass G-Trust verification: document check, quality audit, real reviews',
    },
    {
      icon: Clock,
      label: isRu ? '24/7 Поддержка' : '24/7 Support',
      hint: isRu
        ? 'Круглосуточная поддержка на русском и английском языках'
        : 'Round-the-clock support in Russian and English',
    },
    {
      icon: Users,
      label: isRu ? '200+ Партнёров' : '200+ Partners',
      hint: isRu
        ? 'Более 200 проверенных провайдеров услуг на Пхукете'
        : 'Over 500 verified service providers in Phuket',
    },
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

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {trustBadges.map((badge) => (
            <ContextualHint
              key={badge.label}
              id={`trust-${badge.label}`}
              content={badge.hint}
              side="top"
              showIcon={false}
            >
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-help">
                <badge.icon className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                  {badge.label}
                </span>
              </div>
            </ContextualHint>
          ))}
        </div>

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

        {/* Location Badge */}
        <div className="flex items-center justify-center gap-2 mb-4 py-2">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">
            Phuket, Thailand
          </span>
        </div>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4 mb-5">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 text-xs text-muted-foreground transition-colors ${social.color}`}
              aria-label={social.label}
            >
              <social.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{social.label}</span>
            </a>
          ))}
        </div>

        {/* Legal + Copyright Row */}
        <div className="flex flex-col items-center gap-4 pt-4 border-t border-border/50">
          {/* Logo + Slogan */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">my</span>
              <div className="w-5 h-5 rounded-md gradient-gold flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground">U</span>
              </div>
              <span className="text-sm font-medium text-foreground">UNO</span>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              "The only app you need abroad"
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-3">
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

          {/* Copyright + Version */}
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} myUNO · Phuket Edition v1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
