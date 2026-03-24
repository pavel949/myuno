/**
 * @component ReviewForm
 * @description Post-service review submission form.
 * Used after order completion to rate provider + leave feedback.
 */
import { useState } from 'react';
import { Star, Send, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  orderId: string;
  entityType: string; // 'provider', 'listing', 'product'
  entityId: string;
  entityName?: string;
  onSuccess?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ReviewForm({
  orderId,
  entityType,
  entityId,
  entityName,
  onSuccess,
  onDismiss,
  className,
}: ReviewFormProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast.error(isRu ? 'Пожалуйста, поставьте оценку' : 'Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        order_id: orderId,
        entity_type: entityType,
        entity_id: entityId,
        item_type: entityType,
        item_id: entityId,
        rating,
        title: title || null,
        content: content || null,
        pros: pros || null,
        cons: cons || null,
        is_verified_purchase: true,
        language: language,
        moderation_status: 'pending',
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success(isRu ? 'Спасибо за ваш отзыв!' : 'Thank you for your review!');
      onSuccess?.();
    } catch (err) {
      console.error('Review submit error:', err);
      toast.error(isRu ? 'Ошибка при отправке отзыва' : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className={cn('border-success/30 bg-success/5', className)}>
        <CardContent className="pt-6 text-center">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-success fill-success" />
          </div>
          <h3 className="font-semibold text-lg mb-1">
            {isRu ? 'Спасибо за отзыв!' : 'Thank you for your review!'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Ваш отзыв будет опубликован после модерации' : 'Your review will be published after moderation'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isRu ? 'Оставить отзыв' : 'Leave a Review'}
          </CardTitle>
          {onDismiss && (
            <Button variant="ghost" size="icon" onClick={onDismiss} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {entityName && (
          <p className="text-sm text-muted-foreground">{entityName}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star rating */}
        <div>
          <p className="text-sm font-medium mb-2">
            {isRu ? 'Ваша оценка' : 'Your rating'} *
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'w-8 h-8 transition-colors',
                    (hoverRating || rating) >= star
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <Input
            placeholder={isRu ? 'Заголовок отзыва (необязательно)' : 'Review title (optional)'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Content */}
        <div>
          <Textarea
            placeholder={isRu ? 'Расскажите о вашем опыте...' : 'Tell us about your experience...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={1000}
          />
        </div>

        {/* Pros / Cons */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder={isRu ? '👍 Плюсы' : '👍 Pros'}
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            maxLength={200}
          />
          <Input
            placeholder={isRu ? '👎 Минусы' : '👎 Cons'}
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting
            ? (isRu ? 'Отправка...' : 'Submitting...')
            : (isRu ? 'Отправить отзыв' : 'Submit Review')
          }
        </Button>
      </CardContent>
    </Card>
  );
}
