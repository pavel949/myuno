/**
 * Container rows for the Real Estate Hub — each fetches its own slice of live
 * listings and renders them into a FeaturedRow rail. Hooks are called
 * unconditionally; the rail degrades to a skeleton or empty state so a missing
 * data source never crashes the hub.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useOffplanProjects } from '@/hooks/useOffplanProjects';
import { useResaleProperties } from '@/hooks/useResaleProperties';
import { useFeaturedInvestments } from '@/hooks/useInvestmentProjects';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { OffplanProjectCard } from '@/components/property/OffplanProjectCard';
import { ResalePropertyCard } from '@/components/property/ResalePropertyCard';
import { InvestmentCard } from '@/components/invest/InvestmentCard';
import { APP_ROUTES } from '@/lib/config/routes';
import { FeaturedRow } from './FeaturedRow';

type TFn = (key: string) => string;

const HUB_LIMIT = 8;

export function RentFeaturedRow({ t }: { t: TFn }) {
  const { data = [], isLoading } = useFeaturedProperties(HUB_LIMIT);

  return (
    <FeaturedRow
      title={t('propertyHub.landing.row.rentTitle')}
      seeAllTo={`${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=short`}
      seeAllLabel={t('propertyHub.landing.row.seeAll')}
      emptyLabel={t('propertyHub.landing.row.empty')}
      isLoading={isLoading}
      isEmpty={data.length === 0}
    >
      {data.map((property) => (
        <PropertyListingCard key={property.id} property={property} mode="rent" />
      ))}
    </FeaturedRow>
  );
}

export function OffplanFeaturedRow({ t }: { t: TFn }) {
  const { data = [], isLoading } = useOffplanProjects();
  const projects = data.slice(0, HUB_LIMIT);

  return (
    <FeaturedRow
      title={t('propertyHub.landing.row.offplanTitle')}
      seeAllTo={APP_ROUTES.OFFPLAN}
      seeAllLabel={t('propertyHub.landing.row.seeAll')}
      emptyLabel={t('propertyHub.landing.row.empty')}
      isLoading={isLoading}
      isEmpty={projects.length === 0}
    >
      {projects.map((project) => (
        <OffplanProjectCard key={project.id} project={project} variant="carousel" />
      ))}
    </FeaturedRow>
  );
}

export function ResaleFeaturedRow({ t }: { t: TFn }) {
  const navigate = useNavigate();
  const { data = [], isLoading } = useResaleProperties();
  const items = data.slice(0, HUB_LIMIT);

  return (
    <FeaturedRow
      title={t('propertyHub.landing.row.resaleTitle')}
      seeAllTo={APP_ROUTES.RESALE}
      seeAllLabel={t('propertyHub.landing.row.seeAll')}
      emptyLabel={t('propertyHub.landing.row.empty')}
      isLoading={isLoading}
      isEmpty={items.length === 0}
      secondary={{
        to: APP_ROUTES.RESALE_LANDING,
        label: t('propertyHub.landing.resale.howItWorks'),
      }}
    >
      {items.map((property) => (
        <ResalePropertyCard
          key={property.id}
          property={property}
          onClick={() => navigate(APP_ROUTES.RESALE_DETAIL(property.id))}
        />
      ))}
    </FeaturedRow>
  );
}

export function InvestTeaserRow({ t }: { t: TFn }) {
  const { data = [], isLoading } = useFeaturedInvestments();

  return (
    <FeaturedRow
      title={t('propertyHub.landing.row.investTitle')}
      seeAllTo={APP_ROUTES.INVEST}
      seeAllLabel={t('propertyHub.landing.row.seeAll')}
      emptyLabel={t('propertyHub.landing.row.empty')}
      isLoading={isLoading}
      isEmpty={data.length === 0}
      itemWidthClassName="w-[260px]"
    >
      {data.map((project) => (
        <InvestmentCard key={project.id} project={project} variant="compact" />
      ))}
    </FeaturedRow>
  );
}
