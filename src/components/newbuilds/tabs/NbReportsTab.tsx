/**
 * NbReportsTab — Monthly project reports with PDF downloads
 */
import React from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { useProjectReports } from '@/hooks/useProjectReports';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  projectId: string;
}

function formatMonth(month: string): string {
  try {
    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  } catch {
    return month;
  }
}

export function NbReportsTab({ projectId }: Props) {
  const { data: reports, isLoading } = useProjectReports(projectId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 rounded-xl" style={{ background: 'hsl(var(--nb-surface))' }} />
        ))}
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--nb-muted))' }} />
        <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-muted))' }}>Отчёты пока не опубликованы</p>
        <p className="text-sm mt-2" style={{ color: 'hsl(var(--nb-muted))' }}>
          Ежемесячные отчёты о строительстве будут доступны здесь
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="nb-label">ЕЖЕМЕСЯЧНЫЕ ОТЧЁТЫ</p>

      <div className="space-y-3">
        {reports.map((report, idx) => (
          <div key={report.id} className="nb-glass p-5 flex items-start gap-4">
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: idx === 0 ? 'hsl(var(--nb-gold) / 0.15)' : 'hsl(var(--nb-surface))' }}
            >
              <FileText className="w-5 h-5" style={{ color: idx === 0 ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-muted))' }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="nb-display text-base capitalize" style={{ color: 'hsl(var(--nb-text))' }}>
                  {formatMonth(report.month)}
                </h3>
                {idx === 0 && (
                  <span className="nb-badge text-[10px]" style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}>
                    Последний
                  </span>
                )}
              </div>
              {report.summary && (
                <p className="text-sm line-clamp-2" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                  {report.summary}
                </p>
              )}
              {report.created_at && (
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
                  <Calendar className="w-3 h-3" />
                  {new Date(report.created_at).toLocaleDateString('ru-RU')}
                </div>
              )}
            </div>

            {/* Download */}
            {report.pdf_url && (
              <a
                href={report.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
