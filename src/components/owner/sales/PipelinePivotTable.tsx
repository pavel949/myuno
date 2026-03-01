import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, formatValue } from '@/hooks/useAgentDeals';
import { DynamicPipelineResult } from '@/hooks/useDynamicPipelineStages';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown, ChevronRight, FileText, FileSpreadsheet, Sheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

interface Props {
  deals: AgentDeal[];
  pipelineData: DynamicPipelineResult;
}

type MeasureKey = 'expected_revenue' | 'count' | 'weighted_revenue';

const MEASURES: { key: MeasureKey; labelEn: string; labelRu: string }[] = [
  { key: 'expected_revenue', labelEn: 'Expected Revenue', labelRu: 'Ожидаемый доход' },
  { key: 'count', labelEn: 'Count', labelRu: 'Количество' },
  { key: 'weighted_revenue', labelEn: 'Weighted Revenue', labelRu: 'Взвешенный доход' },
];

function getMonthKey(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'yyyy-MM');
  } catch {
    return 'unknown';
  }
}

function getMonthLabel(key: string, isRu: boolean) {
  if (key === 'unknown') return isRu ? 'Без даты' : 'No date';
  try {
    const d = parseISO(key + '-01');
    return format(d, 'MMMM yyyy', { locale: isRu ? ru : undefined });
  } catch {
    return key;
  }
}

