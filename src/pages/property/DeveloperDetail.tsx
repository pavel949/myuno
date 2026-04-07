/**
 * DeveloperDetail - Developer profile page
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Calendar,
  Users,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeveloper } from '@/hooks/useDevelopers';
import { useOffplanProjects } from '@/hooks/useOffplanProjects';
import { MuunoScoreWidget } from '@/components/invest/MuunoScoreWidget';
import { OffplanProjectCard } from '@/components/property/OffplanProjectCard';

export default function DeveloperDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: developer, isLoading } = useDeveloper(id || '');
  const { data: allProjects } = useOffplanProjects({ developerId: id });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4 p-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!developer) {
    return (
      <AppLayout title={isRu ? 'Не найдено' : 'Not Found'}>
        <div className="flex flex-col items-center justify-center py-20">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {isRu ? 'Застройщик не найден' : 'Developer not found'}
          </p>
          <Button variant="link" onClick={() => navigate('/property/developers')}>
            {isRu ? 'Вернуться к списку' : 'Back to list'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const name = isRu ? developer.nameRu : developer.nameEn;
  const description = isRu ? developer.descriptionRu : developer.descriptionEn;

  return (
    <AppLayout>
      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
        <BackButton fallbackPath={APP_ROUTES.DEVELOPERS} className="absolute top-4 left-4" />
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground px-4 pt-2">
        <Link to="/property/developers" className="hover:text-foreground">{isRu ? 'Застройщики' : 'Developers'}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate max-w-[200px]">{name}</span>
      </div>

      {/* Profile card */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="rounded-2xl border bg-card p-4 shadow-lg">
          <div className="flex items-start gap-4">
            {developer.logoUrl ? (
              <img
                src={developer.logoUrl}
                alt={name}
                className="w-20 h-20 rounded-xl object-contain bg-muted flex-shrink-0 -mt-12 border-4 border-background"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 -mt-12 border-4 border-background">
                <Building2 className="w-10 h-10 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 pt-2">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl">{name}</h1>
                {developer.isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
              {developer.foundedYear && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {isRu ? 'С' : 'Since'} {developer.foundedYear}
                </p>
              )}
            </div>

            {developer.muunoScore && (
              <MuunoScoreWidget score={developer.muunoScore} size="md" />
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-24 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold text-primary">{developer.projectsCompleted}</div>
            <div className="text-xs text-muted-foreground">{isRu ? 'Проектов' : 'Projects'}</div>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold">{developer.totalUnitsSold}</div>
            <div className="text-xs text-muted-foreground">{isRu ? 'Юнитов' : 'Units Sold'}</div>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold">
              {developer.averageRating > 0 ? `⭐ ${developer.averageRating.toFixed(1)}` : '—'}
            </div>
            <div className="text-xs text-muted-foreground">{isRu ? 'Рейтинг' : 'Rating'}</div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div>
            <h2 className="font-semibold mb-2">{isRu ? 'О компании' : 'About'}</h2>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        )}

        {/* Contact */}
        <div className="space-y-2">
          <h2 className="font-semibold mb-2">{isRu ? 'Контакты' : 'Contact'}</h2>
          {developer.website && (
            <a
              href={developer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Globe className="w-4 h-4" />
              {developer.website}
            </a>
          )}
          {developer.phone && (
            <a href={`tel:${developer.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              {developer.phone}
            </a>
          )}
          {developer.email && (
            <a href={`mailto:${developer.email}`} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              {developer.email}
            </a>
          )}
        </div>

        {/* Projects */}
        {allProjects && allProjects.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">
              {isRu ? 'Проекты' : 'Projects'} ({allProjects.length})
            </h2>
            <div className="space-y-4">
              {allProjects.map(project => (
                <OffplanProjectCard
                  key={project.id}
                  project={project}
                  variant="grid"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
