import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, AlertTriangle, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { getEmergencyContacts, sanitizeTelNumber } from '@/lib/emergency/contacts';

interface EmergencyContactsProps {
  citySlug?: string;
  className?: string;
}

/**
 * Compact emergency teaser on the Knowledge Hub. Shows the critical quick-dial
 * lines from the shared SSOT and links through to the full /sos hub for
 * hospitals, embassies and survival tips.
 */
export function EmergencyContacts({ citySlug = 'phuket', className }: EmergencyContactsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { quickDial } = getEmergencyContacts(citySlug);

  const handleCall = (number: string) => {
    window.location.href = `tel:${sanitizeTelNumber(number)}`;
  };

  return (
    <Card className={cn('border-destructive/30', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {isRu ? 'Экстренные контакты' : 'Emergency Contacts'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickDial.map((contact) => {
          const Icon = contact.icon ?? AlertTriangle;
          return (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-none">
                  <Icon className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {isRu ? contact.nameRu : contact.nameEn}
                  </p>
                  {(contact.descEn || contact.descRu) && (
                    <p className="text-xs text-muted-foreground">
                      {isRu ? contact.descRu : contact.descEn}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => handleCall(contact.phone)}
              >
                <Phone className="h-4 w-4" />
                {contact.phone}
              </Button>
            </div>
          );
        })}

        <Button asChild variant="ghost" className="w-full justify-between text-destructive hover:bg-destructive/10">
          <Link to={APP_ROUTES.SOS}>
            {isRu ? 'Полный центр экстренной помощи' : 'Full emergency hub'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
