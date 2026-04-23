/**
 * ManagementCompanyProfile — Public page for a management company
 * Route: /company/:slug
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useManagementCompanyBySlug } from '@/hooks/useManagementCompanies';
import { usePropertiesInfinite } from '@/hooks/useProperties';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2, Star, Phone, Mail, Globe, MapPin,
  Shield, Calendar, MessageCircle, Users, Loader2,
} from 'lucide-react';

export default function ManagementCompanyProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { data: company, isLoading } = useManagementCompanyBySlug(slug);

  // Fetch properties managed by this company
  const { data: propData, isLoading: propsLoading } = usePropertiesInfinite({
    managementCompanyId: company?.id,
  });

  const properties = propData?.pages.flatMap(p => p.properties) || [];

  if (isLoading) {
    return (
      <AppLayout showHeader={false} showBottomNav>
        <div className="min-h-screen bg-background p-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-none" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </AppLayout>
    );
  }

  if (!company) {
    return (
      <AppLayout showHeader={false} showBottomNav>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {isRu ? 'Компания не найдена' : 'Company not found'}
            </h2>
            <Button variant="outline" onClick={() => navigate('/property')}>
              {isRu ? 'К объектам' : 'Browse properties'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const name = isRu ? company.name_ru : company.name_en;
  const description = isRu ? company.description_ru : company.description_en;

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background pb-24">
        {/* Cover */}
        <div className="relative h-48 sm:h-64 bg-muted">
          {company.cover_image ? (
            <img src={company.cover_image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Building2 className="w-16 h-16 text-primary/30" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <BackButton fallbackPath="/property" />
          </div>
        </div>

        {/* Company Info */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="bg-card rounded-none border shadow-sm p-4">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-16 h-16 rounded-none bg-muted border overflow-hidden shrink-0">
                {company.logo ? (
                  <img src={company.logo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{name}</h1>
                  {company.is_verified && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Shield className="w-3 h-3" />
                      {isRu ? 'Проверено' : 'Verified'}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {company.rating != null && company.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current text-primary" />
                      {Number(company.rating).toFixed(1)}
                      {company.review_count ? ` (${company.review_count})` : ''}
                    </span>
                  )}
                  {company.district && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {company.district}
                    </span>
                  )}
                  {company.founded_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {isRu ? `с ${company.founded_year}` : `est. ${company.founded_year}`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {description}
              </p>
            )}

            {/* Services */}
            {company.services && company.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {company.services.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            )}

            {/* Languages */}
            {company.languages && company.languages.length > 0 && (
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {company.languages.join(', ')}
              </div>
            )}

            {/* Contact buttons */}
            <div className="flex gap-2 mt-4">
              {company.phone && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={`tel:${company.phone}`}>
                    <Phone className="w-3.5 h-3.5" />
                    {isRu ? 'Позвонить' : 'Call'}
                  </a>
                </Button>
              )}
              {company.whatsapp && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </Button>
              )}
              {company.email && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={`mailto:${company.email}`}>
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </a>
                </Button>
              )}
              {company.website && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-3.5 h-3.5" />
                    {isRu ? 'Сайт' : 'Website'}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio */}
        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold mb-3">
            {isRu ? 'Объекты под управлением' : 'Managed properties'}
            {properties.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({properties.length})
              </span>
            )}
          </h2>

          {propsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {properties.map(property => (
                <PropertyListingCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {isRu ? 'Объекты пока не добавлены' : 'No properties listed yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
