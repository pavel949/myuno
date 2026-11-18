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
import { Send, Instagram, Youtube, Linkedin, Facebook, ArrowUpRight, MessageCircle, Download, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatformSocialLinks } from '@/hooks/usePlatformSocialLinks';
import { COMPANY_CONTACTS } from '@/lib/config';
import { APP_ROUTES } from '@/lib/config/routes';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { BrandWordmark } from '@/components/uno/BrandWordmark';
import { ECOSYSTEM_FOOTER_UI, pickTriplet } from '@/lib/ecosystemGlossary';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
import { cn } from '@/lib/utils';
import { SURFACE_LANDINGS } from '@/lib/landings/surfaceLandings';
import { LegalCopyright } from '@/components/legal/LegalEntityInfo';

export const CompactFooter = forwardRef<HTMLElement>((_props, ref) => {
  const { language } = useLanguage();
  const socialSettings = usePlatformSocialLinks();
  const { isInstalled, canInstall, isIOS, install } = usePWAInstall();
  // Use ≥1024px (true laptop/desktop) for the wide footer — phones in PWA
  // standalone sometimes report ≥768px and were getting the desktop layout.
  const { isLargeDesktop } = useBreakpoint();
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
    ...(socialSettings.data?.youtube ? [{ href: socialSettings.data.youtube, icon: Youtube, label: 'YouTube' }] : []),
    ...(socialSettings.data?.instagram ? [{ href: socialSettings.data.instagram, icon: Instagram, label: 'Instagram' }] : []),
    ...(socialSettings.data?.linkedin ? [{ href: socialSettings.data.linkedin, icon: Linkedin, label: 'LinkedIn' }] : []),
    ...(socialSettings.data?.facebook ? [{ href: socialSettings.data.facebook, icon: Facebook, label: 'Facebook' }] : []),
    { href: COMPANY_CONTACTS.social.whatsapp, icon: MessageCircle, label: 'WhatsApp' },
  ];

  const socialPanel = <section aria-label={t({ ru: 'Социальные сети и связь', en: 'Social networks and contact', th: 'โซเชียลมีเดียและการติดต่อ' })} className="w-full border border-border bg-muted/30 p-4 lg:w-auto lg:shrink-0">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg">{t({ ru: 'Будем на связи', en: 'Stay connected', th: 'ติดตามและติดต่อเรา' })}</h2>
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

  // ─── Desktop: slim 3-row footer ────────────────────────────────────────
  if (isLargeDesktop) {
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
            {socialPanel}
          </div>

          {/* Row 1.5 — surface explore (Master Taxonomy v1.0) */}
          <nav
            aria-label={t({ ru: 'Жизненный цикл', en: 'Lifecycle', th: 'ช่วงการใช้ชีวิต' })}
            className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-caption"
          >
            <span className="text-muted-foreground/70">
              {t({ ru: 'Жизненный цикл:', en: 'Lifecycle:', th: 'ช่วงการใช้ชีวิต:' })}
            </span>
            {SURFACE_LANDINGS.map((s) => (
              <Link
                key={s.slug}
                to={s.href}
                className="text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:underline"
              >
                {t({ ru: s.titleRu, en: s.titleEn, th: s.titleTh })}
              </Link>
            ))}
          </nav>

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
              <LegalCopyright />
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
              className="inline-flex min-h-11 items-center gap-2 rounded-none border border-border bg-card px-4 py-2 font-sans text-body-sm font-medium text-foreground transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isIOS ? <Smartphone className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {t(ECOSYSTEM_FOOTER_UI.downloadApp)}
            </button>
          </div>
        )}

        <div className="flex justify-center">{socialPanel}</div>

        <nav
          aria-label={t({ ru: 'Жизненный цикл', en: 'Lifecycle', th: 'ช่วงการใช้ชีวิต' })}
          className="flex flex-wrap justify-center gap-x-3 gap-y-2 font-sans text-caption"
        >
          {SURFACE_LANDINGS.map((s) => (
            <Link
              key={s.slug}
              to={s.href}
              className="text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:underline"
            >
              {t({ ru: s.titleRu, en: s.titleEn, th: s.titleTh })}
            </Link>
          ))}
        </nav>

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
          <LegalCopyright />
        </p>
      </div>
    </footer>
  );
});

CompactFooter.displayName = 'CompactFooter';
