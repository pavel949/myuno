import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { CrmContact } from '@/hooks/useCrmContacts';

interface ContactExportButtonProps {
  contacts: CrmContact[];
}

const EXPORT_FIELDS = [
  { key: 'first_name', label: 'First Name', labelRu: 'Имя' },
  { key: 'last_name', label: 'Last Name', labelRu: 'Фамилия' },
  { key: 'phone', label: 'Phone', labelRu: 'Телефон' },
  { key: 'email', label: 'Email', labelRu: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp', labelRu: 'WhatsApp' },
  { key: 'telegram', label: 'Telegram', labelRu: 'Telegram' },
  { key: 'contact_type', label: 'Type', labelRu: 'Тип' },
  { key: 'source', label: 'Source', labelRu: 'Источник' },
  { key: 'nationality', label: 'Nationality', labelRu: 'Гражданство' },
  { key: 'language', label: 'Language', labelRu: 'Язык' },
  { key: 'company_name', label: 'Company', labelRu: 'Компания' },
  { key: 'budget_min', label: 'Budget Min', labelRu: 'Бюджет от' },
  { key: 'budget_max', label: 'Budget Max', labelRu: 'Бюджет до' },
  { key: 'currency', label: 'Currency', labelRu: 'Валюта' },
  { key: 'notes', label: 'Notes', labelRu: 'Заметки' },
  { key: 'tags', label: 'Tags', labelRu: 'Теги' },
] as const;

export function ContactExportButton({ contacts }: ContactExportButtonProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleExport = () => {
    if (contacts.length === 0) {
      toast.error(isRu ? 'Нет контактов для экспорта' : 'No contacts to export');
      return;
    }

    const rows = contacts.map(c => {
      const row: Record<string, string> = {};
      EXPORT_FIELDS.forEach(f => {
        const val = (c as any)[f.key];
        row[isRu ? f.labelRu : f.label] = Array.isArray(val) ? val.join(', ') : (val ?? '');
      });
      return row;
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(isRu ? `Экспортировано ${contacts.length} контактов` : `Exported ${contacts.length} contacts`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={contacts.length === 0}>
      <Download className="h-4 w-4 mr-1" />
      CSV
    </Button>
  );
}
