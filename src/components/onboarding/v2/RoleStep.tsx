import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Language } from '@/i18n';
import { ROLE_OPTIONS, type CanonicalRoleAnswer } from '@/lib/segmentation/detectPersona';
import { CANONICAL_ROLE_META } from '@/types/canonical';

const ROLE_LABELS_TH: Record<CanonicalRoleAnswer, { label: string; description: string }> = {
  consumer:           { label: 'ผู้ใช้บริการ',     description: 'ฉันมาเที่ยวหรือมาใช้บริการ' },
  'resident-user':    { label: 'ผู้พักอาศัย',       description: 'ฉันอาศัยอยู่ที่นี่และใช้บริการในชีวิตประจำวัน' },
  'investor-passive': { label: 'นักลงทุนเชิงรับ',   description: 'ฉันลงทุนและให้คนอื่นดูแลให้' },
  'investor-active':  { label: 'นักลงทุนเชิงรุก',   description: 'ฉันบริหารการลงทุนของตัวเอง' },
  operator:           { label: 'ผู้ดูแลทรัพย์สิน',   description: 'ฉันดูแลหรือบริหารอสังหาริมทรัพย์' },
  provider:           { label: 'ผู้ให้บริการ',       description: 'ฉันให้บริการแก่ผู้อื่น' },
};

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
  lang: Language;
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
              'relative flex items-start gap-3 rounded-none border-2 bg-card p-4 text-left transition-all min-h-[88px]',
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
                {lang === 'ru' ? meta.labelRu : lang === 'th' ? ROLE_LABELS_TH[role].label : meta.labelEn}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {lang === 'ru' ? meta.descriptionRu : lang === 'th' ? ROLE_LABELS_TH[role].description : meta.descriptionEn}
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
