import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NbCompareProvider } from '../NbCompareProvider';
import { ProjectCompareAction, ProjectCompareSelection } from '../ProjectCompareAction';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
const key = 'myuno_compare_newbuilds';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

function Destination() {
  const location = useLocation();
  const href = location.state?.publicJourneyOrigin?.href;
  return <output>{location.pathname}|{href}</output>;
}

function Scenario() {
  return (
    <MemoryRouter initialEntries={['/property/offplan/search?q=Vega&district=Bang+Tao']}>
      <NbCompareProvider>
        <Routes>
          <Route path="/property/offplan/search" element={<><ProjectCompareSelection />
            {['A', 'B', 'C', 'D'].map(id => <ProjectCompareAction key={id} id={id} name={id} />)}</>} />
          <Route path="/newbuilds/compare" element={<><Destination /><ProjectCompareSelection /></>} />
        </Routes>
      </NbCompareProvider>
    </MemoryRouter>
  );
}

it('compares as a guest, caps selection at three and preserves filters into the comparison page', () => {
  render(<Scenario />);
  expect(screen.queryByRole('link', { name: 'Open comparison' })).toBeNull();
  const a = screen.getByRole('button', { name: 'Compare project A' });
  fireEvent.click(a);
  expect(a).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('status')).toHaveTextContent('Selected for comparison: 1 of 3');
  fireEvent.click(screen.getByRole('button', { name: 'Compare project B' }));
  fireEvent.click(screen.getByRole('button', { name: 'Compare project C' }));
  expect(screen.getByRole('button', { name: 'Compare project D' })).toBeDisabled();
  fireEvent.click(a);
  expect(screen.getByRole('button', { name: 'Compare project D' })).toBeEnabled();
  fireEvent.click(screen.getByRole('link', { name: 'Open comparison' }));
  expect(screen.getByText('/newbuilds/compare|/property/offplan/search?q=Vega&district=Bang+Tao')).toBeVisible();
  expect(screen.getAllByRole('status').some(s => within(s).queryByText('Selected for comparison: 2 of 3'))).toBe(true);
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([{ id: 'B' }, { id: 'C' }]);
});

it('restores identity only from old browser data and ignores duplicate or invalid entries', () => {
  localStorage.setItem(key, JSON.stringify([{ id: 'B', name_en: 'Old name', price_from: 100 }, { id: 'B' }, null, { id: 123 }]));
  render(<Scenario />);
  expect(screen.getByRole('button', { name: 'Compare project B' })).toHaveAttribute('aria-pressed', 'true');
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([{ id: 'B' }]);
  fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
  expect(screen.queryByRole('link', { name: 'Open comparison' })).toBeNull();
});
