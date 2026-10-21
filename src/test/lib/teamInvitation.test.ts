import { describe, expect, it } from 'vitest';
import { readTeamInvitationResult, readAdminInvitationResult, teamInvitationMessage } from '@/lib/teamInvitation';

describe('invitation UI completion honesty', () => {
  it('reads partial completion detail even when Functions returns a non-2xx error', async () => {
    const error = { context: new Response(JSON.stringify({ success: false, code: 'membership_incomplete', error: 'Invitation sent; membership incomplete', invite_email_sent: true }), { status: 409 }) };
    await expect(readTeamInvitationResult(null, error)).rejects.toThrow('Invitation sent; membership incomplete');
  });
  it('rejects a missing or legacy success payload', async () => {
    await expect(readTeamInvitationResult({ success: true }, null)).rejects.toThrow();
  });
  it.each(['en', 'ru', 'th'])('distinguishes existing account from email delivery in %s', language => {
    const existing = teamInvitationMessage({ success: true, code: 'existing_account_added', invite_email_sent: false, access_setup_required: true }, language);
    const invited = teamInvitationMessage({ success: true, code: 'invited', invite_email_sent: true, access_setup_required: true }, language);
    expect(existing).not.toBe(invited); expect(existing.length).toBeGreaterThan(40);
  });
  it('admin role failure cannot masquerade as a sent-and-ready invite', async () => {
    await expect(readAdminInvitationResult({ success: true, invite_email_sent: true, role_granted: false }, null)).rejects.toThrow();
  });
  it('admin operator link must be confirmed when requested', async () => {
    await expect(readAdminInvitationResult({ success: true, invite_email_sent: true, role_granted: true, transfer_operator_linked: false }, null, true)).rejects.toThrow();
  });
  it('admin partial completion response is shown instead of generic transport error', async () => {
    await expect(readAdminInvitationResult(null, { context: new Response(JSON.stringify({ error: 'Invitation sent; role not granted' }), { status: 409 }) })).rejects.toThrow('Invitation sent; role not granted');
  });
});
