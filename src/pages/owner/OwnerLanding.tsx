import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MoneySnapshotWidget, 
  NextEventCard, 
  QuickServiceGrid, 
  PropertyOnboardingHero 
} from '@/components/owner/landing';
import { Building2, ArrowRight, Sparkles, ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OwnerLanding() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data: properties, isLoading } = useOwnerProperties();

  const hasProperties = properties && properties.length > 0;

  // Redirect to dashboard if user has properties
  if (user && hasProperties) {
    return (
      <AppLayout showFooter>
        <PageContainer>
          <PageHeader 
            title={isRu ? 'Мои объекты' : 'My Properties'}
            showBack
          />

          <div className="space-y-4">
            {/* Money Snapshot */}
            <MoneySnapshotWidget />

            {/* Next Event */}
            <NextEventCard />

            {/* Quick Services */}
            <QuickServiceGrid />

            {/* Properties Mini Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">
                  {isRu ? 'Мои объекты' : 'My Properties'}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => navigate('/owner/properties')}
                >
                  {isRu ? 'Все' : 'All'}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {properties.slice(0, 4).map((property) => (
                  <Card 
                    key={property.id}
                    className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                    onClick={() => navigate(`/owner/properties/${property.id}/manage`)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-video rounded-lg bg-muted mb-2 overflow-hidden">
                        {property.cover_image ? (
                          <img 
                            src={property.cover_image} 
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-xs line-clamp-1">
                        {property.title}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Full Management CTA */}
            <Card className="bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-warning/20 shrink-0">
                    <Sparkles className="h-5 w-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">
                      {isRu ? 'Полное управление' : 'Full Management'}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {isRu 
                        ? 'Передайте нам управление — 70% дохода вам' 
                        : 'Let us manage — keep 70% of income'}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => navigate('/owner/full-management')}
                    >
                      {isRu ? 'Узнать больше' : 'Learn More'}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout showFooter>
        <PageContainer>
          <PageHeader 
            title={isRu ? 'Для собственников' : 'For Property Owners'}
            showBack
          />
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // New user without properties - show onboarding
  return (
    <AppLayout showFooter>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Для собственников' : 'For Property Owners'}
          showBack
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Onboarding Hero */}
          <PropertyOnboardingHero />

          {/* Quick Stats - Platform benefits */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: '85%', labelEn: 'Occupancy', labelRu: 'Загрузка' },
              { value: '24/7', labelEn: 'Support', labelRu: 'Поддержка' },
              { value: '4.9', labelEn: 'Rating', labelRu: 'Рейтинг' },
            ].map((stat, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-3">
                  <div className="text-lg font-bold text-primary">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {isRu ? stat.labelRu : stat.labelEn}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* If not logged in, show auth CTA */}
          {!user && (
            <Card className="border-primary/30">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  {isRu 
                    ? 'Войдите, чтобы добавить объект' 
                    : 'Sign in to add your property'}
                </p>
                <Button 
                  className="w-full"
                  onClick={() => navigate('/auth?redirect=/owner/properties/new')}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {isRu ? 'Войти и добавить' : 'Sign In & Add'}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </PageContainer>
    </AppLayout>
  );
}
