import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Package, Scissors, Home, Car, Ship, Ticket, Flower2, Stethoscope, Clock, MapPin, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { EmptyState } from '@/components/uno/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface BookingItem {
  id: string;
  type: 'booking' | 'tour' | 'event' | 'property' | 'water';
  title: string;
  subtitle?: string;
  date: string;
  status: string;
  total: number;
  currency: string;
  image?: string;
}

const getBookingIcon = (type: string) => {
  switch (type) {
    case 'beauty': return Scissors;
    case 'service': return Package;
    case 'food': return Package;
    case 'flower': return Flower2;
    case 'transport': return Car;
    case 'tour': return Ticket;
    case 'event': return Ticket;
    case 'property': return Home;
    case 'water': return Ship;
    case 'medical': return Stethoscope;
    default: return Calendar;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusLabel = (status: string, language: string) => {
  const labels: Record<string, { en: string; ru: string }> = {
    pending: { en: 'Pending', ru: 'Ожидает' },
    confirmed: { en: 'Confirmed', ru: 'Подтверждено' },
    completed: { en: 'Completed', ru: 'Завершено' },
    cancelled: { en: 'Cancelled', ru: 'Отменено' },
  };
  return labels[status]?.[language === 'ru' ? 'ru' : 'en'] || status;
};

export default function Bookings() {
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const allBookings: BookingItem[] = [];

      // Load general bookings
      const { data: generalBookings } = await supabase
        .from('bookings')
        .select('*, booking_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (generalBookings) {
        for (const b of generalBookings) {
          const items = b.booking_items || [];
          const firstItem = items[0];
          allBookings.push({
            id: b.id,
            type: 'booking',
            title: firstItem?.item_name || (language === 'ru' ? 'Бронирование' : 'Booking'),
            subtitle: b.booking_type,
            date: b.scheduled_at || b.created_at,
            status: b.status,
            total: b.total_amount || 0,
            currency: b.currency || 'THB',
          });
        }
      }

      // Load tour bookings
      const { data: tourBookings } = await supabase
        .from('tour_bookings')
        .select('*, tours(title_en, title_ru, cover_image)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tourBookings) {
        for (const b of tourBookings) {
          allBookings.push({
            id: b.id,
            type: 'tour',
            title: language === 'ru' ? b.tours?.title_ru : b.tours?.title_en || 'Tour',
            date: b.booking_date,
            status: b.status || 'pending',
            total: b.total_amount || 0,
            currency: b.currency || 'THB',
            image: b.tours?.cover_image,
          });
        }
      }

      // Load event bookings
      const { data: eventBookings } = await supabase
        .from('event_bookings')
        .select('*, events(title_en, title_ru, cover_image)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (eventBookings) {
        for (const b of eventBookings) {
          allBookings.push({
            id: b.id,
            type: 'event',
            title: language === 'ru' ? b.events?.title_ru : b.events?.title_en || 'Event',
            subtitle: `${b.tickets} ${language === 'ru' ? 'билетов' : 'tickets'}`,
            date: b.created_at,
            status: b.status || 'pending',
            total: b.total_amount || 0,
            currency: b.currency || 'THB',
            image: b.events?.cover_image,
          });
        }
      }

      // Load property inquiries
      const { data: propertyInquiries } = await supabase
        .from('property_inquiries')
        .select('*, properties(title_en, title_ru, cover_image)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (propertyInquiries) {
        for (const b of propertyInquiries) {
          allBookings.push({
            id: b.id,
            type: 'property',
            title: language === 'ru' ? b.properties?.title_ru : b.properties?.title_en || 'Property',
            subtitle: b.check_in && b.check_out ? `${b.check_in} - ${b.check_out}` : undefined,
            date: b.created_at,
            status: b.status || 'pending',
            total: 0,
            currency: 'THB',
            image: b.properties?.cover_image,
          });
        }
      }

      // Load water activity bookings
      const { data: waterBookings } = await supabase
        .from('water_activity_bookings')
        .select('*, water_activities(title_en, title_ru, cover_image)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (waterBookings) {
        for (const b of waterBookings) {
          allBookings.push({
            id: b.id,
            type: 'water',
            title: language === 'ru' ? b.water_activities?.title_ru : b.water_activities?.title_en || 'Water Activity',
            subtitle: `${b.participants} ${language === 'ru' ? 'чел.' : 'guests'}`,
            date: b.booking_date,
            status: b.status || 'pending',
            total: b.total_amount || 0,
            currency: b.currency || 'THB',
            image: b.water_activities?.cover_image,
          });
        }
      }

      // Sort by date
      allBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBookings(allBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, language]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, loadBookings]);

  const handleRefresh = useCallback(async () => {
    await loadBookings();
  }, [loadBookings]);

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <LoadingState />
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'd MMM yyyy', { locale: language === 'ru' ? ru : enUS });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-[calc(100vh-8rem)]">
        <PageContainer>
          <PageHeader title={t('nav.bookings')} />
          
          {bookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={language === 'ru' ? 'Нет бронирований' : 'No bookings yet'}
              description={language === 'ru' 
                ? 'Начните изучать услуги, чтобы сделать первое бронирование'
                : 'Start exploring services to make your first booking'}
              action={
                <PremiumButton onClick={() => navigate('/discover')}>
                  {t('nav.discover')}
                </PremiumButton>
              }
            />
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const Icon = getBookingIcon(booking.subtitle || booking.type);
                return (
                  <div
                    key={`${booking.type}-${booking.id}`}
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex gap-3">
                      {booking.image ? (
                        <img
                          src={booking.image}
                          alt={booking.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium truncate">{booking.title}</h3>
                          <Badge className={`shrink-0 ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status, language)}
                          </Badge>
                        </div>
                        {booking.subtitle && (
                          <p className="text-sm text-muted-foreground capitalize">{booking.subtitle}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDate(booking.date)}</span>
                          </div>
                          {booking.total > 0 && (
                            <span className="font-medium text-foreground">
                              ฿{booking.total.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PageContainer>
      </PullToRefresh>
    </AppLayout>
  );
}
