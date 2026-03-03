import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, ChevronRight } from 'lucide-react';
// jsPDF and jspdf-autotable are dynamically imported in handleExportPdf

interface DocumentTemplate {
  id: string;
  nameEn: string;
  nameRu: string;
  descEn: string;
  descRu: string;
  category: string;
  variables: string[];
  bodyEn: string;
  bodyRu: string;
  hasTable?: boolean;
  autoFillFrom?: 'inventory' | 'inventory_damaged';
}

const TEMPLATES: DocumentTemplate[] = [
  {
    id: 'lease_agreement',
    nameEn: 'Lease Agreement',
    nameRu: 'Договор аренды',
    descEn: 'Standard rental contract between owner and tenant',
    descRu: 'Стандартный договор аренды между собственником и арендатором',
    category: 'rental',
    variables: ['tenant_name', 'property_address', 'start_date', 'end_date', 'monthly_rent', 'deposit_amount', 'currency'],
    bodyEn: `LEASE AGREEMENT

This Lease Agreement ("Agreement") is entered into on {{start_date}} between the Owner and the Tenant:

Tenant: {{tenant_name}}
Property: {{property_address}}

TERMS:
1. Lease Period: From {{start_date}} to {{end_date}}
2. Monthly Rent: {{monthly_rent}} {{currency}}, payable on the 1st of each month
3. Security Deposit: {{deposit_amount}} {{currency}}, refundable upon satisfactory inspection

OBLIGATIONS:
- Tenant shall maintain the property in good condition
- Tenant shall not sublease without written consent
- Owner shall ensure all utilities are in working order

This agreement is binding upon signing by both parties.

Owner Signature: ___________________    Date: ____________
Tenant Signature: ___________________   Date: ____________`,
    bodyRu: `ДОГОВОР АРЕНДЫ

Настоящий Договор аренды ("Договор") заключён {{start_date}} между Собственником и Арендатором:

Арендатор: {{tenant_name}}
Объект: {{property_address}}

УСЛОВИЯ:
1. Срок аренды: с {{start_date}} по {{end_date}}
2. Ежемесячная арендная плата: {{monthly_rent}} {{currency}}, оплата до 1-го числа каждого месяца
3. Залог: {{deposit_amount}} {{currency}}, возвращается при удовлетворительном осмотре

ОБЯЗАТЕЛЬСТВА:
- Арендатор обязуется содержать объект в надлежащем состоянии
- Субаренда без письменного согласия запрещена
- Собственник обеспечивает исправность коммуникаций

Договор вступает в силу с момента подписания обеими сторонами.

Подпись Собственника: ___________________  Дата: ____________
Подпись Арендатора: ___________________    Дата: ____________`,
  },
  {
    id: 'handover_act',
    nameEn: 'Property Handover Act',
    nameRu: 'Акт приёма-передачи',
    descEn: 'Check-in/check-out property condition report',
    descRu: 'Отчёт о состоянии объекта при заезде/выезде',
    category: 'operations',
    variables: ['tenant_name', 'property_address', 'handover_date', 'condition_notes', 'meter_electric', 'meter_water'],
    bodyEn: `PROPERTY HANDOVER ACT

Date: {{handover_date}}
Property: {{property_address}}
Tenant: {{tenant_name}}

METER READINGS:
- Electric: {{meter_electric}} kWh
- Water: {{meter_water}} m³

CONDITION NOTES:
{{condition_notes}}

Both parties confirm the property condition as described above.

Owner/Manager: ___________________   Date: ____________
Tenant: ___________________          Date: ____________`,
    bodyRu: `АКТ ПРИЁМА-ПЕРЕДАЧИ

Дата: {{handover_date}}
Объект: {{property_address}}
Арендатор: {{tenant_name}}

ПОКАЗАНИЯ СЧЁТЧИКОВ:
- Электричество: {{meter_electric}} кВт·ч
- Вода: {{meter_water}} м³

ЗАМЕЧАНИЯ ПО СОСТОЯНИЮ:
{{condition_notes}}

Стороны подтверждают состояние объекта, описанное выше.

Собственник/Управляющий: ___________________  Дата: ____________
Арендатор: ___________________                 Дата: ____________`,
  },
  {
    id: 'power_of_attorney',
    nameEn: 'Power of Attorney',
    nameRu: 'Доверенность',
    descEn: 'Authorization for property management on behalf of owner',
    descRu: 'Доверенность на управление объектом от имени собственника',
    category: 'legal',
    variables: ['owner_name', 'manager_name', 'property_address', 'valid_from', 'valid_until'],
    bodyEn: `POWER OF ATTORNEY

I, {{owner_name}} ("Principal"), hereby authorize {{manager_name}} ("Agent") to act on my behalf regarding the following property:

Property: {{property_address}}

SCOPE OF AUTHORITY:
1. Execute lease agreements with tenants
2. Collect rent and issue receipts
3. Arrange maintenance and repairs
4. Represent the Principal in dealings with service providers

This Power of Attorney is valid from {{valid_from}} to {{valid_until}}.

Principal Signature: ___________________   Date: ____________
Agent Signature: ___________________       Date: ____________`,
    bodyRu: `ДОВЕРЕННОСТЬ

Я, {{owner_name}} ("Доверитель"), настоящим уполномочиваю {{manager_name}} ("Поверенный") действовать от моего имени в отношении следующего объекта:

Объект: {{property_address}}

ПОЛНОМОЧИЯ:
1. Заключать договоры аренды с арендаторами
2. Получать арендную плату и выдавать квитанции
3. Организовывать обслуживание и ремонт
4. Представлять Доверителя в отношениях с поставщиками услуг

Доверенность действительна с {{valid_from}} по {{valid_until}}.

Подпись Доверителя: ___________________    Дата: ____________
Подпись Поверенного: ___________________   Дата: ____________`,
  },
  {
    id: 'service_contract',
    nameEn: 'Service Contract',
    nameRu: 'Договор на услуги',
    descEn: 'Agreement with cleaning, maintenance, or other service providers',
    descRu: 'Договор с клининговой компанией, техобслуживанием или другими подрядчиками',
    category: 'operations',
    variables: ['provider_name', 'service_description', 'property_address', 'monthly_fee', 'currency', 'start_date'],
    bodyEn: `SERVICE CONTRACT

Date: {{start_date}}
Provider: {{provider_name}}
Property: {{property_address}}

SERVICE DESCRIPTION:
{{service_description}}

COMPENSATION:
Monthly fee: {{monthly_fee}} {{currency}}
Payment due by the 5th of each month.

TERMS:
- Provider shall deliver services as described above
- Either party may terminate with 30 days written notice
- Provider maintains liability insurance

Owner Signature: ___________________    Date: ____________
Provider Signature: ___________________  Date: ____________`,
    bodyRu: `ДОГОВОР НА УСЛУГИ

Дата: {{start_date}}
Исполнитель: {{provider_name}}
Объект: {{property_address}}

ОПИСАНИЕ УСЛУГ:
{{service_description}}

ОПЛАТА:
Ежемесячная плата: {{monthly_fee}} {{currency}}
Оплата до 5-го числа каждого месяца.

УСЛОВИЯ:
- Исполнитель обязуется оказывать услуги, описанные выше
- Любая сторона вправе расторгнуть договор с уведомлением за 30 дней
- Исполнитель имеет страхование ответственности

Подпись Заказчика: ___________________    Дата: ____________
Подпись Исполнителя: ___________________  Дата: ____________`,
  },
  // === NEW TEMPLATES ===
  {
    id: 'damage_report',
    nameEn: 'Damage Report',
    nameRu: 'Акт повреждений',
    descEn: 'Document damages found during check-out or inspection',
    descRu: 'Фиксация повреждений при выезде или инспекции',
    category: 'operations',
    variables: ['tenant_name', 'property_address', 'inspection_date', 'damage_details', 'total_cost', 'currency'],
    hasTable: true,
    autoFillFrom: 'inventory_damaged',
    bodyEn: `DAMAGE REPORT

Date: {{inspection_date}}
Property: {{property_address}}
Tenant: {{tenant_name}}

DAMAGED ITEMS:
{{damage_details}}

Total Estimated Cost: {{total_cost}} {{currency}}

The tenant is responsible for the damages described above.

Inspector: ___________________    Date: ____________
Tenant: ___________________       Date: ____________`,
    bodyRu: `АКТ ПОВРЕЖДЕНИЙ

Дата: {{inspection_date}}
Объект: {{property_address}}
Арендатор: {{tenant_name}}

ПОВРЕЖДЁННЫЕ ПРЕДМЕТЫ:
{{damage_details}}

Общая оценочная стоимость: {{total_cost}} {{currency}}

Арендатор несёт ответственность за описанные повреждения.

Инспектор: ___________________    Дата: ____________
Арендатор: ___________________    Дата: ____________`,
  },
  {
    id: 'inventory_list',
    nameEn: 'Property Inventory List',
    nameRu: 'Опись имущества',
    descEn: 'Complete inventory of property contents with conditions',
    descRu: 'Полная опись имущества объекта с состоянием',
    category: 'operations',
    variables: ['property_address', 'inventory_date'],
    hasTable: true,
    autoFillFrom: 'inventory',
    bodyEn: `PROPERTY INVENTORY LIST

Date: {{inventory_date}}
Property: {{property_address}}

ITEMS: See table below.

Both parties confirm the inventory as listed above.

Owner/Manager: ___________________   Date: ____________
Tenant: ___________________          Date: ____________`,
    bodyRu: `ОПИСЬ ИМУЩЕСТВА

Дата: {{inventory_date}}
Объект: {{property_address}}

ПРЕДМЕТЫ: см. таблицу ниже.

Стороны подтверждают опись имущества.

Собственник/Управляющий: ___________________  Дата: ____________
Арендатор: ___________________                 Дата: ____________`,
  },
  {
    id: 'cleaning_checklist',
    nameEn: 'Cleaning Checklist',
    nameRu: 'Чек-лист уборки',
    descEn: 'Room-by-room cleaning task checklist',
    descRu: 'Чек-лист уборки по комнатам',
    category: 'operations',
    variables: ['property_address', 'cleaning_date', 'cleaner_name'],
    hasTable: true,
    bodyEn: `CLEANING CHECKLIST

Date: {{cleaning_date}}
Property: {{property_address}}
Cleaner: {{cleaner_name}}

See checklist table below.

Cleaner Signature: ___________________   Date: ____________
Inspector: ___________________           Date: ____________`,
    bodyRu: `ЧЕК-ЛИСТ УБОРКИ

Дата: {{cleaning_date}}
Объект: {{property_address}}
Клинер: {{cleaner_name}}

См. таблицу чек-листа ниже.

Подпись Клинера: ___________________   Дата: ____________
Инспектор: ___________________         Дата: ____________`,
  },
  {
    id: 'deposit_return',
    nameEn: 'Deposit Return Act',
    nameRu: 'Акт возврата залога',
    descEn: 'Security deposit return with deductions breakdown',
    descRu: 'Возврат залога с расшифровкой удержаний',
    category: 'rental',
    variables: ['tenant_name', 'property_address', 'deposit_amount', 'deductions_details', 'refund_amount', 'currency', 'return_date'],
    hasTable: true,
    bodyEn: `DEPOSIT RETURN ACT

Date: {{return_date}}
Property: {{property_address}}
Tenant: {{tenant_name}}

Original Deposit: {{deposit_amount}} {{currency}}

DEDUCTIONS:
{{deductions_details}}

Refund Amount: {{refund_amount}} {{currency}}

Owner/Manager: ___________________   Date: ____________
Tenant: ___________________          Date: ____________`,
    bodyRu: `АКТ ВОЗВРАТА ЗАЛОГА

Дата: {{return_date}}
Объект: {{property_address}}
Арендатор: {{tenant_name}}

Сумма залога: {{deposit_amount}} {{currency}}

УДЕРЖАНИЯ:
{{deductions_details}}

Сумма к возврату: {{refund_amount}} {{currency}}

Собственник/Управляющий: ___________________  Дата: ____________
Арендатор: ___________________                 Дата: ____________`,
  },
  {
    id: 'booking_confirmation',
    nameEn: 'Booking Confirmation',
    nameRu: 'Подтверждение бронирования',
    descEn: 'Confirmation letter after deposit payment',
    descRu: 'Письмо-подтверждение после оплаты депозита',
    category: 'rental',
    variables: ['guest_name', 'property_address', 'start_date', 'end_date', 'total_amount', 'deposit_amount', 'currency', 'guest_email', 'booking_ref'],
    bodyEn: `BOOKING CONFIRMATION

Booking Reference: {{booking_ref}}

Dear {{guest_name}},

We are pleased to confirm your reservation at the following property:

Property: {{property_address}}
Check-in: {{start_date}}
Check-out: {{end_date}}

PAYMENT DETAILS:
Total Amount: {{total_amount}} {{currency}}
Deposit Paid: {{deposit_amount}} {{currency}}
Balance Due on Check-in: Remaining amount

IMPORTANT INFORMATION:
1. Check-in time: 14:00 (2:00 PM)
2. Check-out time: 12:00 (noon)
3. A refundable security deposit may be required upon check-in
4. Valid passport/ID required for all guests
5. Cancellation policy: As per rental agreement terms

Please retain this confirmation for your records.

For any questions, please contact us.

Best regards,
Property Management

Confirmation Date: ____________`,
    bodyRu: `ПОДТВЕРЖДЕНИЕ БРОНИРОВАНИЯ

Номер бронирования: {{booking_ref}}

Уважаемый(ая) {{guest_name}},

Рады подтвердить Вашу бронь на следующий объект:

Объект: {{property_address}}
Заезд: {{start_date}}
Выезд: {{end_date}}

ДЕТАЛИ ОПЛАТЫ:
Общая сумма: {{total_amount}} {{currency}}
Оплаченный депозит: {{deposit_amount}} {{currency}}
Остаток при заезде: Оставшаяся сумма

ВАЖНАЯ ИНФОРМАЦИЯ:
1. Время заезда: 14:00
2. Время выезда: 12:00
3. При заезде может потребоваться возвратный залог
4. Необходим действующий паспорт/ID для всех гостей
5. Условия отмены: Согласно договору аренды

Сохраните данное подтверждение для Ваших записей.

По любым вопросам свяжитесь с нами.

С уважением,
Управляющая компания

Дата подтверждения: ____________`,
  },
];

