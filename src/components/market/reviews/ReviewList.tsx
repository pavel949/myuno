import React from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarketplaceReview, useProductReviews } from '@/hooks/useMarketplaceReviews';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface ReviewListProps {
  productId: string;
  onWriteReview?: () => void;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating 
              ? 'fill-amber-400 text-amber-400' 
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: MarketplaceReview }) {
  const { language } = useLanguage();
  
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {language === 'ru' ? 'Покупатель' : 'Customer'}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), 'dd.MM.yyyy')}
              </p>
            </div>
          </div>
          <RatingStars rating={review.rating} />
        </div>

        {review.title && (
          <h4 className="font-medium mb-2">{review.title}</h4>
        )}
        
        {review.content && (
          <p className="text-sm text-muted-foreground mb-3">{review.content}</p>
        )}

        {(review.pros || review.cons) && (
          <div className="space-y-2 text-sm">
            {review.pros && (
              <div className="flex gap-2">
                <span className="text-green-500 font-medium">+</span>
                <span>{review.pros}</span>
              </div>
            )}
            {review.cons && (
              <div className="flex gap-2">
                <span className="text-red-500 font-medium">−</span>
                <span>{review.cons}</span>
              </div>
            )}
          </div>
        )}

        {review.photos && review.photos.length > 0 && (
          <div className="flex gap-2 mt-3">
            {review.photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt=""
                className="w-16 h-16 rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
          <Button variant="ghost" size="sm" className="text-xs">
            <ThumbsUp className="w-3 h-3 mr-1" />
            {language === 'ru' ? 'Полезно' : 'Helpful'} ({review.helpful_count})
          </Button>
          {review.is_verified_purchase && (
            <span className="text-xs text-green-600 font-medium">
              ✓ {language === 'ru' ? 'Проверенная покупка' : 'Verified Purchase'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReviewList({ productId, onWriteReview }: ReviewListProps) {
  const { language } = useLanguage();
  const { reviews, stats, isLoading } = useProductReviews(productId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Average Rating */}
            <div className="text-center md:border-r md:pr-6">
              <div className="text-5xl font-bold text-foreground">
                {stats.averageRating.toFixed(1)}
              </div>
              <RatingStars rating={Math.round(stats.averageRating)} />
              <p className="text-sm text-muted-foreground mt-1">
                {stats.totalReviews} {language === 'ru' ? 'отзывов' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                const percentage = stats.totalReviews > 0 
                  ? (count / stats.totalReviews) * 100 
                  : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-3">{rating}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-8">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Write Review Button */}
            <div className="flex items-center justify-center md:border-l md:pl-6">
              <Button onClick={onWriteReview} className="w-full md:w-auto">
                {language === 'ru' ? 'Написать отзыв' : 'Write a Review'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {language === 'ru' 
                ? 'Пока нет отзывов. Будьте первым!' 
                : 'No reviews yet. Be the first!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
