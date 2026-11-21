import { useId, useRef, useState } from 'react';
import type { Language } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pickLang } from '@/lib/i18n/pickLang';
import { INSTALLMENT_MILESTONES, projectInstallmentDraftExport, readProjectInstallmentTemplate, type InstallmentDraftStep, type InstallmentEvent } from '@/lib/real-estate/projectInstallmentTemplate';

type Copy = { en: string; ru: string; th: string };
const events: Record<InstallmentEvent, Copy> = {
  reservation: { en: 'Reservation', ru: 'Резервирование', th: 'การจอง' },
  contract: { en: 'Contract signing', ru: 'Подписание договора', th: 'ลงนามสัญญา' },
  construction: { en: 'Construction milestone', ru: 'Этап строительства', th: 'ขั้นตอนการก่อสร้าง' },
  handover: { en: 'Handover', ru: 'Передача объекта', th: 'ส่งมอบ' },
  date: { en: 'Specific date', ru: 'Конкретная дата', th: 'วันที่ระบุ' },
};

const emptyStep = (): InstallmentDraftStep => ({ event: 'contract', percent: '', date: '' });

export function ProjectInstallmentDraft({ language, projectId, currentTemplate }: { language: Language; projectId?: string; currentTemplate?: unknown }) {
  const t = (copy: Copy) => pickLang(language, copy);
  const base = useId();
  const [initial] = useState(() => readProjectInstallmentTemplate(currentTemplate));
  const [steps, setSteps] = useState(() => (initial.steps.length ? initial.steps : [emptyStep()]).map((step, key) => ({ ...step, key })));
  const nextStepKey = useRef(steps.length);
  const [attempted, setAttempted] = useState(false);
  const result = projectInstallmentDraftExport(steps, projectId);
  const error = result.ok === true ? null : {
    step_count: t({ en: 'Enter 1–12 installments.', ru: 'Добавьте от 1 до 12 взносов.', th: 'ระบุงวดชำระ 1–12 งวด' }),
    invalid_step: t({ en: 'Check the percentage and date in the highlighted installment.', ru: 'Проверьте процент и дату в выделенном взносе.', th: 'ตรวจสอบเปอร์เซ็นต์และวันที่ในงวดที่ระบุ' }),
    invalid_total: t({ en: 'Installments must add up to exactly 100%.', ru: 'Сумма взносов должна быть ровно 100%.', th: 'ยอดรวมทุกงวดต้องเท่ากับ 100%' }),
    date_order: t({ en: 'Put dated installments in chronological order.', ru: 'Расположите взносы с датами в хронологическом порядке.', th: 'เรียงงวดชำระที่มีวันที่ตามลำดับเวลา' }),
  }[result.code];
  const invalidRow = attempted && result.ok === false ? result.row : undefined;

  const update = (key: number, patch: Partial<InstallmentDraftStep>) =>
    setSteps(list => list.map(step => step.key === key ? { ...step, ...patch } : step));

  function addStep() {
    const step = { ...emptyStep(), key: nextStepKey.current++ };
    setSteps(list => [...list, step]);
  }

  function exportDraft() {
    setAttempted(true);
    if (result.ok === false) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result.payload, null, 2) + '\n'], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'myuno-installment-draft.json';
    link.click();
    const revoke = URL.revokeObjectURL.bind(URL);
    setTimeout(() => revoke(url), 0);
  }

  return <section className="space-y-4" aria-labelledby={`${base}-title`}>
    <h3 id={`${base}-title`} className="text-base font-semibold">{t({ en: 'Installment draft', ru: 'Черновик рассрочки', th: 'ร่างแผนผ่อนชำระ' })}</h3>
    <p className="text-sm text-muted-foreground">{t({
      en: 'For operator review only. Downloading does not save the project, publish terms or create a payment.',
      ru: 'Только для проверки оператором. Скачивание не сохраняет проект, не публикует условия и не создаёт платёж.',
      th: 'สำหรับเจ้าหน้าที่ตรวจสอบเท่านั้น การดาวน์โหลดจะไม่บันทึกโครงการ ไม่เผยแพร่เงื่อนไข และไม่สร้างการชำระเงิน',
    })}</p>
    {initial.kind === 'legacy' && <p className="text-sm text-muted-foreground">{t({
      en: 'Existing terms use another format. This draft does not read, replace or convert them.',
      ru: 'У прежних условий другой формат. Черновик не читает, не заменяет и не преобразует их.',
      th: 'เงื่อนไขเดิมอยู่ในรูปแบบอื่น ร่างนี้จะไม่อ่าน แทนที่ หรือแปลงข้อมูลดังกล่าว',
    })}</p>}
    {steps.map((step, index) => {
      const id = `${base}-${step.key}`;
      return <fieldset key={step.key} className="min-w-0 space-y-3 border border-border p-3">
        <legend className="px-1 text-sm font-medium">{t({ en: 'Installment', ru: 'Взнос', th: 'งวดชำระ' })} {index + 1}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-1">
            <Label htmlFor={`${id}-event`}>{t({ en: 'When due', ru: 'Срок', th: 'กำหนดชำระ' })}</Label>
            <select id={`${id}-event`} value={step.event} className="min-h-11 w-full min-w-0 border border-input bg-background px-2 text-sm"
              onChange={event => update(step.key, { event: event.target.value as InstallmentEvent, date: '' })}>
              {[...INSTALLMENT_MILESTONES, 'date' as const].map(value => <option key={value} value={value}>{t(events[value])}</option>)}
            </select>
          </div>
          <div className="min-w-0 space-y-1">
            <Label htmlFor={`${id}-percent`}>{t({ en: 'Share, %', ru: 'Доля, %', th: 'สัดส่วน %' })}</Label>
            <Input id={`${id}-percent`} inputMode="decimal" maxLength={6} value={step.percent} className="min-h-11"
              aria-invalid={invalidRow === index || undefined} onChange={event => update(step.key, { percent: event.target.value })} />
          </div>
          {step.event === 'date' && <div className="min-w-0 space-y-1">
            <Label htmlFor={`${id}-date`}>{t({ en: 'Due date', ru: 'Дата взноса', th: 'วันที่ชำระ' })}</Label>
            <Input id={`${id}-date`} type="date" value={step.date} className="min-h-11"
              aria-invalid={invalidRow === index || undefined} onChange={event => update(step.key, { date: event.target.value })} />
          </div>}
        </div>
        <Button type="button" variant="outline" disabled={steps.length === 1} onClick={() => setSteps(list => list.filter(item => item.key !== step.key))}>
          {t({ en: 'Remove installment', ru: 'Убрать взнос', th: 'ลบงวดชำระ' })} {index + 1}
        </Button>
      </fieldset>;
    })}
    {attempted && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" disabled={steps.length >= 12} onClick={addStep}>
        {t({ en: 'Add installment', ru: 'Добавить взнос', th: 'เพิ่มงวดชำระ' })}
      </Button>
      <Button type="button" onClick={exportDraft}>{t({ en: 'Download draft', ru: 'Скачать черновик', th: 'ดาวน์โหลดร่าง' })}</Button>
    </div>
  </section>;
}