const VARIABLE_LABELS: Record<string, { en: string; ru: string }> = {
  tenant_name: { en: 'Tenant Name', ru: 'Имя арендатора' },
  property_address: { en: 'Property Address', ru: 'Адрес объекта' },
  start_date: { en: 'Start Date', ru: 'Дата начала' },
  end_date: { en: 'End Date', ru: 'Дата окончания' },
  monthly_rent: { en: 'Monthly Rent', ru: 'Месячная аренда' },
  deposit_amount: { en: 'Deposit', ru: 'Залог' },
  currency: { en: 'Currency', ru: 'Валюта' },
  handover_date: { en: 'Date', ru: 'Дата' },
  condition_notes: { en: 'Condition Notes', ru: 'Замечания' },
  meter_electric: { en: 'Electric Meter', ru: 'Электросчётчик' },
  meter_water: { en: 'Water Meter', ru: 'Водосчётчик' },
  owner_name: { en: 'Owner Name', ru: 'Имя собственника' },
  manager_name: { en: 'Manager Name', ru: 'Имя управляющего' },
  valid_from: { en: 'Valid From', ru: 'Действует с' },
  valid_until: { en: 'Valid Until', ru: 'Действует до' },
  provider_name: { en: 'Provider Name', ru: 'Исполнитель' },
  service_description: { en: 'Service Description', ru: 'Описание услуг' },
  monthly_fee: { en: 'Monthly Fee', ru: 'Месячная плата' },
  inspection_date: { en: 'Inspection Date', ru: 'Дата инспекции' },
  damage_details: { en: 'Damage Details', ru: 'Описание повреждений' },
  total_cost: { en: 'Total Cost', ru: 'Общая стоимость' },
  inventory_date: { en: 'Inventory Date', ru: 'Дата описи' },
  cleaning_date: { en: 'Cleaning Date', ru: 'Дата уборки' },
  cleaner_name: { en: 'Cleaner Name', ru: 'Имя клинера' },
  deductions_details: { en: 'Deductions Details', ru: 'Детали удержаний' },
  refund_amount: { en: 'Refund Amount', ru: 'Сумма возврата' },
  return_date: { en: 'Return Date', ru: 'Дата возврата' },
  guest_name: { en: 'Guest Name', ru: 'Имя гостя' },
  guest_email: { en: 'Guest Email', ru: 'Email гостя' },
  booking_ref: { en: 'Booking Reference', ru: 'Номер бронирования' },
  total_amount: { en: 'Total Amount', ru: 'Общая сумма' },
};

