import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { AgentEntryRedirect, type AgentEntry } from '@/components/landings/AgentEntryRedirect';
import AgentLandingPage from '../AgentLandingPage';
import PropertySearchRedirect from '@/components/property/PropertySearchRedirect';
const { rpc, invoke } = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn().mockResolvedValue({ data: {} }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc, functions: { invoke } } }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useCapitalIntroRequest', () => ({ useCapitalIntroRequest: () => ({ isPending: false }) }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
vi.mock('@/components/miniapp/LandingLayout', () => ({ LandingLayout: ({ children, heroCta }: { children: React.ReactNode; heroCta: { label: string; onClick: () => void } }) => <main><button onClick={heroCta.onClick}>{heroCta.label}</button>{children}</main> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
function LocationProof() { const l = useLocation(); return <output data-testid="location">{JSON.stringify({ ...l })}</output>; }
function mount(entry = '/for/agent') {
 return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } })}><MemoryRouter initialEntries={[{ pathname: entry.split('?')[0], search: entry.includes('?') ? '?' + entry.split('?')[1].split('#')[0] : '', hash: entry.includes('#') ? '#' + entry.split('#')[1] : '', state: { origin: 'synthetic-agent' } }]}><LocationProof /><Routes><Route path="/for/agent" element={<AgentLandingPage />} />{(['join','dashboard','resources'] as AgentEntry[]).map(kind => <Route key={kind} path={'/agent/' + kind} element={<AgentEntryRedirect entry={kind} />} />)}<Route path="/property/browse" element={<PropertySearchRedirect />} /><Route path="/property/search" element={<p>Public catalogue</p>} /><Route path="*" element={<p>No privileged workspace</p>} /></Routes></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { rpc.mockReset(); invoke.mockClear(); });
describe('public agent entry contracts', () => {
 it.each(['join','dashboard','resources'] as AgentEntry[])('redirects exact legacy %s preserving context without privileged destination', async kind => {
  mount('/agent/' + kind + '?ref=campaign#bookmark');
  await waitFor(() => expect(JSON.parse(screen.getByTestId('location').textContent!).pathname).toBe(kind === 'resources' ? '/property/search' : '/for/agent'));
  const location = JSON.parse(screen.getByTestId('location').textContent!);
  expect(location.search).toContain('ref=campaign'); expect(location.hash).toBe('#bookmark'); expect(location.state).toEqual({ origin: 'synthetic-agent' });
  if (kind !== 'resources') expect(location.search).toContain('agentIntent=' + (kind === 'dashboard' ? 'workspace' : 'cooperation'));
  expect(rpc).not.toHaveBeenCalled(); expect(invoke).not.toHaveBeenCalled();
 });
 it('does not create a wildcard agent portal or enrol through navigation', () => { mount('/agent/private'); expect(screen.getByText('No privileged workspace')).toBeInTheDocument(); expect(rpc).not.toHaveBeenCalled(); });
 it('uses native catalogue link and preserves campaign on workspace enquiry', async () => {
  mount('/for/agent?ref=campaign');
  expect(screen.getByRole('link', { name: /Public property catalogue/ })).toHaveAttribute('href', '/property/browse');
  fireEvent.click(screen.getByRole('link', { name: /Ask about workspace access/ }));
  await waitFor(() => expect(screen.getByTestId('location').textContent).toContain('agentIntent=workspace'));
  expect(screen.getByTestId('location').textContent).toContain('ref=campaign');
  expect(screen.queryByText('Agent dashboard')).not.toBeInTheDocument();
 });
 it.each([null, '', 'receipt-synthetic'])('only acknowledges a nonempty persisted receipt: %s', async receipt => {
  rpc.mockResolvedValue({ data: receipt, error: null }); mount('/for/agent?agentIntent=workspace');
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Synthetic agent' } });
  fireEvent.change(screen.getByLabelText(/^Phone/), { target: { value: '+66000000000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save enquiry' }));
  await waitFor(() => expect(rpc).toHaveBeenCalledWith('submit_consultation_request', expect.objectContaining({ payload: expect.objectContaining({ request_type: 'property_consultation', vertical_id: 'properties', entry_point: '/for/agent?agentIntent=workspace', user_id: null }) })));
  if (receipt) { expect(await screen.findByText(/Enquiry saved. Agent approval/)).toBeInTheDocument(); expect(invoke).toHaveBeenCalledWith('notify-admin-order', expect.anything()); }
  else { expect(await screen.findByRole('alert')).toHaveTextContent('Request saving was not confirmed'); expect(invoke).not.toHaveBeenCalled(); }
 });
 it('mounts only the three explicit compatibility paths in the actual route registry', () => {
  const source = readFileSync('src/components/layout/AnimatedRoutes.tsx', 'utf8');
  for (const kind of ['join','dashboard','resources']) expect(source).toContain(`path="/agent/${kind}" element={<AgentEntryRedirect entry="${kind}" />}`);
  expect(source).not.toContain('path="/agent/*"');
 });
});
