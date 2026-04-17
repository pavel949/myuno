/**
 * DevelopersIndex - Catalog of property developers
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, TrendingUp, ExternalLink } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDevelopers } from '@/hooks/useDevelopers';
import { MuunoScoreWidget } from '@/components/invest/MuunoScoreWidget';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

export default function DevelopersIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: developers, isLoading } = useDevelopers();

  return (
    <AppLayout 
      title={isRu ? 'Застройщики' : 'Developers'}
    >
      <div className="px-4 py-4 pb-24 space-y-4">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 p-4 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-xl">
                {isRu ? 'Застройщики Пхукета' : 'Phuket Developers'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Проверенные партнёры с рейтингом muUNO' : 'Verified partners with muUNO rating'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL_APPLY)}
          >
            {isRu ? 'Я застройщик — добавить компанию' : "I'm a developer — list my company"}
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : developers && developers.length > 0 ? (
          <div className="space-y-4">
            {developers.map(dev => (
              <div
                key={dev.id}
                onClick={() => navigate(APP_ROUTES.DEVELOPER_DETAIL(dev.id))}
                className={cn(
                  "rounded-xl border bg-card p-4 cursor-pointer",
                  "hover:border-primary/50 hover:shadow-md transition-all"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  {dev.logoUrl ? (
                    <img
                      src={dev.logoUrl}
                      alt={dev.nameEn}
                      className="w-16 h-16 rounded-xl object-contain bg-muted flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">
                        {isRu ? dev.nameRu : dev.nameEn}
                      </h3>
                      {dev.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                      {dev.isFeatured && (
                        <Badge className="bg-accent-amber text-white text-xs">
                          {isRu ? 'Топ' : 'Top'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{dev.projectsCompleted} {isRu ? 'проектов' : 'projects'}</span>
                      {dev.averageRating > 0 && (
                        <span>⭐ {dev.averageRating.toFixed(1)}</span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  {dev.muunoScore && (
                    <MuunoScoreWidget score={dev.muunoScore} size="sm" />
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    {dev.totalUnitsSold} {isRu ? 'юнитов продано' : 'units sold'}
                  </span>
                  <Button variant="ghost" size="sm" className="gap-1">
                    {isRu ? 'Проекты' : 'Projects'}
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {isRu ? 'Застройщики не найдены' : 'No developers found'}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