const CATEGORY_LABELS: Record<string, { en: string; ru: string }> = {
  rental: { en: 'Rental', ru: 'Аренда' },
  operations: { en: 'Operations', ru: 'Операции' },
  legal: { en: 'Legal', ru: 'Юридическое' },
};

// Cleaning checklist data
const CLEANING_ROOMS = [
  { en: 'Living Room', ru: 'Гостиная', tasks: [
    { en: 'Vacuum/Mop floors', ru: 'Пропылесосить/помыть полы' },
    { en: 'Dust all surfaces', ru: 'Протереть пыль' },
    { en: 'Clean windows', ru: 'Помыть окна' },
    { en: 'Wipe switches & outlets', ru: 'Протереть выключатели' },
  ]},
  { en: 'Kitchen', ru: 'Кухня', tasks: [
    { en: 'Clean countertops', ru: 'Протереть столешницы' },
    { en: 'Clean stove & oven', ru: 'Помыть плиту и духовку' },
    { en: 'Clean refrigerator', ru: 'Помыть холодильник' },
    { en: 'Wash dishes / check dishwasher', ru: 'Помыть посуду / проверить посудомойку' },
    { en: 'Empty trash', ru: 'Вынести мусор' },
  ]},
  { en: 'Bedroom', ru: 'Спальня', tasks: [
    { en: 'Change linens', ru: 'Сменить бельё' },
    { en: 'Vacuum/Mop floors', ru: 'Пропылесосить/помыть полы' },
    { en: 'Dust furniture', ru: 'Протереть мебель' },
  ]},
  { en: 'Bathroom', ru: 'Ванная', tasks: [
    { en: 'Clean toilet', ru: 'Помыть унитаз' },
    { en: 'Clean shower/bathtub', ru: 'Помыть душ/ванну' },
    { en: 'Clean sink & mirror', ru: 'Помыть раковину и зеркало' },
    { en: 'Replace towels', ru: 'Заменить полотенца' },
    { en: 'Restock toiletries', ru: 'Пополнить косметику' },
  ]},
  { en: 'Balcony/Terrace', ru: 'Балкон/Терраса', tasks: [
    { en: 'Sweep floor', ru: 'Подмести пол' },
    { en: 'Wipe furniture', ru: 'Протереть мебель' },
  ]},
];

