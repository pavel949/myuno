/**
 * VendorLegalInbox — incoming consultation requests visible to the legal vendor.
 *
 * Wave 2 / C12. Pulls rows from `consultation_requests` filtered by legal-type
 * (`general_legal`, `business_legal`, `property_legal`, `visa_consultation`)
 * where `vertical_metadata.provider_id` matches the vendor's provider_id.
 *
 * Read-only inbox + status pill; full case-management lives in /admin/consultations.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, Phone, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const LEGAL_REQUEST_TYPES = [
  'general_legal',
  'business_legal',
  'property_legal',
  'visa_consultation',
];

interface InboxRow {
  id: string;
  request_type: string;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  notes: string | null;
  preferred_dates: unknown;
  vertical_metadata: Record<string, unknown> | null;
  created_at: string;
}

export function VendorLegalInbox({ providerId }: { providerId?: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-legal-inbox', providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('id,request_type,name,email,phone,status,notes,preferred_dates,vertical_metadata,created_at')
        .in('request_type', LEGAL_REQUEST_TYPES)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).filter((r) => {
        const meta = (r as InboxRow).vertical_metadata as Record<string, unknown> | null;
        return !meta?.provider_id || meta.provider_id === providerId;
      }) as InboxRow[];
    },
  });

  if (!providerId) return null;

  if (isLoading) {
    return (
      <div className="space-y-2 mb-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Inbox className="h-4 w-4" />
        {isRu ? 'Входящие заявки' : 'Incoming Requests'}
        {data && data.length > 0 && (
          <Badge variant="secondary">{data.length}</Badge>
        )}
      </h3>

      {!data || data.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {isRu ? 'Пока нет заявок от клиентов' : 'No client requests yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((row) => {
            const meta = row.vertical_metadata || {};
            const service = typeof meta.service === 'string' ? meta.service : null;
            return (
              <Card key={row.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="font-medium">{row.name}</div>
                    <Badge variant={row.status === 'pending' ? 'default' : 'outline'} className="text-xs">
                      {row.status}
                    </Badge>
                  </div>
                  {service && (
                    <p className="text-sm text-muted-foreground mb-1">{service}</p>
                  )}
                  {row.notes && (
                    <p className="text-sm mb-2 line-clamp-2">{row.notes}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{row.phone}</span>
                    {row.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{row.email}</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(row.created_at), 'dd MMM HH:mm')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
