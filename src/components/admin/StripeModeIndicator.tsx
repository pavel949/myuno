import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Zap } from 'lucide-react';

export function StripeModeIndicator() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: mode } = useQuery({
    queryKey: ['stripe-mode'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'stripe_mode')
        .maybeSingle();
      return (data?.value as string) || 'test';
    },
    staleTime: 60 * 1000,
  });

  const isLive = mode === 'live';

  return (
    <Badge
      variant="outline"
      className={
        isLive
          ? 'gap-1 border-success/40 bg-success/10 text-success text-[10px] font-mono uppercase'
          : 'gap-1 border-orange-400/40 bg-orange-400/10 text-orange-600 dark:text-orange-400 text-[10px] font-mono uppercase'
      }
    >
      <Zap className="h-3 w-3" />
      {isLive ? 'LIVE' : 'TEST'}
    </Badge>
  );
}
