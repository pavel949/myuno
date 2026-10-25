import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MCGuard } from '@/components/auth/MCGuard';
import { mcRoutes } from '@/components/layout/routes/mcRoutes';
import { postAuthDestination } from '../postAuthDestination';
const state = vi.hoisted(() => ({ member: true }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-staff' }, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useResolvedContext', () => ({ useResolvedContext: () => ({ context: { role: 'staff', permissions: [] }, isLoading: false, isVerifying: false }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ companies: state.member ? [{ company_id: 'synthetic-company' }] : [], activeCompany: state.member ? { company_id: 'synthetic-company', role: 'staff' } : null, isLoading: false }) }));
vi.mock('@/components/layout/pageRegistry', () => new Proxy({}, { has: () => true, get: (_target, key) => key === 'then' ? undefined : () => <p>{String(key)}</p> }));
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => children }));
afterEach(() => { cleanup(); state.member = true; });
function mount(member: boolean) { state.member = member; const destination = postAuthDestination({ redirectPath: '/', activeRole: 'staff', availableRoles: ['staff'], hasMCMembership: true, needsAccountType: false, isMCPortal: false }); return render(<MemoryRouter initialEntries={[destination.path]}><Routes><Route path="/mc" element={<MCGuard><Outlet /></MCGuard>}>{mcRoutes}</Route><Route path="/mc/onboarding" element={<p>Membership required</p>} /><Route path="*" element={<p>Missing route</p>} /></Routes></MemoryRouter>); }
import { Outlet } from 'react-router-dom';
it('resolves established staff through actual MC route registration and guard', async () => { mount(true); expect(await screen.findByText('CrmTasksPage')).toBeInTheDocument(); expect(screen.queryByText('Missing route')).not.toBeInTheDocument(); });
it('never admits task workspace when real MCGuard lacks membership', async () => { mount(false); await waitFor(() => expect(screen.getByText('Membership required')).toBeInTheDocument()); expect(screen.queryByText('CrmTasksPage')).not.toBeInTheDocument(); });
