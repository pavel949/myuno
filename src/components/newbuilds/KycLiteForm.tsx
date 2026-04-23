/**
 * KycLiteForm — inline KYC form required before Soft Hold
 *
 * Collects: first_name, last_name, nationality, date_of_birth
 * Submits via devmod-buyer-kyc edge function (action: 'lite')
 * On success: calls onComplete(buyerId)
 */

import React, { useState } from 'react';
import { useSubmitKycLite } from '@/hooks/useDeveloperPortal';
import { cn } from '@/lib/utils';

interface Props {
  onComplete: (buyerId: string) => void;
  leadId?: string;
}

const NATIONALITIES = [
  { code: 'RU', label: 'Россия' },
  { code: 'UA', label: 'Украина' },
  { code: 'BY', label: 'Беларусь' },
  { code: 'KZ', label: 'Казахстан' },
  { code: 'AE', label: 'ОАЭ' },
  { code: 'GB', label: 'Великобритания' },
  { code: 'DE', label: 'Германия' },
  { code: 'FR', label: 'Франция' },
  { code: 'US', label: 'США' },
  { code: 'CN', label: 'Китай' },
  { code: 'TH', label: 'Таиланд' },
  { code: 'AU', label: 'Австралия' },
  { code: 'SG', label: 'Сингапур' },
  { code: 'OTHER', label: 'Другая' },
];

const INPUT_CLASS = cn(
  'w-full px-3 py-2 rounded-none text-sm',
  'bg-[hsl(var(--nb-bg))] text-[hsl(var(--nb-text))]',
  'border border-[hsl(var(--nb-glass-border))]',
  'focus:outline-none focus:border-[hsl(var(--nb-gold)/0.5)]',
);

export function KycLiteForm({ onComplete, leadId }: Props) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    dateOfBirth: '',
  });

  const submit = useSubmitKycLite();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.nationality) return;

    submit.mutate(
      {
        firstName: form.firstName,
        lastName: form.lastName,
        nationality: form.nationality,
        dateOfBirth: form.dateOfBirth || undefined,
        leadId,
      },
      {
        onSuccess: (data) => {
          onComplete(data.buyer_id);
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-[hsl(var(--nb-muted))]">
        Для создания удержания необходимо заполнить краткие данные (KYC-lite)
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-[hsl(var(--nb-muted))] mb-1">Имя *</label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            placeholder="Ivan"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-[hsl(var(--nb-muted))] mb-1">Фамилия *</label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
            placeholder="Petrov"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[hsl(var(--nb-muted))] mb-1">Гражданство *</label>
        <select
          className={INPUT_CLASS}
          value={form.nationality}
          onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
          required
        >
          <option value="">Выберите страну</option>
          {NATIONALITIES.map(n => (
            <option key={n.code} value={n.code}>{n.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-[hsl(var(--nb-muted))] mb-1">Дата рождения</label>
        <input
          type="date"
          className={INPUT_CLASS}
          value={form.dateOfBirth}
          onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
        />
      </div>

      <p className="text-xs text-[hsl(var(--nb-muted))]" style={{ lineHeight: 1.5 }}>
        Ваши данные защищены и не передаются застройщику до подписания договора.
      </p>

      <button
        type="submit"
        disabled={submit.isPending || !form.firstName || !form.lastName || !form.nationality}
        className="nb-btn-gold w-full"
      >
        {submit.isPending ? 'Сохранение...' : 'Продолжить'}
      </button>
    </form>
  );
}
