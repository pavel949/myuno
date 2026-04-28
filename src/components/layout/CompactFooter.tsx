import { forwardRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Instagram, MessageCircle, Download, Smartphone, Shield, Clock, CheckCircle } from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/config';
import { APP_ROUTES } from '@/lib/config/routes';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import {
  ECOSYSTEM_APP_TRIPLET,
  ECOSYSTEM_FOOTER_UI,
  pickTriplet,
  type LocalizedTriplet,
} from '@/lib/ecosystemGlossary';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
import { cn } from '@/lib/utils';

const FOOTER_SERVICE_SECTIONS: Array<{
  clusterId: 'arrive' | 'live' | 'legal' | 'build';
  fallbackTitle: LocalizedTriplet;
  serviceIds: string[][];
}> = [
  {
    clusterId: 'arrive',
    fallbackTitle: { ru: 'Прибытие', en: 'Arrival', th: 'การเดินทาง' },
    serviceIds: [['sos'], ['transfer'], ['fast-track'], ['sim'], ['exchange']],
  },
  {
    clusterId: 'live',
    fallbackTitle: { ru: 'Жизнь', en: 'Live', th: 'ใช้ชีวิต' },
    serviceIds: [['services'], ['cleaning'], ['medical'], ['restaurants', 'restaurant'], ['school-finder']],
  },
  {
    clusterId: 'legal',
    fallbackTitle: { ru: 'Право и визы', en: 'Legal & Visa', th: 'กฎหมายและวีซ่า' },
    serviceIds: [['visa'], ['legal'], ['contract-ai'], ['relocate'], ['knowledge']],
  },
  {
    clusterId: 'build',
    fallbackTitle: { ru: 'Застройщикам', en: 'Build', th: 'ผู้พัฒนา' },
    serviceIds: [['developer-portal'], ['newbuilds'], ['program'], ['advisory']],
  },
];

