import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Anchor, Star, Users, MapPin, Clock, Ruler } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetailPageSkeleton } from '@/components/ui/page-skeletons';
import { useYacht, useYachts } from '@/hooks/useYachts';
import { YachtBookingQuickSelect } from '@/components/yachts/YachtBookingQuickSelect';
import { YachtImageGallery } from '@/components/yachts/YachtImageGallery';
import { YachtIncludedExcluded } from '@/components/yachts/YachtIncludedExcluded';
import { YachtPolicies } from '@/components/yachts/YachtPolicies';
import { YachtOperatorCard } from '@/components/yachts/YachtOperatorCard';
import { YachtSimilarSection } from '@/components/yachts/YachtSimilarSection';
import { RelatedServicesSection } from '@/components/crosssell';
import { SEOHead, createServiceSchema } from '@/components/seo';

export default function YachtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { yacht, isLoading } = useYacht(id || '');
  const { yachts: allYachts } = useYachts();

  if (isLoading) {
    return <AppLayout><DetailPageSkeleton /></AppLayout>;
  }

  if (!yacht) {
    return (
      <AppLayout>
        <PageContainer className="py-20 text-center">
          <Anchor className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ru' ? 'Яхта не найдена' : 'Yacht not found'}
          </h2>
          <Button onClick={() => navigate('/yachts')}>
            {language === 'ru' ? 'К списку яхт' : 'Back to yachts'}
          </Button>
        </PageContainer>
      </AppLayout>
    );
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800';
  const coverImage = yacht.cover_image || fallbackImage;
  const galleryImages = yacht.images?.filter(img => img && img !== yacht.cover_image) || [];
  const images = [coverImage, ...galleryImages];
  const name = language === 'ru' ? yacht.name_ru : yacht.name_en;
  const description = language === 'ru' ? yacht.description_ru : yacht.description_en;
  const location = language === 'ru' ? yacht.location_ru : yacht.location_name;
  const features = language === 'ru' ? yacht.features_ru : yacht.features_en;
  const exclusions = (yacht as any).exclusions_en as string[] | null;
  const exclusionsRu = (yacht as any).exclusions_ru as string[] | null;
  const displayExclusions = language === 'ru' ? (exclusionsRu || exclusions) : exclusions;
  const addons = yacht.addons as Array<{ name_en?: string; name_ru?: string; price?: number; unit?: string }> | null;

  return (
    <AppLayout>
      <SEOHead
        title={name}
        description={(description || '').slice(0, 160)}
        image={coverImage}
        type="product"
        jsonLd={createServiceSchema({
          name: name || '',
          description: (description || '').slice(0, 300),
          price: yacht.price_half_day || yacht.price_full_day || undefined,
          currency: 'THB',
          rating: yacht.rating || undefined,
          reviewCount: yacht.review_count || undefined,
          image: coverImage,
        })}
      />
      <YachtImageGallery
        images={images}
        name={name}
        isVerified={yacht.is_verified}
        isFeatured={yacht.is_featured}
      />

      <PageContainer className="-mt-4 relative z-10 bg-background rounded-t-3xl pt-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold">{name}</h1>
            <Badge variant="secondary" className="capitalize">{yacht.yacht_type?.replace('_', ' ')}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /><span>{location || 'Phuket'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{yacht.rating}</span><span>({yacht.review_count})</span>
            </div>
          </div>
        </div>

        {/* Quick specs */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-xl mb-6">
          <QuickStat icon={Users} value={`${yacht.capacity}`} label={language === 'ru' ? 'гостей' : 'guests'} />
          <QuickStat icon={Ruler} value={yacht.length_meters ? `${yacht.length_meters}m` : '—'} label={language === 'ru' ? 'длина' : 'length'} />
          <QuickStat icon={Clock} value={`${yacht.year_built || '—'}`} label={language === 'ru' ? 'год' : 'year'} />
          <QuickStat icon={Anchor} value={`${yacht.cabins || '—'}`} label={language === 'ru' ? 'каюты' : 'cabins'} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-32">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">{language === 'ru' ? 'Обзор' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="specs">{language === 'ru' ? 'Характеристики' : 'Specs'}</TabsTrigger>
            <TabsTrigger value="reviews">{language === 'ru' ? 'Отзывы' : 'Reviews'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Description */}
            {description && (
              <div>
                <h3 className="font-semibold mb-2">{language === 'ru' ? 'Описание' : 'Description'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            )}

            {/* Included / Excluded / Addons */}
            <YachtIncludedExcluded
              features={features}
              exclusions={displayExclusions}
              addons={addons}
              currency={yacht.currency}
              hasCrew={yacht.has_crew}
            />

            {/* Policies */}
            <YachtPolicies
              cancellationPolicy={(yacht as any).cancellation_policy}
              fuelPolicy={(yacht as any).fuel_policy}
              insuranceIncluded={(yacht as any).insurance_included}
              insuranceNotes={(yacht as any).insurance_notes}
              depositPercent={(yacht as any).deposit_percent}
            />

            {/* Operator */}
            {yacht.provider_id && (
              <div>
                <h4 className="font-semibold text-sm mb-3">
                  {language === 'ru' ? 'Оператор' : 'Charter Operator'}
                </h4>
                <YachtOperatorCard providerId={yacht.provider_id} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="specs" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {yacht.length_meters && <SpecCard label={language === 'ru' ? 'Длина' : 'Length'} value={`${yacht.length_meters}m`} />}
              {yacht.beam && <SpecCard label={language === 'ru' ? 'Ширина' : 'Beam'} value={yacht.beam} />}
              {yacht.draft && <SpecCard label={language === 'ru' ? 'Осадка' : 'Draft'} value={yacht.draft} />}
              {yacht.engines && <SpecCard label={language === 'ru' ? 'Двигатели' : 'Engines'} value={yacht.engines} />}
              {yacht.cruising_speed && <SpecCard label={language === 'ru' ? 'Крейсерская скорость' : 'Cruising Speed'} value={yacht.cruising_speed} />}
              {yacht.max_speed && <SpecCard label={language === 'ru' ? 'Макс. скорость' : 'Max Speed'} value={yacht.max_speed} />}
              {yacht.fuel_capacity && <SpecCard label={language === 'ru' ? 'Топливный бак' : 'Fuel Capacity'} value={yacht.fuel_capacity} />}
              {yacht.cabins && <SpecCard label={language === 'ru' ? 'Каюты' : 'Cabins'} value={`${yacht.cabins}`} />}
              {yacht.bathrooms && <SpecCard label={language === 'ru' ? 'Санузлы' : 'Bathrooms'} value={`${yacht.bathrooms}`} />}
              <SpecCard label={language === 'ru' ? 'Вместимость' : 'Capacity'} value={`${yacht.capacity} ${language === 'ru' ? 'чел.' : 'guests'}`} />
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium">{yacht.rating} / 5</p>
              <p className="text-sm">{yacht.review_count} {language === 'ru' ? 'отзывов' : 'reviews'}</p>
              <p className="text-sm mt-4">{language === 'ru' ? 'Подробные отзывы скоро появятся' : 'Detailed reviews coming soon'}</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Related Services Cross-sell */}
        <RelatedServicesSection currentVertical="yachts" />

        {/* Similar Yachts */}
        <YachtSimilarSection currentYacht={yacht} allYachts={allYachts || []} />
      </PageContainer>

      <YachtBookingQuickSelect yacht={yacht} />
    </AppLayout>
  );
}

function QuickStat({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="text-center">
      <Icon className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
      <p className="text-sm font-medium">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