export function PipelinePivotTable({ deals, pipelineData }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [measure, setMeasure] = useState<MeasureKey>('expected_revenue');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [showMeasureMenu, setShowMeasureMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const stages = pipelineData.activeStages;

  const { monthKeys, pivotData, monthTotals, stageTotals, grandTotal } = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    const mTotals: Record<string, number> = {};
    const sTotals: Record<string, number> = {};
    let gTotal = 0;

    for (const deal of deals) {
      const mk = getMonthKey(deal.created_at);
      if (!data[mk]) data[mk] = {};

      let val = 0;
      if (measure === 'expected_revenue') {
        val = Number(deal.deal_value || deal.budget_max || 0);
      } else if (measure === 'count') {
        val = 1;
      } else if (measure === 'weighted_revenue') {
        val = Number(deal.deal_value || deal.budget_max || 0) * pipelineData.getProbability(deal.stage);
      }

      const stageKey = deal.stage;
      data[mk][stageKey] = (data[mk][stageKey] || 0) + val;
      mTotals[mk] = (mTotals[mk] || 0) + val;
      sTotals[stageKey] = (sTotals[stageKey] || 0) + val;
      gTotal += val;
    }

    const keys = Object.keys(data).sort();
    return { monthKeys: keys, pivotData: data, monthTotals: mTotals, stageTotals: sTotals, grandTotal: gTotal };
  }, [deals, measure, pipelineData, stages]);

  const formatCell = (val: number | undefined) => {
    if (!val) return '';
    if (measure === 'count') return val.toLocaleString();
    return formatValue(val);
  };

  const formatCellRaw = (val: number | undefined) => val || 0;

  const toggleMonth = (mk: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(mk)) next.delete(mk); else next.add(mk);
      return next;
    });
  };

  // ─── Build table data for exports ───
  const getTableData = () => {
    const stageNames = stages.map(s => isRu ? s.nameRu : s.nameEn);
    const header = [isRu ? 'Месяц' : 'Month', ...stageNames, isRu ? 'Итого' : 'Total'];
    const rows = monthKeys.map(mk => [
      getMonthLabel(mk, isRu),
      ...stages.map(s => formatCellRaw(pivotData[mk]?.[s.key])),
      formatCellRaw(monthTotals[mk]),
    ]);
    const totalRow = [isRu ? 'Итого' : 'Total', ...stages.map(s => formatCellRaw(stageTotals[s.key])), grandTotal];
    return { header, rows, totalRow, stageNames };
  };

  // ─── CSV Export ───
  const exportCSV = () => {
    const { header, rows, totalRow } = getTableData();
    const allRows = [header, ...rows, totalRow];
    const csv = allRows.map(r => r.map(c => typeof c === 'number' ? c : `"${c}"`).join(',')).join('\n');
    downloadBlob(csv, 'text/csv', `pipeline-pivot-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  // ─── PDF Export ───
  const exportPDF = () => {
    const { header, rows, totalRow } = getTableData();
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(isRu ? 'Воронка продаж — Pivot' : 'Sales Pipeline — Pivot', 14, 15);
    doc.setFontSize(9);
    doc.text(`${currentMeasure.labelEn} · ${format(new Date(), 'dd.MM.yyyy')}`, 14, 22);

    autoTable(doc, {
      head: [header],
      body: [...rows.map(r => r.map(c => typeof c === 'number' ? c.toLocaleString() : c)), totalRow.map(c => typeof c === 'number' ? c.toLocaleString() : c)],
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [243, 244, 246], fontStyle: 'bold' },
      didParseCell: (data) => {
        // Bold last row
        if (data.row.index === rows.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [243, 244, 246];
        }
      },
    });

    doc.save(`pipeline-pivot-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // ─── Excel Export ───
  const exportExcel = async () => {
    const { header, rows, totalRow } = getTableData();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Pipeline Pivot');

    // Header row
    const headerRow = ws.addRow(header);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Data rows
    for (const row of rows) {
      const r = ws.addRow(row);
      r.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });
    }

    // Total row
    const totRow = ws.addRow(totalRow);
    totRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      if (colNumber > 1) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Auto-width
    ws.columns.forEach(col => { col.width = 18; });

    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `pipeline-pivot-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // ─── Google Sheets (CSV + open in Sheets) ───
  const exportGoogleSheets = () => {
    const { header, rows, totalRow } = getTableData();
    const allRows = [header, ...rows, totalRow];
    const csv = allRows.map(r => r.map(c => typeof c === 'number' ? c : `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    // Download CSV first, then open Google Sheets import
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-pivot-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // Open Google Sheets in new tab
    setTimeout(() => {
      window.open('https://sheets.google.com/create', '_blank');
    }, 500);
  };

  function downloadBlob(content: string | ArrayBuffer | BlobPart, type: string, filename: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentMeasure = MEASURES.find(m => m.key === measure)!;

  const exportOptions = [
    { key: 'csv', label: 'CSV', icon: FileText, action: exportCSV },
    { key: 'excel', label: 'Excel (.xlsx)', icon: FileSpreadsheet, action: exportExcel },
    { key: 'pdf', label: 'PDF', icon: FileText, action: exportPDF },
    { key: 'gsheets', label: 'Google Sheets', icon: Sheet, action: exportGoogleSheets },
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            onClick={() => { setShowMeasureMenu(!showMeasureMenu); setShowExportMenu(false); }}
          >
            {isRu ? 'Метрика' : 'Measures'}
            <ChevronDown className="h-3 w-3" />
          </Button>
          {showMeasureMenu && (
            <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 min-w-[180px] py-1">
              {MEASURES.map(m => (
                <button
                  key={m.key}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors',
                    measure === m.key && 'bg-primary/10 text-primary font-medium',
                  )}
                  onClick={() => { setMeasure(m.key); setShowMeasureMenu(false); }}
                >
                  {isRu ? m.labelRu : m.labelEn}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            onClick={() => { setShowExportMenu(!showExportMenu); setShowMeasureMenu(false); }}
          >
            <Download className="h-3 w-3" />
            {isRu ? 'Экспорт' : 'Export'}
            <ChevronDown className="h-3 w-3" />
          </Button>
          {showExportMenu && (
            <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 min-w-[180px] py-1">
              {exportOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2"
                    onClick={() => { opt.action(); setShowExportMenu(false); }}
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {isRu ? currentMeasure.labelRu : currentMeasure.labelEn}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-x-auto bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2.5 font-semibold sticky left-0 bg-muted/50 min-w-[140px]" />
              {stages.map(s => (
                <th key={s.key} className="text-right p-2.5 font-semibold whitespace-nowrap min-w-[120px]">
                  <div className="flex items-center justify-end gap-1">
                    <span className={cn('w-2 h-2 rounded-full', s.barColor)} />
                    {isRu ? s.nameRu : s.nameEn}
                  </div>
                </th>
              ))}
              <th className="text-right p-2.5 font-bold whitespace-nowrap min-w-[130px] bg-muted/80">
                {isRu ? currentMeasure.labelRu : currentMeasure.labelEn}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Grand total row */}
            <tr className="border-b bg-muted/30 font-semibold">
              <td className="p-2.5 sticky left-0 bg-muted/30">
                {isRu ? 'Итого' : 'Total'}
              </td>
              {stages.map(s => (
                <td key={s.key} className="text-right p-2.5 tabular-nums">
                  {formatCell(stageTotals[s.key])}
                </td>
              ))}
              <td className="text-right p-2.5 tabular-nums font-bold bg-muted/50 text-primary">
                {formatCell(grandTotal)}
              </td>
            </tr>

            {/* Month rows */}
            {monthKeys.map(mk => (
              <tr key={mk} className="border-b hover:bg-muted/20 transition-colors">
                <td className="p-2.5 sticky left-0 bg-card">
                  <button
                    onClick={() => toggleMonth(mk)}
                    className="flex items-center gap-1 hover:text-primary transition-colors capitalize"
                  >
                    {expandedMonths.has(mk) ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    {getMonthLabel(mk, isRu)}
                  </button>
                </td>
                {stages.map(s => {
                  const val = pivotData[mk]?.[s.key];
                  return (
                    <td key={s.key} className={cn('text-right p-2.5 tabular-nums', val && 'text-foreground')}>
                      {formatCell(val)}
                    </td>
                  );
                })}
                <td className="text-right p-2.5 tabular-nums font-semibold bg-muted/30 text-primary">
                  {formatCell(monthTotals[mk])}
                </td>
              </tr>
            ))}

            {monthKeys.length === 0 && (
              <tr>
                <td colSpan={stages.length + 2} className="text-center p-8 text-muted-foreground">
                  {isRu ? 'Нет данных для отображения' : 'No data to display'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
