import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTours, Tour } from "@/hooks/useTours";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { FilterChip } from "@/components/uno/FilterChip";
import { SkeletonCard } from "@/components/uno/SkeletonCard";
import { Compass, Clock, Users, Star } from "lucide-react";

const TOUR_CATEGORIES = [
  { id: 'all', labelEn: 'All Tours', labelRu: 'Все туры' },
  { id: 'islands', labelEn: 'Islands', labelRu: 'Острова' },
  { id: 'culture', labelEn: 'Culture', labelRu: 'Культура' },
  { id: 'nature', labelEn: 'Nature', labelRu: 'Природа' },
  { id: 'water-sports', labelEn: 'Water Sports', labelRu: 'Водный спорт' },
];

export default function ToursIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { tours, isLoading } = useTours({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title={language === 'ru' ? 'Экскурсии и туры' : 'Tours & Excursions'} />

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide mt-4">
          {TOUR_CATEGORIES.map(cat => (
            <FilterChip
              key={cat.id}
              label={language === 'ru' ? cat.labelRu : cat.labelEn}
              isActive={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
        ) : tours.length === 0 ? (
          <div className="text-center py-12">
            <Compass className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p>{language === 'ru' ? 'Туры не найдены' : 'No tours found'}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tours.map(tour => (
              <div key={tour.id} onClick={() => navigate(`/tours/${tour.id}`)} className="cursor-pointer bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-all">
                <div className="flex">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img src={tour.cover_image || 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold line-clamp-2">{language === 'ru' ? tour.title_ru : tour.title_en}</h3>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{tour.duration_hours}h</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{tour.max_participants}</span>
                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{tour.rating}</span>
                      </div>
                    </div>
                    <div className="text-right"><span className="text-lg font-bold text-primary">฿{tour.price?.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
