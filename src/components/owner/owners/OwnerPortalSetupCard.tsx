/**
 * @module OwnerPortalSetupCard
 * MC-facing card for creating and managing an owner's portal.
 * Links CRM contact → auth user → portal settings for all properties.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  Settings,
  UserCheck,
  UserX,
  Loader2,
  Zap,
  Building2,
} from 'lucide-react';

interface OwnerProperty {
  id: string;
  name: string;
}

interface Props {
  contactId: string;
  email: string | null;
  linkedUserId: string | null;
  properties: OwnerProperty[];
}

export default function OwnerPortalSetupCard({ contactId, email, linkedUserId, properties }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const queryClient = useQueryClient();
  const [activating, setActivating] = useState(false);

  // Fetch portal settings for all properties of this owner
  const { data: portalSettings, isLoading } = useQuery({
    queryKey: ['owner-portal-settings-all', contactId, linkedUserId],
    queryFn: async () => {
      if (!linkedUserId || !properties.length) return [];
      const propIds = properties.map(p => p.id);
      const { data, error } = await (supabase as any)
        .from('owner_portal_settings')
        .select('id, property_id, show_booking_calendar')
        .eq('owner_user_id', linkedUserId)
        .in('property_id', propIds);
      if (error) throw error;
      return (data || []) as { id: string; property_id: string; show_booking_calendar: boolean }[];
    },
    enabled: !!linkedUserId && properties.length > 0,
  });

  const portalStatus: 'active' | 'pending' | 'not_configured' = linkedUserId
    ? (portalSettings && portalSettings.length > 0 ? 'active' : 'pending')
    : 'not_configured';

  const handleActivatePortal = async () => {
    if (!email) {
      toast.error(isRu ? 'У контакта нет email' : 'Contact has no email');
      return;
    }
    if (!companyId) return;

    setActivating(true);
    try {
      // 1. Search for user by email in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (!profile) {
        toast.info(
          isRu
            ? `Пользователь с email ${email} не найден. Собственник должен зарегистрироваться в системе, после чего портал активируется.`
            : `No user found with email ${email}. The owner must register first, then the portal will activate.`,
          { duration: 8000 }
        );
        // Create pending delegates for all properties
        for (const prop of properties) {
          await typedFrom('property_delegates').upsert({
            property_id: prop.id,
            invited_email: email,
            status: 'pending',
            role: 'owner_readonly',
          }, { onConflict: 'property_id,invited_email' });
        }
        setActivating(false);
        return;
      }

      // 2. Link user to CRM contact
      await typedFrom('crm_contacts')
        .update({ linked_user_id: profile.id })
        .eq('id', contactId);

      // 3. Create portal settings for each property
      for (const prop of properties) {
        await (supabase as any).from('owner_portal_settings').upsert({
          property_id: prop.id,
          owner_user_id: profile.id,
          company_id: companyId,
          show_booking_calendar: true,
          show_guest_names: false,
          show_booking_prices: true,
          show_financial_statements: true,
          show_mc_commission: false,
          show_expenses_detail: true,
          show_maintenance: true,
          show_utilities: true,
          show_documents: true,
          show_owner_stays: true,
          show_occupancy_stats: true,
          show_deposits: true,
          show_payouts: true,
        }, { onConflict: 'property_id,owner_user_id' });

        // 4. Create property delegate
        await (supabase as any).from('property_delegates').upsert({
          property_id: prop.id,
          user_id: profile.id,
          status: 'active',
          role: 'owner_readonly',
        }, { onConflict: 'property_id,user_id' });
      }

      toast.success(isRu ? 'Портал активирован!' : 'Portal activated!');
      queryClient.invalidateQueries({ queryKey: ['owner-portal-settings-all'] });
      queryClient.invalidateQueries({ queryKey: ['owner-accounts'] });
    } catch (err: any) {
      console.error('Portal activation error:', err);
      toast.error(isRu ? 'Ошибка активации портала' : 'Portal activation error');
    } finally {
      setActivating(false);
    }
  };

  const statusBadge = {
    active: { label: isRu ? 'Активен' : 'Active', variant: 'default' as const },
    pending: { label: isRu ? 'Ожидает регистрации' : 'Pending Registration', variant: 'secondary' as const },
    not_configured: { label: isRu ? 'Не настроен' : 'Not Configured', variant: 'outline' as const },
  }[portalStatus];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            {isRu ? 'Портал владельца' : 'Owner Portal'}
          </CardTitle>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User link status */}
        <div className="flex items-center gap-2 text-sm">
          {linkedUserId ? (
            <>
              <UserCheck className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                {isRu ? 'Привязан к аккаунту' : 'Linked to account'}
              </span>
            </>
          ) : (
            <>
              <UserX className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {isRu ? 'Нет привязки к аккаунту' : 'No account linked'}
              </span>
            </>
          )}
        </div>

        {/* Activate button */}
        {portalStatus === 'not_configured' && email && (
          <Button
            onClick={handleActivatePortal}
            disabled={activating || !properties.length}
            className="w-full"
            size="sm"
          >
            {activating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isRu ? 'Создать портал' : 'Create Portal'}
          </Button>
        )}

        {!email && portalStatus === 'not_configured' && (
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Добавьте email собственнику для создания портала'
              : 'Add email to the owner to create a portal'}
          </p>
        )}

        {/* Properties list with portal status */}
        {properties.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isRu ? 'Объекты' : 'Properties'}
              </p>
              {properties.map(prop => {
                const hasPortal = portalSettings?.some(ps => ps.property_id === prop.id);
                return (
                  <div key={prop.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{prop.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={hasPortal ? 'default' : 'outline'} className="text-[10px]">
                        {hasPortal ? (isRu ? 'Вкл' : 'On') : (isRu ? 'Выкл' : 'Off')}
                      </Badge>
                      {hasPortal && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => navigate(`/mc/properties/${prop.id}/portal-settings`)}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
