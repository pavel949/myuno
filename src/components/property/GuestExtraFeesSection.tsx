/**
 * GuestExtraFeesSection — host UI for configuring extra charges that the
 * guest pays separately from the nightly rate (electricity, water, internet,
 * cleaning, etc).
 *
 * Lives under "Payment & Deposit" in the canonical Pricing step. Persists to
 * `properties.guest_extra_fees` (jsonb).
 *
 * Public counterpart: `GuestExtraFeesDisplay` on the property detail page.
 */
import { memo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Receipt } from 'lucide-react';
import {
  GUEST_FEE_KIND_PRESETS,
  PAYMENT_MOMENT_LABELS,
  newEmptyFee,
  parseGuestExtraFees,
  type GuestExtraFee,
  type GuestFeeKind,
  type GuestFeePaymentMoment,
} from '@/lib/property/guestExtraFees';

interface GuestExtraFeesSectionProps {
  formData: { guest_extra_fees?: unknown };
  updateFormData: (updates: { guest_extra_fees: GuestExtraFee[] }) => void;
}

function GuestExtraFeesSectionInner({ formData, updateFormData }: GuestExtraFeesSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  const fees = parseGuestExtraFees(formData.guest_extra_fees);

  const setFees = useCallback(
    (next: GuestExtraFee[]) => updateFormData({ guest_extra_fees: next }),
    [updateFormData],
  );

  const updateOne = (id: string, patch: Partial<GuestExtraFee>) => {
    setFees(fees.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const remove = (id: string) => setFees(fees.filter((f) => f.id !== id));

  const addFee = (kind: GuestFeeKind) => setFees([...fees, newEmptyFee(kind)]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          {isRu ? 'Доп. оплаты гостя' : isTh ? 'ค่าใช้จ่ายเพิ่มเติมของผู้เข้าพัก' : 'Guest extra fees'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isRu
            ? 'Расходы, которые гость оплачивает отдельно от стоимости проживания (электричество по счётчику, вода, интернет, уборка). На странице объекта показывается список с ориентировочными суммами.'
            : isTh
            ? 'ค่าใช้จ่ายที่ผู้เข้าพักชำระแยกจากค่าที่พักรายคืน (ค่าไฟตามมิเตอร์ ค่าน้ำ อินเทอร์เน็ต ทำความสะอาด) หน้าอสังหาริมทรัพย์จะแสดงรายการพร้อมช่วงราคาโดยประมาณ'
            : 'Charges the guest pays separately from the nightly rate (metered electricity, water, internet, cleaning). The property page shows the list with estimate ranges.'}
        </p>

        {fees.length === 0 && (
          <div className="rounded-none border-2 border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            {isRu ? 'Доп. позиции не настроены' : isTh ? 'ยังไม่ได้ตั้งค่าใช้จ่ายเพิ่มเติม' : 'No extra fees configured'}
          </div>
        )}

        {fees.map((fee) => {
          const preset = GUEST_FEE_KIND_PRESETS[fee.kind];
          return (
            <div key={fee.id} className="rounded-none border border-border/60 p-3 space-y-3 bg-card/40">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base">{preset.icon}</span>
                  <Select
                    value={fee.kind}
                    onValueChange={(v) =>
                      updateOne(fee.id, {
                        kind: v as GuestFeeKind,
                        unit: GUEST_FEE_KIND_PRESETS[v as GuestFeeKind].defaultUnit,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(GUEST_FEE_KIND_PRESETS) as GuestFeeKind[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {GUEST_FEE_KIND_PRESETS[k].icon}{' '}
                          {isRu ? GUEST_FEE_KIND_PRESETS[k].labelRu : GUEST_FEE_KIND_PRESETS[k].labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(fee.id)}
                  aria-label={isRu ? 'Удалить' : isTh ? 'ลบ' : 'Remove'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Optional bilingual label override */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{isRu ? 'Название EN' : isTh ? 'ชื่อ EN' : 'Label EN'}</Label>
                  <Input
                    value={fee.label_en ?? ''}
                    onChange={(e) => updateOne(fee.id, { label_en: e.target.value })}
                    placeholder={preset.labelEn}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isRu ? 'Название RU' : isTh ? 'ชื่อ RU' : 'Label RU'}</Label>
                  <Input
                    value={fee.label_ru ?? ''}
                    onChange={(e) => updateOne(fee.id, { label_ru: e.target.value })}
                    placeholder={preset.labelRu}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Rate + unit + currency */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{isRu ? 'Тариф' : isTh ? 'อัตรา' : 'Rate'}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={fee.rate ?? ''}
                    onChange={(e) =>
                      updateOne(fee.id, { rate: e.target.value === '' ? null : Number(e.target.value) })
                    }
                    className="h-8 text-xs"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isRu ? 'Единица' : isTh ? 'หน่วย' : 'Unit'}</Label>
                  <Input
                    value={fee.unit ?? ''}
                    onChange={(e) => updateOne(fee.id, { unit: e.target.value })}
                    className="h-8 text-xs"
                    placeholder={preset.defaultUnit}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isRu ? 'Валюта' : isTh ? 'สกุลเงิน' : 'Currency'}</Label>
                  <Select
                    value={fee.currency ?? 'THB'}
                    onValueChange={(v) => updateOne(fee.id, { currency: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THB">฿ THB</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="EUR">€ EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estimate range — what the guest typically pays per booking */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{isRu ? 'Оценка от' : isTh ? 'ประมาณการต่ำสุด' : 'Estimate min'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={fee.estimate_min ?? ''}
                    onChange={(e) =>
                      updateOne(fee.id, {
                        estimate_min: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                    placeholder="—"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isRu ? 'Оценка до' : isTh ? 'ประมาณการสูงสุด' : 'Estimate max'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={fee.estimate_max ?? ''}
                    onChange={(e) =>
                      updateOne(fee.id, {
                        estimate_max: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                    placeholder="—"
                  />
                </div>
              </div>

              {/* When paid */}
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Когда оплачивается' : isTh ? 'ชำระเมื่อใด' : 'When paid'}</Label>
                <Select
                  value={fee.when_paid}
                  onValueChange={(v) => updateOne(fee.id, { when_paid: v as GuestFeePaymentMoment })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PAYMENT_MOMENT_LABELS) as GuestFeePaymentMoment[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {isRu ? PAYMENT_MOMENT_LABELS[m].labelRu : PAYMENT_MOMENT_LABELS[m].labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Optional bilingual notes */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{isRu ? 'Заметка EN' : isTh ? 'หมายเหตุ EN' : 'Notes EN'}</Label>
                  <Input
                    value={fee.notes_en ?? ''}
                    onChange={(e) => updateOne(fee.id, { notes_en: e.target.value })}
                    className="h-8 text-xs"
                    placeholder={isRu ? 'необязательно' : isTh ? 'ไม่บังคับ' : 'optional'}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isRu ? 'Заметка RU' : isTh ? 'หมายเหตุ RU' : 'Notes RU'}</Label>
                  <Input
                    value={fee.notes_ru ?? ''}
                    onChange={(e) => updateOne(fee.id, { notes_ru: e.target.value })}
                    className="h-8 text-xs"
                    placeholder={isRu ? 'необязательно' : isTh ? 'ไม่บังคับ' : 'optional'}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Quick-add buttons — Airbnb-style chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {(Object.keys(GUEST_FEE_KIND_PRESETS) as GuestFeeKind[]).map((k) => (
            <Button
              key={k}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => addFee(k)}
            >
              <Plus className="h-3 w-3" />
              <span>{GUEST_FEE_KIND_PRESETS[k].icon}</span>
              {isRu ? GUEST_FEE_KIND_PRESETS[k].labelRu : GUEST_FEE_KIND_PRESETS[k].labelEn}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const GuestExtraFeesSection = memo(GuestExtraFeesSectionInner);
