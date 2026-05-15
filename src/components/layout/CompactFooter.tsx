/**
 * CompactFooter — canon-aligned slim footer (matches WelcomeLanding pattern).
 *
 * Was: 6-column mega-footer with 25+ service deep-links (~618px tall on desktop).
 * Now: brand + tagline + socials, single legal-row, copyright. Target ~160px.
 *
 * The full service sitemap moved to a dedicated `/sitemap` page + XML sitemap;
 * a deep-funnel page (PropertyDetail, Checkout, Booking) shouldn't drag the user
 * back into the catalogue from its bottom.
 */
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Instagram, MessageCircle, Download, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { COMPANY_CONTACTS } from '@/lib/config';
import { APP_ROUTES } from '@/lib/config/routes';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsDesktop } from '@/hooks/use-desktop';
import { BrandWordmark } from '@/components/uno/BrandWordmark';
import { ECOSYSTEM_FOOTER_UI, pickTriplet } from '@/lib/ecosystemGlossary';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
import { cn } from '@/lib/utils';

export const CompactFooter = forwardRef<HTMLElement>((_props, ref) => {
  const { language } = useLanguage();
  const { isInstalled, canInstall, isIOS, install } = usePWAInstall();
  const isDesktop = useIsDesktop();
  const t = (trip: { ru: string; en: string; th: string }) => pickTriplet(trip, language);

  const handleInstallClick = async () => {
    if (canInstall) {
      const success = await install();
      if (success) return;
    } else if (!isIOS) {
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

  const legalLinks = [
    { to: APP_ROUTES.ABOUT, label: t(ECOSYSTEM_FOOTER_UI.about) },
    { to: APP_ROUTES.FAQ, label: t(ECOSYSTEM_FOOTER_UI.faq) },
    { to: APP_ROUTES.SUPPORT, label: t(ECOSYSTEM_FOOTER_UI.support) },
    { to: APP_ROUTES.CONTACT, label: language === 'ru' ? 'Контакты' : language === 'th' ? 'ติดต่อ' : 'Contact' },
    { to: APP_ROUTES.PRIVACY, label: t(ECOSYSTEM_FOOTER_UI.privacy) },
    { to: APP_ROUTES.TERMS, label: t(ECOSYSTEM_FOOTER_UI.terms) },
    { to: APP_ROUTES.COOKIES, label: t(ECOSYSTEM_FOOTER_UI.cookies) },
    { to: APP_ROUTES.REFUND_POLICY, label: t(ECOSYSTEM_FOOTER_UI.refunds) },
  ];

  const socialLinks = [
    { href: COMPANY_CONTACTS.social.telegram, icon: Send, label: 'Telegram' },
    { href: COMPANY_CONTACTS.social.instagram, icon: Instagram, label: 'Instagram' },
    { href: COMPANY_CONTACTS.social.whatsapp, icon: MessageCircle, label: 'WhatsApp' },
  ];

  // ─── Desktop: slim 3-row footer ────────────────────────────────────────
  if (isDesktop) {
    return (
      <footer ref={ref} className="border-t border-border bg-background mt-auto">
        <div className={cn(ECOSYSTEM_PAGE_CONTAINER, 'py-8 lg:py-10')}>
          {/* Row 1 — brand + socials */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-md space-y-2">
              <BrandWordmark as="static" />
              <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                {t(ECOSYSTEM_FOOTER_UI.brandTagline)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="grid h-9 w-9 place-items-center rounded-none border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Row 2 — legal links */}
          <nav
            aria-label={t(ECOSYSTEM_FOOTER_UI.companyHeading)}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans text-caption text-muted-foreground"
          >
            {legalLinks.map((link, i) => (
              <span key={link.to} className="flex items-center gap-x-5">
                {i > 0 && (
                  <span aria-hidden className="text-muted-foreground/40">·</span>
                )}
                <Link
                  to={link.to}
                  className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:underline"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>

          {/* Row 3 — copyright + made-in */}
          <div className="mt-6 flex flex-col gap-2 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-sans text-caption tracking-[0.04em] text-muted-foreground/70">
              © {new Date().getFullYear()} myUNO · Phuket Edition
            </p>
            <p className="font-sans text-caption tracking-[0.04em] text-muted-foreground/70">
              {t(ECOSYSTEM_FOOTER_UI.madeIn)}
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // ─── Mobile: centered slim footer + PWA install ────────────────────────
  return (
    <footer ref={ref} className="border-t border-border bg-background mt-auto pb-20 md:pb-0">
      <div className={cn(ECOSYSTEM_PAGE_CONTAINER, 'space-y-5 py-6')}>
        <div className="mx-auto max-w-md space-y-2 text-center">
          <div className="flex justify-center">
            <BrandWordmark as="static" />
          </div>
          <p className="px-1 font-sans text-body-sm leading-relaxed text-muted-foreground">
            {t(ECOSYSTEM_FOOTER_UI.brandTagline)}
          </p>
        </div>

        {!isInstalled && (
          <div className="flex justify-center">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-2 rounded-none border border-border bg-card px-4 py-2 font-sans text-body-sm font-medium text-foreground transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isIOS ? <Smartphone className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {t(ECOSYSTEM_FOOTER_UI.downloadApp)}
            </button>
          </div>
        )}

        <div className="flex justify-center gap-3">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="grid h-10 w-10 place-items-center rounded-none border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <social.icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <nav
          aria-label={t(ECOSYSTEM_FOOTER_UI.companyHeading)}
          className="flex flex-wrap justify-center gap-x-3 gap-y-2 font-sans text-caption text-muted-foreground"
        >
          {legalLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-center font-sans text-caption text-muted-foreground/70">
          © {new Date().getFullYear()} myUNO · Phuket Edition
        </p>
      </div>
    </footer>
  );
});

CompactFooter.displayName = 'CompactFooter';
