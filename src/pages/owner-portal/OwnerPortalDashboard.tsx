/**
 * OwnerPortalDashboard — The main landing page for the Owner Portal (/my-property).
 * Lists all properties the owner has access to with portal settings.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPortalSettings } from '@/hooks/useOwnerPortalSettings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight, Eye, MessageSquare, Shield, FileCheck, FileSignature, Lock } from 'lucide-react';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function OwnerPortalDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { data: portalProperties, isLoading } = useMyPortalSettings();

  // Pending statement approvals count (badge for "Statements" card)
  const { data: pendingStatements = 0 } = useQuery({
    queryKey: ['owner-portal-pending-statements', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('owner_statement_approvals')
        .select('id', { count: 'exact', head: true })
        .eq('owner_user_id', user!.id)
        .eq('status', 'pending');
      if (error) return 0;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  // Pending signature requests count (badge for "Documents" card)
  const { data: pendingSignatures = 0 } = useQuery({
    queryKey: ['owner-portal-pending-signatures', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('signature_signers')
        .select('id', { count: 'exact', head: true })
        .eq('signer_user_id', user!.id)
        .eq('status', 'pending');
      if (error) return 0;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!portalProperties || portalProperties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-none bg-primary/10 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold">
          {isRu ? 'Портал владельца' : 'Owner Portal'}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {isRu 
            ? 'У вас пока нет объектов, подключённых к порталу. Попросите вашу управляющую компанию настроить доступ.'
            : 'You don\'t have any properties connected to the portal yet. Ask your management company to set up access.'}
        </p>
        <Button variant="outline" onClick={() => navigate('/')}>
          {isRu ? 'На главную' : 'Go Home'}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">
            {isRu ? 'Мои объекты' : 'My Properties'}
          </h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent dark:text-accent border border-accent/40">
            <Lock className="w-3 h-3" />
            {isRu ? 'Портал УК' : 'MC Portal'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {isRu
            ? 'Доступ предоставлен вашей управляющей компанией — только просмотр'
            : 'Access granted by your management company — read only'}
        </p>
      </div>

      {/* Quick actions for owner */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/my-property/statements')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
              <FileCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{isRu ? 'Отчёты' : 'Statements'}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {isRu ? 'На одобрение' : 'For approval'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/my-property/signatures')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
              <FileSignature className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{isRu ? 'Документы' : 'Documents'}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {isRu ? 'На подпись' : 'To sign'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property cards */}
      <div className="space-y-3">
        {portalProperties.map((portal) => {
          const prop = portal.properties;
          if (!prop) return null;
          const title = isRu ? (prop.title_ru || prop.title) : prop.title;
          
          return (
            <Card 
              key={portal.id} 
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => navigate(`/my-property/${portal.property_id}`)}
            >
              <CardContent className="p-0">
                <div className="flex gap-4">
                  {/* Cover image */}
                  {prop.cover_image ? (
                    <div className="w-24 h-24 md:w-32 md:h-28 shrink-0 rounded-none overflow-hidden">
                      <img src={prop.cover_image} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-28 shrink-0 rounded-none bg-muted flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  <div className="flex-1 py-3 pr-4 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-semibold text-sm truncate">{title || (isRu ? 'Объект' : 'Property')}</h3>
                      {prop.address && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{prop.address}</p>
                      )}
                    </div>
                    
                    {/* Quick stats */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="w-3.5 h-3.5" />
                        <span>{isRu ? 'Под управлением' : 'Managed'}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact MC */}
      <Card className="border-dashed">
        <CardContent className="py-4 flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{isRu ? 'Связаться с УК' : 'Contact Management'}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Задайте вопрос или оставьте заявку' : 'Ask a question or submit a request'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/support')}>
            {isRu ? 'Написать' : 'Message'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
