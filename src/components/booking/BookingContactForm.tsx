import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface ContactFormData {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

interface BookingContactFormProps {
  data: ContactFormData;
  onChange: (data: ContactFormData) => void;
  showEmail?: boolean;
  showNotes?: boolean;
  notesPlaceholder?: string;
}

export function BookingContactForm({
  data,
  onChange,
  showEmail = true,
  showNotes = true,
  notesPlaceholder,
}: BookingContactFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();

  // Pre-fill from user profile
  useEffect(() => {
    if (user?.email && !data.email) {
      onChange({ ...data, email: user.email });
    }
  }, [user]);

  const handleChange = (field: keyof ContactFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">
          {language === 'ru' ? 'Имя' : 'Name'} *
        </Label>
        <Input
          value={data.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
          className="mt-1.5"
          required
        />
      </div>

      <div>
        <Label className="text-sm font-medium">
          {language === 'ru' ? 'Телефон' : 'Phone'} *
        </Label>
        <Input
          type="tel"
          value={data.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+66 XX XXX XXXX"
          className="mt-1.5"
          required
        />
      </div>

      {showEmail && (
        <div>
          <Label className="text-sm font-medium">Email</Label>
          <Input
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="email@example.com"
            className="mt-1.5"
          />
        </div>
      )}

      {showNotes && (
        <div>
          <Label className="text-sm font-medium">
            {language === 'ru' ? 'Примечания' : 'Notes'}
          </Label>
          <Textarea
            value={data.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder={notesPlaceholder || (language === 'ru' ? 'Особые пожелания...' : 'Special requests...')}
            className="mt-1.5 min-h-[80px]"
          />
        </div>
      )}
    </div>
  );
}
