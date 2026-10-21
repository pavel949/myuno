export interface TeamInvitationResult {
  success: boolean;
  code: string;
  invite_email_sent: boolean | null;
  access_setup_required: boolean;
  user_id?: string;
  member_id?: string;
  membership_status?: string;
  error?: string;
}

export async function readTeamInvitationResult(data: unknown, error: unknown): Promise<TeamInvitationResult> {
  let result = data;
  if (error && typeof error === 'object' && 'context' in error && error.context instanceof Response) {
    result = await error.context.clone().json().catch(() => null);
  }
  if (!result || typeof result !== 'object' || !('code' in result)) {
    throw new Error('Invitation result unavailable. Check account and membership state before retrying.');
  }
  const outcome = result as TeamInvitationResult;
  if (outcome.success !== true || !['invited', 'already_member', 'existing_account_added'].includes(outcome.code)) {
    throw new Error(outcome.error || 'Invitation incomplete. Review the account before retrying.');
  }
  return outcome;
}

export function teamInvitationMessage(result: TeamInvitationResult, language: string): string {
  const t = (en: string, ru: string, th: string) => language === 'ru' ? ru : language === 'th' ? th : en;
  if (result.code === 'already_member') return t(
    'Already a company member. Existing access was preserved; review permissions and Operating Spaces.',
    'Уже в компании. Права сохранены; проверьте разрешения и рабочие пространства.',
    'เป็นสมาชิกบริษัทอยู่แล้ว สิทธิ์เดิมยังคงอยู่ โปรดตรวจสอบสิทธิ์และพื้นที่ปฏิบัติงาน');
  if (result.code === 'existing_account_added') return t(
    'Existing account added. They can sign in as usual. Configure permissions and Operating Spaces next; no email was sent.',
    'Существующий аккаунт добавлен. Вход обычным способом. Настройте права и рабочие пространства; письмо не отправлялось.',
    'เพิ่มบัญชีที่มีอยู่แล้ว เข้าสู่ระบบได้ตามปกติ โปรดกำหนดสิทธิ์และพื้นที่ปฏิบัติงาน ยังไม่ได้ส่งอีเมล');
  return t('Secure invitation sent. Configure permissions and Operating Spaces next.',
    'Безопасное приглашение отправлено. Теперь настройте права и рабочие пространства.',
    'ส่งคำเชิญที่ปลอดภัยแล้ว โปรดกำหนดสิทธิ์และพื้นที่ปฏิบัติงาน');
}

export async function readAdminInvitationResult(data: unknown, error: unknown, requiresOperatorLink = false): Promise<void> {
  let result = data;
  if (error && typeof error === 'object' && 'context' in error && error.context instanceof Response) {
    result = await error.context.clone().json().catch(() => null);
  }
  const outcome = result as { success?: boolean; invite_email_sent?: boolean; role_granted?: boolean; transfer_operator_linked?: boolean; error?: string } | null;
  if (!outcome || outcome.success !== true || outcome.invite_email_sent !== true || outcome.role_granted !== true || (requiresOperatorLink && outcome.transfer_operator_linked !== true)) {
    throw new Error(outcome?.error || 'Invitation or access setup is unconfirmed. Review the account before retrying.');
  }
}