export default function DocumentTemplatesPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const { allProperties } = useMyProperties();
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [autoFillPropertyId, setAutoFillPropertyId] = useState('');

  // Fetch inventory for autofill
  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory-for-doc', autoFillPropertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_inventory_items')
        .select('*')
        .eq('property_id', autoFillPropertyId)
        .eq('is_active', true)
        .order('category');
      if (error) throw error;
      return data;
    },
    enabled: !!autoFillPropertyId && !!selectedTemplate?.autoFillFrom,
  });

  const fillTemplate = (template: DocumentTemplate) => {
    const body = isRu ? template.bodyRu : template.bodyEn;
    return body.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || `[${key}]`);
  };

  const handleExportPdf = async () => {
    if (!selectedTemplate) return;
    const filled = fillTemplate(selectedTemplate);
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    const title = isRu ? selectedTemplate.nameRu : selectedTemplate.nameEn;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Header with brand
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255);
    doc.setFontSize(14);
    doc.text('myUNO', 15, 12);
    doc.setFontSize(9);
    doc.text(title, pageW - 15, 12, { align: 'right' });

    // Body
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(filled, pageW - 30);
    let y = 28;
    doc.text(lines, 15, y);
    y += lines.length * 5;

    // Add table for inventory/cleaning templates
    if (selectedTemplate.hasTable && selectedTemplate.id === 'inventory_list' && inventoryItems?.length) {
      y += 5;
      (doc as any).autoTable({
        startY: y,
        head: [[isRu ? '№' : '#', isRu ? 'Название' : 'Name', isRu ? 'Категория' : 'Category', isRu ? 'Кол-во' : 'Qty', isRu ? 'Состояние' : 'Condition']],
        body: inventoryItems.map((item, i) => [
          i + 1,
          isRu && item.name_ru ? item.name_ru : item.name,
          item.category,
          item.quantity ?? 0,
          item.condition || 'good',
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59] },
        theme: 'grid',
      });
    }

    if (selectedTemplate.hasTable && selectedTemplate.id === 'cleaning_checklist') {
      y += 5;
      const rows: any[] = [];
      CLEANING_ROOMS.forEach(room => {
        room.tasks.forEach((task, i) => {
          rows.push([
            i === 0 ? (isRu ? room.ru : room.en) : '',
            isRu ? task.ru : task.en,
            '☐',
          ]);
        });
      });
      (doc as any).autoTable({
        startY: y,
        head: [[isRu ? 'Комната' : 'Room', isRu ? 'Задача' : 'Task', isRu ? 'Готово' : 'Done']],
        body: rows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59] },
        theme: 'grid',
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { cellWidth: 20, halign: 'center' } },
      });
    }

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Generated by myUNO  |  Page ${i}/${totalPages}`, pageW / 2, pageH - 8, { align: 'center' });
    }

    doc.save(`${selectedTemplate.id}-${Date.now()}.pdf`);
  };

  const handleSelectTemplate = (t: DocumentTemplate) => {
    setSelectedTemplate(t);
    setValues({});
    setPreviewMode(false);
    setAutoFillPropertyId('');
  };

  const needsPropertySelect = selectedTemplate?.autoFillFrom;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold">{isRu ? 'Шаблоны документов' : 'Document Templates'}</h1>
      <p className="text-sm text-muted-foreground">
        {isRu ? '8 шаблонов с профессиональным PDF-экспортом' : '8 templates with professional PDF export'}
      </p>

      <div className="space-y-3">
        {TEMPLATES.map(t => (
          <Card
            key={t.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
            onClick={() => handleSelectTemplate(t)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-foreground/70" />
                </div>
                <div>
                  <p className="font-medium text-sm">{isRu ? t.nameRu : t.nameEn}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? t.descRu : t.descEn}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {t.hasTable && <Badge variant="secondary" className="text-[10px]">📊</Badge>}
                <Badge variant="outline" className="text-[10px]">
                  {CATEGORY_LABELS[t.category] ? (isRu ? CATEGORY_LABELS[t.category].ru : CATEGORY_LABELS[t.category].en) : t.category}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={!!selectedTemplate} onOpenChange={(open) => { if (!open) setSelectedTemplate(null); }}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <SheetHeader>
                <SheetTitle>{isRu ? selectedTemplate.nameRu : selectedTemplate.nameEn}</SheetTitle>
              </SheetHeader>

              {!previewMode ? (
                <div className="space-y-4 mt-4">
                  {needsPropertySelect && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2 border border-border">
                      <Label className="text-xs font-semibold">
                        {isRu ? '🏠 Автозаполнение из инвентаря' : '🏠 Auto-fill from inventory'}
                      </Label>
                      <Select value={autoFillPropertyId} onValueChange={setAutoFillPropertyId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
                        </SelectTrigger>
                        <SelectContent>
                          {allProperties.map(p => (
                            <SelectItem key={p.property_id} value={p.property_id}>
                              {isRu ? p.title_ru : p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {inventoryItems && inventoryItems.length > 0 && (
                        <p className="text-xs text-green-600">
                          ✓ {inventoryItems.length} {isRu ? 'предметов загружено' : 'items loaded'}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Заполните поля для подстановки в документ:' : 'Fill in the fields to populate the document:'}
                  </p>
                  {selectedTemplate.variables.map(v => (
                    <div key={v}>
                      <Label>{VARIABLE_LABELS[v] ? (isRu ? VARIABLE_LABELS[v].ru : VARIABLE_LABELS[v].en) : v}</Label>
                      {v === 'condition_notes' || v === 'service_description' || v === 'damage_details' || v === 'deductions_details' ? (
                        <Textarea
                          value={values[v] || ''}
                          onChange={e => setValues({ ...values, [v]: e.target.value })}
                          rows={3}
                        />
                      ) : (
                        <Input
                          value={values[v] || ''}
                          onChange={e => setValues({ ...values, [v]: e.target.value })}
                          type={v.includes('date') || v.includes('from') || v.includes('until') ? 'date' : 'text'}
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => setPreviewMode(true)}>
                      <Eye className="h-4 w-4 mr-1" />
                      {isRu ? 'Предпросмотр' : 'Preview'}
                    </Button>
                    <Button variant="outline" onClick={handleExportPdf}>
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm font-mono leading-relaxed border border-border">
                    {fillTemplate(selectedTemplate)}
                  </div>
                  {selectedTemplate.hasTable && selectedTemplate.id === 'inventory_list' && inventoryItems?.length ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left">#</th>
                            <th className="p-2 text-left">{isRu ? 'Название' : 'Name'}</th>
                            <th className="p-2 text-left">{isRu ? 'Кат.' : 'Cat.'}</th>
                            <th className="p-2 text-right">{isRu ? 'Кол.' : 'Qty'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryItems.map((item, i) => (
                            <tr key={item.id} className="border-t">
                              <td className="p-2">{i + 1}</td>
                              <td className="p-2">{isRu && item.name_ru ? item.name_ru : item.name}</td>
                              <td className="p-2">{item.category}</td>
                              <td className="p-2 text-right">{item.quantity ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  {selectedTemplate.hasTable && selectedTemplate.id === 'cleaning_checklist' && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left">{isRu ? 'Комната' : 'Room'}</th>
                            <th className="p-2 text-left">{isRu ? 'Задача' : 'Task'}</th>
                            <th className="p-2 text-center">✓</th>
                          </tr>
                        </thead>
                        <tbody>
                          {CLEANING_ROOMS.map(room =>
                            room.tasks.map((task, i) => (
                              <tr key={`${room.en}-${i}`} className="border-t">
                                <td className="p-2 font-medium">{i === 0 ? (isRu ? room.ru : room.en) : ''}</td>
                                <td className="p-2">{isRu ? task.ru : task.en}</td>
                                <td className="p-2 text-center">☐</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setPreviewMode(false)}>
                      {isRu ? '← Редактировать' : '← Edit'}
                    </Button>
                    <Button onClick={handleExportPdf}>
                      <Download className="h-4 w-4 mr-1" />
                      {isRu ? 'Скачать PDF' : 'Download PDF'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
