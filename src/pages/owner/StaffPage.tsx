import { useState, lazy, Suspense, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { VendorDocumentsTab } from '@/components/owner/vendors/VendorDocumentsTab';
import { PageContainer } from '@/components/uno/PageContainer';
import { MemberPermissionsSheet } from '@/components/owner/team/MemberPermissionsSheet';
import { useMemberPermissions, MODULES, useCanManagePermissions } from '@/hooks/useTeamPermissions';
import { MemberActivitySheet } from '@/components/owner/team/MemberActivitySheet';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

const TeamAccessTab = lazy(() => import('@/pages/owner/TeamPage'));
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Pencil,
  UserX,
  Wrench,
  Sparkles,
  ShieldCheck,
  User,
  Wallet,
  Building2,
  CalendarDays,
  MapPin,
  MessageCircle,
  MoreVertical,
  UserCheck,
  Search,
  History,
  ClipboardList,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useAllStaffMembers,
  useCreateStaffMember,
  useUpdateStaffMember,
  useDeactivateStaffMember,
  useStaffPropertyAssignments,
  useAssignStaffToProperty,
  useRemoveStaffAssignment,
  STAFF_ROLES,
  PAY_TYPES,
  StaffMember,
  StaffMemberInsert,
  StaffRole,
  PayType,
} from '@/hooks/useStaffMembers';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { supabase } from '@/integrations/supabase/client';
import { toast as toastSonner } from 'sonner';
import { format } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';

const ROLE_ICONS: Record<StaffRole, React.ReactNode> = {
  cleaner: <Sparkles className="h-4 w-4" />,
  maintenance: <Wrench className="h-4 w-4" />,
  manager: <ShieldCheck className="h-4 w-4" />,
  admin: <ShieldCheck className="h-4 w-4" />,
  staff: <User className="h-4 w-4" />,
};

const ROLE_COLORS: Record<StaffRole, string> = {
  cleaner: 'text-info bg-info/10',
  maintenance: 'text-warning bg-warning/10',
  manager: 'text-primary bg-primary/10',
  admin: 'text-primary bg-primary/10',
  staff: 'text-muted-foreground bg-muted',
};

