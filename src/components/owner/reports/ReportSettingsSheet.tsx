import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ReportConfig {
  sections: {
    income: boolean;
    expenses: boolean;
    netIncome: boolean;
    occupancy: boolean;
    bookings: boolean;
    maintenance: boolean;
    commission: boolean;
    utilities: boolean;
  };
  autoSend: {
    enabled: boolean;
    frequency: 'monthly' | 'quarterly';
    dayOfMonth: number;
    recipientEmails: string;
  };
  defaultType: 'monthly' | 'quarterly' | 'owner_statement' | 'pnl' | 'management';
  currency: 'THB' | 'USD' | 'EUR' | 'RUB';
}

const DEFAULT_CONFIG: ReportConfig = {
  sections: {
    income: true,
    expenses: true,
    netIncome: true,
    occupancy: true,
    bookings: true,
    maintenance: false,
    commission: true,
    utilities: false,
  },
  autoSend: {
    enabled: false,
    frequency: 'monthly',
    dayOfMonth: 5,
    recipientEmails: '',
  },
  defaultType: 'monthly',
  currency: 'THB',
};

const STORAGE_KEY = 'uno-report-config';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportSettingsSheet({ open, onOpenChange }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [config, setConfig] = useState<ReportConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const updateSection = (key: keyof ReportConfig['sections'], value: boolean) => {
    setConfig(prev => ({ ...prev, sections: { ...prev.sections, [key]: value } }));
  };

  const updateAutoSend = (key: keyof ReportConfig['autoSend'], value: any) => {
    setConfig(prev => ({ ...prev, autoSend: { ...prev.autoSend, [key]: value } }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    toast.success(isRu ? 'Настройки сохранены' : 'Settings saved');
    onOpenChange(false);
  };

  const sectionLabels: Record<keyof ReportConfig['sections'], { en: string; ru: string }> = {
    income: { en: 'Income breakdown', ru: 'Разбивка доходов' },
    expenses: { en: 'Expense breakdown', ru: 'Разбивка расходов' },
    netIncome: { en: 'Net income summary', ru: 'Итого чистый доход' },
    occupancy: { en: 'Occupancy rate', ru: 'Заполняемость' },
    bookings: { en: 'Booking details', ru: 'Детали бронирований' },
    maintenance: { en: 'Maintenance log', ru: 'Журнал обслуживания' },
    commission: { en: 'Management commission', ru: 'Комиссия УК' },
    utilities: { en: 'Utility costs', ru: 'Коммунальные расходы' },
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {isRu ? 'Настройки отчётов' : 'Report Settings'}
          </SheetTitle>
          <SheetDescription>
            {isRu
              ? 'Выберите разделы для включения и настройте автоматическую отправку'
              : 'Choose which sections to include and set up auto-delivery'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Report Sections */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              {isRu ? 'Разделы отчёта' : 'Report Sections'}
            </h3>
            <div className="space-y-3">
              {(Object.keys(config.sections) as Array<keyof ReportConfig['sections']>).map(key => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm">{isRu ? sectionLabels[key].ru : sectionLabels[key].en}</Label>
                  <Switch
                    checked={config.sections[key]}
                    onCheckedChange={(v) => updateSection(key, v)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Default Report Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {isRu ? 'Тип отчёта по умолчанию' : 'Default Report Type'}
            </Label>
            <Select value={config.defaultType} onValueChange={(v) => setConfig(prev => ({ ...prev, defaultType: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{isRu ? 'Ежемесячный' : 'Monthly'}</SelectItem>
                <SelectItem value="quarterly">{isRu ? 'Квартальный' : 'Quarterly'}</SelectItem>
                <SelectItem value="owner_statement">{isRu ? 'Отчёт собственнику' : 'Owner Statement'}</SelectItem>
                <SelectItem value="pnl">{isRu ? 'P&L' : 'P&L'}</SelectItem>
                <SelectItem value="management">{isRu ? 'Управленческий' : 'Management'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {isRu ? 'Валюта' : 'Currency'}
            </Label>
            <Select value={config.currency} onValueChange={(v) => setConfig(prev => ({ ...prev, currency: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">THB (฿)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="RUB">RUB (₽)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Auto-send */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {isRu ? 'Автоматическая отправка' : 'Auto-Send Reports'}
              </h3>
              <Switch
                checked={config.autoSend.enabled}
                onCheckedChange={(v) => updateAutoSend('enabled', v)}
              />
            </div>

            {config.autoSend.enabled && (
              <div className="space-y-3 pl-1">
                <div className="space-y-2">
                  <Label className="text-sm">{isRu ? 'Частота' : 'Frequency'}</Label>
                  <Select
                    value={config.autoSend.frequency}
                    onValueChange={(v) => updateAutoSend('frequency', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{isRu ? 'Ежемесячно' : 'Monthly'}</SelectItem>
                      <SelectItem value="quarterly">{isRu ? 'Ежеквартально' : 'Quarterly'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">{isRu ? 'День отправки' : 'Day of month'}</Label>
                  <Select
                    value={String(config.autoSend.dayOfMonth)}
                    onValueChange={(v) => updateAutoSend('dayOfMonth', Number(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 3, 5, 7, 10, 15].map(d => (
                        <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">{isRu ? 'Email получателей' : 'Recipient emails'}</Label>
                  <input
                    type="text"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="owner@example.com"
                    value={config.autoSend.recipientEmails}
                    onChange={(e) => updateAutoSend('recipientEmails', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Через запятую для нескольких адресов' : 'Comma-separated for multiple'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {isRu ? 'Сохранить настройки' : 'Save Settings'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
