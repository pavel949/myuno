import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCanManagePermissions } from '@/hooks/useTeamPermissions';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { CrmContact } from '@/hooks/useCrmContacts';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

function contactToOdooRow(c: CrmContact): Record<string, string> {
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
  const row: Record<string, string> = {
    firstname: c.first_name ?? '',
    lastname: c.last_name ?? '',
    name,
    email: c.email ?? '',
    phone: c.phone ?? '',
    mobile: c.mobile ?? c.whatsapp ?? '',
    street: c.address_street ?? '',
    street2: c.address_street2 ?? '',
    city: c.address_city ?? '',
    zip: c.address_zip ?? '',
    country_id: c.address_country ?? '',
    website: c.website ?? '',
    function: c.job_title ?? '',
    parent_id: c.company_name ?? '',
    comment: [c.notes, c.special_notes].filter(Boolean).join('\n'),
    lang: c.language ?? '',
    vat: c.tax_id ?? '',
    birthdate: c.birthday ?? '',
  };
  return row;
}

export function ContactExportButton({ contacts }: ContactExportButtonProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const canManage = useCanManagePermissions();
  const [exportOpen, setExportOpen] = useState(false);

  const logExport = async () => {
    if (!user) return;
    try {
      await supabase.from('crm_access_log').insert({
        user_id: user.id,
        action: 'export_csv',
        entity_type: 'contacts',
        entity_count: contacts.length,
        metadata: { format: 'csv', timestamp: new Date().toISOString() },
      } as Record<string, unknown>);
    } catch {
      // ignore
    }
  };

  const exportDate = new Date().toISOString().split('T')[0];

  const handleExportMyUno = async () => {
    if (contacts.length === 0) {
      toast.error(isRu ? 'Нет контактов для экспорта' : 'No contacts to export');
      return;
    }
    await logExport();
    const rows = contacts.map(c => {
      const row: Record<string, string> = {};
      EXPORT_FIELDS.forEach(f => {
        const val = (c as Record<string, unknown>)[f.key];
        row[isRu ? f.labelRu : f.label] = Array.isArray(val) ? val.join(', ') : String(val ?? '');
      });
      return row;
    });
    const csv = Papa.unparse(rows);
    const exporterName = user?.email || 'Unknown';
    const watermark = `\n# Exported by: ${exporterName} on ${exportDate}\n# Confidential — Do not distribute`;
    const blob = new Blob(['\ufeff' + csv + watermark], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts-${exportDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isRu ? `Экспортировано ${contacts.length} контактов` : `Exported ${contacts.length} contacts`);
    setExportOpen(false);
  };

  const handleExportOdoo = async () => {
    if (contacts.length === 0) {
      toast.error(isRu ? 'Нет контактов для экспорта' : 'No contacts to export');
      return;
    }
    await logExport();
    const rows = contacts.map(c => contactToOdooRow(c));
    const csv = Papa.unparse(rows);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts-odoo-${exportDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isRu ? `Экспорт для Odoo: ${contacts.length} контактов` : `Odoo export: ${contacts.length} contacts`);
    setExportOpen(false);
  };

  if (!canManage) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {isRu ? 'Экспорт доступен только директору или администратору' : 'Export is available to directors and admins only'}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu open={exportOpen} onOpenChange={setExportOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={contacts.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          CSV
          <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportMyUno}>
          {isRu ? 'CSV (myUNO)' : 'CSV (myUNO)'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportOdoo}>
          {isRu ? 'CSV для Odoo' : 'CSV for Odoo'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
