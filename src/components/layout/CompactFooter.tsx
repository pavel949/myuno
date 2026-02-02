import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Instagram, MessageCircle } from 'lucide-react';

export function CompactFooter() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const navLinks = [
    { to: '/about', label: isRu ? 'О нас' : 'About' },
    { to: '/faq', label: 'FAQ' },
    { to: '/support', label: isRu ? 'Помощь' : 'Help' },
    { to: '/terms', label: isRu ? 'Условия' : 'Terms' },
    { to: '/privacy', label: isRu ? 'Конфиденциальность' : 'Privacy' },
  ];

  const socialLinks = [
    { 
      href: 'https://t.me/myuno_support', 
      icon: Send, 
      label: 'Telegram',
      hoverColor: 'hover:text-[#0088cc]'
    },
    { 
      href: 'https://instagram.com/myuno.app', 
      icon: Instagram, 
      label: 'Instagram',
      hoverColor: 'hover:text-[#E4405F]'
    },
    { 
      href: 'https://wa.me/66XXXXXXXXX', 
      icon: MessageCircle, 
      label: 'WhatsApp',
      hoverColor: 'hover:text-[#25D366]'
    },
  ];

  return (
    <footer className="border-t border-border/50 bg-muted/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Social Links */}
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

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {navLinks.map((link, index) => (
            <span key={link.to} className="flex items-center gap-4">
              <Link
                to={link.to}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
              {index < navLinks.length - 1 && (
                <span className="text-border hidden sm:inline">·</span>
              )}
            </span>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} myUNO · Phuket Edition
        </p>
      </div>
    </footer>
  );
}
