import { Star, ThumbsUp, CheckCircle, MessageCircle, Flag } from "lucide-react";
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
    is_featured?: boolean;
    helpful_count?: number;
    created_at: string;
    response?: string | null;
    response_at?: string | null;
    profile?: {
      full_name?: string | null;
      avatar_url?: string | null;
    };
  };
  onHelpful?: (reviewId: string) => void;
  providerName?: string;
}

export const ReviewCard = ({ review, onHelpful, providerName }: ReviewCardProps) => {
  const { language } = useLanguage();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
      />
    ));
  };

  return (
    <div className="bg-card rounded-none p-4 border">
      {/* Featured Badge */}
      {review.is_featured && (
        <div className="mb-3">
          <Badge className="bg-gradient-to-r from-warning to-accent-amber text-white border-0">
            <Star className="w-3 h-3 mr-1 fill-current" />
            {language === 'ru' ? 'Лучший отзыв' : 'Featured Review'}
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.profile?.avatar_url || undefined} />
            <AvatarFallback>
              {review.profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {review.profile?.full_name || (language === 'ru' ? 'Пользователь' : 'User')}
              </span>
              {review.is_verified_purchase && (
                <Badge variant="secondary" className="text-[10px] px-1.5 bg-success/10 text-success border-success/20">
                  <CheckCircle className="w-3 h-3 mr-0.5" />
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
              <span className="text-success font-medium shrink-0">+</span>
              <span>{review.pros}</span>
            </div>
          )}
          {review.cons && (
            <div className="flex gap-2 text-sm">
              <span className="text-destructive font-medium shrink-0">−</span>
              <span>{review.cons}</span>
            </div>
          )}
        </div>
      )}

      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {review.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt=""
              className="w-16 h-16 rounded-none object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            />
          ))}
        </div>
      )}

      {/* Provider Response */}
      {review.response && review.response_at && (
        <div className="mt-3 p-3 bg-primary/5 rounded-none border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium">
              {providerName || (language === 'ru' ? 'Ответ провайдера' : 'Provider Response')}
            </span>
            <CheckCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(review.response_at), 'dd MMM', {
                locale: language === 'ru' ? ru : undefined
              })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{review.response}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t mt-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs gap-1"
          onClick={() => onHelpful?.(review.id)}
        >
          <ThumbsUp className="w-4 h-4" />
          {language === 'ru' ? 'Полезно' : 'Helpful'}
          {review.helpful_count ? ` (${review.helpful_count})` : ''}
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
          <Flag className="w-3.5 h-3.5" />
          {language === 'ru' ? 'Пожаловаться' : 'Report'}
        </Button>
      </div>
    </div>
  );
};
