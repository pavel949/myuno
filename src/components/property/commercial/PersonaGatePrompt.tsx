/**
 * Inline nudge shown when a user without `business`/`investor` persona lands on
 * commercial / land URLs. Doesn't block content — content always renders for SEO
 * & shared links — but offers a one-click toggle to enable persona, which makes
 * the section appear in PropertyHubTabs going forward.
 */
import { Briefcase, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useUserPersonas } from '@/hooks/useUserPersonas';

export function PersonaGatePrompt() {
  const { language } = useLanguage();
  const { personas, togglePersona, isToggling } = useUserPersonas();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  const hasBusiness = personas.includes('business');
  const hasInvestor = personas.includes('investor');
  if (hasBusiness || hasInvestor) return null;

  return (
    <div className="rounded-none border border-primary/20 bg-primary/5 p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          {isRu
            ? 'Включить роль «Бизнес» или «Инвестор», чтобы видеть этот раздел в навигации?'
            : isTh
            ? 'เปิดบทบาท “ธุรกิจ” หรือ “นักลงทุน” เพื่อให้ส่วนนี้แสดงในเมนูนำทางของคุณหรือไม่?'
            : 'Enable “Business” or “Investor” persona to see this section in your navigation?'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isRu
            ? 'Раздел доступен по ссылке всем — но в навигации появится только при выбранной роли.'
            : isTh
            ? 'ส่วนนี้เปิดให้ทุกคนผ่านลิงก์โดยตรง — จะแสดงในเมนูนำทางเมื่อเปิดบทบาทเท่านั้น'
            : 'Section is open to anyone via direct link — it only appears in nav when the role is enabled.'}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => togglePersona('business')}
          disabled={isToggling}
          className="gap-1.5"
        >
          <Briefcase className="w-3.5 h-3.5" />
          {isRu ? 'Бизнес' : isTh ? 'ธุรกิจ' : 'Business'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => togglePersona('investor')}
          disabled={isToggling}
          className="gap-1.5"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          {isRu ? 'Инвестор' : isTh ? 'นักลงทุน' : 'Investor'}
        </Button>
      </div>
    </div>
  );
}
