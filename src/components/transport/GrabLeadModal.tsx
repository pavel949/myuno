import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, User, ArrowRight, Shield, Clock, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GrabLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress?: string;
  destinationAddress?: string;
}

export function GrabLeadModal({ isOpen, onClose, pickupAddress, destinationAddress }: GrabLeadModalProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const [step, setStep] = useState<'form' | 'transition'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    pickup: pickupAddress || '',
    destination: destinationAddress || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.pickup) {
      toast.error(isRu ? 'Ошибка' : 'Error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save lead to consultation_requests
      const { error } = await supabase.from('consultation_requests').insert([
        {
          request_type: 'taxi',
          user_id: user?.id ?? null,
          name: formData.name || 'Taxi Request',
          email: user?.email ?? null,
          phone: formData.phone,
          vertical_id: 'taxi',
          entry_point: 'grab_transition',
          lead_source: 'app',
          notes: `Запрос на Grab такси\nОткуда: ${formData.pickup}\nКуда: ${formData.destination || 'Не указано'}`,
          vertical_metadata: {
            pickup_address: formData.pickup,
            destination_address: formData.destination,
            partner: 'grab',
            platform: 'myuno',
          },
        }
      ]);
      
      if (error) throw error;

      // Show transition screen
      setStep('transition');

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        openGrabApp();
      }, 3000);

    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error(isRu ? 'Ошибка' : 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGrabApp = () => {
    // Deep link to Grab app (works on mobile)
    // Fallback to website for desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open Grab app
      window.location.href = 'grab://open?screenType=BOOKING';
      
      // Fallback to app store after timeout
      setTimeout(() => {
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isIOS) {
          window.location.href = 'https://apps.apple.com/app/grab-taxi-ride-food-delivery/id647268330';
        } else {
          window.location.href = 'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger';
        }
      }, 2000);
    } else {
      // Desktop - open Grab website
      window.open('https://www.grab.com/th/transport/taxi/', '_blank');
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        >
          {step === 'form' ? (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-background z-10 px-6 pt-6 pb-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center">
                      <span className="text-white font-bold text-lg">G</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">
                        {isRu ? 'Заказ через Grab' : 'Book via Grab'}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {isRu ? 'Партнёр myUNO' : 'myUNO Partner'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="px-6 py-4 bg-muted/30">
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>{isRu ? 'Безопасно' : 'Secure'}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{isRu ? '3-5 мин' : '3-5 min'}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>{isRu ? 'Проверено' : 'Verified'}</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {isRu ? 'Ваше имя' : 'Your name'}
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isRu ? 'Как к вам обращаться?' : 'How should we call you?'}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {isRu ? 'Телефон' : 'Phone'} *
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+66..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-success" />
                    {isRu ? 'Откуда' : 'From'} *
                  </Label>
                  <Input
                    value={formData.pickup}
                    onChange={(e) => setFormData({ ...formData, pickup: e.target.value })}
                    placeholder={isRu ? 'Адрес подачи' : 'Pickup address'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {isRu ? 'Куда' : 'To'}
                  </Label>
                  <Input
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder={isRu ? 'Адрес назначения' : 'Destination address'}
                  />
                </div>

                {/* Info note */}
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    {isRu 
                      ? '📱 После отправки вы будете перенаправлены в приложение Grab для завершения заказа. myUNO сохранит вашу заявку для поддержки.'
                      : '📱 After submitting, you will be redirected to the Grab app to complete your booking. myUNO will save your request for support.'}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-success hover:bg-success/90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      {isRu ? 'Обработка...' : 'Processing...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isRu ? 'Продолжить в Grab' : 'Continue to Grab'}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* Transition Screen */
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="mb-6"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-success to-success/90 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-3xl">G</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-bold mb-2">
                  {isRu ? 'Переходим в Grab' : 'Opening Grab'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {isRu 
                    ? 'myUNO сохранил вашу заявку. Наша служба поддержки доступна 24/7 если понадобится помощь.'
                    : 'myUNO saved your request. Our support team is available 24/7 if you need help.'}
                </p>
              </motion.div>

              {/* Loading animation */}
              <motion.div
                className="flex justify-center gap-1.5 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-success"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>

              <Button
                variant="outline"
                onClick={openGrabApp}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {isRu ? 'Открыть сейчас' : 'Open now'}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
