import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import type { ListingApplicationDraft } from '@/hooks/useListingApplication';
import { User, Mail, Phone } from 'lucide-react';

interface ContactStepProps {
  draft: ListingApplicationDraft;
  onChange: (updates: Partial<ListingApplicationDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ContactStep({ draft, onChange, onNext, onBack }: ContactStepProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  
  // Pre-fill from user if available
  React.useEffect(() => {
    if (user && !draft.applicant_email) {
      onChange({
        applicant_email: user.email || '',
        applicant_name: user.user_metadata?.name || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  const isValid = draft.applicant_email && draft.applicant_name;
  
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {isRu 
          ? 'Как с вами связаться для уточнения деталей?'
          : 'How can we contact you to clarify details?'}
      </p>
      
      {user && (
        <div className="bg-primary/10 rounded-xl p-4 text-sm">
          {isRu 
            ? '✓ Вы вошли в систему. Контактные данные заполнены автоматически.'
            : '✓ You are signed in. Contact info is pre-filled.'}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          {isRu ? 'Ваше имя' : 'Your name'} *
        </Label>
        <Input
          id="name"
          value={draft.applicant_name || ''}
          onChange={(e) => onChange({ applicant_name: e.target.value })}
          placeholder={isRu ? 'Иван Петров' : 'John Smith'}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {isRu ? 'Email' : 'Email'} *
        </Label>
        <Input
          id="email"
          type="email"
          value={draft.applicant_email || ''}
          onChange={(e) => onChange({ applicant_email: e.target.value })}
          placeholder="you@example.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          {isRu ? 'Телефон' : 'Phone'}
        </Label>
        <Input
          id="phone"
          type="tel"
          value={draft.applicant_phone || ''}
          onChange={(e) => onChange({ applicant_phone: e.target.value })}
          placeholder="+66 xxx xxx xxxx"
        />
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {isRu ? 'Назад' : 'Back'}
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!isValid}>
          {isRu ? 'Продолжить' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
