import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface LifecycleNotification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  type: string;
  data: {
    title_ru?: string;
    body_ru?: string;
    cta_label_en?: string;
    cta_label_ru?: string;
    cta_url?: string;
    lifecycle_stage?: string;
    booking_id?: string;
  } | null;
}

export function LifecycleNotificationBell({ userId }: { userId: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['lifecycle-notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'booking')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as LifecycleNotification[];
    },
    enabled: !!userId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('lifecycle-notifs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => refetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, refetch]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    refetch();
  };

  const handleAction = (notif: LifecycleNotification) => {
    markRead(notif.id);
    const url = notif.data?.cta_url;
    if (url) {
      navigate(url);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
            >
              {unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <p className="font-semibold text-sm">{isRu ? 'Уведомления' : 'Notifications'}</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {isRu ? 'Нет уведомлений' : 'No notifications yet'}
              </div>
            ) : notifications.map(notif => {
              const title = isRu ? (notif.data?.title_ru || notif.title) : notif.title;
              const bodyText = isRu ? (notif.data?.body_ru || notif.body) : notif.body;
              const ctaLabel = isRu ? (notif.data?.cta_label_ru || 'Подробнее') : (notif.data?.cta_label_en || 'View');

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => handleAction(notif)}
                >
                  <div className="flex items-start gap-2">
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-1">{title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{body}</p>
                      {notif.metadata?.cta_url && (
                        <Badge variant="outline" className="mt-1.5 text-[10px] cursor-pointer">
                          {ctaLabel} →
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => { navigate('/notifications'); setOpen(false); }}
            >
              {isRu ? 'Все уведомления' : 'View all notifications'}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
