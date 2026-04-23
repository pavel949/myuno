import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, AlertTriangle, Shield, Heart, Flame } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface EmergencyContact {
  icon: React.ElementType;
  label: string;
  number: string;
  description?: string;
}

// Emergency contacts by city (extendable)
const emergencyContacts: Record<string, { en: EmergencyContact[]; ru: EmergencyContact[] }> = {
  phuket: {
    en: [
      { icon: AlertTriangle, label: 'Emergency (all)', number: '191', description: 'Police, Fire, Ambulance' },
      { icon: Shield, label: 'Tourist Police', number: '1155', description: '24/7 English speaking' },
      { icon: Heart, label: 'Medical Emergency', number: '1669', description: 'Ambulance service' },
      { icon: Flame, label: 'Fire Department', number: '199', description: 'Fire emergency' },
      { icon: Phone, label: 'Immigration Phuket', number: '076-221905', description: 'Visa inquiries' },
    ],
    ru: [
      { icon: AlertTriangle, label: 'Экстренная помощь', number: '191', description: 'Полиция, пожар, скорая' },
      { icon: Shield, label: 'Туристическая полиция', number: '1155', description: '24/7 английский язык' },
      { icon: Heart, label: 'Скорая помощь', number: '1669', description: 'Служба скорой помощи' },
      { icon: Flame, label: 'Пожарная служба', number: '199', description: 'Пожарная экстренная служба' },
      { icon: Phone, label: 'Иммиграция Пхукет', number: '076-221905', description: 'Визовые вопросы' },
    ],
  },
};

interface EmergencyContactsProps {
  citySlug?: string;
  className?: string;
}

export function EmergencyContacts({ citySlug = 'phuket', className }: EmergencyContactsProps) {
  const { language } = useLanguage();
  
  const contacts = emergencyContacts[citySlug]?.[language as 'en' | 'ru'] 
    || emergencyContacts[citySlug]?.en 
    || emergencyContacts.phuket.en;

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/[^0-9+]/g, '')}`;
  };

  return (
    <Card className={cn("border-destructive/30", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {language === 'ru' ? 'Экстренные контакты' : 'Emergency Contacts'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.map((contact, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 bg-muted/50 rounded-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-none">
                <contact.icon className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{contact.label}</p>
                {contact.description && (
                  <p className="text-xs text-muted-foreground">{contact.description}</p>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => handleCall(contact.number)}
            >
              <Phone className="h-4 w-4" />
              {contact.number}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
