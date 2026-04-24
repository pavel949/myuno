/**
 * PropertyMySection — Personal property hub
 * Routes owners to management, investors to portfolio, guests to auth CTA
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, TrendingUp, LogIn, ArrowRight, Home, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useMyDelegations } from '@/hooks/usePropertyDelegates';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function PropertyMySection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {isRu ? 'Войдите, чтобы управлять недвижимостью' : 'Sign in to manage your property'}
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          {isRu
            ? 'Добавляйте объекты, отслеживайте бронирования и управляйте портфелем'
            : 'Add properties, track bookings, and manage your portfolio'}
        </p>
        <Button onClick={() => navigate('/auth')} size="lg">
          {isRu ? 'Войти' : 'Sign In'}
        </Button>
      </div>
    );
  }

  return (
    <AuthenticatedMySection />
  );
}

function AuthenticatedMySection() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { allProperties, isLoading, isOwner, isManager, hasProperties } = useMyProperties();
  const { data: delegations = [], isLoading: delegLoading } = useMyDelegations();

  // Filter active delegations with property data
  const activeDelegations = delegations.filter(
    (d: any) => d.status === 'active' && d.property
  );

  const sections = [
    {
      id: 'manage',
      icon: Building2,
      title: isRu ? 'Управление объектами' : 'Property Management',
      description: isRu
        ? `${allProperties.length} объект${allProperties.length !== 1 ? 'ов' : ''} в управлении`
        : `${allProperties.length} propert${allProperties.length !== 1 ? 'ies' : 'y'} managed`,
      path: '/owner',
      show: isOwner || isManager || hasProperties,
      gradient: 'from-primary to-primary/70',
    },
    {
      id: 'invest',
      icon: TrendingUp,
      title: isRu ? 'Инвестиционный портфель' : 'Investment Portfolio',
      description: isRu ? 'Проекты и аналитика' : 'Projects & analytics',
      // /property/invest legacy → /invest (handled by router redirect, but link directly to canonical)
      path: '/invest',
      show: true,
      gradient: 'from-success to-success/70',
    },
    {
      id: 'add',
      icon: Home,
      title: isRu ? 'Добавить объект' : 'Add Property',
      description: isRu ? 'Разместить на платформе' : 'List on the platform',
      path: '/owner',
      show: true,
      gradient: 'from-accent to-accent/70',
    },
  ];

  return (
    <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-foreground">
        {isRu ? 'Мои объекты' : 'My Property'}
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-none bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sections.filter(s => s.show).map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-border/50"
                onClick={() => navigate(section.path)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={cn(
                    "w-12 h-12 rounded-none flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                    section.gradient
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delegated properties — Transparency Portal access */}
      {activeDelegations.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            {isRu ? 'Управляемые объекты' : 'Managed Properties'}
          </h2>
          <p className="text-xs text-muted-foreground -mt-1">
            {isRu 
              ? 'Объекты, переданные вам в управление. Нажмите для просмотра отчётности.'
              : 'Properties delegated to you. Tap to view reports.'}
          </p>
          {activeDelegations.map((d: any) => {
            const prop = d.property;
            return (
              <Card
                key={d.id}
                variant="interactive"
                onClick={() => navigate(`/owner/transparency/${prop.id}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {prop.cover_image ? (
                    <img src={prop.cover_image} alt="" className="w-12 h-12 rounded-none object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-none bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {isRu ? (prop.title_ru || prop.title) : prop.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{prop.address}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {delegLoading && activeDelegations.length === 0 && (
        <div className="h-16 rounded-none bg-muted animate-pulse" />
      )}
    </div>
  );
}
