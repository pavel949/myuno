/**
 * AuthTrustFooter — quiet trust micro-copy below the auth form.
 *
 * Three small reassurances (encryption, no spam, free account) rendered with
 * lucide icons in muted-foreground. No exclamation marks, no marketing.
 */
import { Shield, MailCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function AuthTrustFooter() {
  const { t } = useLanguage();

  const items = [
    { icon: Shield, key: 'secure' as const },
    { icon: MailCheck, key: 'noSpam' as const },
    { icon: Sparkles, key: 'free' as const },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-6 text-xs text-muted-foreground">
      {items.map(({ icon: Icon, key }) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {t(`auth.trust.${key}`)}
        </span>
      ))}
    </div>
  );
}
