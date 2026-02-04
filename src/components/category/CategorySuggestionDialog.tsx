/**
 * CategorySuggestionDialog - Allows vendors to suggest new categories
 * Similar to Etsy's "Request a category" feature
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb, Send, CheckCircle2 } from 'lucide-react';

interface CategorySuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'product' | 'service';
  initialName?: string;
}

export function CategorySuggestionDialog({
  open,
  onOpenChange,
  type,
  initialName = '',
}: CategorySuggestionDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  
  const [formData, setFormData] = useState({
    category_name: initialName,
    category_name_ru: '',
    description: '',
    example_items: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_name.trim()) {
      toast.error(isRu ? 'Укажите название категории' : 'Please enter category name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Direct insert to category_suggestions table
      const { error: insertError } = await supabase
        .from('category_suggestions')
        .insert({
          user_id: user?.id || null,
          suggestion_type: type,
          category_name_en: formData.category_name,
          category_name_ru: formData.category_name_ru || null,
          description: formData.description || null,
          example_items: formData.example_items || null,
          status: 'pending',
        });
      
      if (insertError) throw insertError;

      setIsSuccess(true);
      toast.success(isRu ? 'Заявка отправлена!' : 'Suggestion submitted!');
      
      // Reset after delay
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ category_name: '', category_name_ru: '', description: '', example_items: '' });
        onOpenChange(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error(isRu ? 'Ошибка отправки' : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-success/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isRu ? 'Спасибо за предложение!' : 'Thank you for your suggestion!'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Мы рассмотрим вашу заявку в течение 48 часов' 
                : 'We will review your request within 48 hours'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            {isRu ? 'Предложить категорию' : 'Suggest a Category'}
          </DialogTitle>
          <DialogDescription>
            {isRu 
              ? 'Не нашли подходящую категорию? Предложите свою, и мы добавим её!'
              : "Can't find the right category? Suggest one and we'll add it!"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_name">
              {isRu ? 'Название категории (EN) *' : 'Category name (EN) *'}
            </Label>
            <Input
              id="category_name"
              placeholder={isRu ? 'Например: Vintage Electronics' : 'e.g., Vintage Electronics'}
              value={formData.category_name}
              onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_name_ru">
              {isRu ? 'Название на русском' : 'Russian name'}
            </Label>
            <Input
              id="category_name_ru"
              placeholder={isRu ? 'Например: Винтажная электроника' : 'e.g., Винтажная электроника'}
              value={formData.category_name_ru}
              onChange={(e) => setFormData(prev => ({ ...prev, category_name_ru: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {isRu ? 'Описание категории' : 'Category description'}
            </Label>
            <Textarea
              id="description"
              placeholder={isRu 
                ? 'Опишите, какие товары/услуги входят в эту категорию...'
                : 'Describe what products/services belong to this category...'}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="example_items">
              {isRu ? 'Примеры товаров/услуг' : 'Example items/services'}
            </Label>
            <Input
              id="example_items"
              placeholder={isRu 
                ? 'Sony Walkman, ретро-телевизоры, радиоприёмники...'
                : 'Sony Walkman, retro TVs, vintage radios...'}
              value={formData.example_items}
              onChange={(e) => setFormData(prev => ({ ...prev, example_items: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !formData.category_name.trim()}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isRu ? 'Отправить' : 'Submit'}
            </Button>
          </div>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-2">
          {isRu 
            ? 'Мы уведомим вас, когда категория будет добавлена'
            : "We'll notify you when the category is added"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