export const CompactFooter = forwardRef<HTMLElement>((_props, ref) => {
  const { language } = useLanguage();
  const { isInstalled, canInstall, isIOS, install } = usePWAInstall();
  const isDesktop = useIsDesktop();
  const { clusterCatalog } = useCatalogFromDB();
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

  const footerGroups = useMemo(() => {
    return FOOTER_SERVICE_SECTIONS.map((section) => {
      const cluster = clusterCatalog.find((c) => c.id === section.clusterId);
      const services = cluster?.categories.flatMap((category) => category.services) ?? [];

      const items = section.serviceIds
        .map((ids) => services.find((service) => ids.includes(service.id) && service.status !== 'soon'))
        .filter((service): service is NonNullable<typeof service> => Boolean(service))
        .map((service) => ({
          to: service.path,
          label: pickTriplet(
            { ru: service.labelRu, en: service.labelEn, th: service.labelTh ?? service.labelEn },
            language,
          ),
        }));

      return {
        title: cluster
          ? pickTriplet({ ru: cluster.labelRu, en: cluster.labelEn, th: cluster.labelTh ?? cluster.labelEn }, language)
          : pickTriplet(section.fallbackTitle, language),
        items,
      };
    }).filter((group) => group.items.length > 0);
  }, [clusterCatalog, language]);

  const re = ECOSYSTEM_APP_TRIPLET;
  const realEstateLinks = [
    { to: APP_ROUTES.PROPERTY_RENT_SHORT, label: t(re['property-rent-short']) },
    { to: APP_ROUTES.PROPERTY_RENT_LONG, label: t(re['property-rent-long']) },
    { to: APP_ROUTES.RESALE, label: t(re['property-purchase']) },
    { to: APP_ROUTES.OFFPLAN, label: t(re['property-offplan-combo']) },
    { to: APP_ROUTES.INVEST, label: t(re['property-invest-footer']) },
    { to: APP_ROUTES.DEVELOPERS, label: t(re.developers) },
  ];

  const companyLinks = [
    { to: APP_ROUTES.ABOUT, label: t(ECOSYSTEM_FOOTER_UI.about) },
    { to: APP_ROUTES.FAQ, label: t(ECOSYSTEM_FOOTER_UI.faq) },
    { to: APP_ROUTES.SUPPORT, label: t(ECOSYSTEM_FOOTER_UI.support) },
    { to: APP_ROUTES.VIP_CONCIERGE, label: t(re['vip-concierge']) },
    { to: APP_ROUTES.TERMS, label: t(ECOSYSTEM_FOOTER_UI.terms) },
    { to: APP_ROUTES.PRIVACY, label: t(ECOSYSTEM_FOOTER_UI.privacy) },
    { to: APP_ROUTES.COOKIES, label: t(ECOSYSTEM_FOOTER_UI.cookies) },
    { to: APP_ROUTES.REFUND_POLICY, label: t(ECOSYSTEM_FOOTER_UI.refunds) },
  ];

  const socialLinks = [
    { href: COMPANY_CONTACTS.social.telegram, icon: Send, label: 'Telegram', hoverColor: 'hover:text-info' },
    { href: COMPANY_CONTACTS.social.instagram, icon: Instagram, label: 'Instagram', hoverColor: 'hover:text-accent-purple' },
    { href: COMPANY_CONTACTS.social.whatsapp, icon: MessageCircle, label: 'WhatsApp', hoverColor: 'hover:text-success' },
  ];

  const trustBadges = [
    { icon: CheckCircle, trip: ECOSYSTEM_FOOTER_UI.trustVerified },
    { icon: Clock, trip: ECOSYSTEM_FOOTER_UI.trust247 },
    { icon: Shield, trip: ECOSYSTEM_FOOTER_UI.trustData },
  ];

  // Desktop: professional multi-column footer
  if (isDesktop) {
    // Left: arrive, live, enjoy (first 3 journey groups)
    // Right: health, settle (remaining groups)
    const leftGroups = footerGroups.slice(0, 3);
    const rightGroups = footerGroups.slice(3);

    return (
      <footer ref={ref} className="border-t border-border/40 bg-muted/10 mt-auto">
        <div className={cn(ECOSYSTEM_PAGE_CONTAINER, 'py-10 lg:py-12')}>
          {/* Main grid — 6 columns */}
          <div className="grid grid-cols-6 gap-6 xl:gap-8 mb-8">

            {/* Brand column */}
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                <span className="text-base text-muted-foreground font-light">my</span>
                <span className="text-lg font-semibold text-foreground font-display">UNO</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(ECOSYSTEM_FOOTER_UI.brandTagline)}
              </p>
              <div className="flex gap-3 pt-1">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center w-9 h-9 rounded-none bg-muted/50 hover:bg-muted text-muted-foreground transition-all duration-200 ${social.hoverColor}`}
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Services — left (Home, Transport, Leisure) */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">
                {t(ECOSYSTEM_FOOTER_UI.servicesHeading)}
              </h4>
              <nav className="flex flex-col gap-4">
                {leftGroups.map((group) => (
                  <div key={group.title} className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                      {group.title}
                    </span>
                    {group.items.map((link) => (
                      <Link key={link.to} to={link.to} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </div>

            {/* Services — right (Wellness, Docs & Finance) */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground invisible">&nbsp;</h4>
              <nav className="flex flex-col gap-4">
                {rightGroups.map((group) => (
                  <div key={group.title} className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                      {group.title}
                    </span>
                    {group.items.map((link) => (
                      <Link key={link.to} to={link.to} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </div>

            {/* Real Estate column */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                {t(ECOSYSTEM_FOOTER_UI.realEstateHeading)}
              </h4>
              <nav className="flex flex-col gap-2.5">
                {realEstateLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Company column */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                {t(ECOSYSTEM_FOOTER_UI.companyHeading)}
              </h4>
              <nav className="flex flex-col gap-2.5">
                {companyLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Trust column */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                {t(ECOSYSTEM_FOOTER_UI.trustHeading)}
              </h4>
              <div className="flex flex-col gap-3">
                {trustBadges.map((badge) => (
                  <div key={badge.trip.en} className="flex items-center gap-2">
                    <badge.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {t(badge.trip)}
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
              {t(ECOSYSTEM_FOOTER_UI.madeIn)}
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Mobile: compact footer
  return (
    <footer ref={ref} className="border-t border-border/50 bg-muted/30 mt-auto pb-20 md:pb-0">
      <div className={cn(ECOSYSTEM_PAGE_CONTAINER, 'py-6 space-y-4')}>
        {!isInstalled && (
          <div className="flex justify-center">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium transition-all "
            >
              {isIOS ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {t(ECOSYSTEM_FOOTER_UI.downloadApp)}
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
});

CompactFooter.displayName = 'CompactFooter';
