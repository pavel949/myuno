import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';

export interface ExportableItem {
  id: string;
  name_en: string;
  name_ru: string;
  type?: string;
  price?: number;
  is_active?: boolean;
  is_featured?: boolean;
  created_at?: string;
  [key: string]: any;
}

interface CatalogExportButtonProps {
  items: ExportableItem[];
  filename?: string;
  columns?: { key: string; label: string; labelRu: string }[];
}

const defaultColumns = [
  { key: 'id', label: 'ID', labelRu: 'ID' },
  { key: 'name_en', label: 'Name (EN)', labelRu: 'Название (EN)' },
  { key: 'name_ru', label: 'Name (RU)', labelRu: 'Название (RU)' },
  { key: 'type', label: 'Type', labelRu: 'Тип' },
  { key: 'price', label: 'Price', labelRu: 'Цена' },
  { key: 'is_active', label: 'Active', labelRu: 'Активен' },
  { key: 'is_featured', label: 'Featured', labelRu: 'Избранное' },
  { key: 'created_at', label: 'Created', labelRu: 'Создан' },
];

export function CatalogExportButton({ 
  items, 
  filename = 'catalog-export',
  columns = defaultColumns 
}: CatalogExportButtonProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    if (items.length === 0) {
      toast.error(isRussian ? 'Нет данных для экспорта' : 'No data to export');
      return;
    }

    setIsExporting(true);
    try {
      const headers = columns.map(col => isRussian ? col.labelRu : col.label);
      const rows = items.map(item => 
        columns.map(col => {
          const value = item[col.key];
          if (typeof value === 'boolean') return value ? 'Yes' : 'No';
          if (value === null || value === undefined) return '';
          return String(value);
        })
      );

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(isRussian ? 'CSV экспортирован' : 'CSV exported');
    } catch (error) {
      toast.error(isRussian ? 'Ошибка экспорта' : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (items.length === 0) {
      toast.error(isRussian ? 'Нет данных для экспорта' : 'No data to export');
      return;
    }

    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'UNO Admin';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet(isRussian ? 'Каталог' : 'Catalog');

      // Add headers with styling
      worksheet.columns = columns.map(col => ({
        header: isRussian ? col.labelRu : col.label,
        key: col.key,
        width: col.key === 'id' ? 40 : 20,
      }));

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Add data rows
      items.forEach(item => {
        const row: Record<string, any> = {};
        columns.forEach(col => {
          const value = item[col.key];
          if (typeof value === 'boolean') {
            row[col.key] = value ? (isRussian ? 'Да' : 'Yes') : (isRussian ? 'Нет' : 'No');
          } else {
            row[col.key] = value ?? '';
          }
        });
        worksheet.addRow(row);
      });

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(isRussian ? 'Excel экспортирован' : 'Excel exported');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error(isRussian ? 'Ошибка экспорта Excel' : 'Excel export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting || items.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {isRussian ? 'Экспорт' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
