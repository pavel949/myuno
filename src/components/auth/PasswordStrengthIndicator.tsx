import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const rules = [
  { key: 'length', test: (p: string) => p.length >= 8, labelRu: '8+ символов', labelEn: '8+ characters' },
  { key: 'upper', test: (p: string) => /[A-Z]/.test(p), labelRu: 'Заглавная буква', labelEn: 'Uppercase letter' },
  { key: 'digit', test: (p: string) => /\d/.test(p), labelRu: 'Цифра', labelEn: 'A digit' },
  { key: 'special', test: (p: string) => /[^A-Za-z0-9]/.test(p), labelRu: 'Спецсимвол (!@#...)', labelEn: 'Special char (!@#...)' },
];

const levels = [
  { min: 0, labelRu: '', labelEn: '', color: '' },
  { min: 1, labelRu: 'Слабый', labelEn: 'Weak', color: 'bg-destructive' },
  { min: 2, labelRu: 'Средний', labelEn: 'Fair', color: 'bg-orange-500' },
  { min: 3, labelRu: 'Хороший', labelEn: 'Good', color: 'bg-yellow-500' },
  { min: 4, labelRu: 'Сильный', labelEn: 'Strong', color: 'bg-green-500' },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

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
        <p className={cn('text-xs font-medium', passed <= 1 ? 'text-destructive' : passed <= 2 ? 'text-orange-500' : passed <= 3 ? 'text-yellow-600' : 'text-green-600')}>
          {isRu ? level.labelRu : level.labelEn}
        </p>
      )}

      {/* Rules checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {rules.map(rule => {
          const ok = rule.test(password);
          return (
            <div key={rule.key} className="flex items-center gap-1.5">
              {ok ? (
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <span className={cn('text-xs', ok ? 'text-green-600' : 'text-muted-foreground')}>
                {isRu ? rule.labelRu : rule.labelEn}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
