/**
 * PEYLAA Lead Capture Form — Modal overlay
 */
import React, { useState } from 'react';
import { X, Send, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubmitPeylaaLead } from '@/hooks/usePeylaa';

interface Props {
  source: string;
  utm?: { source?: string; medium?: string; campaign?: string };
  unitId?: string;
  onClose: () => void;
}

export function PeylaaLeadForm({ source, utm, unitId, onClose }: Props) {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    preferred_bedrooms: [] as number[],
    purchase_timeline: '',
    purchase_purpose: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const mutation = useSubmitPeylaaLead();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone) return;

    try {
      await mutation.mutateAsync({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || undefined,
        whatsapp: form.phone,
        language: 'ru',
        source_channel: source as any,
        source_url: window.location.href,
        utm_source: utm?.source,
        utm_medium: utm?.medium,
        utm_campaign: utm?.campaign,
        interested_unit_ids: unitId ? [unitId] : undefined,
        preferred_bedrooms: form.preferred_bedrooms.length ? form.preferred_bedrooms : undefined,
        purchase_timeline: form.purchase_timeline || undefined,
        purchase_purpose: form.purchase_purpose || undefined,
        notes: form.notes || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Lead submission error:', err);
    }
  };

  const toggleBedroom = (br: number) => {
    setForm(prev => ({
      ...prev,
      preferred_bedrooms: prev.preferred_bedrooms.includes(br)
        ? prev.preferred_bedrooms.filter(b => b !== br)
        : [...prev.preferred_bedrooms, br],
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#141414] border border-white/10 rounded-none sm:rounded-none w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {submitted ? 'Заявка отправлена!' : 'Получить консультацию'}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h4 className="text-xl font-bold text-white">Спасибо, {form.full_name}!</h4>
            <p className="text-white/50">
              Наш консультант свяжется с вами в ближайшее время по WhatsApp или телефону.
            </p>
            <Button
              className="w-full bg-success hover:bg-success text-white"
              onClick={() => window.open(`https://wa.me/66922407355?text=Здравствуйте! Я ${form.full_name}, оставил заявку на PEYLAA Phuket`, '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Написать в WhatsApp сейчас
            </Button>
            <Button variant="ghost" className="w-full text-white/40" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Name */}
            <div>
              <Label className="text-white/70 text-sm">Имя *</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Как к вам обращаться"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <Label className="text-white/70 text-sm">Телефон / WhatsApp *</Label>
              <Input
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+7 (999) 123-45-67"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label className="text-white/70 text-sm">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1"
              />
            </div>

            {/* Bedrooms */}
            <div>
              <Label className="text-white/70 text-sm">Интересует</Label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3].map(br => (
                  <button
                    key={br}
                    type="button"
                    onClick={() => toggleBedroom(br)}
                    className={`px-4 py-2 rounded-none text-sm font-medium transition-colors ${
                      form.preferred_bedrooms.includes(br)
                        ? 'bg-accent text-black'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {br} BR
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <Label className="text-white/70 text-sm">Когда планируете покупку</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { value: 'immediate', label: 'Сейчас' },
                  { value: 'within_3_months', label: 'До 3 мес' },
                  { value: 'within_6_months', label: 'До 6 мес' },
                  { value: 'exploring', label: 'Изучаю рынок' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, purchase_timeline: opt.value }))}
                    className={`px-3 py-2 rounded-none text-xs font-medium transition-colors ${
                      form.purchase_timeline === opt.value
                        ? 'bg-accent text-black'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <Label className="text-white/70 text-sm">Цель покупки</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { value: 'investment', label: 'Инвестиция' },
                  { value: 'living', label: 'Для жизни' },
                  { value: 'both', label: 'Оба' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, purchase_purpose: opt.value }))}
                    className={`px-3 py-2 rounded-none text-xs font-medium transition-colors ${
                      form.purchase_purpose === opt.value
                        ? 'bg-accent text-black'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent text-black font-bold h-12"
              disabled={mutation.isPending || !form.full_name || !form.phone}
            >
              {mutation.isPending ? 'Отправляю...' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Отправить заявку
                </>
              )}
            </Button>

            <p className="text-[10px] text-white/30 text-center">
              Нажимая кнопку, вы соглашаетесь на обработку персональных данных
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
