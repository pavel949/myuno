import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { useUiSignOut } from '../useUiSignOut';
const mock = vi.hoisted(() => ({ signOut: vi.fn(), error: vi.fn(), language: 'en' }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ signOut: mock.signOut }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mock.language }) }));
vi.mock('sonner', () => ({ toast: { error: mock.error } }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mock.language = 'en'; mock.signOut.mockResolvedValue(undefined); });
describe('UI-only sign-out adapter', () => {
  it('returns confirmed success without inventing a separate auth operation', async () => {
    const view = renderHook(() => useUiSignOut()); await expect(view.result.current()).resolves.toBe(true); expect(mock.signOut).toHaveBeenCalledTimes(1); expect(mock.error).not.toHaveBeenCalled();
  });
  it.each([
    ['en', 'Sign-out could not be confirmed. Please try again.'],
    ['ru', 'Не удалось подтвердить выход. Попробуйте ещё раз.'],
    ['th', 'ยืนยันการออกจากระบบไม่สำเร็จ โปรดลองอีกครั้ง'],
  ])('returns explicit failure with %s feedback instead of a rejected UI event', async (language, message) => {
    mock.language = language; mock.signOut.mockRejectedValue(new Error('synthetic failure')); const view = renderHook(() => useUiSignOut());
    await expect(view.result.current()).resolves.toBe(false); expect(mock.error).toHaveBeenCalledWith(message);
  });
});
