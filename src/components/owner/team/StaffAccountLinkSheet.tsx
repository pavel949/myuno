import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCanManagePermissions } from '@/hooks/useTeamPermissions';
import { useSetStaffAccountLink, useStaffAccountSetup } from '@/hooks/useStaffAccountLinks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

interface Props {
  open: boolean; onOpenChange: (open: boolean) => void;
  staffId?: string; staffName?: string;
  onViewActivity: (userId: string, name: string) => void;
}

export function StaffAccountLinkSheet({ open, onOpenChange, staffId, staffName, onViewActivity }: Props) {
  const { language } = useLanguage();
  const ru = language === 'ru';
  const { activeCompany, isError: companyError, isLoading: companyLoading, refetch: reloadCompany } = useActiveCompany();
  const canManage = useCanManagePermissions();
  const setup = useStaffAccountSetup(open && canManage);
  const save = useSetStaffAccountLink();
  const [selected, setSelected] = useState('');
  const [checkingActivity, setCheckingActivity] = useState(false);
  const current = useRef({ companyId: activeCompany?.company_id, staffId, mounted: true });
  current.current.companyId = activeCompany?.company_id;
  current.current.staffId = staffId;
  useEffect(() => { current.current.mounted = true; return () => { current.current.mounted = false; }; }, []);
  const link = setup.data?.links.find(item => item.staff_member_id === staffId);
  useEffect(() => { setSelected(link?.company_member_id ?? ''); }, [staffId, link?.company_member_id, activeCompany?.company_id]);
  const failed = companyError || setup.isError;
  const pending = companyLoading || setup.isLoading || setup.isFetching;
  const unavailable = !canManage || !activeCompany || failed || pending;
  const commit = async (memberId: string | null) => {
    if (!staffId || unavailable) return;
    const companyId = activeCompany?.company_id;
    const stillCurrent = () => current.current.mounted && current.current.companyId === companyId && current.current.staffId === staffId;
    try {
      await save.mutateAsync({ staffId, memberId });
      if (stillCurrent()) toast.success(ru ? 'Связь аккаунта сохранена' : 'Account link saved');
    } catch { if (stillCurrent()) toast.error(ru ? 'Не удалось сохранить связь аккаунта' : 'Could not save account link'); }
  };
  const viewActivity = async () => {
    if (!staffId || unavailable) return;
    setCheckingActivity(true);
    const companyId = activeCompany?.company_id;
    try {
      // Never pass a directory UUID, cached account link or revoked membership
      // to the authenticated-user activity consumer.
      const latest = await setup.refetch();
      if (!current.current.mounted || current.current.companyId !== companyId || current.current.staffId !== staffId) return;
      const verified = !latest.error && latest.data?.links.find(item => item.staff_member_id === staffId);
      if (!verified) { toast.error(ru ? 'Аккаунт не связан с сотрудником' : 'No active account linked'); return; }
      onViewActivity(verified.user_id, staffName ?? '');
      onOpenChange(false);
    } catch { toast.error(ru ? 'Не удалось проверить связь аккаунта' : 'Could not verify account link'); }
    finally { setCheckingActivity(false); }
  };
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="sm:max-w-md overflow-y-auto">
    <SheetHeader><SheetTitle>{ru ? 'Аккаунт сотрудника' : 'Staff account'}</SheetTitle>
      <SheetDescription>{staffName}</SheetDescription></SheetHeader>
    <div className="mt-5 space-y-4">
      {!canManage ? <p>{ru ? 'Управление связью доступно директору компании.' : 'Company directors manage account links.'}</p>
        : failed ? <div role="alert" className="space-y-3"><p>{ru ? 'Не удалось загрузить аккаунты компании.' : 'Could not load company accounts.'}</p>
          <Button variant="outline" onClick={() => { if (companyError) void reloadCompany(); else void setup.refetch(); }}>{ru ? 'Повторить' : 'Retry'}</Button></div>
        : pending ? <p role="status">{ru ? 'Загрузка аккаунтов…' : 'Loading accounts…'}</p>
        : !activeCompany ? <p>{ru ? 'Выберите компанию.' : 'Select a company.'}</p>
        : <>
          <p className="text-sm text-muted-foreground">{ru ? 'Выберите существующего участника компании. Связь не создаёт аккаунт и не меняет права доступа.' : 'Select an existing company member. Linking does not create an account or change permissions.'}</p>
          <Label htmlFor="staff-account-member">{ru ? 'Участник компании' : 'Company member'}</Label>
          <select id="staff-account-member" value={selected} onChange={event => setSelected(event.target.value)} disabled={save.isPending}
            className="w-full min-h-11 border bg-background px-3 py-2 text-sm">
            <option value="">{ru ? 'Выберите аккаунт' : 'Choose an account'}</option>
            {setup.data?.members.map(member => <option key={member.id} value={member.id}>
              {member.name}{member.email ? ` (${member.email})` : ''}
            </option>)}
          </select>
          {setup.data?.members.length === 0 && <p>{ru ? 'Нет активных участников компании.' : 'No active company members.'}</p>}
          <p className="text-sm">{link ? (ru ? 'Активный аккаунт связан.' : 'An active account is linked.') : (ru ? 'Аккаунт не связан.' : 'No account linked.')}</p>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!staffId || !selected || save.isPending || selected === link?.company_member_id} onClick={() => { void commit(selected); }}>{ru ? 'Связать аккаунт' : 'Link account'}</Button>
            {link && <Button variant="outline" disabled={save.isPending} onClick={() => { void commit(null); }}>{ru ? 'Убрать связь' : 'Unlink account'}</Button>}
            {link && <Button variant="outline" disabled={save.isPending || checkingActivity} onClick={() => { void viewActivity(); }}>{ru ? 'Лог активности' : 'Activity Log'}</Button>}
          </div>
        </>}
    </div>
  </SheetContent></Sheet>;
}
