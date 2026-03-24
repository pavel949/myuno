import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Hotel, Briefcase, Loader2, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvestorLeadFormProps {
  onSuccess?: () => void;
  entryPoint?: string;
}

interface InterestOption {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: React.ReactNode;
}

const INTEREST_OPTIONS: InterestOption[] = [
  { id: 'offplan', labelEn: 'Off-plan Property', labelRu: 'Новостройки', icon: <Building2 className="w-4 h-4" /> },
  { id: 'hotels', labelEn: 'Hotels & Hospitality', labelRu: 'Отели', icon: <Hotel className="w-4 h-4" /> },
  { id: 'business', labelEn: 'Business & Startups', labelRu: 'Бизнес', icon: <Briefcase className="w-4 h-4" /> },
];

const BUDGET_RANGES = [
  { value: '50k-150k', labelEn: '$50,000 - $150,000', labelRu: '$50,000 - $150,000' },
  { value: '150k-500k', labelEn: '$150,000 - $500,000', labelRu: '$150,000 - $500,000' },
  { value: '500k-1m', labelEn: '$500,000 - $1,000,000', labelRu: '$500,000 - $1,000,000' },
  { value: '1m+', labelEn: '$1,000,000+', labelRu: '$1,000,000+' },
];

export function InvestorLeadForm({ onSuccess, entryPoint = 'hero_promo_card' }: InvestorLeadFormProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [interests, setInterests] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<string>('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (id: string) => {
    setInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (interests.length === 0) {
      toast.error(isRu ? 'Выберите хотя бы одну область интереса' : 'Please select at least one area of interest');
      return;
    }

    if (!name.trim()) {
      toast.error(isRu ? 'Введите ваше имя' : 'Please enter your name');
      return;
    }

    if (!contact.trim()) {
      toast.error(isRu ? 'Введите email или телефон' : 'Please enter email or phone');
      return;
    }

    if (!consent) {
      toast.error(isRu ? 'Необходимо согласие на обработку данных' : 'Please agree to data processing');
      return;
    }

    setIsSubmitting(true);

    try {
      const contactIsEmail = isEmail(contact);

      const { error } = await supabase.from('consultation_requests').insert({
        vertical_id: 'investment',
        entry_point: entryPoint,
        lead_source: 'organic',
        request_type: 'investment_consultation',
        name: name.trim(),
        preferred_contact_method: contactIsEmail ? 'email' : 'whatsapp',
        email: contactIsEmail ? contact.trim() : null,
        phone: !contactIsEmail ? contact.trim() : null,
        notes: notes.trim() || null,
        vertical_metadata: {
          interests,
          budget_range: budgetRange || null,
        },
        status: 'pending',
        priority: budgetRange === '1m+' ? 'high' : 'normal',
      });

      if (error) throw error;

      toast.success(isRu ? 'Заявка отправлена! Мы свяжемся с вами в течение 24 часов.' : 'Request sent! We\'ll contact you within 24 hours.');
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit investor lead:', error);
      toast.error(isRu ? 'Ошибка отправки. Попробуйте ещё раз.' : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Interest Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {isRu ? 'Что вас интересует?' : 'What are you interested in?'}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {INTEREST_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleInterest(option.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                interests.includes(option.id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {option.icon}
              <span className="text-xs font-medium text-center">
                {isRu ? option.labelRu : option.labelEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Budget Range */}
      <div className="space-y-2">
        <Label htmlFor="budget" className="text-sm font-medium">
          {isRu ? 'Планируемый бюджет (USD)' : 'Planned Budget (USD)'}
        </Label>
        <Select value={budgetRange} onValueChange={setBudgetRange}>
          <SelectTrigger id="budget">
            <SelectValue placeholder={isRu ? 'Выберите диапазон' : 'Select range'} />
          </SelectTrigger>
          <SelectContent>
            {BUDGET_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {isRu ? range.labelRu : range.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          {isRu ? 'Имя' : 'Name'}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isRu ? 'Ваше имя' : 'Your name'}
          required
        />
      </div>

      {/* Contact */}
      <div className="space-y-2">
        <Label htmlFor="contact" className="text-sm font-medium">
          {isRu ? 'Email или телефон' : 'Email or phone'}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={isRu ? 'email@example.com или +7...' : 'email@example.com or +1...'}
          required
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          {isRu ? 'Комментарий' : 'Comment'}
          <span className="text-muted-foreground ml-1 font-normal">
            ({isRu ? 'опционально' : 'optional'})
          </span>
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isRu ? 'Расскажите о ваших целях и предпочтениях...' : 'Tell us about your goals and preferences...'}
          rows={3}
        />
      </div>

      {/* Consent */}
      <div className="flex items-start gap-2">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
        />
        <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          {isRu 
            ? 'Я согласен на обработку персональных данных и получение информации об инвестиционных возможностях'
            : 'I agree to the processing of personal data and receiving information about investment opportunities'
          }
        </Label>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isRu ? 'Отправка...' : 'Submitting...'}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            {isRu ? 'Получить консультацию' : 'Get Consultation'}
          </>
        )}
      </Button>

      {/* Trust indicator */}
      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Shield className="w-3 h-3" />
        {isRu ? 'Данные защищены. Ответим в течение 24 часов.' : 'Data protected. We\'ll respond within 24 hours.'}
      </p>
    </form>
  );
}
