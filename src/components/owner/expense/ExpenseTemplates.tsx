import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateFinancial, EXPENSE_CATEGORIES } from '@/hooks/usePropertyFinancials';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface Template {
  id: string; icon: string; labelRu: string; labelEn: string; category: string;
  amount: number; descriptionRu: string; descriptionEn: string; paymentMethod: string;
}

const TEMPLATES: Template[] = [
  { id: 'electricity', icon: '⚡', labelRu: 'Электричество', labelEn: 'Electricity', category: 'electricity', amount: 2000, descriptionRu: 'Оплата за электроэнергию', descriptionEn: 'Monthly electricity payment', paymentMethod: 'bank_transfer' },
  { id: 'water', icon: '💧', labelRu: 'Вода', labelEn: 'Water', category: 'water', amount: 500, descriptionRu: 'Оплата за водоснабжение', descriptionEn: 'Monthly water bill', paymentMethod: 'bank_transfer' },
  { id: 'internet', icon: '📶', labelRu: 'Интернет/ТВ', labelEn: 'Internet/TV', category: 'internet', amount: 600, descriptionRu: 'Абонентская плата интернет', descriptionEn: 'Monthly internet subscription', paymentMethod: 'bank_transfer' },
  { id: 'cleaning', icon: '🧹', labelRu: 'Уборка', labelEn: 'Cleaning', category: 'cleaning', amount: 1500, descriptionRu: 'Плановая уборка', descriptionEn: 'Regular cleaning service', paymentMethod: 'cash' },
  { id: 'management_fee', icon: '🏢', labelRu: 'Комиссия УК', labelEn: 'Management Fee', category: 'management_fee', amount: 5000, descriptionRu: 'Комиссия управляющей компании', descriptionEn: 'Management company fee', paymentMethod: 'bank_transfer' },
  { id: 'insurance', icon: '🛡️', labelRu: 'Страховка', labelEn: 'Insurance', category: 'insurance', amount: 3000, descriptionRu: 'Страховой взнос', descriptionEn: 'Insurance premium', paymentMethod: 'bank_transfer' },
];

interface ExpenseTemplatesProps {
  propertyId: string;
  onApplied?: () => void;
}

export function ExpenseTemplates({ propertyId, onApplied }: ExpenseTemplatesProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const createFinancial = useCreateFinancial();
  const [applied, setApplied] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleApply = async (template: Template) => {
    if (!propertyId) { toast.error(isRu ? 'Выберите объект' : 'Select a property'); return; }
    setApplied(template.id);
    try {
      await createFinancial.mutateAsync({
        property_id: propertyId, transaction_type: 'expense', amount: template.amount,
        currency: 'THB', category: template.category,
        description: isRu ? template.descriptionRu : template.descriptionEn,
        payment_method: template.paymentMethod, transaction_date: format(new Date(), 'yyyy-MM-dd'), status: 'completed',
      });
      toast.success(isRu ? `Расход "${template.labelRu}" добавлен` : `Expense "${template.labelEn}" added`);
      onApplied?.();
    } catch { /* errors surfaced via toast */ } finally { setApplied(null); }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Zap className="h-4 w-4 text-warning" />
        {isRu ? 'Шаблоны' : 'Templates'}
      </Button>

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title={isRu ? 'Шаблоны расходов' : 'Expense Templates'}
        description={isRu ? 'Нажмите — расход записывается одним касанием' : 'Tap to record the expense with one touch'}
        icon={<Zap className="w-5 h-5 text-warning" />}
        size="md"
      >
        <div className="grid grid-cols-1 gap-3">
          {TEMPLATES.map((template) => (
            <div key={template.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div>
                  <p className="font-medium text-sm">{isRu ? template.labelRu : template.labelEn}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? template.descriptionRu : template.descriptionEn}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-xs">฿{template.amount.toLocaleString()}</Badge>
                <Button size="sm" variant={applied === template.id ? 'default' : 'outline'} className="h-8 w-8 p-0"
                  disabled={applied === template.id || createFinancial.isPending}
                  onClick={() => handleApply(template)}>
                  {applied === template.id ? <Check className="h-4 w-4" /> : <span className="text-xs">+</span>}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-muted-foreground">
          {isRu ? 'Суммы можно изменить в транзакции после создания' : 'Amounts can be edited in the transaction after creation'}
        </p>
      </ResponsiveModal>
    </>
  );
}
