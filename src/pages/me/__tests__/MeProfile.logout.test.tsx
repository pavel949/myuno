import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MeProfile from '../MeProfile';
const mocks = vi.hoisted(() => ({ signOut: vi.fn(), navigate: vi.fn(), error: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ signOut: mocks.signOut }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
vi.mock('@/components/layout/MeShellLayout', () => ({ MeShellLayout: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
vi.mock('@/components/account/AccountProfileCard', () => ({ AccountProfileCard: () => null }));
vi.mock('@/components/account/AccountFlatMenu', () => ({ AccountFlatMenu: () => null }));
vi.mock('@/components/pwa/DownloadAppButton', () => ({ DownloadAppButton: () => null }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.signOut.mockResolvedValue(undefined); });
describe('profile logout feedback', () => {
  it('handles refusal without success navigation or an unhandled event rejection', async () => {
    mocks.signOut.mockRejectedValue(new Error('synthetic revocation failure')); render(<MeProfile />); fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Sign-out could not be confirmed. Please try again.')); expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('navigates after confirmed logout', async () => { render(<MeProfile />); fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/')); });
});
