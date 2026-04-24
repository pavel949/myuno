/**
 * PostOrderReviewPrompt — appears after order completion
 * Prompts user to rate their experience + optional referral CTA
 */
import React, { useState } from 'react';
import { Star, Send, Gift, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateReview } from '@/hooks/useReviews';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PostOrderReviewPromptProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  onReviewSubmitted?: () => void;
  showReferralCTA?: boolean;
}

export function PostOrderReviewPrompt({
  open,
  onClose,
  orderId,
  entityType,
  entityId,
  entityName,
  onReviewSubmitted,
  showReferralCTA = true,
}: PostOrderReviewPromptProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { createReview, isSubmitting } = useCreateReview();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [step, setStep] = useState<'rate' | 'thanks'>('rate');

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    try {
      await createReview({
        itemType: entityType,
        itemId: entityId,
        rating,
        content: text || undefined,
      });
      
      setStep('thanks');
      onReviewSubmitted?.();
      
      // Mark as reviewed in localStorage
      localStorage.setItem(`reviewed-order-${orderId}`, 'true');
    } catch {
      toast.error(isRu ? 'Ошибка отправки отзыва' : 'Failed to submit review');
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`reviewed-order-${orderId}`, 'skipped');
    onClose();
  };

  const handleShareReferral = () => {
    onClose();
    window.location.href = '/wallet#referral';
  };

  if (step === 'thanks') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-sm text-center p-6">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="w-8 h-8 text-primary fill-primary" />
            </div>
            <h2 className="text-xl font-semibold">
              {isRu ? 'Спасибо за отзыв' : 'Thank you for your review'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Ваш отзыв помогает другим выбрать подходящий сервис' 
                : 'Your review helps others choose the right service'}
            </p>
            
            {showReferralCTA && rating >= 4 && (
              <div className="bg-primary/5 border border-primary/20 rounded-none p-4 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">
                    {isRu ? 'Понравился сервис?' : 'Enjoyed the service?'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRu 
                    ? 'Пригласите друга и получите 200 ฿ на баланс' 
                    : 'Invite a friend and get ฿200 bonus'}
                </p>
                <Button size="sm" className="w-full" onClick={handleShareReferral}>
                  <Gift className="w-4 h-4 mr-2" />
                  {isRu ? 'Пригласить друга' : 'Invite a friend'}
                </Button>
              </div>
            )}
            
            <Button variant="ghost" onClick={onClose} className="w-full">
              {isRu ? 'Закрыть' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold">
              {isRu ? 'Как всё прошло?' : 'How was your experience?'}
            </h2>
            {entityName && (
              <p className="text-sm text-muted-foreground">{entityName}</p>
            )}
          </div>

          {/* Star rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform "
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  className={cn(
                    'w-10 h-10 transition-colors',
                    (hoverRating || rating) >= star
                      ? 'text-primary fill-primary'
                      : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>

          {/* Rating label */}
          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {rating <= 2
                ? (isRu ? 'Нам жаль. Расскажите, что пошло не так' : 'Sorry to hear. Tell us what went wrong')
                : rating === 3
                ? (isRu ? 'Нормально. Что можно улучшить?' : 'Average. What could be better?')
                : rating === 4
                ? (isRu ? 'Хорошо! Что понравилось?' : 'Good! What did you like?')
                : (isRu ? 'Отлично! Будем рады вашему отзыву' : 'Excellent! We\'d love to hear more')}
            </p>
          )}

          {/* Text */}
          {rating > 0 && (
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isRu ? 'Расскажите подробнее (необязательно)' : 'Tell us more (optional)'}
              rows={3}
              className="resize-none"
            />
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleSkip} className="flex-1">
              {isRu ? 'Пропустить' : 'Skip'}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={rating === 0 || isSubmitting}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {isRu ? 'Отправить' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
