import { Star, ThumbsUp, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title?: string | null;
    content?: string | null;
    pros?: string | null;
    cons?: string | null;
    images?: string[];
    is_verified_purchase?: boolean;
    helpful_count?: number;
    created_at: string;
    profile?: {
      full_name?: string | null;
      avatar_url?: string | null;
    };
  };
  onHelpful?: (reviewId: string) => void;
}

export const ReviewCard = ({ review, onHelpful }: ReviewCardProps) => {
  const { language } = useLanguage();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
      />
    ));
  };

  return (
    <div className="bg-card rounded-xl p-4 border">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.profile?.avatar_url || undefined} />
            <AvatarFallback>
              {review.profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {review.profile?.full_name || (language === 'ru' ? 'Пользователь' : 'User')}
              </span>
              {review.is_verified_purchase && (
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  <CheckCircle className="w-3 h-3 mr-0.5 text-green-500" />
                  {language === 'ru' ? 'Проверено' : 'Verified'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex">{renderStars(review.rating)}</div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), 'dd MMM yyyy', { 
                  locale: language === 'ru' ? ru : undefined 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {review.title && (
        <h4 className="font-semibold mb-2">{review.title}</h4>
      )}

      {review.content && (
        <p className="text-sm text-muted-foreground mb-3">{review.content}</p>
      )}

      {(review.pros || review.cons) && (
        <div className="space-y-2 mb-3">
          {review.pros && (
            <div className="flex gap-2 text-sm">
              <span className="text-green-500 font-medium">+</span>
              <span>{review.pros}</span>
            </div>
          )}
          {review.cons && (
            <div className="flex gap-2 text-sm">
              <span className="text-red-500 font-medium">−</span>
              <span>{review.cons}</span>
            </div>
          )}
        </div>
      )}

      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {review.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt=""
              className="w-16 h-16 rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => onHelpful?.(review.id)}
        >
          <ThumbsUp className="w-4 h-4 mr-1" />
          {language === 'ru' ? 'Полезно' : 'Helpful'}
          {review.helpful_count ? ` (${review.helpful_count})` : ''}
        </Button>
      </div>
    </div>
  );
};
