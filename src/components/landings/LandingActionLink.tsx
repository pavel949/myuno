import { forwardRef, type AnchorHTMLAttributes, type Ref } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { cn } from '@/lib/utils';
import type { LandingLinkAvailability } from '@/lib/landings/types';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  availability?: LandingLinkAvailability;
}

/** Keep reviewed unavailable destinations visible without offering a broken navigation action. */
export const LandingActionLink = forwardRef<HTMLElement, Props>(function LandingActionLink({ availability, children, ...props }, ref) {
  const { language } = useLanguage();
  if (!availability) return <a {...props} ref={ref as Ref<HTMLAnchorElement>}>{children}</a>;
  const label = pickLang(language, availability === 'entity-unverified'
    ? { ru: 'Информация не подтверждена', en: 'Details not verified', th: 'ยังไม่ได้ยืนยันข้อมูล' }
    : { ru: 'Недоступно онлайн', en: 'Unavailable online', th: 'ยังไม่พร้อมใช้งานออนไลน์' });
  return <span ref={ref as Ref<HTMLSpanElement>} role="link" aria-disabled="true" data-link-availability={availability}
    className={cn(props.className, 'h-auto min-h-11 cursor-not-allowed whitespace-normal opacity-70')} title={label}>
    {children}{' '}<span className="ml-2 text-xs font-normal">{label}</span>
  </span>;
});
