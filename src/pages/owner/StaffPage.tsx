import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
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

interface StaffFormState {
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  notes: string;
  pay_type: PayType;
  monthly_salary: string;
  hourly_rate: string;
  daily_rate: string;
  is_active: boolean;
}

const DEFAULT_FORM: StaffFormState = {
  name: '',
  role: 'staff',
  phone: '',
  email: '',
  notes: '',
  pay_type: 'salary',
  monthly_salary: '',
  hourly_rate: '',
  daily_rate: '',
  is_active: true,
};

function staffToForm(s: StaffMember): StaffFormState {
  return {
    name: s.name,
    role: s.role,
    phone: s.phone ?? '',
    email: s.email ?? '',
    notes: s.notes ?? '',
    pay_type: s.pay_type,
    monthly_salary: s.monthly_salary?.toString() ?? '',
    hourly_rate: s.hourly_rate?.toString() ?? '',
    daily_rate: s.daily_rate?.toString() ?? '',
    is_active: s.is_active,
  };
}

export default function StaffPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: staff, isLoading } = useAllStaffMembers();
  const createMutation = useCreateStaffMember();
  const updateMutation = useUpdateStaffMember();
  const deactivateMutation = useDeactivateStaffMember();
  const { allProperties } = useMyProperties();
  const assignStaff = useAssignStaffToProperty();
  const removeAssignment = useRemoveStaffAssignment();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffFormState>(DEFAULT_FORM);
  const [tab, setTab] = useState<'active' | 'all'>('active');
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null);

  const shown = (staff ?? []).filter(s =>
    tab === 'active' ? s.is_active : true
  );

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
      phone: form.phone || undefined,
      email: form.email || undefined,
      notes: form.notes || undefined,
      pay_type: form.pay_type,
      monthly_salary: form.monthly_salary ? parseFloat(form.monthly_salary) : undefined,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : undefined,
      daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : undefined,
      is_active: form.is_active,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setSheetOpen(false);
    } catch {
      // errors are handled by mutation onError callbacks
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const t = (en: string, ru: string) => isRu ? ru : en;

  return (
    <PageContainer>
      <PageHeader
        title={t('Staff Directory', 'Реестр сотрудников')}
        subtitle={t('Manage in-house staff for your properties', 'Штатные сотрудники УК и назначения')}
        showBack
        fallbackPath="/owner"
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: t('Total', 'Всего'), value: staff?.length ?? 0, color: 'text-foreground' },
          { label: t('Active', 'Активных'), value: staff?.filter(s => s.is_active).length ?? 0, color: 'text-primary' },
          { label: t('Inactive', 'Неактивных'), value: staff?.filter(s => !s.is_active).length ?? 0, color: 'text-muted-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-3 text-center">
            <p className={`text-2xl font-bold ${color}`}>{isLoading ? '–' : value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <Tabs value={tab} onValueChange={v => setTab(v as 'active' | 'all')}>
          <TabsList>
            <TabsTrigger value="active">{t('Active', 'Активные')}</TabsTrigger>
            <TabsTrigger value="all">{t('All', 'Все')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={openCreate}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('Add Staff', 'Добавить')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : shown.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">{t('No staff yet', 'Нет сотрудников')}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {t('Add your in-house cleaners, maintenance staff and managers', 'Добавьте штатных уборщиц, мастеров и управляющих')}
            </p>
            <Button variant="outline" onClick={openCreate}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('Add first staff member', 'Добавить первого')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {shown.map(s => {
            const roleLabel = STAFF_ROLES.find(r => r.value === s.role)?.[isRu ? 'labelRu' : 'labelEn'] ?? s.role;
            const colorClass = ROLE_COLORS[s.role] ?? 'text-muted-foreground bg-muted';

            return (
              <Card key={s.id} className={!s.is_active ? 'opacity-60' : undefined}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${colorClass}`}>
                      {ROLE_ICONS[s.role] ?? <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{s.name}</span>
                        <Badge variant="outline" className="text-xs">{roleLabel}</Badge>
                        {!s.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            {t('Inactive', 'Неактивен')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        {s.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />{s.phone}
                          </span>
                        )}
                        {s.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />{s.email}
                          </span>
                        )}
                        {(s.monthly_salary || s.hourly_rate || s.daily_rate) && (
                          <span className="flex items-center gap-1">
                            <Wallet className="h-3 w-3" />
                            {s.monthly_salary
                              ? `฿${s.monthly_salary.toLocaleString()}/${t('mo', 'мес')}`
                              : s.daily_rate
                                ? `฿${s.daily_rate}/${t('day', 'день')}`
                                : `฿${s.hourly_rate}/${t('hr', 'ч')}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {s.is_active && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeactivateTarget(s)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit / Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>
              {editing ? t('Edit Staff Member', 'Редактировать сотрудника') : t('New Staff Member', 'Новый сотрудник')}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            <div>
              <Label>{t('Full Name', 'Имя')}</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={t('e.g. Nong Yui', 'например, Юлия')}
              />
            </div>

            <div>
              <Label>{t('Role', 'Роль')}</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as StaffRole }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {isRu ? r.labelRu : r.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('Phone', 'Телефон')}</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+66 8x xxx xxxx"
                />
              </div>
              <div>
                <Label>{t('Email', 'Email')}</Label>
                <Input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="staff@"
                />
              </div>
            </div>

            {/* Pay type */}
            <div>
              <Label>{t('Pay Type', 'Тип оплаты')}</Label>
              <Select value={form.pay_type} onValueChange={v => setForm(f => ({ ...f, pay_type: v as PayType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAY_TYPES.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {isRu ? p.labelRu : p.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.pay_type === 'salary' && (
              <div>
                <Label>{t('Monthly Salary (฿)', 'Оклад в месяц (฿)')}</Label>
                <Input
                  type="number"
                  value={form.monthly_salary}
                  onChange={e => setForm(f => ({ ...f, monthly_salary: e.target.value }))}
                  placeholder="15000"
                />
              </div>
            )}
            {form.pay_type === 'hourly' && (
              <div>
                <Label>{t('Hourly Rate (฿)', 'Ставка в час (฿)')}</Label>
                <Input
                  type="number"
                  value={form.hourly_rate}
                  onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                  placeholder="200"
                />
              </div>
            )}
            {form.pay_type === 'daily' && (
              <div>
                <Label>{t('Daily Rate (฿)', 'Дневная ставка (฿)')}</Label>
                <Input
                  type="number"
                  value={form.daily_rate}
                  onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))}
                  placeholder="1000"
                />
              </div>
            )}
            {form.pay_type === 'per_task' && (
              <div>
                <Label>{t('Rate per Task (฿)', 'Ставка за задачу (฿)')}</Label>
                <Input
                  type="number"
                  value={form.daily_rate}
                  onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))}
                  placeholder="500"
                />
              </div>
            )}

            <div>
              <Label>{t('Notes', 'Примечания')}</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={t('Special skills, schedule notes...', 'Особые навыки, график...')}
                rows={3}
              />
            </div>

            {/* Property Assignments (only in edit mode) */}
            {editing && allProperties.length > 0 && (
              <StaffPropertyAssignments
                staffId={editing.id}
                properties={allProperties}
                isRu={isRu}
                onAssign={(propertyId) => assignStaff.mutate({ staffId: editing.id, propertyId })}
                onRemove={(assignmentId) => removeAssignment.mutate(assignmentId)}
              />
            )}

            <Button className="w-full" onClick={handleSave} disabled={isBusy || !form.name.trim()}>
              {isBusy
                ? t('Saving...', 'Сохранение...')
                : editing
                  ? t('Save Changes', 'Сохранить')
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
    </PageContainer>
  );
}

/** Inline component for property assignments */
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
      <Label>{isRu ? 'Назначен на объекты' : 'Assigned Properties'}</Label>
      
      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : (
        <>
          {(assignments || []).length > 0 && (
            <div className="space-y-1.5">
              {(assignments || []).map(a => {
                const prop = properties.find(p => p.property_id === a.property_id);
                return (
                  <div key={a.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{prop ? (isRu ? prop.title_ru : prop.title) : a.property_id.slice(0, 8)}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => onRemove(a.id)}>
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
                    {isRu ? p.title_ru : p.title}
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
