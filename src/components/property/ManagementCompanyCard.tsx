/**
 * ManagementCompanyCard — compact tile for the public management-company
 * directory. Mirrors the profile header treatment (logo · name · verified ·
 * rating · district) and links to the company's public profile.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Star, MapPin, Building2 } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { getDistrictLabel } from '@/lib/taxonomies';
import type { ManagementCompany } from '@/hooks/useManagementCompanies';

interface ManagementCompanyCardProps {
  company: ManagementCompany;
  isRu: boolean;
}

export function ManagementCompanyCard({ company, isRu }: ManagementCompanyCardProps) {
  const name = isRu ? company.name_ru : company.name_en;
  const district = company.district
    ? getDistrictLabel(company.district, isRu ? 'ru' : 'en')
    : null;
  const propertiesCount = company.properties_count ?? 0;

  return (
    <Link
      to={APP_ROUTES.MANAGEMENT_COMPANY(company.slug)}
      className="group flex items-start gap-3 rounded-none border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-none border bg-muted">
        {company.logo ? (
          <img
            src={company.logo}
            alt={name}
            width={56}
            height={56}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <Building2 className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            {name}
          </span>
          {company.is_verified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label={isRu ? 'Проверено' : 'Verified'} />
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {company.rating != null && company.rating > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-foreground text-foreground" />
              {Number(company.rating).toFixed(1)}
            </span>
          )}
          {district && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {district}
            </span>
          )}
          {propertiesCount > 0 && (
            <span>
              {propertiesCount} {isRu ? 'объектов' : 'properties'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
