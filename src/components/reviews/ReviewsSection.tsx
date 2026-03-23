import { useState } from "react";
import { logger } from '@/lib/logger';
import { Star, Filter, ChevronDown, MessageSquare, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useReviews } from "@/hooks/useReviews";
import { ReviewCard } from "@/components/uno/ReviewCard";
import { ReviewStats } from "@/components/uno/ReviewStats";
import { WriteReviewModal } from "./WriteReviewModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReviewsSectionProps {
  itemType: string;
  itemId: string;
  itemName: string;
  showStats?: boolean;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
type FilterOption = 'all' | '5' | '4' | '3' | '2' | '1' | 'with_photos' | 'verified';

export const ReviewsSection = ({
  itemType,
  itemId,
  itemName,
  showStats = true,
}: ReviewsSectionProps) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { reviews, isLoading, stats, refetch } = useReviews({ itemType, itemId });
  
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showAll, setShowAll] = useState(false);

  const sortLabels: Record<SortOption, { en: string; ru: string }> = {
    newest: { en: 'Newest First', ru: 'Сначала новые' },
    oldest: { en: 'Oldest First', ru: 'Сначала старые' },
    highest: { en: 'Highest Rated', ru: 'Высокий рейтинг' },
    lowest: { en: 'Lowest Rated', ru: 'Низкий рейтинг' },
    helpful: { en: 'Most Helpful', ru: 'Самые полезные' },
  };

  const filterLabels: Record<FilterOption, { en: string; ru: string }> = {
    all: { en: 'All Reviews', ru: 'Все отзывы' },
    '5': { en: '5 Stars', ru: '5 звезд' },
    '4': { en: '4 Stars', ru: '4 звезды' },
    '3': { en: '3 Stars', ru: '3 звезды' },
    '2': { en: '2 Stars', ru: '2 звезды' },
    '1': { en: '1 Star', ru: '1 звезда' },
    with_photos: { en: 'With Photos', ru: 'С фото' },
    verified: { en: 'Verified Only', ru: 'Только проверенные' },
  };

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'helpful':
        return (b.helpful_count || 0) - (a.helpful_count || 0);
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Filter reviews
  const filteredReviews = sortedReviews.filter((review) => {
    switch (filterBy) {
      case '5':
      case '4':
      case '3':
      case '2':
      case '1':
        return review.rating === parseInt(filterBy);
      case 'with_photos':
        return review.images && review.images.length > 0;
      case 'verified':
        return review.is_verified_purchase;
      default:
        return true;
    }
  });

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 3);

  const handleHelpful = async (reviewId: string) => {
    if (!user) {
      toast.error(language === 'ru' ? 'Войдите, чтобы отметить отзыв' : 'Sign in to mark as helpful');
      return;
    }

    try {
      // Check if already marked
      const { data: existing } = await supabase
        .from('review_helpful')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast.info(language === 'ru' ? 'Вы уже отметили этот отзыв' : 'You already marked this review');
        return;
      }

      // Add helpful vote
      await supabase.from('review_helpful').insert({
        review_id: reviewId,
        user_id: user.id,
        is_helpful: true,
      });

      // Update count
      await supabase.rpc('increment_helpful_count', { review_id_param: reviewId });

      toast.success(language === 'ru' ? 'Спасибо за отзыв!' : 'Thanks for your feedback!');
      refetch();
    } catch (error) {
      logger.error('Error marking helpful:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-2xl" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-display font-bold">
            {language === 'ru' ? 'Отзывы' : 'Reviews'}
          </h2>
          {stats.total > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Star className="w-3 h-3 fill-warning text-warning" />
              {stats.average.toFixed(1)} ({stats.total})
            </Badge>
          )}
        </div>
        <Button onClick={() => setShowAll(true)} size="sm" variant="outline" className="w-full sm:w-auto touch-manipulation">
          <MessageSquare className="w-4 h-4 mr-2" />
          {language === 'ru' ? 'Читать отзывы' : 'Read Reviews'}
        </Button>
      </div>

      {/* Stats */}
      {showStats && stats.total > 0 && (
        <ReviewStats 
          average={stats.average} 
          total={stats.total} 
          distribution={stats.distribution} 
        />
      )}

      {/* Filters & Sort */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <TrendingUp className="w-4 h-4" />
                {sortLabels[sortBy][language]}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={sortBy === option ? 'bg-accent' : ''}
                >
                  {sortLabels[option][language]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="w-4 h-4" />
                {filterLabels[filterBy][language]}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(Object.keys(filterLabels) as FilterOption[]).map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setFilterBy(option)}
                  className={filterBy === option ? 'bg-accent' : ''}
                >
                  {filterLabels[option][language]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {filterBy !== 'all' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilterBy('all')}
              className="text-muted-foreground"
            >
              {language === 'ru' ? 'Сбросить' : 'Clear'}
            </Button>
          )}
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-2xl">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {filterBy !== 'all' 
              ? (language === 'ru' ? 'Нет отзывов с этим фильтром' : 'No reviews match this filter')
              : (language === 'ru' ? 'Пока нет отзывов' : 'No reviews yet')}
          </p>
          {filterBy === 'all' && (
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => setIsWriteModalOpen(true)}
            >
              {language === 'ru' ? 'Будьте первым!' : 'Be the first!'}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              onHelpful={handleHelpful}
            />
          ))}

          {filteredReviews.length > 3 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll 
                ? (language === 'ru' ? 'Скрыть' : 'Show Less')
                : (language === 'ru' 
                    ? `Показать все ${filteredReviews.length} отзывов` 
                    : `Show all ${filteredReviews.length} reviews`)}
            </Button>
          )}
        </div>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        itemType={itemType}
        itemId={itemId}
        itemName={itemName}
        onSuccess={refetch}
      />
    </div>
  );
};
