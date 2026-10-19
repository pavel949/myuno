import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompanyAccessContext, useCompanyTeam, useInviteCompanyMember, useChangeCompanyMemberAccess, TEAM_ACCESS_ENABLED } from '@/hooks/useCompanyTeam';
import { teamInvitationMessage } from '@/lib/teamInvitation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export function CompanyAccessPanel() {
  const { language } = useLanguage();
  const t = (en: string, ru: string, th: string) => language === 'ru' ? ru : language === 'th' ? th : en;
  const lifetime = useCompanyAccessContext();
  const team = useCompanyTeam(lifetime);
  const invite = useInviteCompanyMember(lifetime);
  const access = useChangeCompanyMemberAccess(lifetime);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const sending = useRef(false);
  const changing = useRef(false);
  useEffect(() => {
    sending.current = false; changing.current = false;
    setName(''); setEmail(''); setRole('staff'); setMessage(''); setError('');
  }, [lifetime]);
  const busy = invite.isPending || access.isPending;
  const disabled = !TEAM_ACCESS_ENABLED || busy || team.isFetching || !team.data || team.data.spacesEnforced !== true;
  const errorText = t('Could not verify the change. Refresh and review account, membership and permissions before retrying.',
    'Не удалось подтвердить изменение. Обновите данные и проверьте аккаунт, участие и права перед повтором.',
    'ยืนยันการเปลี่ยนแปลงไม่ได้ โปรดรีเฟรชและตรวจสอบบัญชี สมาชิก และสิทธิ์ก่อนลองอีกครั้ง');

  const sendInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled || sending.current) return;
    const current = lifetime.capture();
    sending.current = true;
    setError(''); setMessage('');
    try {
      const result = await invite.mutateAsync({ full_name: name.trim(), email: email.trim().toLowerCase(), role });
      if (!current()) return;
      setMessage(teamInvitationMessage(result, language));
      setName(''); setEmail('');
    } catch (failure) {
      if (!current()) return;
      setError(failure instanceof Error ? failure.message : errorText);
    } finally { if (current()) sending.current = false; }
  };
  const changeAccess = async (change: Parameters<typeof access.mutateAsync>[0]) => {
    if (disabled || changing.current) return;
    const current = lifetime.capture();
    changing.current = true;
    setError(''); setMessage('');
    try {
      await access.mutateAsync(change);
      if (!current()) return;
      setMessage(t('Access change saved. Invitation delivery and first login still need separate verification.',
        'Права сохранены. Доставка приглашения и первый вход проверяются отдельно.',
        'บันทึกสิทธิ์แล้ว ยังต้องตรวจสอบการส่งคำเชิญและการเข้าสู่ระบบครั้งแรกแยกต่างหาก'));
    } catch { if (current()) setError(errorText); }
    finally { if (current()) changing.current = false; }
  };

  return <Card className="mb-5"><CardContent className="p-4 space-y-4">
    <div>
      <h2 className="font-semibold">{t('Company account access', 'Доступ аккаунтов компании', 'สิทธิ์บัญชีของบริษัท')}</h2>
      <p className="text-sm text-muted-foreground">{t(
        'Invite an account, then explicitly assign property permissions and Operating Spaces. HR directory entries are not login identities.',
        'Пригласите аккаунт, затем назначьте права на объекты и рабочие пространства. Запись сотрудника в справочнике не является аккаунтом.',
        'เชิญบัญชี แล้วกำหนดสิทธิ์ทรัพย์สินและพื้นที่ปฏิบัติงาน รายชื่อพนักงานไม่ใช่บัญชีเข้าสู่ระบบ')}
      </p>
    </div>
    {!TEAM_ACCESS_ENABLED && <p role="status" className="text-sm text-muted-foreground">{t(
      'Secure employee access awaits controlled activation. Invites and access changes are disabled.',
      'Безопасный доступ сотрудников ожидает контролируемой активации. Приглашения и изменение прав отключены.',
      'การเข้าถึงของพนักงานกำลังรอการเปิดใช้งานที่ตรวจสอบแล้ว ขณะนี้ปิดการเชิญและการเปลี่ยนสิทธิ์')}
    </p>}
    {team.isLoading ? <p role="status">{t('Loading access…', 'Загрузка доступа…', 'กำลังโหลดสิทธิ์…')}</p>
      : team.isError ? <div role="alert"><p>{t('Access data is unavailable or you cannot manage this company.', 'Данные доступа недоступны или у вас нет права управлять этой компанией.', 'ข้อมูลสิทธิ์ไม่พร้อมใช้งาน หรือคุณไม่มีสิทธิ์จัดการบริษัทนี้')}</p><Button variant="outline" onClick={() => team.refetch()}>{t('Retry', 'Повторить', 'ลองอีกครั้ง')}</Button></div>
        : team.data && <>
          {!team.data.spacesEnforced && <p role="status" className="text-sm text-destructive">{t(
            'Operating Space isolation is not enabled for this company. Invitations and access controls stay disabled until the approved security cutover.',
            'Изоляция рабочих пространств компании не включена. Приглашения и изменение прав отключены до одобренного переключения защиты.',
            'บริษัทยังไม่ได้เปิดการแยกพื้นที่ปฏิบัติงาน ปิดการเชิญและการเปลี่ยนสิทธิ์จนกว่าจะผ่านการเปิดใช้ความปลอดภัย')}
          </p>}
          <form onSubmit={sendInvite} className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="company-invite-name">{t('Full name', 'Полное имя', 'ชื่อเต็ม')}</Label><Input id="company-invite-name" value={name} onChange={event => setName(event.target.value)} required maxLength={160} disabled={disabled} /></div>
            <div><Label htmlFor="company-invite-email">Email</Label><Input id="company-invite-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} disabled={disabled} /></div>
            <div><Label htmlFor="company-invite-role">{t('Company role', 'Роль в компании', 'บทบาทในบริษัท')}</Label><select id="company-invite-role" className="w-full h-10 border bg-background px-3" value={role} onChange={event => setRole(event.target.value)} disabled={disabled}>
              <option value="staff">{t('Staff', 'Сотрудник', 'พนักงาน')}</option><option value="manager">{t('Manager (operational role)', 'Менеджер (операционная роль)', 'ผู้จัดการ (บทบาทปฏิบัติการ)')}</option><option value="accountant">{t('Accountant', 'Бухгалтер', 'นักบัญชี')}</option>
            </select></div>
            <Button type="submit" className="self-end" disabled={disabled || !name.trim() || !email.trim()}>{t('Send secure invitation', 'Отправить безопасное приглашение', 'ส่งคำเชิญที่ปลอดภัย')}</Button>
          </form>
          {role === 'manager' && <p role="status" className="text-sm text-destructive">{t('Manager is an operational role and may grant access beyond these module switches. Choose Staff for a content-only employee.', 'Менеджер — операционная роль, которая может давать доступ сверх переключателей модулей. Для работы только с контентом выберите «Сотрудник».', 'ผู้จัดการเป็นบทบาทปฏิบัติการและอาจมีสิทธิ์นอกเหนือจากสวิตช์โมดูล เลือกพนักงานสำหรับงานเฉพาะเนื้อหา')}</p>}
          <p className="text-xs text-muted-foreground">{t('New accounts receive a secure setup link. Existing accounts keep their sign-in and permissions; no password is generated or emailed.', 'Новые аккаунты получают безопасную ссылку. Для существующих вход и права сохраняются; пароль не создаётся и не отправляется.', 'บัญชีใหม่จะได้รับลิงก์ตั้งค่าที่ปลอดภัย บัญชีเดิมคงการเข้าสู่ระบบและสิทธิ์เดิม ไม่มีการสร้างหรือส่งรหัสผ่านทางอีเมล')}</p>
          {team.data.members.length === 0 && <p>{t('No company members found.', 'Участники компании не найдены.', 'ไม่พบสมาชิกบริษัท')}</p>}
          <ul className="space-y-3">{team.data.members.map(member => {
            const permission = team.data.permissions.find(item => item.user_id === member.user_id && item.module === 'properties');
            const privileged = ['director', 'admin'].includes(member.role);
            const locked = disabled || member.is_active !== true || privileged;
            const spaces = team.data.spaces.filter(space => space.is_active || team.data.assignments.some(item => item.company_member_id === member.id && item.operating_space_id === space.id && item.is_active));
            return <li key={member.id} className="border p-3 space-y-3">
              <div className="break-words"><p className="font-medium">{member.full_name || member.email || member.user_id}</p><p className="text-xs text-muted-foreground">{member.email || member.user_id} · {member.role} · {member.is_active ? t('Active', 'Активен', 'ใช้งาน') : t('Inactive', 'Неактивен', 'ไม่ใช้งาน')}</p></div>
              {member.role === 'manager' && <p className="text-sm text-destructive">{t('Legacy manager roles can grant operational access independently of these switches. Review the role before treating this account as content-only.', 'Старая роль менеджера может давать операционный доступ независимо от переключателей. Проверьте роль перед предоставлением доступа только к контенту.', 'บทบาทผู้จัดการเดิมอาจให้สิทธิ์ปฏิบัติการนอกเหนือจากสวิตช์เหล่านี้ โปรดตรวจสอบบทบาทก่อนถือว่าบัญชีมีสิทธิ์เฉพาะเนื้อหา')}</p>}
              {privileged ? <p className="text-sm">{t('Company administrator. Privileged roles are managed separately.', 'Администратор компании. Привилегированные роли управляются отдельно.', 'ผู้ดูแลบริษัท บทบาทสิทธิ์สูงจัดการแยกต่างหาก')}</p> : <>
                <div className="flex flex-wrap gap-4">
                  <Label htmlFor={`member-view-${member.id}`} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><Checkbox className="h-5 w-5 min-h-0" id={`member-view-${member.id}`} checked={permission?.can_view === true} disabled={locked} onCheckedChange={checked => changeAccess({ memberId: member.id, kind: 'module', module: 'properties', capability: 'view', enabled: checked === true })} />{t('View properties', 'Просмотр объектов', 'ดูทรัพย์สิน')}</Label>
                  <Label htmlFor={`member-edit-${member.id}`} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><Checkbox className="h-5 w-5 min-h-0" id={`member-edit-${member.id}`} checked={permission?.can_edit === true} disabled={locked} onCheckedChange={checked => changeAccess({ memberId: member.id, kind: 'module', module: 'properties', capability: 'edit', enabled: checked === true })} />{t('Edit property drafts', 'Редактирование черновиков', 'แก้ไขร่างทรัพย์สิน')}</Label>
                </div>
                <div className="flex flex-wrap gap-4">{(['pricing', 'bookings'] as const).map(module => {
                  const current = team.data.permissions.find(item => item.user_id === member.user_id && item.module === module);
                  return <Label key={module} htmlFor={`member-${module}-${member.id}`} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                    <Checkbox className="h-5 w-5 min-h-0" id={`member-${module}-${member.id}`} checked={current?.can_edit === true} disabled={locked}
                      onCheckedChange={checked => changeAccess({ memberId: member.id, kind: 'module', module, capability: 'edit', enabled: checked === true })} />
                    {module === 'pricing' ? t('Edit tariffs', 'Редактирование тарифов', 'แก้ไขอัตราราคา') : t('Edit bookings', 'Редактирование бронирований', 'แก้ไขการจอง')}
                  </Label>;
                })}</div>
                <p className="text-xs text-muted-foreground">{t('Tariff and booking rights are explicit, scoped permissions. Finance access is unchanged.', 'Права на тарифы и бронирования назначаются отдельно в рамках выбранных пространств. Финансовый доступ не меняется.', 'สิทธิ์ราคาและการจองกำหนดแยกตามพื้นที่ สิทธิ์การเงินยังคงเดิม')}</p>
                <div><p className="text-sm font-medium mb-2">{t('Operating Spaces', 'Рабочие пространства', 'พื้นที่ปฏิบัติงาน')}</p>
                  {spaces.length === 0 ? <p className="text-sm text-muted-foreground">{t('No active Spaces available. Property access is not ready.', 'Нет активных пространств. Доступ к объектам не готов.', 'ไม่มีพื้นที่ที่ใช้งานอยู่ การเข้าถึงทรัพย์สินยังไม่พร้อม')}</p> : <div className="flex flex-wrap gap-4">{spaces.map(space => {
                    const assigned = team.data.assignments.some(item => item.company_member_id === member.id && item.operating_space_id === space.id && item.is_active);
                    return <Label key={space.id} htmlFor={`member-space-${member.id}-${space.id}`} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><Checkbox className="h-5 w-5 min-h-0" id={`member-space-${member.id}-${space.id}`} checked={assigned} disabled={locked} onCheckedChange={checked => changeAccess({ memberId: member.id, kind: 'space', spaceId: space.id, active: checked === true })} />{language === 'ru' ? space.name_ru : space.name_en}{!space.is_active && ` (${t('inactive', 'неактивно', 'ไม่ใช้งาน')})`}</Label>;
                  })}</div>}
                </div>
              </>}
            </li>;
          })}</ul>
        </>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </CardContent></Card>;
}
