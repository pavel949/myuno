/**
 * CategorySuggestionDialog - Allows vendors to suggest new categories
 * Similar to Etsy's "Request a category" feature
 */
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
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
  const isTh = language === 'th';

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
      toast.error(isRu ? 'Укажите название категории' : isTh ? 'กรุณากรอกชื่อหมวดหมู่' : 'Please enter category name');
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
      toast.success(isRu ? 'Заявка отправлена!' : isTh ? 'ส่งคำแนะนำแล้ว!' : 'Suggestion submitted!');
      
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error(isRu ? 'Ошибка отправки' : isTh ? 'ส่งไม่สำเร็จ' : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset and close after success (outside try block to only run on success)
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false);
        setFormData({ category_name: '', category_name_ru: '', description: '', example_items: '' });
        onOpenChange(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onOpenChange]);

  if (isSuccess) {
    return (
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        size="md"
        icon={<CheckCircle2 className="h-5 w-5 text-success" />}
        title={isRu ? 'Спасибо за предложение!' : isTh ? 'ขอบคุณสำหรับคำแนะนำ!' : 'Thank you for your suggestion!'}
      >
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-success/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isRu ? 'Спасибо за предложение!' : isTh ? 'ขอบคุณสำหรับคำแนะนำ!' : 'Thank you for your suggestion!'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isRu
                ? 'Мы рассмотрим вашу заявку в течение 48 часов'
                : isTh
                ? 'เราจะตรวจสอบคำขอของคุณภายใน 48 ชั่วโมง'
                : 'We will review your request within 48 hours'}
            </p>
          </div>
      </ResponsiveModal>
    );
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      icon={<Lightbulb className="h-5 w-5 text-warning" />}
      title={isRu ? 'Предложить категорию' : isTh ? 'แนะนำหมวดหมู่' : 'Suggest a Category'}
      description={
        isRu
          ? 'Не нашли подходящую категорию? Предложите свою, и мы добавим её!'
          : isTh
          ? 'ไม่พบหมวดหมู่ที่ต้องการใช่ไหม? แนะนำมาได้เลย แล้วเราจะเพิ่มให้!'
          : "Can't find the right category? Suggest one and we'll add it!"
      }
    >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_name">
              {isRu ? 'Название категории (EN) *' : isTh ? 'ชื่อหมวดหมู่ (EN) *' : 'Category name (EN) *'}
            </Label>
            <Input
              id="category_name"
              placeholder={isRu ? 'Например: Vintage Electronics' : isTh ? 'เช่น Vintage Electronics' : 'e.g., Vintage Electronics'}
              value={formData.category_name}
              onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_name_ru">
              {isRu ? 'Название на русском' : isTh ? 'ชื่อภาษารัสเซีย' : 'Russian name'}
            </Label>
            <Input
              id="category_name_ru"
              placeholder={isRu ? 'Например: Винтажная электроника' : isTh ? 'เช่น Винтажная электроника' : 'e.g., Винтажная электроника'}
              value={formData.category_name_ru}
              onChange={(e) => setFormData(prev => ({ ...prev, category_name_ru: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {isRu ? 'Описание категории' : isTh ? 'คำอธิบายหมวดหมู่' : 'Category description'}
            </Label>
            <Textarea
              id="description"
              placeholder={isRu
                ? 'Опишите, какие товары/услуги входят в эту категорию...'
                : isTh
                ? 'อธิบายว่าสินค้า/บริการใดบ้างที่อยู่ในหมวดหมู่นี้...'
                : 'Describe what products/services belong to this category...'}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="example_items">
              {isRu ? 'Примеры товаров/услуг' : isTh ? 'ตัวอย่างสินค้า/บริการ' : 'Example items/services'}
            </Label>
            <Input
              id="example_items"
              placeholder={isRu
                ? 'Sony Walkman, ретро-телевизоры, радиоприёмники...'
                : isTh
                ? 'Sony Walkman, ทีวีย้อนยุค, วิทยุวินเทจ...'
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
              {isRu ? 'Отмена' : isTh ? 'ยกเลิก' : 'Cancel'}
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
              {isRu ? 'Отправить' : isTh ? 'ส่ง' : 'Submit'}
            </Button>
          </div>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-2">
          {isRu
            ? 'Мы уведомим вас, когда категория будет добавлена'
            : isTh
            ? 'เราจะแจ้งให้คุณทราบเมื่อเพิ่มหมวดหมู่แล้ว'
            : "We'll notify you when the category is added"}
        </p>
    </ResponsiveModal>
  );
}
