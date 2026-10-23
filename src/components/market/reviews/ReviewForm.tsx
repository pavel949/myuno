import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubmitReview } from '@/hooks/useMarketplaceReviews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ReviewFormProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewForm({ productId, productName, isOpen, onClose, onSuccess }: ReviewFormProps) {
  const { language } = useLanguage();
  const { submitReview, isSubmitting, canReview } = useSubmitReview();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error(language === 'ru' ? 'Поставьте оценку' : 'Please select a rating');
      return;
    }

    try {
      await submitReview({
        product_id: productId,
        rating,
        title: title || undefined,
        content: content || undefined,
        pros: pros || undefined,
        cons: cons || undefined,
      });
      
      toast.success(language === 'ru' ? 'Отзыв отправлен!' : 'Review submitted!');
      onSuccess();
      onClose();
      
      // Reset form
      setRating(0);
      setTitle('');
      setContent('');
      setPros('');
      setCons('');
    } catch (err) {
      toast.error(language === 'ru' ? 'Ошибка отправки' : 'Failed to submit');
    }
  };

  if (!canReview) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Требуется авторизация' : 'Sign In Required'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {language === 'ru' 
              ? 'Войдите в аккаунт, чтобы оставить отзыв' 
              : 'Please sign in to write a review'}
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {language === 'ru' ? 'Написать отзыв' : 'Write a Review'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">{productName}</p>

          {/* Rating Stars */}
          <div>
            <Label>{language === 'ru' ? 'Ваша оценка' : 'Your Rating'} *</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">
              {language === 'ru' ? 'Заголовок' : 'Title'}
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'ru' ? 'Кратко о товаре' : 'Summary of your experience'}
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">
              {language === 'ru' ? 'Отзыв' : 'Review'}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={language === 'ru' ? 'Расскажите подробнее...' : 'Tell us more...'}
              rows={3}
            />
          </div>

          {/* Pros */}
          <div>
            <Label htmlFor="pros" className="text-success">
              + {language === 'ru' ? 'Достоинства' : 'Pros'}
            </Label>
            <Input
              id="pros"
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              placeholder={language === 'ru' ? 'Что понравилось' : 'What you liked'}
            />
          </div>

          {/* Cons */}
          <div>
            <Label htmlFor="cons" className="text-destructive">
              − {language === 'ru' ? 'Недостатки' : 'Cons'}
            </Label>
            <Input
              id="cons"
              value={cons}
              onChange={(e) => setCons(e.target.value)}
              placeholder={language === 'ru' ? 'Что не понравилось' : 'What you disliked'}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting 
                ? (language === 'ru' ? 'Отправка...' : 'Submitting...') 
                : (language === 'ru' ? 'Отправить' : 'Submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
