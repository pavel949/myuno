vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MCGuard } from '@/components/auth/MCGuard';
const state = vi.hoisted(() => ({ signedIn: true, role: 'guest', member: false }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.signedIn ? { id: 'fixture-user' } : null, isLoading: false }) }));
vi.mock('@/hooks/useResolvedContext', () => ({ useResolvedContext: () => ({ context: { role: state.role }, isLoading: false }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ companies: state.member ? [{ company_id: 'fixture-company' }] : [], activeCompany: state.member ? { company_id: 'fixture-company' } : null, isLoading: false }) }));
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname + location.search + location.hash}</output>; }
function mount() { render(<MemoryRouter initialEntries={['/mc/sequences?campaign=fixture#draft']}><Location /><Routes><Route path="/mc/sequences" element={<MCGuard><p>CRM sequences</p></MCGuard>} /><Route path="/auth" element={<p>Sign in</p>} /><Route path="/mc/onboarding" element={<p>Company setup</p>} /></Routes></MemoryRouter>); }
beforeEach(() => { state.signedIn = true; state.role = 'guest'; state.member = false; });
afterEach(cleanup);
it('retains sign-in return context for the protected sequences destination', () => {
  state.signedIn = false; mount();
  expect(screen.getByText('Sign in')).toBeInTheDocument();
  expect(decodeURIComponent(screen.getByTestId('location').textContent!)).toContain('/mc/sequences?campaign=fixture#draft');
  expect(screen.queryByText('CRM sequences')).not.toBeInTheDocument();
});
it('does not grant workspace access merely because a user signed in', () => {
  mount(); expect(screen.getByText('Company setup')).toBeInTheDocument(); expect(screen.queryByText('CRM sequences')).not.toBeInTheDocument();
});
it.each(['member', 'admin'])('preserves existing %s access without redirecting to public outreach', access => {
  state.member = access === 'member'; state.role = access === 'admin' ? 'admin' : 'guest'; mount();
  expect(screen.getByText('CRM sequences')).toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/mc/sequences?campaign=fixture#draft');
});
