import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignupIntegrityModal, type IntegrityReport } from '../SignupIntegrityModal';
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null, session: null, isLoading: false }) }));
const invoke = vi.hoisted(() => vi.fn(() => { throw new Error('Live auth transport forbidden'); }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const complete: IntegrityReport = { ok: true, profile_exists: true, phone_saved: true, phone_matches: true, terms_accepted: true, privacy_accepted: true, warnings: [] };
const props = { open: true, onClose: vi.fn(), userId: null, expectedPhone: '+66000000000', initialError: null, emailConfirmationRequired: false };
const languages = [
  { language: 'ru' as const, positive: ['Профиль создан', 'Телефон сохранён', 'Условия использования приняты', 'Политика конфиденциальности принята'], review: ['Профиль требует проверки', 'Телефон требует проверки', 'Принятие условий использования требует проверки', 'Принятие политики конфиденциальности требует проверки'], mismatch: 'Телефон не совпадает с введённым', success: 'Все данные сохранены.' },
  { language: 'en' as const, positive: ['Profile created', 'Phone saved', 'Terms of Service accepted', 'Privacy Policy accepted'], review: ['Profile needs review', 'Phone needs review', 'Terms acceptance needs review', 'Privacy acceptance needs review'], mismatch: "Stored phone doesn't match the value you entered", success: 'All data saved.' },
  { language: 'th' as const, positive: ['สร้างโปรไฟล์แล้ว', 'บันทึกเบอร์โทรแล้ว', 'ยอมรับเงื่อนไขแล้ว', 'ยอมรับนโยบายความเป็นส่วนตัวแล้ว'], review: ['ต้องตรวจสอบโปรไฟล์', 'ต้องตรวจสอบเบอร์โทร', 'ต้องตรวจสอบการยอมรับเงื่อนไข', 'ต้องตรวจสอบการยอมรับนโยบายความเป็นส่วนตัว'], mismatch: 'เบอร์โทรไม่ตรงกับที่กรอก', success: 'ข้อมูลทั้งหมดถูกบันทึกแล้ว' },
];
for (const locale of languages) describe(locale.language, () => {
  for (const state of ['false', 'missing'] as const) it(`${state} flags never announce affirmative row labels`, () => {
    const report = state === 'false'
      ? { ...complete, ok: false, profile_exists: false, phone_saved: false, phone_matches: false, terms_accepted: false, privacy_accepted: false }
      : { ok: false, warnings: [] } as unknown as IntegrityReport;
    render(<SignupIntegrityModal {...props} language={locale.language} initialReport={report} />);
    for (const label of locale.positive) expect(screen.queryByText(label, { exact: true })).not.toBeInTheDocument();
    for (const label of locale.review) expect(screen.getByText(label, { exact: true })).toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalled();
  });
  it('saved but mismatched phone uses review wording and retains the mismatch explanation', () => {
    render(<SignupIntegrityModal {...props} language={locale.language} initialReport={{ ...complete, ok: false, phone_matches: false }} />);
    expect(screen.queryByText(locale.positive[1], { exact: true })).not.toBeInTheDocument();
    expect(screen.getByText(locale.review[1] + ' — ' + locale.mismatch, { exact: true })).toBeInTheDocument();
    for (const i of [0, 2, 3]) expect(screen.getByText(locale.positive[i], { exact: true })).toBeInTheDocument();
  });
  it('full success retains the affirmative labels and success banner', () => {
    render(<SignupIntegrityModal {...props} language={locale.language} initialReport={complete} />);
    for (const label of locale.positive) expect(screen.getByText(label, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(locale.success, { exact: true })).toBeInTheDocument();
    for (const label of locale.review) expect(screen.queryByText(label, { exact: true })).not.toBeInTheDocument();
  });
  it('missing report does not create rows or claim saved success', () => {
    render(<SignupIntegrityModal {...props} language={locale.language} initialReport={null} />);
    for (const label of [...locale.positive, ...locale.review, locale.success]) expect(screen.queryByText(label, { exact: true })).not.toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalled();
  });
});
