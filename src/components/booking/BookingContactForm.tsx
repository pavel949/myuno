import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { User, Phone, Mail, MessageSquare, Check, AlertCircle } from 'lucide-react';

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

const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;

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
  const [focused, setFocused] = useState<string | null>(null);

  // Pre-fill from user profile
  useEffect(() => {
    if (profile) {
      const updates: Partial<ContactFormData> = {};
      if (!data.name && profile.full_name) updates.name = profile.full_name;
      if (!data.phone && profile.phone) updates.phone = profile.phone;
      if (!data.email && profile.email) updates.email = profile.email;
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
    setFocused(null);
  };

  const handleFocus = (field: string) => {
    setFocused(field);
  };

  const getFieldStatus = (field: string, value: string) => {
    if (!touched[field]) return 'idle';
    if (errors[field as keyof FormErrors]) return 'error';
    if (value.trim()) return 'valid';
    return 'idle';
  };

  // Airbnb-style stacked field
  const renderField = (config: {
    field: keyof ContactFormData;
    label: string;
    type?: string;
    placeholder: string;
    required?: boolean;
    icon: React.ReactNode;
    position: 'top' | 'middle' | 'bottom' | 'single';
  }) => {
    const value = (data[config.field] || '') as string;
    const status = getFieldStatus(config.field, value);
    const isFocused = focused === config.field;
    const hasFloatingLabel = isFocused || value.length > 0;

    const borderRadius = {
      top: 'rounded-t-xl rounded-b-none',
      middle: 'rounded-none',
      bottom: 'rounded-b-xl rounded-t-none',
      single: 'rounded-xl',
    }[config.position];

    const borderTop = config.position !== 'top' && config.position !== 'single' ? '-mt-px' : '';

    return (
      <div key={config.field} className="relative">
        <div
          className={cn(
            "relative border-2 transition-all duration-200",
            borderRadius,
            borderTop,
            isFocused ? "border-foreground z-10" : "border-border",
            status === 'error' && !isFocused && "border-destructive z-10",
          )}
        >
          {/* Icon */}
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {config.icon}
          </div>

          {/* Floating label */}
          <label
            className={cn(
              "absolute left-11 transition-all duration-200 pointer-events-none",
              hasFloatingLabel
                ? "top-2 text-[10px] font-medium text-muted-foreground"
                : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
            )}
          >
            {config.label}
            {config.required && <span className="text-destructive ml-0.5">*</span>}
          </label>

          <input
            type={config.type || 'text'}
            value={value}
            onChange={(e) => handleChange(config.field, e.target.value)}
            onBlur={() => handleBlur(config.field)}
            onFocus={() => handleFocus(config.field)}
            className={cn(
              "w-full bg-transparent outline-none text-sm text-foreground pl-11 pr-10",
              hasFloatingLabel ? "pt-5 pb-2" : "py-3.5",
            )}
          />

          {/* Status icon */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {status === 'valid' && (
              <Check className="w-4 h-4 text-[hsl(var(--success))]" />
            )}
            {status === 'error' && (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Error message */}
        {status === 'error' && errors[config.field as keyof FormErrors] && (
          <p className="text-xs text-destructive mt-1 pl-1">
            {errors[config.field as keyof FormErrors]}
          </p>
        )}
      </div>
    );
  };

  // Build stacked fields list
  const stackedFields = [
    {
      field: 'name' as const,
      label: language === 'ru' ? 'Имя' : 'Full name',
      placeholder: language === 'ru' ? 'Ваше имя' : 'Your name',
      required: true,
      icon: <User className="w-4 h-4" />,
    },
    {
      field: 'phone' as const,
      label: language === 'ru' ? 'Телефон' : 'Phone number',
      type: 'tel',
      placeholder: '+66 XX XXX XXXX',
      required: true,
      icon: <Phone className="w-4 h-4" />,
    },
    ...(showEmail ? [{
      field: 'email' as const,
      label: 'Email',
      type: 'email',
      placeholder: 'email@example.com',
      required: false,
      icon: <Mail className="w-4 h-4" />,
    }] : []),
  ];

  const getPosition = (idx: number, total: number): 'top' | 'middle' | 'bottom' | 'single' => {
    if (total === 1) return 'single';
    if (idx === 0) return 'top';
    if (idx === total - 1) return 'bottom';
    return 'middle';
  };

  return (
    <div className="space-y-4">
      {/* Stacked grouped fields (Airbnb-style) */}
      <div>
        {stackedFields.map((field, idx) =>
          renderField({
            ...field,
            position: getPosition(idx, stackedFields.length),
          })
        )}
      </div>

      {/* Notes — separate field, not stacked */}
      {showNotes && (
        <div className="relative">
          <div
            className={cn(
              "relative border-2 rounded-xl transition-all duration-200",
              focused === 'notes' ? "border-foreground" : "border-border",
            )}
          >
            <div className="absolute left-3.5 top-3.5 text-muted-foreground pointer-events-none">
              <MessageSquare className="w-4 h-4" />
            </div>
            <label
              className={cn(
                "absolute left-11 transition-all duration-200 pointer-events-none",
                (focused === 'notes' || (data.notes && data.notes.length > 0))
                  ? "top-2 text-[10px] font-medium text-muted-foreground"
                  : "top-3.5 text-sm text-muted-foreground"
              )}
            >
              {language === 'ru' ? 'Примечания' : 'Special requests'}
            </label>
            <textarea
              value={data.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              onBlur={() => handleBlur('notes')}
              onFocus={() => handleFocus('notes')}
              placeholder=""
              className={cn(
                "w-full bg-transparent outline-none text-sm text-foreground pl-11 pr-4 pt-5 pb-3 min-h-[80px] resize-none",
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
