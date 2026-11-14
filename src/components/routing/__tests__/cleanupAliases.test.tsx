import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/hooks/useDevelopers', () => ({ useDeveloperSlugOrId: () => ({ data: { id: 'resolved-developer' }, isLoading: false, isError: false }) }));
vi.mock('@/hooks/useNewbuildProjects', () => ({ useNewbuildProject: () => ({ data: { id: 'resolved-project' }, isLoading: false, isError: false }) }));
import { NewbuildDeveloperToHubRedirect } from '../NewbuildLegacyRedirects';
afterEach(cleanup);
function Destination() { const location = useLocation(); return <output>{location.pathname}</output>; }
it.each([
  ['known-slug', '/property/developers/resolved-developer'],
  ['00000000-0000-4000-8000-000000000001', '/property/developers/00000000-0000-4000-8000-000000000001'],
])('preserves developer identity for %s', (id, target) => {
  render(<MemoryRouter initialEntries={[`/newbuilds/developers/${id}`]}><Routes><Route path="/newbuilds/developers/:slug" element={<NewbuildDeveloperToHubRedirect />} /><Route path="/property/developers/:id" element={<Destination />} /></Routes></MemoryRouter>);
  expect(screen.getByText(target)).toBeVisible();
});
it('does not server-redirect canonical offplan routes into an unmounted detail family', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as { redirects: { source: string; destination: string; has?: { value: string }[] }[] };
  expect(config.redirects.filter(r => r.source.startsWith('/offplan') || r.source.startsWith('/property/offplan'))).toEqual([]);
  const canonical = config.redirects.find(r => r.source === '/:path*');
  expect(canonical?.destination).toBe('https://www.myuno.app/:path*');
  expect(canonical?.has?.[0].value).toBe('myuno.app');
});