import { forwardRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Instagram, MessageCircle, Download, Smartphone, Shield, Clock, CheckCircle } from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/config';
import { APP_ROUTES } from '@/lib/config/routes';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { BrandWordmark } from '@/components/uno/BrandWordmark';
import {
  ECOSYSTEM_APP_TRIPLET,
  ECOSYSTEM_FOOTER_UI,
  pickTriplet,
  type LocalizedTriplet,
} from '@/lib/ecosystemGlossary';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
import { cn } from '@/lib/utils';

const FOOTER_SERVICE_SECTIONS: Array<{
  clusterId: 'arrive' | 'live' | 'invest' | 'legal' | 'build';
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
    clusterId: 'invest',
    fallbackTitle: { ru: 'Инвестиции', en: 'Invest', th: 'การลงทุน' },
    serviceIds: [['property'], ['offplan'], ['resale'], ['roi-hub']],
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

  // Desktop: professional multi-column footer (≥ md breakpoint)
  if (isDesktop) {
    const leftGroups = footerGroups.slice(0, 3);
    const rightGroups = footerGroups.slice(3);
    const servicesNavId = 'compact-footer-services-nav';

    return (
      <footer ref={ref} className="border-t border-border/40 bg-muted/10 mt-auto">
        <div className={cn(ECOSYSTEM_PAGE_CONTAINER, 'py-6 lg:py-8')}>
          {/* Main grid — 2 cols → 3 (sm) → 6 (lg); services spans 2 cols on lg */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 xl:gap-6 mb-5">

            {/* Brand column */}
            <div className="space-y-3">
              <BrandWordmark as="static" />
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

            {/* Services — one landmark nav, two sub-columns (no duplicate / invisible headings) */}
            <div className="space-y-3 sm:col-span-2 lg:col-span-2">
              <h4 id={servicesNavId} className="text-sm font-semibold text-foreground">
                {t(ECOSYSTEM_FOOTER_UI.servicesHeading)}
              </h4>
              <nav aria-labelledby={servicesNavId} className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex flex-col gap-3">
                  {leftGroups.map((group) => (
                    <div key={group.title} className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                        {group.title}
                      </span>
                      <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
                        {group.items.map((link) => (
                          <li key={link.to}>
                            <Link
                              to={link.to}
                              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {rightGroups.map((group) => (
                    <div key={group.title} className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                        {group.title}
                      </span>
                      <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
                        {group.items.map((link) => (
                          <li key={link.to}>
                            <Link
                              to={link.to}
                              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </nav>
            </div>

            {/* Real Estate column */}
            <div className="space-y-3">
              <h4 id="compact-footer-re" className="text-sm font-semibold text-foreground">
                {t(ECOSYSTEM_FOOTER_UI.realEstateHeading)}
              </h4>
              <nav aria-labelledby="compact-footer-re" className="flex flex-col gap-2.5">
                <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                  {realEstateLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Company column */}
            <div className="space-y-3">
              <h4 id="compact-footer-company" className="text-sm font-semibold text-foreground">
                {t(ECOSYSTEM_FOOTER_UI.companyHeading)}
              </h4>
              <nav aria-labelledby="compact-footer-company" className="flex flex-col gap-2.5">
                <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                  {companyLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Trust column */}
            <div className="space-y-3">
              <h4 id="compact-footer-trust" className="text-sm font-semibold text-foreground">
                {t(ECOSYSTEM_FOOTER_UI.trustHeading)}
              </h4>
              <ul className="flex flex-col gap-3 list-none p-0 m-0" aria-labelledby="compact-footer-trust">
                {trustBadges.map((badge) => (
                  <li key={badge.trip.en} className="flex items-center gap-2">
                    <badge.icon className="w-4 h-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm text-muted-foreground">{t(badge.trip)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/30 pt-4 flex items-center justify-between">
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

  // Mobile: compact footer (< md)
  return (
    <footer ref={ref} className="border-t border-border/50 bg-muted/30 mt-auto pb-20 md:pb-0">
      <div className={cn(ECOSYSTEM_PAGE_CONTAINER, 'py-6 space-y-4')}>
        <div className="text-center space-y-2 max-w-md mx-auto">
          <div className="flex justify-center">
            <BrandWordmark as="static" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed px-1">
            {t(ECOSYSTEM_FOOTER_UI.brandTagline)}
          </p>
        </div>

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

        <nav aria-label={t(ECOSYSTEM_FOOTER_UI.companyHeading)} className="flex flex-wrap justify-center gap-x-3 gap-y-2">
          {companyLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} myUNO · Phuket Edition
        </p>
      </div>
    </footer>
  );
});

CompactFooter.displayName = 'CompactFooter';
