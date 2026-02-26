/**
 * AdminSettingsStep — Admin-only fields: status, moderation, commission, investment data
 */
import React, { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Star, Percent, Landmark, Calendar } from 'lucide-react';

interface AdminSettingsData {
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  approval_status?: string;
  rejection_reason?: string;
  commission_rate?: number;
  notes?: string;
  // Investment
  purchase_price?: number;
  purchase_date?: string;
  purchase_currency?: string;
  acquisition_costs?: number;
  mortgage_amount?: number;
  mortgage_bank?: string;
  mortgage_interest_rate?: number;
  mortgage_monthly_payment?: number;
  chanote_number?: string;
  // iCal
  ical_export_enabled?: boolean;
}

interface AdminSettingsStepProps {
  data: AdminSettingsData;
  onChange: (updates: Partial<AdminSettingsData>) => void;
}

export const AdminSettingsStep = memo(function AdminSettingsStep({ data, onChange }: AdminSettingsStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-4">
      {/* Status & Moderation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {isRu ? 'Статус и модерация' : 'Status & Moderation'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'Активен' : 'Active'}</Label>
            <Switch checked={data.is_active ?? true} onCheckedChange={v => onChange({ is_active: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'Рекомендуемый' : 'Featured'}</Label>
            <Switch checked={data.is_featured ?? false} onCheckedChange={v => onChange({ is_featured: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'Верифицирован' : 'Verified'}</Label>
            <Switch checked={data.is_verified ?? false} onCheckedChange={v => onChange({ is_verified: v })} />
          </div>
          <div>
            <Label className="text-xs">{isRu ? 'Статус модерации' : 'Approval status'}</Label>
            <Select value={data.approval_status || 'pending'} onValueChange={v => onChange({ approval_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{isRu ? 'На модерации' : 'Pending'}</SelectItem>
                <SelectItem value="approved">{isRu ? 'Одобрен' : 'Approved'}</SelectItem>
                <SelectItem value="rejected">{isRu ? 'Отклонён' : 'Rejected'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {data.approval_status === 'rejected' && (
            <div>
              <Label className="text-xs">{isRu ? 'Причина отказа' : 'Rejection reason'}</Label>
              <Textarea
                rows={2}
                value={data.rejection_reason ?? ''}
                onChange={e => onChange({ rejection_reason: e.target.value })}
              />
            </div>
          )}
          <div>
            <Label className="text-xs">{isRu ? 'Заметки (внутренние)' : 'Notes (internal)'}</Label>
            <Textarea
              rows={2}
              value={data.notes ?? ''}
              onChange={e => onChange({ notes: e.target.value })}
              placeholder={isRu ? 'Только для администраторов...' : 'Admin-only notes...'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Commission */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Percent className="h-4 w-4 text-success" />
            {isRu ? 'Комиссия платформы' : 'Platform Commission'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-xs">{isRu ? 'Ставка комиссии (%)' : 'Commission rate (%)'}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={data.commission_rate ?? ''}
              onChange={e => onChange({ commission_rate: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Investment Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Landmark className="h-4 w-4 text-warning" />
            {isRu ? 'Инвестиционные данные' : 'Investment Data'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Цена покупки' : 'Purchase price'}</Label>
              <Input
                type="number"
                value={data.purchase_price ?? ''}
                onChange={e => onChange({ purchase_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Валюта' : 'Currency'}</Label>
              <Select value={data.purchase_currency || 'THB'} onValueChange={v => onChange({ purchase_currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['THB', 'USD', 'EUR', 'RUB', 'GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Дата покупки' : 'Purchase date'}</Label>
              <Input
                type="date"
                value={data.purchase_date ?? ''}
                onChange={e => onChange({ purchase_date: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Доп. расходы' : 'Acquisition costs'}</Label>
              <Input
                type="number"
                value={data.acquisition_costs ?? ''}
                onChange={e => onChange({ acquisition_costs: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">{isRu ? 'Номер Чанота' : 'Chanote number'}</Label>
            <Input
              value={data.chanote_number ?? ''}
              onChange={e => onChange({ chanote_number: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mortgage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-info" />
            {isRu ? 'Ипотека' : 'Mortgage'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Сумма ипотеки' : 'Mortgage amount'}</Label>
              <Input
                type="number"
                value={data.mortgage_amount ?? ''}
                onChange={e => onChange({ mortgage_amount: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Банк' : 'Bank'}</Label>
              <Input
                value={data.mortgage_bank ?? ''}
                onChange={e => onChange({ mortgage_bank: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Ставка (%)' : 'Interest rate (%)'}</Label>
              <Input
                type="number"
                step={0.01}
                value={data.mortgage_interest_rate ?? ''}
                onChange={e => onChange({ mortgage_interest_rate: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Ежемес. платёж' : 'Monthly payment'}</Label>
              <Input
                type="number"
                value={data.mortgage_monthly_payment ?? ''}
                onChange={e => onChange({ mortgage_monthly_payment: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* iCal */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'iCal экспорт' : 'iCal export'}</Label>
            <Switch
              checked={data.ical_export_enabled ?? false}
              onCheckedChange={v => onChange({ ical_export_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
