import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, Mail, Globe, Building2, Shield, ExternalLink, Link2, Crown } from 'lucide-react';
import { PropertyTeamTab } from '@/components/owner/PropertyTeamTab';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PropertyOwnerInfoTabProps {
  propertyId: string;
  property: {
    owner_name?: string | null;
    owner_email?: string | null;
    owner_phone?: string | null;
    owner_nationality?: string | null;
    management_company_id?: string | null;
    provider_id?: string | null;
    project_id?: string | null;
    management_type?: string | null;
    owner_contact_id?: string | null;
  };
}

export function PropertyOwnerInfoTab({ propertyId, property }: PropertyOwnerInfoTabProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    property.owner_contact_id || null
  );
  const [isLinking, setIsLinking] = useState(false);

  // Fetch owner contacts from CRM for the linking selector
  const { data: ownerContacts } = useQuery({
    queryKey: ['owner-contacts-for-link', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, email, phone, whatsapp, birthday, nationality, avatar_url, family_info')
        .eq('company_id', companyId)
        .eq('contact_type', 'owner')
        .eq('is_archived', false)
        .order('first_name');
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch the linked CRM contact if there is one
  const { data: linkedContact } = useQuery({
    queryKey: ['linked-owner-contact', property.owner_contact_id],
    queryFn: async () => {
      if (!property.owner_contact_id) return null;
      const { data } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, email, phone, whatsapp, telegram, birthday, nationality, avatar_url, family_info, notes')
        .eq('id', property.owner_contact_id)
        .maybeSingle();
      return data;
    },
    enabled: !!property.owner_contact_id,
  });

  const handleLinkContact = async (contactId: string) => {
    setIsLinking(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ owner_contact_id: contactId })
        .eq('id', propertyId);
      if (error) throw error;
      setSelectedContactId(contactId);
      toast.success(isRu ? 'Собственник привязан' : 'Owner linked');
    } catch {
      toast.error(isRu ? 'Ошибка привязки' : 'Link error');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkContact = async () => {
    setIsLinking(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ owner_contact_id: null })
        .eq('id', propertyId);
      if (error) throw error;
      setSelectedContactId(null);
      toast.success(isRu ? 'Привязка снята' : 'Owner unlinked');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    } finally {
      setIsLinking(false);
    }
  };

  const managementLabels: Record<string, { en: string; ru: string }> = {
    full: { en: 'Full Management', ru: 'Полное управление' },
    partial: { en: 'Partial Management', ru: 'Частичное управление' },
    self: { en: 'Self-managed', ru: 'Самоуправление' },
  };

  // Use linked CRM contact data OR fallback to legacy fields
  const ownerData = linkedContact || {
    first_name: property.owner_name?.split(' ')[0] || null,
    last_name: property.owner_name?.split(' ').slice(1).join(' ') || null,
    email: property.owner_email,
    phone: property.owner_phone,
    nationality: property.owner_nationality,
    avatar_url: null,
    whatsapp: null,
    telegram: null,
    birthday: null,
    family_info: null,
    notes: null,
  };

  const displayName = linkedContact
    ? `${linkedContact.first_name} ${linkedContact.last_name}`
    : property.owner_name;

  return (
    <div className="space-y-6">
      {/* Owner Contact Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              {isRu ? 'Собственник' : 'Property Owner'}
            </CardTitle>
            {linkedContact && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/owner/owners/${linkedContact.id}`)}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {isRu ? 'Профиль' : 'Profile'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayName ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {ownerData.avatar_url && <AvatarImage src={ownerData.avatar_url} />}
                  <AvatarFallback className="text-lg">
                    {displayName[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{displayName}</p>
                  {property.management_type && (
                    <Badge variant="outline" className="text-xs mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      {isRu 
                        ? managementLabels[property.management_type]?.ru || property.management_type
                        : managementLabels[property.management_type]?.en || property.management_type
                      }
                    </Badge>
                  )}
                  {linkedContact && (
                    <Badge variant="secondary" className="text-xs mt-1 ml-1">
                      <Link2 className="h-3 w-3 mr-1" />
                      CRM
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {ownerData.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${ownerData.phone}`} className="hover:underline">{ownerData.phone}</a>
                  </div>
                )}
                {ownerData.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${ownerData.email}`} className="hover:underline">{ownerData.email}</a>
                  </div>
                )}
                {ownerData.nationality && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{ownerData.nationality}</span>
                  </div>
                )}
              </div>

              {/* Link/Unlink action */}
              {!linkedContact && companyId && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    {isRu ? 'Привязать к CRM контакту:' : 'Link to CRM contact:'}
                  </p>
                  <div className="flex gap-2">
                    <Select onValueChange={handleLinkContact} disabled={isLinking}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isRu ? 'Выберите собственника...' : 'Select owner...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(ownerContacts || []).map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.first_name} {c.last_name} {c.email ? `(${c.email})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {linkedContact && (
                <div className="pt-2 border-t">
                  <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={handleUnlinkContact} disabled={isLinking}>
                    {isRu ? 'Отвязать от CRM' : 'Unlink from CRM'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4 text-muted-foreground">
                <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{isRu ? 'Собственник не указан' : 'Owner not assigned'}</p>
              </div>
              {companyId && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {isRu ? 'Привязать к CRM контакту:' : 'Link to CRM contact:'}
                  </p>
                  <Select onValueChange={handleLinkContact} disabled={isLinking}>
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Выберите собственника...' : 'Select owner...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(ownerContacts || []).map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.last_name} {c.email ? `(${c.email})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delegates / Team */}
      <PropertyTeamTab propertyId={propertyId} />
    </div>
  );
}
