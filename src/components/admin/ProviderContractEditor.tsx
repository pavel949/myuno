import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEntityContract, useProviderContracts, ContractInsert } from '@/hooks/useProviderContracts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FileText, 
  Save, 
  Loader2, 
  Percent, 
  Calendar,
  Building2,
  CreditCard,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

interface ProviderContractEditorProps {
  providerId: string;
  providerName?: string;
}

export function ProviderContractEditor({ providerId, providerName }: ProviderContractEditorProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
  const { data: existingContract, isLoading: contractLoading } = useEntityContract('provider', providerId);
  const { createContract, updateContract, isCreating, isUpdating } = useProviderContracts();
  
  const [formData, setFormData] = useState({
    commission_rate: 10,
    min_commission_amount: null as number | null,
    max_commission_amount: null as number | null,
    payment_terms: 'monthly',
    contract_type: 'standard',
    auto_renew: true,
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
  });
  
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form with existing contract data
  useEffect(() => {
    if (existingContract) {
      setFormData({
        commission_rate: existingContract.commission_rate || 10,
        min_commission_amount: existingContract.min_commission_amount ?? null,
        max_commission_amount: existingContract.max_commission_amount ?? null,
        payment_terms: existingContract.payment_terms || 'monthly',
        contract_type: existingContract.contract_type || 'standard',
        auto_renew: existingContract.auto_renew ?? true,
        bank_name: existingContract.bank_name || '',
        bank_account_number: existingContract.bank_account_number || '',
        bank_account_name: existingContract.bank_account_name || '',
      });
      setIsDirty(false);
    }
  }, [existingContract]);

  const handleChange = <K extends keyof typeof formData>(key: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const contractData = {
        commission_rate: formData.commission_rate,
        min_commission_amount: formData.min_commission_amount,
        max_commission_amount: formData.max_commission_amount,
        payment_terms: formData.payment_terms,
        contract_type: formData.contract_type,
        auto_renew: formData.auto_renew,
        bank_name: formData.bank_name || undefined,
        bank_account_number: formData.bank_account_number || undefined,
        bank_account_name: formData.bank_account_name || undefined,
      };

      if (existingContract) {
        await updateContract({ id: existingContract.id, data: contractData });
      } else {
        const newContract: ContractInsert = {
          entity_type: 'provider',
          entity_id: providerId,
          status: 'active', // Auto-activate for admin
          commission_type: 'percentage',
          valid_from: new Date().toISOString(),
          notice_period_days: 30,
          ...contractData,
        };
        await createContract(newContract);
      }
      
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  if (contractLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSaving = isCreating || isUpdating;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {isRussian ? 'Условия сотрудничества' : 'Collaboration Terms'}
            </CardTitle>
          </div>
          {existingContract && (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {isRussian ? 'Активен' : 'Active'}
            </Badge>
          )}
        </div>
        <CardDescription>
          {existingContract 
            ? (isRussian ? 'Редактирование условий контракта' : 'Edit contract terms')
            : (isRussian ? 'Создайте условия для этого провайдера' : 'Set up terms for this provider')
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Commission Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Percent className="h-4 w-4" />
            {isRussian ? 'Комиссия' : 'Commission'}
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{isRussian ? 'Ставка %' : 'Rate %'}</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.commission_rate}
                  onChange={(e) => handleChange('commission_rate', parseFloat(e.target.value) || 0)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">{isRussian ? 'Мин. ฿' : 'Min ฿'}</Label>
              <Input
                type="number"
                min={0}
                placeholder="—"
                value={formData.min_commission_amount ?? ''}
                onChange={(e) => handleChange('min_commission_amount', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">{isRussian ? 'Макс. ฿' : 'Max ฿'}</Label>
              <Input
                type="number"
                min={0}
                placeholder="—"
                value={formData.max_commission_amount ?? ''}
                onChange={(e) => handleChange('max_commission_amount', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Terms */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {isRussian ? 'Условия оплаты' : 'Payment Terms'}
          </div>
          
          <RadioGroup
            value={formData.payment_terms}
            onValueChange={(value) => handleChange('payment_terms', value)}
            className="flex flex-wrap gap-2"
          >
            {[
              { value: 'per_transaction', labelEn: 'Per Transaction', labelRu: 'За транзакцию' },
              { value: 'weekly', labelEn: 'Weekly', labelRu: 'Еженедельно' },
              { value: 'monthly', labelEn: 'Monthly', labelRu: 'Ежемесячно' },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center">
                <RadioGroupItem value={opt.value} id={`payment-${opt.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`payment-${opt.value}`}
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover px-3 py-2 text-sm font-medium cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:bg-accent hover:text-accent-foreground"
                >
                  {isRussian ? opt.labelRu : opt.labelEn}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Contract Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            {isRussian ? 'Тип контракта' : 'Contract Type'}
          </Label>
          
          <RadioGroup
            value={formData.contract_type}
            onValueChange={(value) => handleChange('contract_type', value)}
            className="flex flex-wrap gap-2"
          >
            {[
              { value: 'standard', labelEn: 'Standard', labelRu: 'Стандартный' },
              { value: 'exclusive', labelEn: 'Exclusive', labelRu: 'Эксклюзивный' },
              { value: 'trial', labelEn: 'Trial', labelRu: 'Пробный' },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center">
                <RadioGroupItem value={opt.value} id={`type-${opt.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`type-${opt.value}`}
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover px-3 py-2 text-sm font-medium cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:bg-accent hover:text-accent-foreground"
                >
                  {isRussian ? opt.labelRu : opt.labelEn}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Auto Renew */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="auto-renew" className="text-sm">
              {isRussian ? 'Автопродление' : 'Auto Renew'}
            </Label>
          </div>
          <Switch
            id="auto-renew"
            checked={formData.auto_renew}
            onCheckedChange={(checked) => handleChange('auto_renew', checked)}
          />
        </div>

        <Separator />

        {/* Bank Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            {isRussian ? 'Банковские реквизиты' : 'Bank Details'}
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{isRussian ? 'Банк' : 'Bank'}</Label>
              <Input
                value={formData.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                placeholder="Bangkok Bank, Kasikorn, SCB..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isRussian ? 'Номер счёта' : 'Account Number'}</Label>
                <Input
                  value={formData.bank_account_number}
                  onChange={(e) => handleChange('bank_account_number', e.target.value)}
                  placeholder="1234567890"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs">{isRussian ? 'Имя владельца' : 'Account Name'}</Label>
                <Input
                  value={formData.bank_account_name}
                  onChange={(e) => handleChange('bank_account_name', e.target.value)}
                  placeholder="Company Co., Ltd"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !isDirty}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isRussian ? 'Сохранение...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {existingContract 
                ? (isRussian ? 'Сохранить изменения' : 'Save Changes')
                : (isRussian ? 'Создать контракт' : 'Create Contract')
              }
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
