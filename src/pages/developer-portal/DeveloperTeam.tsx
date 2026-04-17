/**
 * Developer Team — manage team members and send invites.
 * Accessible to developer users with role 'owner' or 'admin'.
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeveloperProfile } from '@/hooks/useDeveloperPortal';
import { useDeveloperTeam, useInviteTeamMember } from '@/hooks/useDeveloperOnboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Shield, Clock } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  sales_lead: 'Руководитель продаж',
  sales_rep: 'Менеджер продаж',
  finance: 'Финансы',
  marketing: 'Маркетинг',
  readonly: 'Только просмотр',
};

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).filter(([r]) => r !== 'owner');

export default function DeveloperTeam() {
  const { data: developer } = useDeveloperProfile();
  const { data: members = [], isLoading } = useDeveloperTeam(developer?.id);
  const invite = useInviteTeamMember();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('sales_rep');

  async function handleInvite() {
    if (!developer || !email) return;
    await invite.mutateAsync({ developer_id: developer.id, email, role });
    setOpen(false);
    setEmail('');
    setRole('sales_rep');
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="nb-display text-3xl text-[hsl(var(--nb-text))]">Команда</h1>
          <p className="text-sm text-[hsl(var(--nb-text-secondary))] mt-1">
            Управляйте доступом сотрудников к порталу
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="nb-btn-gold">
              <UserPlus className="w-4 h-4 mr-2" /> Пригласить
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[hsl(var(--nb-surface))] border-[hsl(var(--nb-glass-border))]">
            <DialogHeader>
              <DialogTitle className="text-[hsl(var(--nb-text))]">Пригласить сотрудника</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Email *</label>
                <Input
                  type="email"
                  placeholder="manager@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="nb-input"
                />
              </div>
              <div>
                <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Роль *</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="nb-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="nb-btn-gold w-full"
                onClick={handleInvite}
                disabled={!email || invite.isPending}
              >
                <Mail className="w-4 h-4 mr-2" />
                {invite.isPending ? 'Отправка...' : 'Отправить приглашение'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-[hsl(var(--nb-muted))]">Загрузка...</div>
      ) : members.length === 0 ? (
        <div className="nb-glass p-8 rounded-xl text-center">
          <Shield className="w-8 h-8 text-[hsl(var(--nb-muted))] mx-auto mb-3" />
          <p className="text-[hsl(var(--nb-text-secondary))]">Пока нет участников команды</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="nb-glass p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--nb-text))]">
                  {m.full_name || m.email}
                </p>
                <p className="text-xs text-[hsl(var(--nb-muted))]">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {ROLE_LABELS[m.role] ?? m.role}
                </Badge>
                {m.status === 'invited' && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <Clock className="w-3 h-3" /> Ожидает
                  </span>
                )}
                {m.status === 'active' && (
                  <span className="text-xs text-green-400">Активен</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
