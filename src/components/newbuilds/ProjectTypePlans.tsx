import { useState } from 'react';
import { ExternalLink, FileText, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueryRecovery } from '@/components/shared/QueryRecovery';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { collectHostedProjectPlans, type HostedProjectPlan, type ProjectPlanDocument } from '@/lib/real-estate/projectHostedPlans';

const initialTypeCount = 6;

function PlanCard({ plan }: { plan: HostedProjectPlan }) {
  const { language } = useLanguage();
  const [previewFailed, setPreviewFailed] = useState(false);
  const title = plan.title || (plan.isMasterplan
    ? pickLang(language, { en: 'Site plan', ru: 'Генплан', th: 'ผังโครงการ' })
    : pickLang(language, { en: 'Floor plan', ru: 'Планировка', th: 'แปลน' }));
  const action = plan.isImage
    ? pickLang(language, { en: 'Open full size', ru: 'Открыть в полном размере', th: 'เปิดภาพขนาดเต็ม' })
    : pickLang(language, { en: 'Open PDF', ru: 'Открыть PDF', th: 'เปิด PDF' });
  const newTab = pickLang(language, { en: 'new tab', ru: 'новая вкладка', th: 'แท็บใหม่' });

  return (
    <a href={plan.url} target="_blank" rel="noopener noreferrer" aria-label={`${title}: ${action} (${newTab})`}
      className="group block min-w-0 border border-border bg-card text-card-foreground hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-muted p-3">
        {plan.isImage && !previewFailed ? (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError handles failed loading, not user interaction.
          <img src={plan.url} alt="" width={320} height={200} loading="lazy" decoding="async"
            className="h-full w-full object-contain" onError={() => setPreviewFailed(true)} />
        ) : plan.isImage ? <ImageOff aria-hidden="true" className="h-7 w-7 text-muted-foreground" />
          : <FileText aria-hidden="true" className="h-7 w-7 text-muted-foreground" />}
      </div>
      <div className="flex min-h-11 items-center justify-between gap-3 p-3">
        <div className="min-w-0 break-words">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{action}</p>
        </div>
        <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
      </div>
    </a>
  );
}

export function ProjectTypePlans({ docs, isLoading, isError, onRetry }: {
  docs: readonly ProjectPlanDocument[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => unknown;
}) {
  const { language } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const plans = collectHostedProjectPlans(docs);
  const masterplans = plans.filter(plan => plan.isMasterplan);
  const types = plans.filter(plan => !plan.isMasterplan);

  return (
    <section aria-labelledby="project-plans-title" className="space-y-3">
      <h3 id="project-plans-title" className="text-lg font-semibold">
        {pickLang(language, { en: 'Project plans', ru: 'Планировки проекта', th: 'แปลนโครงการ' })}
      </h3>
      {isError ? <QueryRecovery onRetry={onRetry} /> : isLoading ? (
        <Skeleton className="h-32" role="status"
          aria-label={pickLang(language, { en: 'Loading plans', ru: 'Загружаем планировки', th: 'กำลังโหลดแปลน' })} />
      ) : plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {pickLang(language, { en: 'No project plans have been published here yet.', ru: 'Здесь пока нет опубликованных планировок проекта.', th: 'ยังไม่มีการเผยแพร่แปลนโครงการในหน้านี้' })}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {pickLang(language, {
              en: 'Reference plans only. Total area may include outdoor space. An individual unit’s layout, price and availability must be confirmed separately.',
              ru: 'Это типовые планы. Общая площадь может включать террасу или сад. Планировку, цену и наличие конкретной квартиры уточняйте отдельно.',
              th: 'แปลนนี้ใช้เพื่ออ้างอิงเท่านั้น พื้นที่รวมอาจรวมพื้นที่กลางแจ้ง โปรดยืนยันแปลน ราคา และสถานะว่างของยูนิตจริงแยกต่างหาก',
            })}
          </p>
          {[
            { id: 'site-plan', label: pickLang(language, { en: 'Site plan', ru: 'Генплан', th: 'ผังโครงการ' }), plans: masterplans },
            { id: 'typical-layouts', label: pickLang(language, { en: 'Typical layouts', ru: 'Типовые планировки', th: 'แปลนตามแบบห้อง' }),
              plans: showAll ? types : types.slice(0, initialTypeCount) },
          ].map(group => group.plans.length > 0 && (
            <div className="space-y-2" key={group.id}>
              <h4 className="text-sm font-semibold">{group.label}</h4>
              <div id={group.id} className={group.id === 'typical-layouts'
                ? 'grid grid-cols-2 gap-3 lg:grid-cols-3'
                : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'}>
                {group.plans.map(plan => <PlanCard key={plan.url} plan={plan} />)}
              </div>
            </div>
          ))}
          {types.length > initialTypeCount && (
            <Button type="button" variant="outline" className="min-h-11"
              aria-expanded={showAll} aria-controls="typical-layouts" onClick={() => setShowAll(value => !value)}>
              {showAll ? pickLang(language, { en: 'Show fewer layouts', ru: 'Свернуть список', th: 'แสดงแปลนน้อยลง' })
                : pickLang(language, { en: `Show all ${types.length} layouts`, ru: `Все планировки (${types.length})`, th: `ดูแปลนทั้งหมด ${types.length} แบบ` })}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
