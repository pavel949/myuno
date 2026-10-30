/**
 * NbLeadForm — lead capture with full attribution tracking
 * - Sets/reads myuno_attr_id cookie
 * - Computes contact fingerprint (sha256)
 * - Creates/updates lead_attributions record
 * - Triggers RLN on first qualified project touchpoint
 */
import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { leadAttempt, completeLeadAttempt, startNewLeadAttempt } from '@/lib/newbuilds/leadAttempt';
import { recordAttribution } from '@/lib/newbuilds/attribution';

interface Props {
  projectId?: string;
  developerId?: string;
  source?: string;
  compact?: boolean;
}

export function NbLeadForm({ projectId, developerId, source = 'project_page', compact = false }: Props) {
  const submitting = useRef(false);
  const [loading, setLoading] = useState(false);
  const completed = useRef<{ payload: Record<string, unknown>; id: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', message: '', unit_preference: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current || submitted) return;
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error('Укажите имя и телефон');
      return;
    }
    submitting.current = true;
    setLoading(true);
    try {
      const payload = {
        full_name: form.full_name.trim(), phone: form.phone.trim(),
        email: form.email.trim() || null, message: form.message.trim() || null,
        unit_preference: form.unit_preference.trim() || null,
        project_id: projectId ?? null, developer_id: developerId ?? null, source,
      };
      const attempt = await leadAttempt(payload);
      if (attempt.state === 'completed') {
        completed.current = { payload, id: attempt.id };
        setSubmitted(true);
        return;
      }
      const attemptId = attempt.id;
      // 1. Record attribution (cookie + fingerprint + RLN)
      let attributionId: string | null = null;
      try {
        const result = await recordAttribution({
          email: form.email || undefined,
          phone: form.phone,
          projectId,
          touchpoint: { type: 'form_submit', source, projectId },
        });
        attributionId = result.attributionId;
      } catch {
        // Attribution failure must not block lead capture
      }

      // 2. Insert nb_lead
      const { error } = await (supabase.from('nb_leads' as any) as any).insert({
        ...payload,
        id: attemptId,
        attribution_id: attributionId,
      });
      if (error) throw error;

      completed.current = { payload, id: attemptId };
      // The insert was acknowledged even if local completion persistence fails.
      // Retain the pending ID on failure; never rotate an uncertain attempt.
      try { await completeLeadAttempt(payload, attemptId); } catch { /* Keep acknowledged UI state. */ }
      setSubmitted(true);
      toast.success('Запрос отправлен! Мы свяжемся с вами в течение 2 часов.');
    } catch (error) {
      const duplicate = typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
      if (duplicate) {
        toast.error('Этот запрос уже получен или ожидает подтверждения. Не отправляйте его повторно; уточните статус у менеджера.');
        return;
      }
      toast.error('Ошибка отправки. Попробуйте позже.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const handleNewEnquiry = async () => {
    if (submitting.current || !completed.current) return;
    submitting.current = true;
    setLoading(true);
    try {
      const { payload, id } = completed.current;
      await completeLeadAttempt(payload, id);
      await startNewLeadAttempt(payload, id);
      completed.current = null;
      setSubmitted(false);
    } catch {
      toast.error('Не удалось подготовить новый запрос. Попробуйте позже.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="nb-glass p-6 text-center">
        <div className="text-2xl mb-2">✓</div>
        <p className="nb-display text-lg" style={{ color: 'hsl(var(--nb-gold))' }}>Запрос отправлен</p>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--nb-muted))' }}>Мы свяжемся с вами в течение 2 часов</p>
        <button type="button" onClick={handleNewEnquiry} disabled={loading} className="nb-btn-gold mt-4 disabled:opacity-50">Отправить новый запрос</button>
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
        className="w-full px-3 py-2.5 rounded-none text-sm"
        style={{ background: 'hsl(var(--nb-bg))', color: 'hsl(var(--nb-text))', border: '1px solid hsl(var(--nb-gold) / 0.2)' }}
      />
      <input
        type="tel"
        placeholder="Телефон / WhatsApp *"
        value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-none text-sm"
        style={{ background: 'hsl(var(--nb-bg))', color: 'hsl(var(--nb-text))', border: '1px solid hsl(var(--nb-gold) / 0.2)' }}
      />
      {!compact && (
        <>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-none text-sm"
            style={{ background: 'hsl(var(--nb-bg))', color: 'hsl(var(--nb-text))', border: '1px solid hsl(var(--nb-gold) / 0.2)' }}
          />
          <textarea
            placeholder="Сообщение"
            rows={3}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-none text-sm resize-none"
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
