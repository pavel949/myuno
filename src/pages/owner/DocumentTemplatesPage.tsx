import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';

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
};

const CATEGORY_LABELS: Record<string, { en: string; ru: string }> = {
  rental: { en: 'Rental', ru: 'Аренда' },
  operations: { en: 'Operations', ru: 'Операции' },
  legal: { en: 'Legal', ru: 'Юридическое' },
};

export default function DocumentTemplatesPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);

  const fillTemplate = (template: DocumentTemplate) => {
    const body = isRu ? template.bodyRu : template.bodyEn;
    return body.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || `[${key}]`);
  };

  const handleExportPdf = () => {
    if (!selectedTemplate) return;
    const filled = fillTemplate(selectedTemplate);
    const doc = new jsPDF();
    const title = isRu ? selectedTemplate.nameRu : selectedTemplate.nameEn;

    doc.setFontSize(16);
    doc.text(title, 20, 20);
    doc.setFontSize(10);

    const lines = doc.splitTextToSize(filled, 170);
    doc.text(lines, 20, 35);

    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('Generated by myUNO', 105, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    doc.save(`${selectedTemplate.id}-${Date.now()}.pdf`);
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold">{isRu ? 'Шаблоны документов' : 'Document Templates'}</h1>
      <p className="text-sm text-muted-foreground">
        {isRu ? 'Выберите шаблон, заполните переменные и скачайте PDF' : 'Choose a template, fill in variables, and download PDF'}
      </p>

      <div className="space-y-3">
        {TEMPLATES.map(t => (
          <Card
            key={t.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
            onClick={() => { setSelectedTemplate(t); setValues({}); setPreviewMode(false); }}
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
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Заполните поля для подстановки в документ:' : 'Fill in the fields to populate the document:'}
                  </p>
                  {selectedTemplate.variables.map(v => (
                    <div key={v}>
                      <Label>{VARIABLE_LABELS[v] ? (isRu ? VARIABLE_LABELS[v].ru : VARIABLE_LABELS[v].en) : v}</Label>
                      {v === 'condition_notes' || v === 'service_description' ? (
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
