import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Compass, Waves, Star, Shield, Clock, MapPin, Users, Calendar,
  Check, X, AlertTriangle, Info, ExternalLink, Truck
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExperience, formatDuration, getDifficultyColor } from '@/hooks/useExperiences';
import { useExperiencePricing } from '@/hooks/useExperiencePricing';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CrossSellSection, RelatedServicesSection } from '@/components/crosssell';
import { getContextualCrossSell } from '@/lib/crossSellConfig';
import { SEOHead, createTouristAttractionSchema } from '@/components/seo';
import { cn } from '@/lib/utils';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

export default function ExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { experience, isLoading, error } = useExperience(id);
  const { data: pricingOptions = [] } = useExperiencePricing(id);
  const [activeImage, setActiveImage] = useState(0);
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <MiniAppLayout title="" fallbackPath="/experiences" showHero={false} showFilter={false} showCategories={false}>
        <div className="space-y-4 animate-pulse">
          <div className="h-64 bg-muted rounded-none" />
          <div className="h-8 bg-muted rounded-none w-3/4" />
          <div className="h-4 bg-muted rounded-none w-1/2" />
        </div>
      </MiniAppLayout>
    );
  }

  if (error || !experience) {
    return (
      <MiniAppLayout title="" fallbackPath="/experiences" showHero={false} showFilter={false} showCategories={false}>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">
            {isRu ? 'Не найдено' : 'Not Found'}
          </h3>
          <Button onClick={() => navigate('/experiences')} variant="outline">
            {isRu ? 'Назад к списку' : 'Back to list'}
          </Button>
        </div>
      </MiniAppLayout>
    );
  }

  const isTour = experience.experience_type === 'tour';
  const images = experience.cover_image 
    ? [experience.cover_image, ...(experience.images || [])]
    : experience.images || [];

  const expTitle = isRu ? experience.title_ru : experience.title_en;
  const expDesc = isRu ? (experience.description_ru || '') : (experience.description_en || '');

  return (
    <MiniAppLayout
      title={expTitle}
      fallbackPath="/experiences"
      showHero={false}
      showFilter={false}
      showCategories={false}
    >
      <SEOHead
        title={expTitle}
        description={expDesc.slice(0, 160)}
        image={experience.cover_image || undefined}
        type="product"
        jsonLd={createTouristAttractionSchema({
          name: expTitle || '',
          description: expDesc.slice(0, 300),
          price: experience.price || undefined,
          currency: 'THB',
          image: experience.cover_image || undefined,
          url: `https://myuno.app/experiences/${id}`,
          rating: experience.rating || undefined,
          reviewCount: experience.review_count || undefined,
        })}
      />
      <div className="space-y-4 pb-32">
        {/* Image Gallery */}
        <div className="relative -mx-4 -mt-4">
          <div className="h-64 sm:h-80 relative">
            <OptimizedImage
              src={images[activeImage] || PLACEHOLDER_IMAGES.experience}
              alt={isRu ? experience.title_ru : experience.title_en}
              width={800}
              height={400}
              className="w-full h-full"
              quality={85}
            />
            
            {/* Type badge */}
            <Badge 
              className="absolute top-4 left-4 text-sm"
              style={isTour
                ? { backgroundColor: 'hsl(var(--warning))', color: 'hsl(var(--primary-foreground))' }
                : { backgroundColor: 'hsl(var(--info))', color: 'hsl(var(--primary-foreground))' }
              }
            >
              {isTour ? (
                <>
                  <Compass className="w-4 h-4 mr-1" />
                  {isRu ? 'Тур' : 'Tour'}
                </>
              ) : (
                <>
                  <Waves className="w-4 h-4 mr-1" />
                  {isRu ? 'Активность' : 'Activity'}
                </>
              )}
            </Badge>
            
            {experience.is_certified && (
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                <Shield className="w-4 h-4 mr-1" />
                {isRu ? 'Сертифицировано' : 'Certified'}
              </Badge>
            )}
          </div>
          
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 p-2 overflow-x-auto scrollbar-hide">
              {images.slice(0, 5).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "w-16 h-16 rounded-none overflow-hidden flex-shrink-0 border-2 transition-all",
                    activeImage === idx ? "border-primary" : "border-transparent opacity-70"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title & Meta */}
        <div className="px-4">
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? experience.title_ru : experience.title_en}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" style={{ fill: 'hsl(var(--warning))', color: 'hsl(var(--warning))' }} />
              {experience.rating.toFixed(1)}
              <span className="text-xs">({experience.review_count} {isRu ? 'отзывов' : 'reviews'})</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(experience.duration_minutes, language)}
            </span>
            {experience.difficulty && (
              <Badge className={getDifficultyColor(experience.difficulty)}>
                {experience.difficulty}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                {isRu ? 'Группа' : 'Group'}
              </span>
            </div>
            <p className="font-semibold mt-1">
              {experience.min_participants || 1} - {experience.max_participants || 'N/A'} {isRu ? 'чел' : 'people'}
            </p>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                {isRu ? 'Место' : 'Location'}
              </span>
            </div>
            <p className="font-semibold mt-1 truncate">
              {experience.location_name || (isRu ? 'Пхукет' : 'Phuket')}
            </p>
          </Card>
        </div>

        {/* Pricing Options */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            {pricingOptions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {isRu ? 'Варианты цен' : 'Pricing Options'}
                </p>
                {pricingOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{opt.price_name}</p>
                      {opt.price_notes && (
                        <p className="text-xs text-muted-foreground">{opt.price_notes}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary">
                      ฿{opt.price_thb.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{isRu ? 'Цена от' : 'From'}</p>
                  <p className="text-3xl font-bold text-primary">
                    ฿{experience.price?.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Pickup badge */}
            {experience.pickup_included && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Truck className="w-4 h-4" />
                {isRu ? 'Трансфер включён' : 'Pickup included'}
              </div>
            )}

            {/* Book with Operator CTA */}
            {experience.booking_url && (
              <Button
                className="w-full mt-4 gap-2"
                size="lg"
                onClick={() => window.open(experience.booking_url!, '_blank', 'noopener')}
              >
                <ExternalLink className="w-4 h-4" />
                {isRu ? 'Забронировать у оператора' : 'Book with Operator'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRu ? 'Описание' : 'Description'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line">
              {isRu 
                ? experience.long_description || experience.description_ru || experience.description_en
                : experience.long_description || experience.description_en || experience.description_ru
              }
            </p>
          </CardContent>
        </Card>

        {/* Highlights */}
        {experience.highlights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" style={{ color: 'hsl(var(--warning))' }} />
                {isRu ? 'Особенности' : 'Highlights'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {experience.highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--success))' }} />
                  <span>{typeof item === 'string' ? item : (isRu ? item.text_ru : item.text_en) || item.text_en}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Itinerary (for tours) */}
        {isTour && experience.itinerary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {isRu ? 'Маршрут' : 'Itinerary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {experience.itinerary.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      {idx + 1}
                    </div>
                    {idx < experience.itinerary.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    {item.time && (
                      <p className="text-xs text-muted-foreground mb-1">{item.time}</p>
                    )}
                    <p className="font-medium">
                      {isRu ? item.title_ru || item.title_en : item.title_en}
                    </p>
                    {(item.description_en || item.description_ru) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {isRu ? item.description_ru || item.description_en : item.description_en}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Requirements (for activities) */}
        {!isTour && experience.requirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--warning))' }} />
                {isRu ? 'Требования' : 'Requirements'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {experience.requirements.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--warning))' }} />
                  <span>{typeof item === 'string' ? item : (isRu ? item.text_ru : item.text_en) || item.text_en}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Includes / Excludes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {experience.includes.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base" style={{ color: 'hsl(var(--success))' }}>
                  {isRu ? 'Включено' : 'Included'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {experience.includes.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--success))' }} />
                    <span>{typeof item === 'string' ? item : (isRu ? item.text_ru : item.text_en) || item.text_en}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {experience.excludes.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base" style={{ color: 'hsl(var(--destructive))' }}>
                  {isRu ? 'Не включено' : 'Not Included'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {experience.excludes.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <X className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--destructive))' }} />
                    <span>{typeof item === 'string' ? item : (isRu ? item.text_ru : item.text_en) || item.text_en}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Meeting Point */}
        {experience.meeting_point && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {isRu ? 'Точка сбора' : 'Meeting Point'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{experience.meeting_point}</p>
            </CardContent>
          </Card>
        )}

        {/* Safety Info for activities */}
        {!isTour && experience.safety_briefing_required && (
          <Card className="border-border bg-muted/30">
            <CardContent className="p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--warning))' }} />
              <div>
                <p className="font-medium text-foreground">
                  {isRu ? 'Инструктаж по безопасности' : 'Safety Briefing Required'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Перед началом активности вы получите инструктаж по технике безопасности'
                    : 'You will receive a safety briefing before the activity begins'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contextual Cross-sell based on category */}
        {experience.category && (() => {
          const contextItems = getContextualCrossSell(experience.category);
          if (contextItems.length === 0) return null;
          return contextItems.map((item, idx) => (
            <CrossSellSection
              key={idx}
              currentVertical={item.vertical}
              title={{ en: item.titleEn, ru: item.titleRu }}
              maxItems={3}
            />
          ));
        })()}

        {/* Entity-level cross-sell */}
        <RelatedServicesSection currentVertical="experiences" />

        {/* Generic Cross-sell */}
        <CrossSellSection currentVertical="experiences" />
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-[var(--bottom-nav-h)] left-0 right-0 bg-background/95 border-t p-4 flex items-center justify-between gap-4 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <div>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Цена от' : 'From'}
          </p>
          <p className="text-xl font-bold text-primary">
            ฿{(pricingOptions.length > 0 ? pricingOptions[0].price_thb : experience.price)?.toLocaleString()}
          </p>
        </div>
        <Button 
          onClick={() => {
            if (experience.booking_url) {
              window.open(experience.booking_url, '_blank', 'noopener');
            } else {
              navigate(`/experiences/${experience.id}/book`);
            }
          }}
          className="gap-2"
        >
          {experience.booking_url && <ExternalLink className="w-4 h-4" />}
          {isRu ? 'Забронировать' : 'Book with Operator'}
        </Button>
      </div>
    </MiniAppLayout>
  );
}
