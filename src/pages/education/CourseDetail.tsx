import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Clock, MapPin, Calendar, Users, CheckCircle, Loader2 } from "lucide-react";
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { FavoriteButton } from "@/components/uno/FavoriteButton";
import { useViewHistory } from "@/hooks/useViewHistory";
import { useSupabaseSingle } from "@/hooks/useSupabaseQuery";
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { useCallback } from "react";
import { RelatedServicesSection } from '@/components/crosssell';
import { AppLayout } from '@/components/layout/AppLayout';

interface EducationProvider {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  provider_type: string | null;
  cover_image: string | null;
  images: string[] | null;
  subjects: string[] | null;
  age_groups: string[] | null;
  languages: string[] | null;
  address: string | null;
  district: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  price_per_hour: number | null;
  price_per_course: number | null;
  currency: string | null;
  qualifications: string[] | null;
  rating: number | null;
  review_count: number | null;
  is_online: boolean | null;
  is_featured: boolean | null;
  is_verified: boolean | null;
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { trackView } = useViewHistory();

  const transform = useCallback((data: unknown) => data as EducationProvider, []);
  const { data: course, isLoading } = useSupabaseSingle<EducationProvider>({
    table: 'education_providers',
    id: id || '',
    transform,
  });

  useEffect(() => {
    if (course) {
      trackView(course.id, 'course', {
        name_en: course.name_en,
        name_ru: course.name_ru,
        image: course.cover_image || course.images?.[0],
        rating: course.rating,
        price: course.price_per_course || course.price_per_hour,
        location: course.district || course.address,
      });
    }
  }, [course?.id]);

  if (isLoading) {
    return (
      <AppLayout showHeader={false} showBottomNav usePageContainer={false}>
        <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout showHeader={false} showBottomNav usePageContainer={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">{language === "ru" ? "Курс не найден" : "Course not found"}</p>
          <Button onClick={() => navigate('/education')}>{language === "ru" ? "К курсам" : "Back to courses"}</Button>
        </div>
      </AppLayout>
    );
  }

  const title = language === "ru" ? course.name_ru : course.name_en;
  const description = language === "ru" ? course.description_ru : course.description_en;
  const images = course.images || (course.cover_image ? [course.cover_image] : []);
  const heroImage = course.cover_image || images[0] || PLACEHOLDER_IMAGES.education;
  const price = course.price_per_course || course.price_per_hour || 0;
  const isKids = course.age_groups?.includes('kids');

  return (
    <AppLayout showHeader={false} showBottomNav usePageContainer={false}>
    <div className="min-h-screen bg-background pb-24">
      <div className="relative h-72">
        <img src={heroImage} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <BackButton fallbackPath={APP_ROUTES.EDUCATION} variant="overlay" size="md" className="absolute top-4 left-4" />
        <div className="absolute top-4 right-4 flex gap-2">
          <FavoriteButton itemType="course" itemId={course.id} itemData={{ title_en: course.name_en, title_ru: course.name_ru, images, price, currency: course.currency || '฿', category: course.provider_type, rating: course.rating }} />
          {course.age_groups && (
            <Badge className={isKids ? "bg-accent-coral" : "bg-info"}>
              {isKids ? (language === "ru" ? "Для детей" : "For Kids") : (language === "ru" ? "Для взрослых" : "For Adults")}
            </Badge>
          )}
        </div>
      </div>

      <div className="px-4 -mt-8 relative">
        <div className="bg-card rounded-none shadow-lg p-4">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span>{course.rating ?? 0}</span>
              <span>({course.review_count ?? 0} {language === "ru" ? "отзывов" : "reviews"})</span>
            </div>
          </div>
          {course.address && (
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /><span>{course.address}</span>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <img key={idx} src={img} alt="" className="w-24 h-24 rounded-none object-cover flex-shrink-0" />
            ))}
          </div>
        )}

        {description && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">{language === "ru" ? "О курсе" : "About Course"}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
        )}

        {course.subjects && course.subjects.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-foreground mb-2">{language === "ru" ? "Предметы" : "Subjects"}</h3>
            <div className="flex flex-wrap gap-2">
              {course.subjects.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          </div>
        )}

        {course.qualifications && course.qualifications.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">{language === "ru" ? "Квалификации" : "Qualifications"}</h2>
            <div className="space-y-2">
              {course.qualifications.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {course.languages && course.languages.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-foreground mb-2">{language === "ru" ? "Языки" : "Languages"}</h3>
            <div className="flex flex-wrap gap-2">
              {course.languages.map((l) => <Badge key={l} variant="outline">{l}</Badge>)}
            </div>
          </div>
        )}
      </div>

      {/* Cross-sell */}
      <div className="px-4 pb-24">
        <RelatedServicesSection currentVertical="education" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{course.price_per_course ? (language === "ru" ? "За курс" : "Per course") : (language === "ru" ? "За час" : "Per hour")}</p>
          <p className="text-2xl font-bold text-primary">{formatPrice(price)}</p>
        </div>
        <Button size="lg" onClick={() => navigate(`/education/booking/${course.id}`)} className="px-8">
          {language === "ru" ? "Записаться" : "Enroll"}
        </Button>
      </div>
    </div>
    </AppLayout>
  );
}
