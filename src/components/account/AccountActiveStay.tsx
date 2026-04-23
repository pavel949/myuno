import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  Home,
  Calendar,
  MapPin,
  ChevronRight,
  Key,
  MessageCircle,
} from 'lucide-react';

export function AccountActiveStay() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRussian = language === 'ru';

  const { data: activeStay, isLoading } = useQuery({
    queryKey: ['active-stay', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('property_bookings')
        .select(`
          id,
          check_in,
          check_out,
          status,
          total_amount,
          currency,
          property:properties(
            id,
            title_en,
            title_ru,
            address,
            images
          )
        `)
        .eq('guest_id', user.id)
        .in('status', ['confirmed', 'checked_in'])
        .lte('check_in', today)
        .gte('check_out', today)
        .order('check_in', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return null; // Don't show skeleton, just hide if loading
  }

  if (!activeStay) {
    return null; // Hide completely if no active stay
  }

  const property = activeStay.property as any;
  const propertyTitle = isRussian ? (property?.title_ru || property?.title_en) : (property?.title_en || property?.title_ru);
  const checkIn = parseISO(activeStay.check_in);
  const checkOut = parseISO(activeStay.check_out);
  const daysLeft = differenceInDays(checkOut, new Date());

  const formatDate = (date: Date) => {
    return format(date, 'd MMM', {
      locale: isRussian ? ru : enUS,
    });
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5">
      <CardContent className="p-0">
        <div className="flex gap-3 p-4">
          {/* Property Image */}
          <div className="relative w-20 h-20 rounded-none overflow-hidden flex-shrink-0">
            {property?.images?.[0] ? (
              <img
                src={property.images[0]}
                alt={propertyTitle || ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Home className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <Badge
              variant="default"
              className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0"
            >
              <Key className="h-2.5 w-2.5 mr-0.5" />
              {isRussian ? 'Сейчас' : 'Now'}
            </Badge>
          </div>

          {/* Stay Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                  {propertyTitle}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{property?.address}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDate(checkIn)} — {formatDate(checkOut)}
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {daysLeft} {isRussian ? 'дн. осталось' : 'days left'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t flex divide-x">
          <Button
            variant="ghost"
            className="flex-1 rounded-none h-10 text-xs"
            onClick={() => navigate(`/trip/${activeStay.id}`)}
          >
            <Key className="h-3.5 w-3.5 mr-1.5" />
            {isRussian ? 'Инструкции' : 'Check-in Info'}
          </Button>
          <Button
            variant="ghost"
            className="flex-1 rounded-none h-10 text-xs"
            onClick={() => navigate('/messages')}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            {isRussian ? 'Сообщения' : 'Messages'}
          </Button>
          <Button
            variant="ghost"
            className="flex-1 rounded-none h-10 text-xs"
            onClick={() => navigate('/my-stay')}
          >
            {isRussian ? 'Кабинет' : 'Dashboard'}
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
