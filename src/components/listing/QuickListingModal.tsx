import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Home, Briefcase, ShoppingBag, Compass, 
  ChevronRight, ChevronLeft, Check, Upload, Loader2,
  Ship, Car, Utensils, Scissors, Heart, Dumbbell,
  GraduationCap, Baby, Sparkles, PawPrint, Scale, Flower2,
  Pill, Calendar, Building
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickListing, QuickListingData } from '@/hooks/useQuickListing';
import { cn } from '@/lib/utils';

interface QuickListingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'property', icon: Home, labelEn: 'Property', labelRu: 'Недвижимость', color: 'bg-blue-500/10 text-blue-600' },
  { id: 'service', icon: Briefcase, labelEn: 'Service', labelRu: 'Услуга', color: 'bg-green-500/10 text-green-600' },
  { id: 'product', icon: ShoppingBag, labelEn: 'Product', labelRu: 'Товар', color: 'bg-purple-500/10 text-purple-600' },
  { id: 'experience', icon: Compass, labelEn: 'Experience', labelRu: 'Впечатление', color: 'bg-orange-500/10 text-orange-600' },
];

const SUBCATEGORIES: Record<string, Array<{ id: string; icon: React.ElementType; labelEn: string; labelRu: string }>> = {
  property: [
    { id: 'villa', icon: Home, labelEn: 'Villa', labelRu: 'Вилла' },
    { id: 'apartment', icon: Building, labelEn: 'Apartment', labelRu: 'Квартира' },
    { id: 'condo', icon: Building, labelEn: 'Condo', labelRu: 'Кондо' },
  ],
  service: [
    { id: 'beauty', icon: Scissors, labelEn: 'Beauty & Spa', labelRu: 'Красота и SPA' },
    { id: 'clinic', icon: Heart, labelEn: 'Medical', labelRu: 'Медицина' },
    { id: 'fitness', icon: Dumbbell, labelEn: 'Fitness', labelRu: 'Фитнес' },
    { id: 'education', icon: GraduationCap, labelEn: 'Education', labelRu: 'Образование' },
    { id: 'babysitter', icon: Baby, labelEn: 'Babysitting', labelRu: 'Няни' },
    { id: 'cleaning', icon: Sparkles, labelEn: 'Cleaning', labelRu: 'Уборка' },
    { id: 'pets', icon: PawPrint, labelEn: 'Pet Services', labelRu: 'Для питомцев' },
    { id: 'legal', icon: Scale, labelEn: 'Legal', labelRu: 'Юридические' },
    { id: 'transport', icon: Car, labelEn: 'Transport', labelRu: 'Транспорт' },
    { id: 'restaurant', icon: Utensils, labelEn: 'Restaurant', labelRu: 'Ресторан' },
    { id: 'pharmacy', icon: Pill, labelEn: 'Pharmacy', labelRu: 'Аптека' },
  ],
  product: [
    { id: 'flowers', icon: Flower2, labelEn: 'Flowers', labelRu: 'Цветы' },
    { id: 'food', icon: Utensils, labelEn: 'Food & Drinks', labelRu: 'Еда и напитки' },
    { id: 'other', icon: ShoppingBag, labelEn: 'Other', labelRu: 'Другое' },
  ],
  experience: [
    { id: 'tour', icon: Compass, labelEn: 'Tour', labelRu: 'Экскурсия' },
    { id: 'yacht', icon: Ship, labelEn: 'Boat Charter', labelRu: 'Чартер' },
    { id: 'activity', icon: Compass, labelEn: 'Activity', labelRu: 'Активность' },
    { id: 'event', icon: Calendar, labelEn: 'Event', labelRu: 'Мероприятие' },
  ],
};

