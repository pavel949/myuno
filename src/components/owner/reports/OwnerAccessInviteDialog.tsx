import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useInviteDelegate, DEFAULT_PERMISSIONS, type DelegateRole } from '@/hooks/usePropertyDelegates';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Shield, Eye, DollarSign, Calendar, Wrench, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OwnerAccessInviteDialog({ open, onOpenChange }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { allProperties } = useMyProperties();
  const inviteDelegate = useInviteDelegate();

  const [propertyId, setPropertyId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<DelegateRole>('owner_readonly');
  const [notes, setNotes] = useState('');
  const [permissions, setPermissions] = useState({
    view: true,
    edit: false,
    financials: true,
    bookings: true,
    maintenance: false,
  });

  const togglePerm = (key: keyof typeof permissions) => {
    if (key === 'view') return; // always on
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRoleChange = (r: DelegateRole) => {
    setRole(r);
    setPermissions({ ...DEFAULT_PERMISSIONS[r] });
  };

  const handleInvite = () => {
    if (!propertyId || !email) return;
    inviteDelegate.mutate({
      property_id: propertyId,
      role,
      invited_email: email,
      invited_name: name || undefined,
      permissions,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setPropertyId('');
        setEmail('');
        setName('');
        setNotes('');
      },
    });
  };

  const permLabels: Record<string, { en: string; ru: string; icon: any }> = {
    view: { en: 'View property data', ru: 'Просмотр данных объекта', icon: Eye },
    financials: { en: 'Financial reports', ru: 'Финансовые отчёты', icon: DollarSign },
    bookings: { en: 'Booking calendar', ru: 'Календарь бронирований', icon: Calendar },
    maintenance: { en: 'Maintenance tasks', ru: 'Задачи обслуживания', icon: Wrench },
    edit: { en: 'Edit property details', ru: 'Редактирование объекта', icon: Shield },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {isRu ? 'Дать доступ собственнику' : 'Grant Owner Access'}
          </DialogTitle>
          <DialogDescription>
            {isRu
              ? 'Пригласите собственника для просмотра данных по управлению объектом'
              : 'Invite a property owner to view management data and reports'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Property selection */}
          <div className="space-y-2">
            <Label>{isRu ? 'Объект' : 'Property'}</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
              </SelectTrigger>
              <SelectContent>
                {(allProperties || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {isRu ? p.title_ru || p.title : p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email & Name */}
          <div className="space-y-2">
            <Label>{isRu ? 'Email собственника' : 'Owner Email'}</Label>
            <Input
              type="email"
              placeholder="owner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{isRu ? 'Имя (необязательно)' : 'Name (optional)'}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRu ? 'Иван Петров' : 'John Smith'}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>{isRu ? 'Роль' : 'Role'}</Label>
            <Select value={role} onValueChange={(v) => handleRoleChange(v as DelegateRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owner_readonly">
                  {isRu ? 'Собственник (просмотр)' : 'Owner (Read-Only)'}
                </SelectItem>
                <SelectItem value="trustee">
                  {isRu ? 'Доверенное лицо (полный доступ)' : 'Trustee (Full Access)'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissions */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              {isRu ? 'Разрешения' : 'Permissions'}
            </Label>
            <div className="space-y-2.5 rounded-lg border p-3 bg-muted/20">
              {Object.entries(permLabels).map(([key, label]) => {
                const Icon = label.icon;
                const isView = key === 'view';
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {isRu ? label.ru : label.en}
                    </div>
                    <Switch
                      checked={permissions[key as keyof typeof permissions]}
                      onCheckedChange={() => togglePerm(key as keyof typeof permissions)}
                      disabled={isView}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{isRu ? 'Заметка' : 'Note'}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRu ? 'Дополнительная информация...' : 'Additional notes...'}
              rows={2}
            />
          </div>

          <Button
            onClick={handleInvite}
            className="w-full"
            disabled={!propertyId || !email || inviteDelegate.isPending}
          >
            {inviteDelegate.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isRu ? 'Отправка...' : 'Sending...'}</>
            ) : (
              <><UserPlus className="h-4 w-4 mr-2" />{isRu ? 'Отправить приглашение' : 'Send Invitation'}</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {isRu
              ? 'Собственник получит доступ к дашборду прозрачности по этому объекту'
              : 'The owner will get access to the transparency dashboard for this property'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
