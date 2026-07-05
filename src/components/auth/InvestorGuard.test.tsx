/**
 * Security regression test for InvestorGuard (P5 hardening — Sprint 1 Phase 0).
 *
 * Locks the invariant that access to the confidential Tier-3 workspace is
 * granted ONLY by a server-resolved role — never by a self-assignable persona.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InvestorGuard } from './InvestorGuard';

const authMock = vi.fn();
const contextMock = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authMock(),
}));
vi.mock('@/hooks/useResolvedContext', () => ({
  useResolvedContext: () => contextMock(),
}));
vi.mock('@/components/uno/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="spinner" />,
}));

const renderGuard = () =>
  render(
    <MemoryRouter initialEntries={['/capital']}>
      <Routes>
        <Route
          path="/capital"
          element={
            <InvestorGuard>
              <div data-testid="capital-workspace">DEAL DATA</div>
            </InvestorGuard>
          }
        />
        <Route path="/invest" element={<div data-testid="invest-hub">public</div>} />
        <Route path="/auth" element={<div data-testid="auth">login</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('InvestorGuard (P5)', () => {
  beforeEach(() => {
    authMock.mockReset();
    contextMock.mockReset();
  });

  it('shows a spinner while auth/context load', () => {
    authMock.mockReturnValue({ user: null, isLoading: true });
    contextMock.mockReturnValue({ context: null, isLoading: true, isAdminMode: false });
    renderGuard();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('redirects an unauthenticated user to /auth', () => {
    authMock.mockReturnValue({ user: null, isLoading: false });
    contextMock.mockReturnValue({ context: null, isLoading: false, isAdminMode: false });
    renderGuard();
    expect(screen.getByTestId('auth')).toBeInTheDocument();
    expect(screen.queryByTestId('capital-workspace')).not.toBeInTheDocument();
  });

  it('DENIES an authed user with no privileged server role (persona is not enough)', () => {
    // Represents any visitor who self-assigned the `investor` persona: the guard
    // no longer reads personas, so a non-privileged server role must be refused.
    authMock.mockReturnValue({ user: { id: 'u1' }, isLoading: false });
    contextMock.mockReturnValue({ context: { role: 'user' }, isLoading: false, isAdminMode: false });
    renderGuard();
    expect(screen.getByTestId('invest-hub')).toBeInTheDocument();
    expect(screen.queryByTestId('capital-workspace')).not.toBeInTheDocument();
  });

  it('GRANTS access on a server-resolved capital_team role', () => {
    authMock.mockReturnValue({ user: { id: 'u2' }, isLoading: false });
    contextMock.mockReturnValue({ context: { role: 'capital_team' }, isLoading: false, isAdminMode: false });
    renderGuard();
    expect(screen.getByTestId('capital-workspace')).toBeInTheDocument();
  });

  it('GRANTS access in admin mode', () => {
    authMock.mockReturnValue({ user: { id: 'u3' }, isLoading: false });
    contextMock.mockReturnValue({ context: { role: 'user' }, isLoading: false, isAdminMode: true });
    renderGuard();
    expect(screen.getByTestId('capital-workspace')).toBeInTheDocument();
  });
});
