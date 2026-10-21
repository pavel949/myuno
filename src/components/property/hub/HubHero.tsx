/** Shared residential search entry; new developments retain their own catalogue. */
import { Link } from 'react-router-dom';
import { HomeDiscoverySearch } from '@/components/home/HomeDiscoverySearch';
import { APP_ROUTES } from '@/lib/config/routes';
import '@/styles/cinematic-home.css';

type TFn = (key: string) => string;
export function HubHero({ t, isRu }: { t: TFn; isRu: boolean }) {
  return (
    <section aria-labelledby="hub-hero-heading" className="space-y-5">
      <div>
        <h1
          id="hub-hero-heading"
          className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
        >
          {t('propertyHub.landing.heading')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('propertyHub.landing.subheading')}
        </p>
      </div>

      <div className="journey-primary rounded-none border border-border bg-card p-4">
        <HomeDiscoverySearch />
      </div>
      <Link className="inline-flex min-h-11 items-center underline underline-offset-4" to={APP_ROUTES.OFFPLAN}>
        {isRu ? 'Новостройки' : 'New developments'}
      </Link>
    </section>
  );
}
