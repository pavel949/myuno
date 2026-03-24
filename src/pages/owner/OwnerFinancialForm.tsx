import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { 
  usePropertyFinancialsFull,
  useCreateFinancial, 
  useUpdateFinancial,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  PropertyFinancialFull
} from '@/hooks/usePropertyFinancials';
import { useStaffMembers } from '@/hooks/useStaffMembers';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowUpCircle, ArrowDownCircle, Building, Calendar,
  DollarSign, Receipt, Save, Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export default function OwnerFinancialForm() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRu = language === 'ru';
  const isEditing = !!id;

  const { allProperties } = useMyProperties();
  const properties = allProperties.map(p => ({ ...p, id: p.property_id }));
  const { data: financials } = usePropertyFinancialsFull();
  const { data: staffList } = useStaffMembers();
  const createFinancial = useCreateFinancial();
  const updateFinancial = useUpdateFinancial();

  const existingItem = financials?.find(f => f.id === id);

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [formData, setFormData] = useState({
    property_id: '',
    category: '',
    amount: '',
    currency: 'THB',
    description: '',
    description_ru: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: '',
    tax_deductible: false,
    recurring: false,
    recurring_interval: '',
    status: 'completed',
    vendor_name: '',
    invoice_number: '',
    notes: '',
    cost_source: 'external' as 'internal' | 'external' | 'mixed',
    staff_member_id: '',
  });

  useEffect(() => {
    if (existingItem) {
      setTransactionType(existingItem.transaction_type as 'income' | 'expense');
      setFormData({
        property_id: existingItem.property_id || '',
        category: existingItem.category || '',
        amount: existingItem.amount.toString(),
        currency: existingItem.currency || 'THB',
        description: existingItem.description || '',
        description_ru: existingItem.description_ru || '',
        transaction_date: existingItem.transaction_date.split('T')[0],
        payment_method: existingItem.payment_method || '',
        tax_deductible: existingItem.tax_deductible || false,
        recurring: existingItem.recurring || false,
        recurring_interval: existingItem.recurring_interval || '',
        status: existingItem.status || 'completed',
        vendor_name: existingItem.vendor_name || '',
        invoice_number: existingItem.invoice_number || '',
        notes: existingItem.notes || '',
        cost_source: ((existingItem as any).cost_source || 'external') as 'internal' | 'external' | 'mixed',
        staff_member_id: (existingItem as any).staff_member_id || '',
      });
    }
  }, [existingItem]);

  const categories = transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.property_id || !formData.amount) {
      return;
    }

    // Clean empty strings to null for optional fields
    const payload: Record<string, any> = {
      property_id: formData.property_id,
      transaction_type: transactionType,
      amount: parseFloat(formData.amount),
      currency: formData.currency || 'THB',
      transaction_date: formData.transaction_date,
      category: formData.category || null,
      description: formData.description || null,
      description_ru: formData.description_ru || null,
      payment_method: formData.payment_method || null,
      tax_deductible: formData.tax_deductible,
      recurring: formData.recurring,
      recurring_interval: formData.recurring_interval || null,
      status: formData.status || 'completed',
      vendor_name: formData.vendor_name || null,
      invoice_number: formData.invoice_number || null,
      notes: formData.notes || null,
      cost_source: transactionType === 'expense' ? formData.cost_source : undefined,
      staff_member_id: (transactionType === 'expense' && formData.cost_source === 'internal' && formData.staff_member_id)
        ? formData.staff_member_id
        : null,
    };

    try {
      if (isEditing && id) {
        await updateFinancial.mutateAsync({ id, ...payload });
      } else {
        await createFinancial.mutateAsync(payload);
      }
      navigate('/mc/financials');
    } catch (error) {
      console.error('Error saving financial:', error);
    }
  };

  const isPending = createFinancial.isPending || updateFinancial.isPending;

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <PageContainer>
      <BackButton fallbackPath="/mc/financials" />
      <PageHeader 
        title={isEditing 
          ? (isRu ? 'Редактировать транзакцию' : 'Edit Transaction')
          : (isRu ? 'Новая транзакция' : 'New Transaction')
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type */}
        <Tabs value={transactionType} onValueChange={(v) => {
          setTransactionType(v as 'income' | 'expense');
          setFormData(prev => ({ ...prev, category: '' }));
        }}>
          <TabsList className="w-full">
            <TabsTrigger value="income" className="flex-1">
              <ArrowUpCircle className="h-4 w-4 mr-2 text-success" />
              {isRu ? 'Доход' : 'Income'}
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex-1">
              <ArrowDownCircle className="h-4 w-4 mr-2 text-destructive" />
              {isRu ? 'Расход' : 'Expense'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Property Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              {isRu ? 'Объект' : 'Property'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={formData.property_id} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, property_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
              </SelectTrigger>
              <SelectContent>
                {properties?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {isRu && p.title_ru ? p.title_ru : p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Amount & Category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {isRu ? 'Сумма и категория' : 'Amount & Category'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Сумма' : 'Amount'}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">฿ THB</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="RUB">₽ RUB</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Категория' : 'Category'}</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRu ? 'Выберите категорию' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {isRu ? cat.labelRu : cat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Дата' : 'Date'}</Label>
              <Input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              {isRu ? 'Детали' : 'Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Описание' : 'Description'}</Label>
              <Input
                placeholder={isRu ? 'Краткое описание' : 'Brief description'}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Способ оплаты' : 'Payment Method'}</Label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {isRu ? m.labelRu : m.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Статус' : 'Status'}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">{isRu ? 'Оплачено' : 'Completed'}</SelectItem>
                    <SelectItem value="pending">{isRu ? 'Ожидает' : 'Pending'}</SelectItem>
                    <SelectItem value="overdue">{isRu ? 'Просрочено' : 'Overdue'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            {transactionType === 'expense' && (
              <>
                {/* Cost Source: internal staff vs external vendor */}
                <div className="space-y-2">
                  <Label>{isRu ? 'Источник расхода' : 'Cost Source'}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'external', labelRu: 'Внешний поставщик', labelEn: 'External Vendor' },
                      { value: 'internal', labelRu: 'Штатный сотрудник', labelEn: 'Internal Staff' },
                      { value: 'mixed', labelRu: 'Смешанный', labelEn: 'Mixed' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cost_source: opt.value, staff_member_id: '' }))}
                        className={`rounded-xl border p-2 text-xs font-medium transition-colors ${
                          formData.cost_source === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {isRu ? opt.labelRu : opt.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* If internal — pick staff member */}
                {formData.cost_source === 'internal' && staffList && staffList.length > 0 && (
                  <div className="space-y-2">
                    <Label>{isRu ? 'Сотрудник' : 'Staff Member'}</Label>
                    <Select
                      value={formData.staff_member_id}
                      onValueChange={v => setFormData(prev => ({ ...prev, staff_member_id: v, vendor_name: '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isRu ? 'Выберите сотрудника' : 'Select staff'} />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* If external — show vendor name */}
                {formData.cost_source !== 'internal' && (
                  <div className="space-y-2">
                    <Label>{isRu ? 'Поставщик/Исполнитель' : 'Vendor Name'}</Label>
                    <Input
                      placeholder={isRu ? 'Название компании или ФИО' : 'Company or person name'}
                      value={formData.vendor_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendor_name: e.target.value }))}
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>{isRu ? 'Номер счёта/чека' : 'Invoice Number'}</Label>
              <Input
                placeholder={isRu ? 'Опционально' : 'Optional'}
                value={formData.invoice_number}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
              <Textarea
                placeholder={isRu ? 'Дополнительная информация' : 'Additional information'}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{isRu ? 'Налоговый вычет' : 'Tax Deductible'}</Label>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Учитывать при расчёте налогов' : 'Consider for tax calculations'}
                </p>
              </div>
              <Switch
                checked={formData.tax_deductible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tax_deductible: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{isRu ? 'Регулярный платёж' : 'Recurring'}</Label>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Повторяется периодически' : 'Repeats periodically'}
                </p>
              </div>
              <Switch
                checked={formData.recurring}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recurring: checked }))}
              />
            </div>

            {formData.recurring && (
              <div className="space-y-2">
                <Label>{isRu ? 'Интервал' : 'Interval'}</Label>
                <Select 
                  value={formData.recurring_interval} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, recurring_interval: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{isRu ? 'Ежемесячно' : 'Monthly'}</SelectItem>
                    <SelectItem value="quarterly">{isRu ? 'Ежеквартально' : 'Quarterly'}</SelectItem>
                    <SelectItem value="yearly">{isRu ? 'Ежегодно' : 'Yearly'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isEditing 
            ? (isRu ? 'Сохранить изменения' : 'Save Changes')
            : (isRu ? 'Добавить транзакцию' : 'Add Transaction')
          }
        </Button>
      </form>
    </PageContainer>
  );
}
