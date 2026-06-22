import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Language } from '@/i18n';
import {
  MODIFIER_OPTIONS,
  type CanonicalModifier,
} from '@/lib/segmentation/detectPersona';

const LABELS: Record<CanonicalModifier, { en: string; ru: string; th: string; icon: string }> = {
  'pet-owner':     { en: 'I have a pet',         ru: 'У меня питомец',         th: 'ฉันมีสัตว์เลี้ยง',        icon: '🐾' },
  medical:         { en: 'Medical needs',         ru: 'Медицинские потребности', th: 'ความต้องการทางการแพทย์', icon: '🩺' },
  halal:           { en: 'Halal',                 ru: 'Халяль',                 th: 'ฮาลาล',                  icon: '🕌' },
  kosher:          { en: 'Kosher',                ru: 'Кошер',                  th: 'โคเชอร์',                icon: '✡️' },
  vegan:           { en: 'Vegan / vegetarian',    ru: 'Веган / вегетарианец',   th: 'วีแกน / มังสวิรัติ',      icon: '🌱' },
  accessibility:   { en: 'Accessibility',         ru: 'Доступная среда',        th: 'สิ่งอำนวยความสะดวกสำหรับผู้พิการ', icon: '♿' },
  lgbtq:           { en: 'LGBTQ+ friendly',       ru: 'LGBTQ+ friendly',        th: 'เป็นมิตรกับ LGBTQ+',      icon: '🏳️‍🌈' },
  athlete:         { en: 'Active sport',          ru: 'Активный спорт',         th: 'กีฬาและออกกำลังกาย',     icon: '🏋️' },
  wedding:         { en: 'Wedding planning',      ru: 'Планирую свадьбу',       th: 'วางแผนงานแต่งงาน',        icon: '💍' },
  'family-young':  { en: 'Young kids (0–6)',      ru: 'Маленькие дети (0–6)',   th: 'เด็กเล็ก (0–6 ปี)',      icon: '🧸' },
  'family-school': { en: 'School-age kids (7–17)',ru: 'Дети-школьники (7–17)',  th: 'เด็กวัยเรียน (7–17 ปี)', icon: '🎒' },
};

interface Props {
  selected: CanonicalModifier[];
  onToggle: (m: CanonicalModifier) => void;
  lang: Language;
}

export function ModifiersStep({ selected, onToggle, lang }: Props) {
  return (
    <>
      <p className="text-xs text-muted-foreground -mt-2">
        {lang === 'ru' ? 'Можно выбрать несколько или пропустить.' : lang === 'th' ? 'เลือกได้หลายข้อ หรือข้ามก็ได้' : 'Pick any that apply, or skip.'}
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {MODIFIER_OPTIONS.map((m) => {
          const isActive = selected.includes(m);
          const meta = LABELS[m];
          return (
            <motion.button
              key={m}
              type="button"
              onClick={() => onToggle(m)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative flex items-center gap-3 rounded-none border-2 bg-card p-3 text-left transition-all min-h-[56px]',
                'hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive ? 'border-primary bg-primary/5' : 'border-border',
              )}
              aria-pressed={isActive}
            >
              <span className="text-xl shrink-0" aria-hidden>
                {meta.icon}
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">
                {meta[lang] ?? meta.en}
              </span>
              {isActive && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
