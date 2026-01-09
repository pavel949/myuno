import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, GraduationCap, User, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'course' | 'tutor';

export default function Favorites() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { favorites, loading, toggleFavorite } = useFavorites();
  const [filter, setFilter] = useState<FilterType>('all');

  const filters: { value: FilterType; label: string; icon: any }[] = [
    { value: 'all', label: language === 'ru' ? 'Все' : 'All', icon: Heart },
    { value: 'course', label: language === 'ru' ? 'Курсы' : 'Courses', icon: GraduationCap },
    { value: 'tutor', label: language === 'ru' ? 'Репетиторы' : 'Tutors', icon: User },
  ];

  const filteredFavorites = filter === 'all' 
    ? favorites 
    : favorites.filter(f => f.item_type === filter);

  const handleNavigate = (item: any) => {
    if (item.item_type === 'course') {
      navigate(`/education/course/${item.item_id}`);
    } else if (item.item_type === 'tutor') {
      navigate(`/education/tutor/${item.item_id}`);
    }
  };

  const handleRemove = async (item: any) => {
    await toggleFavorite(item.item_type, item.item_id);
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'ru' ? 'Избранное' : 'Favorites'}
        </h1>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="flex-shrink-0"
            >
              <f.icon className="h-4 w-4 mr-1" />
              {f.label}
            </Button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredFavorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {language === 'ru' ? 'Пока пусто' : 'No favorites yet'}
            </h2>
            <p className="text-muted-foreground max-w-xs">
              {language === 'ru' 
                ? 'Добавляйте понравившиеся курсы и репетиторов, нажимая на сердечко' 
                : 'Add your favorite courses and tutors by tapping the heart icon'}
            </p>
            <Button 
              className="mt-4"
              onClick={() => navigate('/education')}
            >
              {language === 'ru' ? 'Перейти к обучению' : 'Browse Education'}
            </Button>
          </div>
        )}

        {/* Favorites list */}
        <div className="space-y-3">
          {filteredFavorites.map((item) => {
            const data = item.item_data || {};
            const title = language === 'ru' 
              ? (data.title_ru || data.name || 'Без названия')
              : (data.title_en || data.name || 'Untitled');
            const subtitle = language === 'ru'
              ? (data.specialty_ru || data.category || '')
              : (data.specialty_en || data.category || '');

            return (
              <div
                key={item.id}
                className="bg-card rounded-xl border border-border overflow-hidden flex"
              >
                <div 
                  className="flex-1 flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => handleNavigate(item)}
                >
                  <img
                    src={data.image || data.images?.[0] || '/placeholder.svg'}
                    alt={title}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.item_type === 'course' 
                          ? (language === 'ru' ? 'Курс' : 'Course')
                          : (language === 'ru' ? 'Репетитор' : 'Tutor')}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground truncate">{title}</h3>
                    {subtitle && (
                      <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                    )}
                    {data.price && (
                      <p className="text-sm font-medium text-primary mt-1">
                        {data.currency || '฿'}{data.price}
                        {item.item_type === 'tutor' && (language === 'ru' ? '/час' : '/hour')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item)}
                  className="px-4 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
