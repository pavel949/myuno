import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  projectId?: string;
  developerId?: string;
  source?: string;
  compact?: boolean;
}

export function NbLeadForm({ projectId, developerId, source = 'project_page', compact = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', message: '', unit_preference: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone) {
      toast.error('Укажите имя и телефон');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('nb_leads').insert({
        ...form,
        project_id: projectId,
        developer_id: developerId,
        source,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Запрос отправлен! Мы свяжемся с вами в течение 2 часов.');
    } catch {
      toast.error('Ошибка отправки. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="nb-glass p-6 text-center">
        <div className="text-2xl mb-2">✓</div>
        <p className="nb-display text-lg" style={{ color: 'hsl(var(--nb-gold))' }}>Запрос отправлен</p>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--nb-muted))' }}>Мы свяжемся с вами в течение 2 часов</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="nb-glass p-5 space-y-3">
      <h4 className="nb-display text-lg" style={{ color: 'hsl(var(--nb-text))' }}>
        Запросить информацию
      </h4>
      
      <input
        type="text"
        placeholder="Ваше имя *"
        value={form.full_name}
        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-lg text-sm"
        style={{ background: 'hsl(var(--nb-bg))', color: 'hsl(var(--nb-text))', border: '1px solid hsl(var(--nb-gold) / 0.2)' }}
      />
      <input
        type="tel"
        placeholder="Телефон / WhatsApp *"
        value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-lg text-sm"
        style={{ background: 'hsl(var(--nb-bg))', color: 'hsl(var(--nb-text))', border: '1px solid hsl(var(--nb-gold) / 0.2)' }}
      />
      {!compact && (
        <>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg text-sm"
            style={{ background: 'hsl(var(--nb-bg))', color: 'hsl(var(--nb-text))', border: '1px solid hsl(var(--nb-gold) / 0.2)' }}
          />
          <textarea
            placeholder="Сообщение"
            rows={3}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
            style={{ background: 'hsl(var(--nb-bg))', color: 'hsl(var(--nb-text))', border: '1px solid hsl(var(--nb-gold) / 0.2)' }}
          />
        </>
      )}
      
      <button type="submit" disabled={loading} className="nb-btn-gold w-full disabled:opacity-50">
        {loading ? 'Отправляем...' : 'Отправить запрос'}
      </button>
      <p className="text-[11px] text-center" style={{ color: 'hsl(var(--nb-muted))' }}>
        Мы свяжемся с вами в течение 2 часов
      </p>
    </form>
  );
}
