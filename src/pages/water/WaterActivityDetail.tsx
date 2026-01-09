import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWaterActivity } from "@/hooks/useWaterActivities";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Star, Clock, Users, MapPin, Shield, Check, 
  AlertTriangle, Calendar, ChevronRight 
} from "lucide-react";

export default function WaterActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { activity, isLoading } = useWaterActivity(id);

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <Skeleton className="w-full h-64 rounded-2xl" />
          <Skeleton className="w-3/4 h-8 mt-4" />
          <Skeleton className="w-full h-24 mt-4" />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!activity) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="text-center py-12">
            <p>{t('water.notFound')}</p>
            <Button onClick={() => navigate('/water')} className="mt-4">
              {t('water.goBack')}
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      easy: t('water.difficulty.easy'),
      moderate: t('water.difficulty.moderate'),
      challenging: t('water.difficulty.challenging'),
      expert: t('water.difficulty.expert'),
    };
    return labels[difficulty] || difficulty;
  };

  return (
    <AppLayout>
      <PageContainer className="pb-24">
        {/* Header Image */}
        <div className="relative -mx-4 -mt-4">
          <img
            src={activity.cover_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'}
            alt={language === 'ru' ? activity.title_ru : activity.title_en}
            className="w-full h-72 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
            onClick={() => navigate('/water')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {activity.is_certified && (
            <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
              <Shield className="w-4 h-4 mr-1" />
              {t('water.certified')}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="relative -mt-16 space-y-6">
          <div className="bg-card rounded-2xl p-4 shadow-lg border">
            <h1 className="text-xl font-bold mb-2">
              {language === 'ru' ? activity.title_ru : activity.title_en}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {activity.rating} ({activity.review_count})
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {activity.duration_minutes ? `${Math.round(activity.duration_minutes / 60)}h` : '-'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {t('water.max')} {activity.max_participants}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm mb-4">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{activity.location_name}</span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('water.pricePer')} {activity.price_per}
                </p>
                <p className="text-2xl font-bold text-primary">
                  ฿{activity.price?.toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">{getDifficultyLabel(activity.difficulty)}</Badge>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card rounded-2xl p-4 border">
            <h2 className="font-semibold mb-3">
              {t('water.description')}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === 'ru' ? activity.description_ru : activity.description_en}
            </p>
          </div>

          {/* What's Included */}
          {activity.includes.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border">
              <h2 className="font-semibold mb-3">
                {t('water.whatsIncluded')}
              </h2>
              <div className="space-y-2">
                {activity.includes.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {activity.requirements.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border">
              <h2 className="font-semibold mb-3">
                {t('water.requirements')}
              </h2>
              <div className="space-y-2">
                {activity.requirements.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Info */}
          {activity.safety_briefing_required && (
            <div className="bg-yellow-500/10 rounded-2xl p-4 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-yellow-600" />
                <h2 className="font-semibold text-yellow-600">
                  {t('water.safety')}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('water.safetyRequired')}. {t('water.minAge')}: {activity.age_restriction} {t('water.years')}.
              </p>
            </div>
          )}

          {/* Meeting Point */}
          <div className="bg-card rounded-2xl p-4 border">
            <h2 className="font-semibold mb-3">
              {t('water.meetingPoint')}
            </h2>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">{activity.meeting_point}</p>
                <p className="text-sm text-muted-foreground">{activity.location_name}</p>
              </div>
            </div>
          </div>

          {/* Available Times */}
          <div className="bg-card rounded-2xl p-4 border">
            <h2 className="font-semibold mb-3">
              {t('water.availableTimes')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {activity.available_times.map((time, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  <Calendar className="w-3 h-3 mr-1" />
                  {time}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t">
          <Button 
            className="w-full h-12 text-base font-semibold" 
            onClick={() => navigate(`/water/${id}/book`)}
          >
            {t('water.bookNow')}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
