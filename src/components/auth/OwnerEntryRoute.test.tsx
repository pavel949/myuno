import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { OwnerEntryRoute } from './OwnerEntryRoute';

const state = vi.hoisted(() => ({ ownerType: 'self_managed' as 'self_managed' | 'mc_portal', loading: false }));
vi.mock('@/hooks/useOwnerType', () => ({ useOwnerType: () => ({ isMCPortal: state.ownerType === 'mc_portal', isLoading: state.loading }) }));
function Probe() { const location = useLocation(); return <output data-testid="location">{location.pathname + location.search + location.hash}</output>; }
afterEach(cleanup);
it.each([
  ['self_managed', '/my-property?tab=one#details'],
  ['mc_portal', '/mc/setup?tab=one#details'],
] as const)('routes %s owners to the matching existing workspace', (ownerType, expected) => {
  state.ownerType = ownerType;
  render(<MemoryRouter initialEntries={['/owner/onboarding?tab=one#details']}><OwnerEntryRoute /><Probe /></MemoryRouter>);
  expect(screen.getByTestId('location')).toHaveTextContent(expected);
});
