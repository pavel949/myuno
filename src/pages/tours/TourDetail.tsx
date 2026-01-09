import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTour } from "@/hooks/useTours";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { LoadingSpinner } from "@/components/uno/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, Star, Check, Calendar } from "lucide-react";
import { FavoriteButton } from "@/components/uno/FavoriteButton";

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { tour, isLoading, error } = useTour(id);

  if (isLoading) return <AppLayout showBottomNav={false}><div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div></AppLayout>;
  if (error || !tour) return <AppLayout><PageContainer><div className="text-center py-12"><p>{t('tours.notFound')}</p><Button onClick={() => navigate('/tours')} className="mt-4">{t('action.back')}</Button></div></PageContainer></AppLayout>;

  return (
    <AppLayout showBottomNav={false}>
      <div className="min-h-screen bg-background">
        <div className="relative h-64">
          <img src={tour.cover_image || 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800'} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Button variant="ghost" size="icon" className="bg-background/80" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
            <FavoriteButton itemId={tour.id} itemType="tour" itemData={{ title: language === 'ru' ? tour.title_ru : tour.title_en, image: tour.cover_image, price: tour.price }} />
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold text-white">{language === 'ru' ? tour.title_ru : tour.title_en}</h1>
          </div>
        </div>

        <PageContainer className="pb-24">
          <div className="grid grid-cols-3 gap-2 py-4 border-b text-center">
            <div><Clock className="w-5 h-5 mx-auto text-primary mb-1" /><span className="text-sm">{tour.duration_hours}h</span></div>
            <div><Users className="w-5 h-5 mx-auto text-primary mb-1" /><span className="text-sm">{tour.max_participants}</span></div>
            <div><Star className="w-5 h-5 mx-auto text-yellow-500 fill-yellow-500 mb-1" /><span className="text-sm">{tour.rating}</span></div>
          </div>

          <div className="py-4 border-b">
            <h2 className="font-semibold mb-2">{t('tours.description')}</h2>
            <p className="text-muted-foreground text-sm">{language === 'ru' ? tour.description_ru : tour.description_en}</p>
          </div>

          {tour.highlights.length > 0 && (
            <div className="py-4 border-b">
              <h2 className="font-semibold mb-3">{t('tours.highlights')}</h2>
              <div className="flex flex-wrap gap-2">{tour.highlights.map((h, i) => <Badge key={i} variant="secondary">{h}</Badge>)}</div>
            </div>
          )}

          {tour.itinerary.length > 0 && (
            <div className="py-4 border-b">
              <h2 className="font-semibold mb-3">{t('tours.itinerary')}</h2>
              <div className="space-y-3">
                {tour.itinerary.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-12 h-6 rounded bg-primary/10 text-xs flex items-center justify-center text-primary font-semibold">{item.time}</div>
                    <p className="text-sm">{language === 'ru' ? item.title_ru : item.title_en}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tour.includes.length > 0 && (
            <div className="py-4">
              <h2 className="font-semibold mb-3">{t('tours.includes')}</h2>
              <ul className="space-y-2">{tour.includes.map((item, i) => <li key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" />{item}</li>)}</ul>
            </div>
          )}
        </PageContainer>

        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div><span className="text-2xl font-bold text-primary">฿{tour.price?.toLocaleString()}</span><span className="text-sm text-muted-foreground">{t('tours.perPerson')}</span></div>
            <Button size="lg" onClick={() => navigate(`/tours/${tour.id}/book`)}><Calendar className="w-4 h-4 mr-2" />{t('tours.bookNow')}</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
