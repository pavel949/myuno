import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { CanonicalPublicRedirect } from '../CanonicalPublicRedirect';
import { canonicalRedirectHref } from '@/lib/config/routes';

afterEach(cleanup);
function Destination() {
  const location = useLocation(); const navigate = useNavigate();
  return <><output data-testid="destination">{location.pathname + location.search + location.hash}</output><output data-testid="context">{JSON.stringify(location.state)}</output><button onClick={() => navigate(-1)}>Back</button></>;
}

it('replaces an old discovery URL while retaining filters, anchor and return context', () => {
  render(<MemoryRouter initialEntries={['/discover?q=before', { pathname: '/tours', search: '?q=spa&type=activity&tag=family&tag=boat', hash: '#results', state: { publicJourney: 'retained' } }]} initialIndex={1}>
    <Routes><Route path="/tours" element={<CanonicalPublicRedirect to="/experiences?type=tour" />} /><Route path="*" element={<Destination />} /></Routes>
  </MemoryRouter>);
  expect(screen.getByTestId('destination')).toHaveTextContent('/experiences?q=spa&tag=family&tag=boat&type=tour#results');
  expect(screen.getByTestId('context')).toHaveTextContent('retained');
  fireEvent.click(screen.getByText('Back'));
  expect(screen.getByTestId('destination')).toHaveTextContent('/discover?q=before');
});

it.each([
  ['/property/offplan', '?area=bang-tao&bedrooms=2', '#homes', '/property/offplan?area=bang-tao&bedrooms=2#homes'],
  ['/experiences?type=activity', '?type=tour&type=other&q=family', '', '/experiences?q=family&type=activity'],
  ['/flowers', '?category=roses&colorPalette=red&ref=legacy', '#offers', '/flowers?category=roses&colorPalette=red&ref=legacy#offers'],
  ['/discover#categories', '?q=visa', '#old', '/discover?q=visa#categories'],
])('preserves context for canonical destination %s', (target, search, hash, expected) => {
  expect(canonicalRedirectHref(target, search, hash)).toBe(expected);
});

it.each(['https://outside.invalid', '//outside.invalid', '/\\outside.invalid', 'javascript:alert(1)'])('rejects an external redirect destination %s', target => {
  expect(() => canonicalRedirectHref(target)).toThrow();
});
