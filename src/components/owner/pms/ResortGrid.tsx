import { Fragment } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { CellState, DayTotals, GridCell, GridRow } from '@/lib/pms/availabilityGrid';
import type { IcalStatus } from '@/lib/pms/icalHealth';

export interface ResortGridProps {
  rows: readonly GridRow[];
  totals: readonly DayTotals[];
  villaLabels: ReadonlyMap<string, string>;
  onFreeCell: (propertyId: string, date: string) => void;
  onBookedCell: (propertyId: string, bookingId: string) => void;
}

const CELL_CLASS: Record<CellState, string> = {
  free: 'bg-card hover:bg-muted',
  booked: 'bg-primary/80 text-primary-foreground',
  arrival: 'bg-primary/60 text-primary-foreground',
  departure: 'bg-primary/20',
  turnover: 'bg-accent/40',
  blocked: 'bg-muted-foreground/30',
  family_held: 'bg-warning/20',
};

const ICAL_CLASS: Record<IcalStatus, string> = {
  ok: 'bg-success',
  stale: 'bg-warning',
  error: 'bg-destructive',
  none: 'bg-muted-foreground/30',
};

function rowLabel(row: GridRow, language: string, wholeVilla: string): string {
  const title = language === 'ru' && row.key.titleRu ? row.key.titleRu : row.key.title;
  const unit = row.key.unitNumber ? `${row.key.unitNumber} · ` : '';
  return row.isWholeVilla ? `${unit}${title} (${wholeVilla})` : `${unit}${title}`;
}

function dayLabel(date: string): string {
  return date.slice(8, 10);
}

interface CellButtonProps {
  row: GridRow;
  cell: GridCell;
  stateLabel: string;
  onFree: ResortGridProps['onFreeCell'];
  onBooked: ResortGridProps['onBookedCell'];
}

function CellButton({ row, cell, stateLabel, onFree, onBooked }: CellButtonProps) {
  const interactive = cell.state === 'free' || (cell.bookingId !== null && cell.state !== 'family_held');
  const title = [cell.date, stateLabel, cell.guestName, cell.rate != null ? `${cell.rate} ${row.key.currency}` : null]
    .filter(Boolean).join(' · ');
  const handle = () => {
    if (cell.state === 'free') onFree(row.key.id, cell.date);
    else if (cell.bookingId) onBooked(row.key.id, cell.bookingId);
  };
  return (
    <td className="p-0 border-l border-border/60">
      <button
        type="button"
        title={title}
        aria-label={title}
        disabled={!interactive}
        onClick={handle}
        className={cn(
          'relative block h-9 w-9 min-w-9 text-[10px] leading-none disabled:cursor-default',
          CELL_CLASS[cell.state],
          cell.conflict && 'ring-2 ring-inset ring-destructive',
        )}
      >
        {cell.conflict && <AlertTriangle className="mx-auto h-3 w-3 text-destructive" aria-hidden="true" />}
      </button>
    </td>
  );
}

export function ResortGrid({ rows, totals, villaLabels, onFreeCell, onBookedCell }: ResortGridProps) {
  const { t, language } = useLanguage();
  const dates = totals.map(d => d.date);
  let lastVilla = '';
  return (
    <div className="overflow-x-auto border border-border bg-card">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-44 bg-card p-2 text-left font-medium">{t('pms.resort.unit')}</th>
            {dates.map(d => (
              <th key={d} scope="col" className="w-9 min-w-9 border-l border-border/60 p-1 text-center font-mono font-normal text-muted-foreground">
                {dayLabel(d)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const header = row.villaId !== lastVilla;
            lastVilla = row.villaId;
            return (
              <Fragment key={row.key.id}>
                {header && (
                  <tr className="bg-muted/50">
                    <td colSpan={dates.length + 1} className="sticky left-0 p-2 font-medium">{villaLabels.get(row.villaId) ?? t('pms.resort.villa')}</td>
                  </tr>
                )}
                <tr className="border-t border-border/60">
                  <th scope="row" className={cn('sticky left-0 z-10 bg-card p-2 text-left font-normal', !row.isWholeVilla && 'pl-5')}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn('h-2 w-2 rounded-full', ICAL_CLASS[row.ical])}
                        title={t(`pms.ical.${row.ical}`)}
                        role="img"
                        aria-label={t(`pms.ical.${row.ical}`)}
                      />
                      <span className="truncate">{rowLabel(row, language, t('pms.resort.wholeVilla'))}</span>
                    </span>
                  </th>
                  {row.cells.map(cell => (
                    <CellButton
                      key={cell.date}
                      row={row}
                      cell={cell}
                      stateLabel={t(`pms.cell.${cell.state}`)}
                      onFree={onFreeCell}
                      onBooked={onBookedCell}
                    />
                  ))}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-muted/40 font-mono">
            <th scope="row" className="sticky left-0 z-10 bg-muted p-2 text-left font-medium">{t('pms.resort.freeKeys')}</th>
            {totals.map(d => (
              <td key={d.date} className="border-l border-border/60 text-center" title={`+${d.arrivals} / -${d.departures}`}>
                {d.freeKeys}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
