import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const rules = [
  { key: 'length', test: (p: string) => p.length >= 8, labelRu: '8+ символов', labelEn: '8+ characters', labelTh: 'อย่างน้อย 8 ตัวอักษร' },
  { key: 'upper', test: (p: string) => /[A-Z]/.test(p), labelRu: 'Заглавная буква', labelEn: 'Uppercase letter', labelTh: 'ตัวอักษรภาษาอังกฤษพิมพ์ใหญ่' },
  { key: 'digit', test: (p: string) => /\d/.test(p), labelRu: 'Цифра', labelEn: 'A digit', labelTh: 'ตัวเลข' },
  { key: 'special', test: (p: string) => /[^A-Za-z0-9]/.test(p), labelRu: 'Спецсимвол (!@#...)', labelEn: 'Special char (!@#...)', labelTh: 'อักขระพิเศษ (!@#...)' },
];

const levels = [
  { min: 0, labelRu: '', labelEn: '', labelTh: '', color: '' },
  { min: 1, labelRu: 'Слабый', labelEn: 'Weak', labelTh: 'อ่อน', color: 'bg-destructive' },
  { min: 2, labelRu: 'Средний', labelEn: 'Fair', labelTh: 'ปานกลาง', color: 'bg-warning' },
  { min: 3, labelRu: 'Хороший', labelEn: 'Good', labelTh: 'ดี', color: 'bg-accent-amber' },
  { min: 4, labelRu: 'Сильный', labelEn: 'Strong', labelTh: 'แข็งแรง', color: 'bg-success' },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { language } = useLanguage();
  const label = (item: { labelEn: string; labelRu: string; labelTh: string }) =>
    pickLang(language, { en: item.labelEn, ru: item.labelRu, th: item.labelTh });

  const passed = useMemo(() => rules.filter(r => r.test(password)).length, [password]);
  const level = levels[passed] || levels[0];

  if (!password) return null;

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i <= passed ? level.color : 'bg-muted'
            )}
          />
        ))}
      </div>
      {level.labelRu && (
        <p className={cn('text-xs font-medium', passed <= 1 ? 'text-destructive' : passed <= 2 ? 'text-warning' : passed <= 3 ? 'text-accent-amber' : 'text-success')}>
          {label(level)}
        </p>
      )}

      {/* Rules checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {rules.map(rule => {
          const ok = rule.test(password);
          return (
            <div key={rule.key} className="flex min-w-0 items-start gap-1.5">
              {ok ? (
                <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <span className={cn('min-w-0 break-words text-xs', ok ? 'text-success' : 'text-muted-foreground')}>
                {label(rule)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
