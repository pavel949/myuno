import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useCreateManagementRequest } from '@/hooks/useManagementRequests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UserPlus, 
  Mail, 
  Building2, 
  Shield, 
  Eye, 
  DollarSign, 
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPropertyId?: string;
}

type Step = 'role' | 'permissions' | 'confirm';

const ROLES = [
  { 
    value: 'manager', 
    labelEn: 'Manager', 
    labelRu: 'Управляющий',
    descEn: 'Day-to-day property management',
    descRu: 'Ежедневное управление объектом',
    icon: Shield,
    defaultPermissions: { view: true, edit: true, financial: true, bookings: true }
  },
  { 
    value: 'agent', 
    labelEn: 'Agent', 
    labelRu: 'Агент',
    descEn: 'Booking and guest communication',
    descRu: 'Бронирования и общение с гостями',
    icon: CalendarDays,
    defaultPermissions: { view: true, edit: false, financial: false, bookings: true }
  },
  { 
    value: 'trustee', 
    labelEn: 'Trustee', 
    labelRu: 'Доверенное лицо',
    descEn: 'Full access on your behalf',
    descRu: 'Полный доступ от вашего имени',
    icon: Shield,
    defaultPermissions: { view: true, edit: true, financial: true, bookings: true }
  },
  { 
    value: 'management_company', 
    labelEn: 'Management Company', 
    labelRu: 'Управляющая компания',
    descEn: 'Professional property management',
    descRu: 'Профессиональное управление',
    icon: Building2,
    defaultPermissions: { view: true, edit: true, financial: true, bookings: true }
  },
];

export function InviteTeamMemberDialog({ open, onOpenChange, preselectedPropertyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { allProperties } = useMyProperties();
  const properties = allProperties.map(p => ({ ...p, id: p.property_id }));
  const createRequest = useCreateManagementRequest();

  const [step, setStep] = useState<Step>('role');
  const [email, setEmail] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState(preselectedPropertyId || '');
  const [selectedRole, setSelectedRole] = useState('');
  const [permissions, setPermissions] = useState({
    view: true,
    edit: false,
    financial: false,
    bookings: false,
  });
  const [message, setMessage] = useState('');

  const handleRoleSelect = (roleValue: string) => {
    setSelectedRole(roleValue);
    const role = ROLES.find(r => r.value === roleValue);
    if (role) {
      setPermissions(role.defaultPermissions);
    }
    setStep('permissions');
  };

  const handleSubmit = () => {
    if (!email || !selectedPropertyId || !selectedRole) return;

    createRequest.mutate({
      property_id: selectedPropertyId,
      target_email: email,
      request_type: 'invite_delegate',
      requester_type: 'owner',
      proposed_role: selectedRole,
      proposed_permissions: permissions,
      message: message || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setStep('role');
    setEmail('');
    setSelectedPropertyId(preselectedPropertyId || '');
    setSelectedRole('');
    setPermissions({ view: true, edit: false, financial: false, bookings: false });
    setMessage('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {isRu ? 'Пригласить в команду' : 'Invite Team Member'}
          </DialogTitle>
          <DialogDescription>
            {step === 'role' && (isRu ? 'Выберите роль для приглашаемого' : 'Choose a role for the invitee')}
            {step === 'permissions' && (isRu ? 'Настройте права доступа' : 'Configure access permissions')}
            {step === 'confirm' && (isRu ? 'Проверьте и отправьте приглашение' : 'Review and send invitation')}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Email получателя' : 'Recipient email'}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Объект' : 'Property'}</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
                </SelectTrigger>
                <SelectContent>
                  {properties?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {isRu ? p.title_ru || p.title : p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Роль' : 'Role'}</Label>
              <div className="grid gap-2">
                {ROLES.map((role) => (
                  <Card 
                    key={role.value}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedRole === role.value ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleRoleSelect(role.value)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <role.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {isRu ? role.labelRu : role.labelEn}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isRu ? role.descRu : role.descEn}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Permissions */}
        {step === 'permissions' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{isRu ? 'Просмотр' : 'View'}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? 'Просмотр информации об объекте' : 'View property information'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={permissions.view}
                  onCheckedChange={(checked) => setPermissions(p => ({ ...p, view: checked }))}
                  disabled // View is always required
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{isRu ? 'Редактирование' : 'Edit'}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? 'Изменение данных объекта' : 'Modify property data'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={permissions.edit}
                  onCheckedChange={(checked) => setPermissions(p => ({ ...p, edit: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{isRu ? 'Финансы' : 'Financials'}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? 'Доступ к доходам и расходам' : 'Access to income and expenses'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={permissions.financial}
                  onCheckedChange={(checked) => setPermissions(p => ({ ...p, financial: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{isRu ? 'Бронирования' : 'Bookings'}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? 'Управление бронированиями' : 'Manage reservations'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={permissions.bookings}
                  onCheckedChange={(checked) => setPermissions(p => ({ ...p, bookings: checked }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Сообщение (опционально)' : 'Message (optional)'}</Label>
              <Textarea
                placeholder={isRu ? 'Добавьте сообщение для получателя...' : 'Add a message for the recipient...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('role')} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {isRu ? 'Назад' : 'Back'}
              </Button>
              <Button onClick={() => setStep('confirm')} className="flex-1">
                {isRu ? 'Далее' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{properties?.find(p => p.id === selectedPropertyId)?.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>{ROLES.find(r => r.value === selectedRole)?.[isRu ? 'labelRu' : 'labelEn']}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  {permissions.view && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {isRu ? 'Просмотр' : 'View'}
                    </span>
                  )}
                  {permissions.edit && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {isRu ? 'Редактирование' : 'Edit'}
                    </span>
                  )}
                  {permissions.financial && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {isRu ? 'Финансы' : 'Financial'}
                    </span>
                  )}
                  {permissions.bookings && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {isRu ? 'Бронирования' : 'Bookings'}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('permissions')} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {isRu ? 'Назад' : 'Back'}
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={createRequest.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                {isRu ? 'Отправить' : 'Send Invite'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
