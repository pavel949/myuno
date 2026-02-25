import { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, MessageCircle, Award, BookOpen, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { FavoriteButton } from "@/components/uno/FavoriteButton";
import { useViewHistory } from "@/hooks/useViewHistory";
import { useSupabaseSingle } from "@/hooks/useSupabaseQuery";

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
}

export default function TutorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { trackView } = useViewHistory();

  const transform = useCallback((data: unknown) => data as EducationProvider, []);
  const { data: tutor, isLoading } = useSupabaseSingle<EducationProvider>({
    table: 'education_providers',
    id: id || '',
    transform,
  });

  useEffect(() => {
    if (tutor) {
      trackView(tutor.id, 'tutor', {
        name: tutor.name_en,
        image: tutor.cover_image || tutor.images?.[0],
        rating: tutor.rating,
        price: tutor.price_per_hour,
        location: tutor.district || tutor.address,
      });
    }
  }, [tutor?.id]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!tutor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{language === "ru" ? "Репетитор не найден" : "Tutor not found"}</p>
        <Button onClick={() => navigate('/education')}>{language === "ru" ? "К репетиторам" : "Back to tutors"}</Button>
      </div>
    );
  }

  const name = tutor.name_en;
  const specialty = language === "ru" ? tutor.name_ru : tutor.name_en;
  const description = language === "ru" ? tutor.description_ru : tutor.description_en;
  const image = tutor.cover_image || tutor.images?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800';

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 pt-4 pb-24">
        <Button variant="ghost" size="icon" onClick={() => navigate('/education')} className="absolute top-4 left-4 text-white hover:bg-white/20">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <FavoriteButton itemType="tutor" itemId={tutor.id} itemData={{ name: tutor.name_en, specialty_en: tutor.name_en, specialty_ru: tutor.name_ru, image, price: tutor.price_per_hour, currency: tutor.currency || '฿', rating: tutor.rating }} className="absolute top-4 right-4" />
      </div>

      <div className="px-4 -mt-16">
        <div className="bg-card rounded-xl shadow-lg p-4 text-center">
          <img src={image} alt={name} className="w-24 h-24 rounded-full object-cover mx-auto -mt-16 border-4 border-card" />
          <h1 className="text-xl font-bold text-foreground mt-2">{name}</h1>
          <p className="text-primary font-medium">{specialty}</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium">{tutor.rating ?? 0}</span>
            <span className="text-muted-foreground">({tutor.review_count ?? 0} {language === "ru" ? "отзывов" : "reviews"})</span>
          </div>
          {(tutor.district || tutor.address) && (
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /><span>{tutor.district || tutor.address}</span>
            </div>
          )}
          {tutor.is_online && (
            <Badge variant="secondary" className="mt-2">{language === "ru" ? "Онлайн" : "Online"}</Badge>
          )}
        </div>
      </div>

      {tutor.subjects && tutor.subjects.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />{language === "ru" ? "Предметы" : "Subjects"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {tutor.subjects.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        </div>
      )}

      {tutor.age_groups && tutor.age_groups.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <Users className="h-5 w-5" />{language === "ru" ? "Возраст учеников" : "Student Ages"}
          </h2>
          <div className="flex gap-2">
            {tutor.age_groups.includes("kids") && <Badge className="bg-pink-100 text-pink-600 hover:bg-pink-100">{language === "ru" ? "Дети" : "Kids"}</Badge>}
            {tutor.age_groups.includes("adults") && <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">{language === "ru" ? "Взрослые" : "Adults"}</Badge>}
          </div>
        </div>
      )}

      {description && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">{language === "ru" ? "О репетиторе" : "About Tutor"}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      )}

      {tutor.qualifications && tutor.qualifications.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <Award className="h-5 w-5" />{language === "ru" ? "Квалификации" : "Qualifications"}
          </h2>
          <div className="space-y-2">
            {tutor.qualifications.map((q, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <span className="text-foreground">{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tutor.languages && tutor.languages.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />{language === "ru" ? "Языки" : "Languages"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {tutor.languages.map((l) => <Badge key={l} variant="outline">{l}</Badge>)}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{language === "ru" ? "Цена за час" : "Price per hour"}</p>
          <p className="text-2xl font-bold text-primary">{formatPrice(tutor.price_per_hour || 0)}</p>
        </div>
        <Button size="lg" onClick={() => navigate(`/education/booking/${tutor.id}`)} className="px-8">
          {language === "ru" ? "Записаться" : "Book Lesson"}
        </Button>
      </div>
    </div>
  );
}
