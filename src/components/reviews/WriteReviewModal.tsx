import { useState } from "react";
import { Star, Camera, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateReview } from "@/hooks/useReviews";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: string;
  itemId: string;
  itemName: string;
  onSuccess?: () => void;
}

export function WriteReviewModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemName,
  onSuccess,
}: WriteReviewModalProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { createReview, isSubmitting } = useCreateReview();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error(language === 'ru' ? 'Необходимо войти в аккаунт' : 'Please sign in first');
      return;
    }
    
    if (rating === 0) {
      toast.error(language === 'ru' ? 'Выберите оценку' : 'Please select a rating');
      return;
    }

    try {
      await createReview({
        itemType,
        itemId,
        rating,
        title: title || undefined,
        content: content || undefined,
        pros: pros || undefined,
        cons: cons || undefined,
      });
      
      toast.success(language === 'ru' ? 'Отзыв отправлен!' : 'Review submitted!');
      onSuccess?.();
      onClose();
      
      // Reset form
      setRating(0);
      setTitle("");
      setContent("");
      setPros("");
      setCons("");
      setImages([]);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при отправке отзыва' : 'Failed to submit review');
    }
  };

  const ratingLabels = language === 'ru' 
    ? ['Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично']
    : ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            {language === 'ru' ? 'Написать отзыв' : 'Write a Review'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{itemName}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="text-center space-y-2">
            <Label className="text-sm font-medium">
              {language === 'ru' ? 'Ваша оценка' : 'Your Rating'}
            </Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoverRating || rating) > 0 && (
              <p className="text-sm font-medium text-primary animate-in fade-in">
                {ratingLabels[(hoverRating || rating) - 1]}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {language === 'ru' ? 'Заголовок (необязательно)' : 'Title (optional)'}
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'ru' ? 'Кратко опишите впечатление' : 'Summarize your experience'}
              maxLength={100}
            />
          </div>

          {/* Review Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {language === 'ru' ? 'Ваш отзыв' : 'Your Review'}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={language === 'ru' 
                ? 'Расскажите подробнее о вашем опыте...' 
                : 'Tell us more about your experience...'}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </p>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pros" className="flex items-center gap-1">
                <span className="text-green-500 font-bold">+</span>
                {language === 'ru' ? 'Плюсы' : 'Pros'}
              </Label>
              <Textarea
                id="pros"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                placeholder={language === 'ru' ? 'Что понравилось?' : "What did you like?"}
                rows={2}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cons" className="flex items-center gap-1">
                <span className="text-red-500 font-bold">−</span>
                {language === 'ru' ? 'Минусы' : 'Cons'}
              </Label>
              <Textarea
                id="cons"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                placeholder={language === 'ru' ? 'Что не понравилось?' : "What didn't you like?"}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          {/* Image Upload Placeholder */}
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Фотографии' : 'Photos'}</Label>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, index) => (
                <div key={index} className="relative w-16 h-16">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                  >
                    <X className="w-3 h-3 text-destructive-foreground" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="w-16 h-16 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Добавьте до 5 фото' : 'Add up to 5 photos'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {language === 'ru' ? 'Отмена' : 'Cancel'}
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {language === 'ru' ? 'Отправить' : 'Submit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