const AVATAR_COLORS = [
  'bg-primary/20 text-primary',
  'bg-info/20 text-info',
  'bg-warning/20 text-warning',
  'bg-success/20 text-success',
  'bg-destructive/20 text-destructive',
  'bg-accent text-accent-foreground',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

interface StaffFormState {
  name: string;
  role: StaffRole;
  custom_title: string;
  phone: string;
  email: string;
  notes: string;
  pay_type: PayType;
  monthly_salary: string;
  hourly_rate: string;
  daily_rate: string;
  is_active: boolean;
  photo_url: string;
  sendCredentials: boolean;
}

const DEFAULT_FORM: StaffFormState = {
  name: '',
  role: 'staff',
  custom_title: '',
  phone: '',
  email: '',
  notes: '',
  pay_type: 'salary',
  monthly_salary: '',
  hourly_rate: '',
  daily_rate: '',
  is_active: true,
  photo_url: '',
  sendCredentials: false,
};

function staffToForm(s: StaffMember): StaffFormState {
  return {
    name: s.name,
    role: s.role,
    custom_title: s.custom_title ?? '',
    phone: s.phone ?? '',
    email: s.email ?? '',
    notes: s.notes ?? '',
    pay_type: s.pay_type,
    monthly_salary: s.monthly_salary?.toString() ?? '',
    hourly_rate: s.hourly_rate?.toString() ?? '',
    daily_rate: s.daily_rate?.toString() ?? '',
    is_active: s.is_active,
    photo_url: (s as any).photo_url ?? '',
    sendCredentials: false,
  };
}

/** Compact permission indicators for staff card */
function StaffPermissionBadges({ userId, isRu, onClick }: { userId: string; isRu: boolean; onClick: () => void }) {
  const { data: permissions = [] } = useMemberPermissions(userId);
  const t = (en: string, ru: string) => isRu ? ru : en;
  
  if (permissions.length === 0) {
    return (
      <button
        onClick={onClick}
        className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors w-full"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>{t('Set up permissions', 'Настроить права')}</span>
      </button>
    );
  }

  const moduleLabels: Record<string, { short: string; shortRu: string }> = {
    properties: { short: 'Prop', shortRu: 'Объ' },
    finance: { short: 'Fin', shortRu: 'Фин' },
    crm: { short: 'CRM', shortRu: 'CRM' },
    tasks: { short: 'Tasks', shortRu: 'Зад' },
    bookings: { short: 'Book', shortRu: 'Бр' },
    reports: { short: 'Rep', shortRu: 'Отч' },
    staff: { short: 'Staff', shortRu: 'Ком' },
  };

  return (
    <button
      onClick={onClick}
      className="mt-3 pt-3 border-t border-border/40 w-full group"
    >
      <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        {t('Permissions', 'Права доступа')}
        <Pencil className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </p>
      <div className="flex flex-wrap gap-1">
        {MODULES.map(mod => {
          const perm = permissions.find(p => p.module === mod.key);
          const hasView = perm?.can_view ?? false;
          const hasEdit = perm?.can_edit ?? false;
          const label = isRu ? (moduleLabels[mod.key]?.shortRu ?? mod.key) : (moduleLabels[mod.key]?.short ?? mod.key);
          
          return (
            <span
              key={mod.key}
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                hasEdit
                  ? 'bg-primary/10 text-primary'
                  : hasView
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-muted/40 text-muted-foreground/40 line-through'
              }`}
              title={`${isRu ? mod.labelRu : mod.labelEn}: ${hasEdit ? (isRu ? 'Редактирование' : 'Edit') : hasView ? (isRu ? 'Просмотр' : 'View') : (isRu ? 'Нет доступа' : 'No access')}`}
            >
              {label}
            </span>
          );
        })}
      </div>
    </button>
  );
}

/** Rich staff card component */
function StaffCard({
  staff,
  isRu,
  onEdit,
  onDeactivate,
  onReactivate,
  properties,
  onViewTasks,
  onEditPermissions,
  onViewActivity,
  canManage,
}: {
  staff: StaffMember;
  isRu: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  properties: { property_id: string; title: string; title_ru: string }[];
  onViewTasks: () => void;
  onEditPermissions: () => void;
  onViewActivity: () => void;
  canManage: boolean;
}) {
  const t = (en: string, ru: string) => isRu ? ru : en;
  const roleLabel = STAFF_ROLES.find(r => r.value === staff.role)?.[isRu ? 'labelRu' : 'labelEn'] ?? staff.role;
  const colorClass = ROLE_COLORS[staff.role] ?? 'text-muted-foreground bg-muted';
  const { data: assignments } = useStaffPropertyAssignments(staff.id);
  
  const payLabel = (() => {
    if (staff.monthly_salary) return `฿${staff.monthly_salary.toLocaleString()}/${t('mo', 'мес')}`;
    if (staff.daily_rate) return `฿${staff.daily_rate.toLocaleString()}/${t('day', 'день')}`;
    if (staff.hourly_rate) return `฿${staff.hourly_rate.toLocaleString()}/${t('hr', 'ч')}`;
    return null;
  })();

  const hireDate = format(new Date(staff.created_at), isRu ? 'd MMM yyyy' : 'MMM d, yyyy', {
    locale: isRu ? ruLocale : undefined,
  });

  const assignedProperties = (assignments || [])
    .map(a => properties.find(p => p.property_id === a.property_id))
    .filter(Boolean);

  return (
    <Card className={!staff.is_active ? 'opacity-60' : undefined}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14 shrink-0">
            {(staff as any).photo_url && <AvatarImage src={(staff as any).photo_url} />}
            <AvatarFallback className={`text-lg font-bold ${getAvatarColor(staff.name)}`}>
              {getInitials(staff.name)}
            </AvatarFallback>
          </Avatar>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-base leading-tight">{staff.name}</h3>
              {!staff.is_active && (
                <Badge variant="secondary" className="text-xs">{t('Inactive', 'Неактивен')}</Badge>
              )}
            </div>

            {/* Role badge */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`text-xs gap-1 ${colorClass} border-transparent`}>
                {ROLE_ICONS[staff.role]}
                {staff.custom_title || roleLabel}
              </Badge>
              {payLabel && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Wallet className="h-3 w-3" />
                  {payLabel}
                </Badge>
              )}
            </div>

            {/* Contact info */}
            <div className="space-y-1.5">
              {staff.phone && (
                <a href={`tel:${staff.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{staff.phone}</span>
                </a>
              )}
              {staff.email && (
                <a href={`mailto:${staff.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{staff.email}</span>
                </a>
              )}
            </div>

            {/* Assigned properties */}
            {assignedProperties.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {t('Assigned to', 'Назначен на')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {assignedProperties.map(p => (
                    <Badge key={p!.property_id} variant="secondary" className="text-xs font-normal">
                      <Building2 className="h-3 w-3 mr-1" />
                      {isRu ? p!.title_ru || p!.title : p!.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes preview */}
            {staff.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                {staff.notes}
              </p>
            )}

            {/* Permission badges - clickable */}
            <StaffPermissionBadges userId={staff.id} isRu={isRu} onClick={onEditPermissions} />

            {/* Footer: hire date */}
            <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {t('Since', 'С')} {hireDate}
              </span>
              {staff.phone && (
                <a 
                  href={`https://wa.me/${staff.phone.replace(/[^\d+]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-success hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canManage && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('Edit', 'Редактировать')}
                </DropdownMenuItem>
              )}
              {staff.phone && (
                <DropdownMenuItem asChild>
                  <a href={`tel:${staff.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    {t('Call', 'Позвонить')}
                  </a>
                </DropdownMenuItem>
              )}
              {staff.email && (
                <DropdownMenuItem asChild>
                  <a href={`mailto:${staff.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    {t('Email', 'Написать')}
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onViewTasks}>
                <ClipboardList className="h-4 w-4 mr-2" />
                {t('View Tasks', 'Задачи')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEditPermissions}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                {t('Permissions', 'Права доступа')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewActivity}>
                <History className="h-4 w-4 mr-2" />
                {t('Activity Log', 'Лог активности')}
              </DropdownMenuItem>
              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  {staff.is_active ? (
                    <DropdownMenuItem onClick={onDeactivate} className="text-destructive">
                      <UserX className="h-4 w-4 mr-2" />
                      {t('Deactivate', 'Деактивировать')}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onReactivate} className="text-success">
                      <UserCheck className="h-4 w-4 mr-2" />
                      {t('Reactivate', 'Активировать')}
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StaffPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: staff, isLoading } = useAllStaffMembers();
  const createMutation = useCreateStaffMember();
  const updateMutation = useUpdateStaffMember();
  const deactivateMutation = useDeactivateStaffMember();
  const { allProperties } = useMyProperties();
  const { activeCompany } = useActiveCompany();
  const assignStaff = useAssignStaffToProperty();
  const removeAssignment = useRemoveStaffAssignment();
  const canManage = useCanManagePermissions();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffFormState>(DEFAULT_FORM);
  const [staffFilter, setStaffFilter] = useState<'active' | 'all'>('active');
  const [pageTab, setPageTab] = useState<'staff' | 'access'>('staff');
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  // addMemberOpen removed — unified into Sheet form
  const [permissionsTarget, setPermissionsTarget] = useState<{ userId: string; name: string; staffId: string; customTitle?: string } | null>(null);
  const [activityTarget, setActivityTarget] = useState<{ userId: string; name: string } | null>(null);

  const t = (en: string, ru: string) => isRu ? ru : en;
  const navigate = useNavigate();

  const shown = (staff ?? [])
    .filter(s => staffFilter === 'active' ? s.is_active : true)
    .filter(s => roleFilter === 'all' || s.role === roleFilter)
    .filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.phone?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
    });

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setSheetOpen(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditing(s);
    setForm(staffToForm(s));
    setSheetOpen(true);
  };

  const handleSave = async () => {
    const payload: StaffMemberInsert = {
      name: form.name,
      role: form.role,
      custom_title: form.custom_title || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      notes: form.notes || undefined,
      pay_type: form.pay_type,
      monthly_salary: form.monthly_salary ? parseFloat(form.monthly_salary) : undefined,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : undefined,
      daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : undefined,
      is_active: form.is_active,
    } as any;
    if (form.photo_url) (payload as any).photo_url = form.photo_url;

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);

        // Send login credentials if toggle is on and email is provided
        if (form.sendCredentials && form.email && activeCompany?.company_id) {
          try {
            const { data, error } = await supabase.functions.invoke('invite-team-member', {
              body: {
                company_id: activeCompany.company_id,
                full_name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim() || undefined,
                role: form.role === 'admin' ? 'manager' : 'staff',
              },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            toastSonner.success(
              isRu 
                ? `Данные для входа отправлены на ${form.email}` 
                : `Login credentials sent to ${form.email}`
            );
          } catch (inviteErr: any) {
            logger.error('Failed to send credentials:', inviteErr);
            toastSonner.error(
              isRu 
                ? `Сотрудник добавлен, но не удалось отправить данные: ${inviteErr.message}` 
                : `Staff added, but failed to send credentials: ${inviteErr.message}`
            );
          }
        }
      }
      setSheetOpen(false);
    } catch {
      // errors handled by mutation
    }
  };

  const handleReactivate = async (s: StaffMember) => {
    await updateMutation.mutateAsync({ id: s.id, is_active: true });
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const properties = allProperties.map(p => ({ ...p, id: p.property_id }));

  return (
    <PageContainer>
      <PageHeader
        title={t('Team', 'Команда')}
        subtitle={t('Staff directory, access control and delegation', 'Сотрудники, доступ и делегирование')}
        showBack
        fallbackPath="/owner"
      />

      {/* Page-level tabs: Staff | Access & Delegation */}
      <Tabs value={pageTab} onValueChange={v => setPageTab(v as 'staff' | 'access')} className="mb-5">
        <TabsList>
          <TabsTrigger value="staff">{t('Staff', 'Сотрудники')}</TabsTrigger>
          <TabsTrigger value="access">{t('Access & Delegation', 'Доступ и делегирование')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {pageTab === 'access' ? (
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
          <TeamAccessTab />
        </Suspense>
      ) : (
      <>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: t('Total', 'Всего'), value: staff?.length ?? 0, icon: Users, color: 'text-foreground' },
          { label: t('Active', 'Активных'), value: staff?.filter(s => s.is_active).length ?? 0, icon: UserCheck, color: 'text-success' },
          { label: t('Managers', 'Управляющих'), value: staff?.filter(s => s.role === 'manager' || s.role === 'admin').length ?? 0, icon: ShieldCheck, color: 'text-primary' },
          { label: t('On tasks', 'На объектах'), value: staff?.filter(s => s.role === 'cleaner' || s.role === 'maintenance').length ?? 0, icon: Wrench, color: 'text-warning' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{isLoading ? '–' : value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1">
          <Tabs value={staffFilter} onValueChange={v => setStaffFilter(v as 'active' | 'all')}>
            <TabsList>
              <TabsTrigger value="active">{t('Active', 'Активные')}</TabsTrigger>
              <TabsTrigger value="all">{t('All', 'Все')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={roleFilter} onValueChange={v => setRoleFilter(v as StaffRole | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('All roles', 'Все роли')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All roles', 'Все роли')}</SelectItem>
              {STAFF_ROLES.map(r => (
                <SelectItem key={r.value} value={r.value}>
                  {isRu ? r.labelRu : r.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search staff...', 'Поиск сотрудника...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {canManage && (
            <Button onClick={openCreate}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('Add', 'Добавить')}
            </Button>
          )}
        </div>
      </div>

      {/* Staff grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      ) : shown.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-semibold text-lg mb-1">{t('No staff yet', 'Нет сотрудников')}</p>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              {t(
                'Add your cleaners, maintenance staff, managers and other team members to manage assignments and contacts',
                'Добавьте уборщиц, мастеров, управляющих и других сотрудников для управления назначениями и контактами'
              )}
            </p>
            {canManage && (
              <Button onClick={openCreate}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('Add first staff member', 'Добавить первого сотрудника')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {shown.map(s => (
            <StaffCard
              key={s.id}
              staff={s}
              isRu={isRu}
              onEdit={() => openEdit(s)}
              onDeactivate={() => setDeactivateTarget(s)}
              onReactivate={() => handleReactivate(s)}
              properties={allProperties}
              onViewTasks={() => navigate(`/mc/tasks?assignee=${s.id}`)}
              onEditPermissions={() => setPermissionsTarget({ userId: s.id, name: s.name, staffId: s.id, customTitle: s.custom_title })}
              onViewActivity={() => setActivityTarget({ userId: s.id, name: s.name })}
              canManage={canManage}
            />
          ))}
        </div>
      )}

      {/* Unified Edit / Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              {editing ? <Pencil className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              {editing ? t('Edit Staff Member', 'Редактировать сотрудника') : t('New Staff Member', 'Новый сотрудник')}
            </SheetTitle>
            {!editing && (
              <p className="text-sm text-muted-foreground">
                {t('Add to your team and optionally send login credentials', 'Добавьте в команду и при необходимости отправьте доступ')}
              </p>
            )}
          </SheetHeader>

          <div className="space-y-6">
            {/* Section: Profile */}
            <section className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{t('Profile', 'Профиль')}</h4>
              <div className="flex items-center gap-4">
                <UnifiedMediaUploader
                  mode="avatar"
                  value={form.photo_url}
                  onChange={(url) => setForm(f => ({ ...f, photo_url: typeof url === 'string' ? url : '' }))}
                  name={form.name}
                  folder="staff"
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="mb-1 block text-xs">{t('Full Name', 'ФИО')} *</Label>
                    <Input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={t('e.g. Nong Yui', 'например, Юлия Петрова')}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">{t('Job Title', 'Должность')}</Label>
                    <Input
                      value={form.custom_title}
                      onChange={e => setForm(f => ({ ...f, custom_title: e.target.value }))}
                      placeholder={t('e.g. Booking Coordinator', 'напр. Координатор бронирований')}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-xs">{t('Role', 'Роль')}</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as StaffRole }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        <div className="flex items-center gap-2">
                          {ROLE_ICONS[r.value]}
                          {isRu ? r.labelRu : r.labelEn}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editing && (
                <div className="flex items-center justify-between p-3 rounded-xl border">
                  <div>
                    <p className="text-sm font-medium">{t('Active', 'Активен')}</p>
                    <p className="text-xs text-muted-foreground">
                      {form.is_active ? t('Employee is active', 'Сотрудник активен') : t('Deactivated', 'Деактивирован')}
                    </p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={checked => setForm(f => ({ ...f, is_active: checked }))} />
                </div>
              )}
            </section>

            {/* Section: Contact */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{t('Contact', 'Контакты')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block text-xs">{t('Phone', 'Телефон')}</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+66 8x xxx xxxx" />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Email</Label>
                  <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@company.com" />
                </div>
              </div>

              {!editing && form.email.trim() && activeCompany?.company_id && (
                <div className="flex items-center justify-between rounded-xl border p-3 bg-muted/30">
                  <div className="space-y-0.5 min-w-0 mr-3">
                    <p className="text-sm font-medium">{t('Send login credentials', 'Отправить данные для входа')}</p>
                    <p className="text-xs text-muted-foreground">{t('Create account & send password to email', 'Создать аккаунт и отправить пароль')}</p>
                  </div>
                  <Switch checked={form.sendCredentials} onCheckedChange={checked => setForm(f => ({ ...f, sendCredentials: checked }))} />
                </div>
              )}
            </section>

            {/* Section: Compensation */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{t('Compensation', 'Оплата')}</h4>
              <Select value={form.pay_type} onValueChange={v => setForm(f => ({ ...f, pay_type: v as PayType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAY_TYPES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{isRu ? p.labelRu : p.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.pay_type === 'salary' && (
                <div>
                  <Label className="mb-1 block text-xs">{t('Monthly Salary (฿)', 'Оклад в месяц (฿)')}</Label>
                  <Input type="number" value={form.monthly_salary} onChange={e => setForm(f => ({ ...f, monthly_salary: e.target.value }))} placeholder="15000" />
                </div>
              )}
              {form.pay_type === 'hourly' && (
                <div>
                  <Label className="mb-1 block text-xs">{t('Hourly Rate (฿)', 'Ставка в час (฿)')}</Label>
                  <Input type="number" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} placeholder="200" />
                </div>
              )}
              {form.pay_type === 'daily' && (
                <div>
                  <Label className="mb-1 block text-xs">{t('Daily Rate (฿)', 'Дневная ставка (฿)')}</Label>
                  <Input type="number" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} placeholder="1000" />
                </div>
              )}
              {form.pay_type === 'per_task' && (
                <div>
                  <Label className="mb-1 block text-xs">{t('Rate per Task (฿)', 'Ставка за задачу (฿)')}</Label>
                  <Input type="number" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} placeholder="500" />
                </div>
              )}
            </section>

            {/* Section: Notes */}
            <section>
              <Label className="mb-1 block text-xs">{t('Notes', 'Примечания')}</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={t('Special skills, schedule, preferences...', 'Особые навыки, график работы, предпочтения...')}
                rows={3}
              />
            </section>

            {/* Property Assignments (edit mode only) */}
            {editing && allProperties.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{t('Property Assignments', 'Назначения на объекты')}</h4>
                <StaffPropertyAssignments
                  staffId={editing.id}
                  properties={allProperties}
                  isRu={isRu}
                  onAssign={(propertyId) => assignStaff.mutate({ staffId: editing.id, propertyId })}
                  onRemove={(assignmentId) => removeAssignment.mutate(assignmentId)}
                />
              </section>
            )}

            {/* Staff Documents (edit mode only) */}
            {editing && (
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{t('Documents', 'Документы')}</h4>
                <VendorDocumentsTab vendorId={editing.id} docSource="staff" />
              </section>
            )}

            <Button className="w-full" onClick={handleSave} disabled={isBusy || !form.name.trim()}>
              {isBusy
                ? t('Saving...', 'Сохранение...')
                : editing
                  ? t('Save Changes', 'Сохранить изменения')
                  : t('Add Staff Member', 'Добавить сотрудника')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Deactivation confirm dialog */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={open => { if (!open) setDeactivateTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Deactivate Staff Member?', 'Деактивировать сотрудника?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `${deactivateTarget?.name} will be marked as inactive and hidden from active lists.`,
                `${deactivateTarget?.name} будет помечен как неактивный и скрыт из активных списков.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel', 'Отмена')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivateTarget) {
                  deactivateMutation.mutate(deactivateTarget.id);
                  setDeactivateTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('Deactivate', 'Деактивировать')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
      )}

      {/* AddTeamMemberDialog removed — consolidated into Sheet form above */}

      {/* Member Permissions Sheet */}
      <MemberPermissionsSheet
        open={!!permissionsTarget}
        onOpenChange={(open) => { if (!open) setPermissionsTarget(null); }}
        userId={permissionsTarget?.userId ?? null}
        userName={permissionsTarget?.name ?? ''}
        customTitle={permissionsTarget?.customTitle}
        staffId={permissionsTarget?.staffId}
      />

      {/* Member Activity Sheet */}
      <MemberActivitySheet
        open={!!activityTarget}
        onOpenChange={(open) => { if (!open) setActivityTarget(null); }}
        userId={activityTarget?.userId}
        memberName={activityTarget?.name}
      />
    </PageContainer>
  );
}

/** Inline component for property assignments in the edit form */
function StaffPropertyAssignments({
  staffId,
  properties,
  isRu,
  onAssign,
  onRemove,
}: {
  staffId: string;
  properties: { property_id: string; title: string; title_ru: string }[];
  isRu: boolean;
  onAssign: (propertyId: string) => void;
  onRemove: (assignmentId: string) => void;
}) {
  const { data: assignments, isLoading } = useStaffPropertyAssignments(staffId);
  const assignedIds = new Set((assignments || []).map(a => a.property_id));
  const unassigned = properties.filter(p => !assignedIds.has(p.property_id));

  return (
    <div className="space-y-2">
      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : (
        <>
          {(assignments || []).length > 0 && (
            <div className="space-y-1.5">
              {(assignments || []).map(a => {
                const prop = properties.find(p => p.property_id === a.property_id);
                return (
                  <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                    <span className="text-sm flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {prop ? (isRu ? prop.title_ru || prop.title : prop.title) : a.property_id.slice(0, 8)}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => onRemove(a.id)}>
                      {isRu ? 'Убрать' : 'Remove'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {unassigned.length > 0 && (
            <Select onValueChange={onAssign}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={isRu ? '+ Добавить объект' : '+ Add property'} />
              </SelectTrigger>
              <SelectContent>
                {unassigned.map(p => (
                  <SelectItem key={p.property_id} value={p.property_id}>
                    {isRu ? p.title_ru || p.title : p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(assignments || []).length === 0 && unassigned.length === 0 && (
            <p className="text-xs text-muted-foreground">{isRu ? 'Нет объектов для назначения' : 'No properties available'}</p>
          )}
        </>
      )}
    </div>
  );
}
