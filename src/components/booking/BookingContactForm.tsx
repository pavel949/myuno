import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ContactFormData {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}

interface BookingContactFormProps {
  data: ContactFormData;
  onChange: (data: ContactFormData) => void;
  showEmail?: boolean;
  showNotes?: boolean;
  notesPlaceholder?: string;
  onValidationChange?: (isValid: boolean) => void;
}

// Phone validation regex - supports international formats
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;

export function BookingContactForm({
  data,
  onChange,
  showEmail = true,
  showNotes = true,
  notesPlaceholder,
  onValidationChange,
}: BookingContactFormProps) {
  const { language } = useLanguage();
  const { profile } = useProfile();
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Pre-fill from user profile
  useEffect(() => {
    if (profile) {
      const updates: Partial<ContactFormData> = {};
      if (!data.name && profile.full_name) {
        updates.name = profile.full_name;
      }
      if (!data.phone && profile.phone) {
        updates.phone = profile.phone;
      }
      if (!data.email && profile.email) {
        updates.email = profile.email;
      }
      if (Object.keys(updates).length > 0) {
        onChange({ ...data, ...updates });
      }
    }
  }, [profile]);

  // Validate fields
  useEffect(() => {
    const newErrors: FormErrors = {};
    
    if (touched.name && !data.name.trim()) {
      newErrors.name = language === 'ru' ? 'Введите имя' : 'Name is required';
    }
    
    if (touched.phone) {
      if (!data.phone.trim()) {
        newErrors.phone = language === 'ru' ? 'Введите телефон' : 'Phone is required';
      } else if (!PHONE_REGEX.test(data.phone.replace(/\s/g, ''))) {
        newErrors.phone = language === 'ru' ? 'Неверный формат телефона' : 'Invalid phone format';
      }
    }
    
    if (touched.email && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = language === 'ru' ? 'Неверный формат email' : 'Invalid email format';
    }
    
    setErrors(newErrors);
    
    // Check if form is valid
    const isValid = data.name.trim().length > 0 && 
                    data.phone.trim().length > 0 && 
                    PHONE_REGEX.test(data.phone.replace(/\s/g, '')) &&
                    (!data.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email));
    
    onValidationChange?.(isValid);
  }, [data, touched, language, onValidationChange]);

  const handleChange = (field: keyof ContactFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
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
          onBlur={() => handleBlur('name')}
          placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
          className={cn("mt-1.5", errors.name && touched.name && "border-destructive")}
          required
        />
        {errors.name && touched.name && (
          <p className="text-xs text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium">
          {language === 'ru' ? 'Телефон' : 'Phone'} *
        </Label>
        <Input
          type="tel"
          value={data.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          placeholder="+66 XX XXX XXXX"
          className={cn("mt-1.5", errors.phone && touched.phone && "border-destructive")}
          required
        />
        {errors.phone && touched.phone && (
          <p className="text-xs text-destructive mt-1">{errors.phone}</p>
        )}
      </div>

      {showEmail && (
        <div>
          <Label className="text-sm font-medium">Email</Label>
          <Input
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="email@example.com"
            className={cn("mt-1.5", errors.email && touched.email && "border-destructive")}
          />
          {errors.email && touched.email && (
            <p className="text-xs text-destructive mt-1">{errors.email}</p>
          )}
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