export function QuickListingModal({ isOpen, onClose }: QuickListingModalProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { submitListing, isSubmitting } = useQuickListing();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<QuickListingData>>({
    currency: 'THB',
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCategorySelect = (categoryId: string) => {
    setFormData({ ...formData, category: categoryId });
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setFormData({ ...formData, subcategory: subcategoryId });
    setStep(2);
  };

  const handleNext = () => {
    if (step === 2 && !user) {
      setStep(3);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 1 && formData.category) {
      setFormData({ ...formData, subcategory: undefined });
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.title) return;

    const result = await submitListing(formData as QuickListingData);
    if (result.success) {
      setIsSuccess(true);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({ currency: 'THB' });
    setIsSuccess(false);
    onClose();
  };

  const canProceed = () => {
    if (step === 1) return formData.category && formData.subcategory;
    if (step === 2) return formData.title;
    if (step === 3) return formData.contact_name && (formData.contact_phone || formData.contact_email);
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" hideCloseButton>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {step > 1 && !isSuccess && (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <h2 className="text-lg font-semibold">
              {isSuccess 
                ? (language === 'ru' ? 'Заявка отправлена!' : 'Listing Submitted!')
                : (language === 'ru' ? 'Быстрое размещение' : 'Quick Listing')
              }
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 min-h-[400px]">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-80 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {language === 'ru' ? 'Спасибо!' : 'Thank You!'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {language === 'ru' 
                    ? 'Ваша заявка отправлена на модерацию. Мы свяжемся с вами в течение 24 часов.' 
                    : 'Your listing is under review. We\'ll contact you within 24 hours.'}
                </p>
                <Button onClick={handleClose} className="gradient-gold text-primary-foreground">
                  {language === 'ru' ? 'Закрыть' : 'Close'}
                </Button>
              </motion.div>
            ) : step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {!formData.category ? (
                  <>
                    <p className="text-muted-foreground mb-4">
                      {language === 'ru' ? 'Что вы хотите предложить?' : 'What would you like to offer?'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border/50",
                            "hover:border-primary/50 hover:bg-accent/50 transition-all",
                            formData.category === cat.id && "border-primary bg-accent"
                          )}
                        >
                          <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", cat.color)}>
                            <cat.icon className="w-7 h-7" />
                          </div>
                          <span className="font-medium">
                            {language === 'ru' ? cat.labelRu : cat.labelEn}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">
                      {language === 'ru' ? 'Выберите категорию:' : 'Select a category:'}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {SUBCATEGORIES[formData.category]?.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleSubcategorySelect(sub.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50",
                            "hover:border-primary/50 hover:bg-accent/50 transition-all text-center",
                            formData.subcategory === sub.id && "border-primary bg-accent"
                          )}
                        >
                          <sub.icon className="w-6 h-6 text-primary" />
                          <span className="text-sm font-medium">
                            {language === 'ru' ? sub.labelRu : sub.labelEn}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            ) : step === 2 ? (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-muted-foreground mb-4">
                  {language === 'ru' ? 'Расскажите о вашем предложении:' : 'Tell us about your offering:'}
                </p>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {language === 'ru' ? 'Название *' : 'Title *'}
                  </label>
                  <Input
                    placeholder={language === 'ru' ? 'Например: Роскошная вилла с видом на море' : 'e.g. Luxury Sea View Villa'}
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {language === 'ru' ? 'Описание' : 'Description'}
                  </label>
                  <Textarea
                    placeholder={language === 'ru' ? 'Краткое описание...' : 'Brief description...'}
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {language === 'ru' ? 'Цена' : 'Price'}
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {language === 'ru' ? 'Валюта' : 'Currency'}
                    </label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={formData.currency || 'THB'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      <option value="THB">THB (฿)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="RUB">RUB (₽)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {language === 'ru' ? 'Локация' : 'Location'}
                  </label>
                  <Input
                    placeholder={language === 'ru' ? 'Например: Патонг, Пхукет' : 'e.g. Patong, Phuket'}
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {language === 'ru' ? 'Фото (необязательно)' : 'Photos (optional)'}
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Перетащите или нажмите для загрузки' : 'Drag & drop or click to upload'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-muted-foreground mb-4">
                  {language === 'ru' ? 'Как с вами связаться?' : 'How can we reach you?'}
                </p>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {language === 'ru' ? 'Ваше имя *' : 'Your Name *'}
                  </label>
                  <Input
                    placeholder={language === 'ru' ? 'Иван Иванов' : 'John Smith'}
                    value={formData.contact_name || ''}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {language === 'ru' ? 'Телефон / WhatsApp' : 'Phone / WhatsApp'}
                  </label>
                  <Input
                    type="tel"
                    placeholder="+66..."
                    value={formData.contact_phone || ''}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {language === 'ru' ? 'Email' : 'Email'}
                  </label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.contact_email || ''}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!isSuccess && step > 1 && (
          <div className="p-4 border-t border-border">
            <Button
              className="w-full gradient-gold text-primary-foreground"
              disabled={!canProceed() || isSubmitting}
              onClick={handleNext}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === 3 || user ? (
                <>
                  {language === 'ru' ? 'Отправить на модерацию' : 'Submit for Review'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  {language === 'ru' ? 'Далее' : 'Next'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Progress */}
        {!isSuccess && (
          <div className="flex justify-center gap-2 pb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  step >= s ? "bg-primary" : "bg-muted",
                  user && s === 3 && "hidden"
                )}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
