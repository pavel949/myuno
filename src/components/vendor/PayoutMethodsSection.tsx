import { useState } from 'react';
import { Plus, Building2, CreditCard, Star, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePayoutMethods, PayoutMethod, CreatePayoutMethodData } from '@/hooks/usePayoutMethods';
import { useLanguage } from '@/contexts/LanguageContext';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { cn } from '@/lib/utils';

const bankLogos: Record<string, string> = {
  kasikorn: 'KBANK',
  bangkok: 'BBL',
  scb: 'SCB',
  krungsri: 'BAY',
  ktb: 'KTB',
  gsb: 'GSB',
  tisco: 'TISCO',
  cimb: 'CIMB',
  uob: 'UOB',
  other: 'BANK',
};

interface PayoutMethodCardProps {
  method: PayoutMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}

function PayoutMethodCard({ method, onSetDefault, onDelete }: PayoutMethodCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const bankCode = method.bank_code?.toLowerCase() || 'other';

  return (
    <div className={cn(
      'relative p-4 rounded-xl border bg-card',
      method.is_default && 'ring-2 ring-primary/50 border-primary'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            {method.type === 'bank_account' ? (
              <span className="text-xs font-bold text-white">
                {bankLogos[bankCode] || 'BANK'}
              </span>
            ) : (
              <CreditCard className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <p className="font-medium">{method.bank_name || (isRu ? 'Банковский счёт' : 'Bank Account')}</p>
            <p className="text-sm text-muted-foreground">
              •••• {method.account_number?.slice(-4)}
            </p>
            {method.account_holder_name && (
              <p className="text-xs text-muted-foreground uppercase">
                {method.account_holder_name}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!method.is_default && (
              <DropdownMenuItem onClick={() => onSetDefault(method.id)}>
                <Star className="w-4 h-4 mr-2" />
                {isRu ? 'Сделать основным' : 'Set as default'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(method.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isRu ? 'Удалить' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {method.is_default && (
        <div className="absolute top-3 right-12 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
          <Star className="w-3 h-3 fill-current" />
          {isRu ? 'Основной' : 'Default'}
        </div>
      )}
    </div>
  );
}

export function PayoutMethodsSection() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const {
    payoutMethods,
    isLoading,
    addPayoutMethod,
    setDefaultMethod,
    deletePayoutMethod,
    isAdding,
  } = usePayoutMethods();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePayoutMethodData>({
    type: 'bank_account',
    bank_code: '',
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    is_default: false,
  });

  const thBanks = [
    { code: 'kasikorn', name: 'Kasikornbank (KBank)' },
    { code: 'bangkok', name: 'Bangkok Bank' },
    { code: 'scb', name: 'Siam Commercial Bank' },
    { code: 'krungsri', name: 'Bank of Ayudhya (Krungsri)' },
    { code: 'ktb', name: 'Krungthai Bank' },
    { code: 'gsb', name: 'Government Savings Bank' },
    { code: 'tisco', name: 'TISCO Bank' },
    { code: 'cimb', name: 'CIMB Thai' },
    { code: 'uob', name: 'UOB Thailand' },
    { code: 'other', name: isRu ? 'Другой банк' : 'Other Bank' },
  ];

  const handleBankChange = (code: string) => {
    const bank = thBanks.find(b => b.code === code);
    setFormData(prev => ({
      ...prev,
      bank_code: code,
      bank_name: bank?.name || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_number || !formData.bank_code) return;

    addPayoutMethod(formData);
    setIsDialogOpen(false);
    setFormData({
      type: 'bank_account',
      bank_code: '',
      bank_name: '',
      account_number: '',
      account_holder_name: '',
      is_default: false,
    });
  };

  if (isLoading) {
    return <ContentSkeleton variant="card" count={2} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          {isRu ? 'Реквизиты для выплат' : 'Payout Methods'}
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              {isRu ? 'Добавить' : 'Add'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isRu ? 'Добавить реквизиты' : 'Add Payout Method'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Банк' : 'Bank'}</Label>
                <Select
                  value={formData.bank_code}
                  onValueChange={handleBankChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите банк' : 'Select bank'} />
                  </SelectTrigger>
                  <SelectContent>
                    {thBanks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Номер счёта' : 'Account Number'}</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })}
                  placeholder="0123456789"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Имя владельца счёта' : 'Account Holder Name'}</Label>
                <Input
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value.toUpperCase() })}
                  placeholder="SOMCHAI JAIDEE"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRu ? 'Сделать основным' : 'Set as default'}</Label>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isAdding || !formData.account_number || !formData.bank_code}
              >
                {isAdding
                  ? (isRu ? 'Добавление...' : 'Adding...')
                  : (isRu ? 'Добавить реквизиты' : 'Add Payout Method')
                }
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {payoutMethods.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-xl border-dashed">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{isRu ? 'Нет реквизитов для выплат' : 'No payout methods'}</p>
          <p className="text-xs">
            {isRu ? 'Добавьте банковский счёт для получения выплат' : 'Add a bank account to receive payouts'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {payoutMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
              >
                <PayoutMethodCard
                  method={method}
                  onSetDefault={setDefaultMethod}
                  onDelete={deletePayoutMethod}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
