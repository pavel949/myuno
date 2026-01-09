import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, MessageCircle, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function PropertyInquiry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: language === 'ru' ? 'Требуется авторизация' : 'Login Required',
        description: language === 'ru' 
          ? 'Пожалуйста, войдите для отправки запроса' 
          : 'Please login to submit an inquiry',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('property_inquiries')
        .insert({
          property_id: id,
          user_id: user.id,
          check_in: formData.checkIn || null,
          check_out: formData.checkOut || null,
          guests: formData.guests,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
        });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: language === 'ru' ? 'Запрос отправлен!' : 'Inquiry Sent!',
        description: language === 'ru' 
          ? 'Владелец свяжется с вами в ближайшее время' 
          : 'The host will contact you soon',
      });
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast({
        title: language === 'ru' ? 'Ошибка' : 'Error',
        description: language === 'ru' 
          ? 'Не удалось отправить запрос' 
          : 'Failed to submit inquiry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[80vh]">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2 text-center">
            {language === 'ru' ? 'Запрос отправлен!' : 'Inquiry Sent!'}
          </h2>
          <p className="text-muted-foreground text-center max-w-sm mb-8">
            {language === 'ru' 
              ? 'Владелец получил ваш запрос и свяжется с вами в ближайшее время.'
              : 'The property owner has received your inquiry and will contact you soon.'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/property')}>
              {language === 'ru' ? 'К списку' : 'Browse More'}
            </Button>
            <Button onClick={() => navigate('/bookings')}>
              {language === 'ru' ? 'Мои запросы' : 'My Inquiries'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBottomNav={false}>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">
            {language === 'ru' ? 'Запрос на бронирование' : 'Booking Inquiry'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dates */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">
                {language === 'ru' ? 'Даты проживания' : 'Stay Dates'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn">
                  {language === 'ru' ? 'Заезд' : 'Check-in'}
                </Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="checkOut">
                  {language === 'ru' ? 'Выезд' : 'Check-out'}
                </Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">
                {language === 'ru' ? 'Количество гостей' : 'Number of Guests'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData({ ...formData, guests: Math.max(1, formData.guests - 1) })}
              >
                -
              </Button>
              <span className="text-xl font-bold w-12 text-center">{formData.guests}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData({ ...formData, guests: Math.min(20, formData.guests + 1) })}
              >
                +
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h2 className="font-semibold">
              {language === 'ru' ? 'Контактная информация' : 'Contact Information'}
            </h2>
            
            <div>
              <Label htmlFor="name">
                {language === 'ru' ? 'Имя' : 'Full Name'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">
                {language === 'ru' ? 'Телефон' : 'Phone'}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+66 XX XXX XXXX"
                className="mt-1"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <Label htmlFor="message">
                {language === 'ru' ? 'Сообщение' : 'Message'}
              </Label>
            </div>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={language === 'ru' 
                ? 'Расскажите о себе и ваших пожеланиях...'
                : 'Tell us about yourself and any special requests...'}
              rows={4}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={isSubmitting || !formData.name}
          >
            {isSubmitting 
              ? (language === 'ru' ? 'Отправка...' : 'Sending...') 
              : (language === 'ru' ? 'Отправить запрос' : 'Send Inquiry')}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
