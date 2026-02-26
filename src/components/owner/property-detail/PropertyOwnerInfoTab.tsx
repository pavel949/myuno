import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Phone, Mail, Globe, Building2, Shield, ExternalLink } from 'lucide-react';
import { PropertyTeamTab } from '@/components/owner/PropertyTeamTab';

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
  };
}

export function PropertyOwnerInfoTab({ propertyId, property }: PropertyOwnerInfoTabProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const managementLabels: Record<string, { en: string; ru: string }> = {
    full: { en: 'Full Management', ru: 'Полное управление' },
    partial: { en: 'Partial Management', ru: 'Частичное управление' },
    self: { en: 'Self-managed', ru: 'Самоуправление' },
  };

  return (
    <div className="space-y-6">
      {/* Owner Contact Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {isRu ? 'Собственник' : 'Property Owner'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {property.owner_name ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">
                    {property.owner_name[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{property.owner_name}</p>
                  {property.management_type && (
                    <Badge variant="outline" className="text-xs mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      {isRu 
                        ? managementLabels[property.management_type]?.ru || property.management_type
                        : managementLabels[property.management_type]?.en || property.management_type
                      }
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {property.owner_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${property.owner_phone}`} className="hover:underline">{property.owner_phone}</a>
                  </div>
                )}
                {property.owner_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${property.owner_email}`} className="hover:underline">{property.owner_email}</a>
                  </div>
                )}
                {property.owner_nationality && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{property.owner_nationality}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isRu ? 'Данные собственника не заполнены' : 'Owner details not filled'}</p>
              <p className="text-xs mt-1">{isRu ? 'Заполните в редакторе объекта' : 'Fill in the property editor'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delegates / Team */}
      <PropertyTeamTab propertyId={propertyId} />
    </div>
  );
}
