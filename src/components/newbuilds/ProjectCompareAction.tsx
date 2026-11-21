import { GitCompareArrows } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MAX_NEWBUILD_COMPARISON, useOptionalNbCompare } from '@/components/newbuilds/NbCompareProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';
import { publicJourneyState } from '@/lib/real-estate/publicJourney';

export function ProjectCompareAction({ id, name }: { id: string; name: string }) {
  const compare = useOptionalNbCompare();
  const { language } = useLanguage();
  if (!compare) return null;
  const selected = compare.isInCompare(id);
  const full = compare.items.length >= MAX_NEWBUILD_COMPARISON;
  const label = pickLang(language, {
    ru: `Сравнить проект «${name}»`, en: `Compare project ${name}`, th: `เปรียบเทียบโครงการ ${name}`,
  });
  return (
    <Button type="button" variant="outline" size="sm" aria-label={label} aria-pressed={selected} disabled={full && !selected}
      className="min-h-11"
      onClick={() => selected ? compare.remove(id) : compare.add({ id })}>
      <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
      {selected
        ? pickLang(language, { ru: 'В сравнении', en: 'Added to compare', th: 'เพิ่มเพื่อเปรียบเทียบแล้ว' })
        : pickLang(language, { ru: 'Сравнить', en: 'Compare', th: 'เปรียบเทียบ' })}
    </Button>
  );
}

export function ProjectCompareSelection() {
  const compare = useOptionalNbCompare();
  const { language } = useLanguage();
  const location = useLocation();
  const count = compare?.items.length ?? 0;
  if (!compare || count === 0) return null;
  const summary = pickLang(language, {
    ru: `Выбрано для сравнения: ${count} из ${MAX_NEWBUILD_COMPARISON}`,
    en: `Selected for comparison: ${count} of ${MAX_NEWBUILD_COMPARISON}`,
    th: `เลือกเพื่อเปรียบเทียบ ${count} จาก ${MAX_NEWBUILD_COMPARISON} โครงการ`,
  });
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border border-border bg-card p-3">
      <p role="status" className="text-sm text-foreground">{summary}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" className="min-h-11" onClick={compare.clear}>
          {pickLang(language, { ru: 'Снять выбор', en: 'Clear selection', th: 'ล้างการเลือก' })}
        </Button>
        <Button asChild className="min-h-11">
          <Link to={APP_ROUTES.NEWBUILDS_COMPARE} state={publicJourneyState(location)}>
            {pickLang(language, { ru: 'Открыть сравнение', en: 'Open comparison', th: 'เปิดการเปรียบเทียบ' })}
          </Link>
        </Button>
      </div>
    </div>
  );
}
