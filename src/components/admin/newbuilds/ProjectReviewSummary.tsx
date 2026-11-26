import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusTag } from '@/components/ui/status-tag';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDueDiligenceReport } from '@/hooks/useDueDiligence';
import { CLEARVIEW_CATEGORIES } from '@/lib/clearview/methodology';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';

export function ProjectReviewSummary({ projectId, viewerId }: { projectId: string; viewerId: string }) {
  const { language } = useLanguage();
  const t = (labels: LangValues) => pickLang(language, labels);
  const { data: report, isLoading, isError, isFetching, refetch } = useDueDiligenceReport(projectId, { viewerId });
  const scoreFormat = new Intl.NumberFormat(language, { maximumFractionDigits: 1 });
  const dateFormat = new Intl.DateTimeFormat(language, { dateStyle: 'medium' });
  const reportDate = report ? new Date(report.generated_at) : null;
  const unrecorded = t({ en: 'Awaiting score', ru: 'Оценки пока нет', th: 'รอคะแนน' });
  const formatScore = (score: number | null) =>
    typeof score === 'number' && Number.isFinite(score) ? scoreFormat.format(score) : unrecorded;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-h3">{t({ en: 'ClearView report', ru: 'Отчёт ClearView', th: 'รายงาน ClearView' })}</h2>
          {report && !isError && <p className="text-sm text-muted-foreground">
            {t({ en: 'Version', ru: 'Версия', th: 'ฉบับ' })} {report.version}
            {reportDate && !Number.isNaN(reportDate.getTime()) && (
              <> · <time dateTime={reportDate.toISOString()}>{dateFormat.format(reportDate)}</time></>
            )}
          </p>}
        </div>
        {report && !isError && (
          <StatusTag tone={report.is_published ? 'done' : 'waiting'}>
            {report.is_published
              ? t({ en: 'Published', ru: 'Опубликован', th: 'เผยแพร่แล้ว' })
              : t({ en: 'Draft', ru: 'Черновик', th: 'ฉบับร่าง' })}
          </StatusTag>
        )}
      </div>
      {isError ? (
        <div className="space-y-3">
          <p role="alert">{t({ en: 'The ClearView report could not be loaded.', ru: 'Не удалось загрузить отчёт ClearView.', th: 'โหลดรายงาน ClearView ไม่ได้' })}</p>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {t({ en: 'Try again', ru: 'Повторить', th: 'ลองอีกครั้ง' })}
          </Button>
        </div>
      ) : isLoading ? (
        <p role="status" className="text-muted-foreground">
          {t({ en: 'Loading report…', ru: 'Загружаем отчёт…', th: 'กำลังโหลดรายงาน…' })}
        </p>
      ) : report ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 bg-muted p-3">
            {report.grade && <span className="text-h3">{report.grade}</span>}
            <span className="tabular-nums">{formatScore(report.total_score)}</span>
            {typeof report.total_score === 'number' && Number.isFinite(report.total_score) && (
              <span className="text-sm text-muted-foreground">/ 100</span>
            )}
          </div>
          <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {CLEARVIEW_CATEGORIES.map(category => (
              <div key={category.code} className="space-y-1 border p-3">
                <dt className="text-sm text-muted-foreground">{language === 'ru' ? category.shortRu : category.shortEn}</dt>
                <dd className="font-medium tabular-nums">{formatScore(report[category.scoreField])}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="text-muted-foreground">
          {t({ en: 'No ClearView report is available for this project.', ru: 'Отчёт ClearView по этому проекту пока недоступен.', th: 'รายงาน ClearView ของโครงการนี้ยังไม่พร้อมใช้งาน' })}
        </p>
      )}
    </Card>
  );
}
