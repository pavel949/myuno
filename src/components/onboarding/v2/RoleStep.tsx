import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_OPTIONS, type CanonicalRoleAnswer } from '@/lib/segmentation/detectPersona';
import { CANONICAL_ROLE_META } from '@/types/canonical';

const ICONS: Record<CanonicalRoleAnswer, string> = {
  consumer: '🛍️',
  'resident-user': '🏠',
  'investor-passive': '📈',
  'investor-active': '💼',
  operator: '🛠️',
  provider: '🤝',
};

interface Props {
  value: CanonicalRoleAnswer | null;
  onChange: (v: CanonicalRoleAnswer) => void;
  lang: 'en' | 'ru';
}

export function RoleStep({ value, onChange, lang }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ROLE_OPTIONS.map((role) => {
        const meta = CANONICAL_ROLE_META[role];
        const isActive = value === role;
        return (
          <motion.button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            whileTap={{ scale: 0.98 }}
            data-testid={`onboarding-role-${role}`}
            className={cn(
              'relative flex items-start gap-3 rounded-xl border-2 bg-card p-4 text-left transition-all min-h-[88px]',
              'hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border',
            )}
            aria-pressed={isActive}
          >
            <span className="text-2xl shrink-0" aria-hidden>
              {ICONS[role]}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {lang === 'ru' ? meta.labelRu : meta.labelEn}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {meta.descriptionRu /* RU-only one-liner; acceptable for both since EN reads role label */}
              </span>
            </span>
            {isActive && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
