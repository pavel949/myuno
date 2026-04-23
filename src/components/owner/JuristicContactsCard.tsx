import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useJuristicContacts } from '@/hooks/useJuristicRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Phone, Mail, MessageCircle, Clock, User, 
  Wrench, Shield, CreditCard, AlertTriangle, ExternalLink
} from 'lucide-react';

interface JuristicContactsCardProps {
  projectId?: string;
  propertyId?: string;
  projectData?: {
    juristic_person_name?: string;
    juristic_person_name_ru?: string;
    juristic_email?: string;
    juristic_phone?: string;
    juristic_line_id?: string;
    juristic_whatsapp?: string;
    juristic_office_hours?: string;
    juristic_contact_person?: string;
    juristic_contact_position?: string;
    juristic_address?: string;
    cam_fee_per_sqm?: number;
    cam_payment_day?: number;
  };
  className?: string;
}

const contactTypeIcons: Record<string, React.ElementType> = {
  general: Building2,
  maintenance: Wrench,
  security: Shield,
  accounting: CreditCard,
  emergency: AlertTriangle,
  management: User,
};

const contactTypeLabels: Record<string, { en: string; ru: string }> = {
  general: { en: 'General', ru: 'Общий' },
  maintenance: { en: 'Maintenance', ru: 'Обслуживание' },
  security: { en: 'Security', ru: 'Охрана' },
  accounting: { en: 'Accounting', ru: 'Бухгалтерия' },
  emergency: { en: 'Emergency', ru: 'Экстренный' },
  management: { en: 'Management', ru: 'Управление' },
};

export function JuristicContactsCard({ projectId, propertyId, projectData, className }: JuristicContactsCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: contacts } = useJuristicContacts(projectId, propertyId);

  const hasJuristicInfo = projectData?.juristic_person_name || contacts?.length;

  if (!hasJuristicInfo) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {isRu 
              ? 'Информация об УК комплекса не добавлена' 
              : 'Building management info not available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          {isRu ? 'УК комплекса' : 'Building Management'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Juristic Person Info */}
        {projectData?.juristic_person_name && (
          <div className="p-4 rounded-none bg-primary/5 border border-primary/20">
            <h4 className="font-semibold mb-2">
              {isRu 
                ? projectData.juristic_person_name_ru || projectData.juristic_person_name 
                : projectData.juristic_person_name}
            </h4>
            
            <div className="space-y-2 text-sm">
              {projectData.juristic_contact_person && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    {projectData.juristic_contact_person}
                    {projectData.juristic_contact_position && (
                      <span className="text-muted-foreground/70">
                        {' '}· {projectData.juristic_contact_position}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {projectData.juristic_phone && (
                <a 
                  href={`tel:${projectData.juristic_phone}`}
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {projectData.juristic_phone}
                </a>
              )}

              {projectData.juristic_email && (
                <a 
                  href={`mailto:${projectData.juristic_email}`}
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {projectData.juristic_email}
                </a>
              )}

              {projectData.juristic_line_id && (
                <a 
                  href={`https://line.me/ti/p/${projectData.juristic_line_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  LINE: {projectData.juristic_line_id}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {projectData.juristic_office_hours && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {projectData.juristic_office_hours}
                </div>
              )}
            </div>

            {/* CAM Info */}
            {(projectData.cam_fee_per_sqm || projectData.cam_payment_day) && (
              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isRu ? 'CAM' : 'CAM Fee'}:
                  </span>
                  <span className="font-medium">
                    {projectData.cam_fee_per_sqm && (
                      <>฿{projectData.cam_fee_per_sqm}/{isRu ? 'м²' : 'sqm'}</>
                    )}
                    {projectData.cam_payment_day && (
                      <span className="text-muted-foreground ml-2">
                        ({isRu ? 'оплата до' : 'due by'} {projectData.cam_payment_day}{isRu ? '-го' : 'th'})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Contacts */}
        {contacts && contacts.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground mb-2">
              {isRu ? 'Контакты' : 'Contacts'}
            </h5>
            {contacts.map((contact) => {
              const Icon = contactTypeIcons[contact.contact_type] || User;
              const typeLabel = contactTypeLabels[contact.contact_type];

              return (
                <div 
                  key={contact.id}
                  className="flex items-start gap-3 p-3 rounded-none border hover:bg-muted/30 transition-colors"
                >
                  <div className="p-2 rounded-none bg-muted">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {isRu ? contact.name_ru || contact.name : contact.name}
                      </span>
                      {contact.is_primary && (
                        <Badge variant="secondary" className="text-xs">
                          {isRu ? 'Основной' : 'Primary'}
                        </Badge>
                      )}
                    </div>
                    {contact.position && (
                      <p className="text-xs text-muted-foreground">
                        {isRu ? contact.position_ru || contact.position : contact.position}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {contact.phone && (
                        <a 
                          href={`tel:${contact.phone}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <a 
                          href={`mailto:${contact.email}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {isRu ? 'Написать' : 'Email'}
                        </a>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {isRu ? typeLabel?.ru : typeLabel?.en}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
