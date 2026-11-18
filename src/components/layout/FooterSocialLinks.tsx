import { Send, Instagram, Youtube, Linkedin, Facebook, ArrowUpRight, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatformSocialLinks } from '@/hooks/usePlatformSocialLinks';
import { COMPANY_CONTACTS } from '@/lib/config';
import { pickTriplet } from '@/lib/ecosystemGlossary';

/** Same public profiles for anonymous landing and authenticated app footers. */
export function FooterSocialLinks() {
  const { language } = useLanguage();
  const socialSettings = usePlatformSocialLinks();
  const t = (trip: { ru: string; en: string; th: string }) => pickTriplet(trip, language);
  const socialLinks = [
    { href: COMPANY_CONTACTS.social.telegram, icon: Send, label: 'Telegram' },
    ...(socialSettings.data?.youtube ? [{ href: socialSettings.data.youtube, icon: Youtube, label: 'YouTube' }] : []),
    ...(socialSettings.data?.instagram ? [{ href: socialSettings.data.instagram, icon: Instagram, label: 'Instagram' }] : []),
    ...(socialSettings.data?.linkedin ? [{ href: socialSettings.data.linkedin, icon: Linkedin, label: 'LinkedIn' }] : []),
    ...(socialSettings.data?.facebook ? [{ href: socialSettings.data.facebook, icon: Facebook, label: 'Facebook' }] : []),
    { href: COMPANY_CONTACTS.social.whatsapp, icon: MessageCircle, label: 'WhatsApp' },
  ];

  return <section aria-label={t({ ru: 'Социальные сети и связь', en: 'Social networks and contact', th: 'โซเชียลมีเดียและการติดต่อ' })} className="w-full border border-border bg-muted/30 p-4 lg:w-auto lg:shrink-0">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg text-foreground">{t({ ru: 'Будем на связи', en: 'Stay connected', th: 'ติดตามและติดต่อเรา' })}</h2>
      <span className="text-caption text-muted-foreground">myUNO</span>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {socialLinks.map(social => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="group flex min-h-11 min-w-0 items-center gap-2 border border-border bg-background px-3 py-2 text-foreground transition-colors hover:border-primary/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <social.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 text-caption font-medium">{social.label}</span>
        <ArrowUpRight className="size-3 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
      </a>)}
    </div>
  </section>;

}
