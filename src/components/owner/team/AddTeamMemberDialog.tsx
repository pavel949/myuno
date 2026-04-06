import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCanManagePermissions } from '@/hooks/useTeamPermissions';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'director', labelEn: 'Director', labelRu: 'Директор' },
  { value: 'manager', labelEn: 'Manager', labelRu: 'Управляющий' },
  { value: 'staff', labelEn: 'Staff', labelRu: 'Сотрудник' },
  { value: 'accountant', labelEn: 'Accountant', labelRu: 'Бухгалтер' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddTeamMemberDialog({ open, onOpenChange, onSuccess }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => (isRu ? ru : en);
  const { activeCompany } = useActiveCompany();
  const canManage = useCanManagePermissions();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('staff');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !activeCompany || !canManage) return;

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

    if (!emailPattern.test(normalizedEmail)) {
      toast.error(t, { description: t( });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: {
          company_id: activeCompany.company_id,
          full_name: fullName.trim(),
          email: normalizedEmail,
          phone: phone.trim() || undefined,
          role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast(isRu ? 'Готово' : 'Done');

      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setRole('staff');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      const invalidEmailFromBackend = errorMessage.toLowerCase().includes('invalid email');

      toast.error(t, { description: invalidEmailFromBackend });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('Add Team Member', 'Добавить в команду')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Create an account and send login credentials via email',
              'Создать аккаунт и отправить данные для входа по email'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="mb-1.5 block">{t('Full Name', 'ФИО')} *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('John Smith', 'Иван Петров')}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@company.com"
            />
          </div>

          <div>
            <Label className="mb-1.5 block">{t('Phone', 'Телефон')}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+66 8x xxx xxxx"
            />
          </div>

          <div>
            <Label className="mb-1.5 block">{t('Role', 'Роль')} *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {isRu ? r.labelRu : r.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || !fullName.trim() || !email.trim() || !canManage}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('Creating...', 'Создание...')}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('Add & Send Credentials', 'Добавить и отправить доступ')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
