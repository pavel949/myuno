import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { bangkokTodayDate, civilDateKey } from '@/lib/hotelDates';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import type { Database } from '@/integrations/supabase/types';

type ChannelRow = Pick<Database['public']['Tables']['mcc_channel_metrics']['Row'],
  'id' | 'date' | 'channel' | 'impressions' | 'clicks' | 'leads' | 'signups' | 'conversions'>;
const fields = ['impressions', 'clicks', 'leads', 'signups', 'conversions'] as const;
export type ChannelSummary = { channel: string } & Record<typeof fields[number], number | null>;

export function summarizeAcquisition(rows: ChannelRow[]): ChannelSummary[] {
  const groups = new Map<string, ChannelRow[]>();
  for (const row of rows) groups.set(row.channel, [...(groups.get(row.channel) ?? []), row]);
  return [...groups].map(([channel, items]) => {
    const result: ChannelSummary = { channel, impressions: null, clicks: null, leads: null, signups: null, conversions: null };
    for (const field of fields) {
      const values = items.map(row => row[field]);
      if (values.every((value): value is number => typeof value === 'number' && Number.isFinite(value))) {
        result[field] = values.reduce((sum, value) => sum + value, 0);
      }
    }
    return result;
  }).sort((a, b) => a.channel.localeCompare(b.channel));
}

export function useAcquisitionMetrics(period = 30, enabled = false, actorId?: string) {
  const today = bangkokTodayDate();
  const endDate = civilDateKey(today);
  const startDate = civilDateKey(subDays(today, period - 1));
  return useQuery({
    queryKey: ['acquisition-metrics', actorId, startDate, endDate],
    enabled: enabled && Boolean(actorId),
    queryFn: async () => {
      try {
        const rows: ChannelRow[] = [];
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase.from('mcc_channel_metrics')
            .select('id,date,channel,impressions,clicks,leads,signups,conversions')
            .gte('date', startDate).lte('date', endDate)
            .order('date').order('id').range(offset, offset + 999);
          if (error) throw error;
          if (!data) throw new Error('Missing acquisition response');
          rows.push(...data);
          if (data.length < 1000) break;
        }
        return { channels: summarizeAcquisition(rows), rowCount: rows.length,
          latestDate: rows.at(-1)?.date ?? null };
      } catch (error) {
        throw error instanceof Error ? error : new Error('Acquisition read failed');
      }
    },
    ...CACHE_PROFILES.ADMIN,
  });
}
