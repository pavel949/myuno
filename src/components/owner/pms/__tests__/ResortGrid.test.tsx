import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ResortGrid } from '../ResortGrid';
import type { DayTotals, GridCell, GridRow } from '@/lib/pms/availabilityGrid';
import type { KeyProperty } from '@/lib/pms/complexHierarchy';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (k: string) => k }),
}));

const key: KeyProperty = {
  id: 'k1', parentId: null, projectId: 'p', ownerId: null, unitNumber: 'A1', title: 'Villa A1',
  titleRu: null, isBookable: true, isActive: true, pricePerNight: 100, currency: 'THB',
};

function cell(date: string, state: GridCell['state'], bookingId: string | null = null): GridCell {
  return { date, state, bookingId, rate: 100, source: null, guestName: null, conflict: false };
}

const row: GridRow = {
  key, villaId: 'k1', isWholeVilla: true, ical: 'ok',
  cells: [cell('2026-11-01', 'free'), cell('2026-11-02', 'booked', 'b1'), cell('2026-11-03', 'family_held', 'b2')],
};
const totals: DayTotals[] = row.cells.map(c => ({ date: c.date, freeKeys: c.state === 'free' ? 1 : 0, occupiedKeys: c.state === 'free' ? 0 : 1, arrivals: 0, departures: 0 }));

describe('ResortGrid', () => {
  it('routes free and booked cells to their handlers; family_held is inert', () => {
    const onFree = vi.fn();
    const onBooked = vi.fn();
    render(<ResortGrid rows={[row]} totals={totals} villaLabels={new Map([['k1', 'A1 · Villa A1']])} onFreeCell={onFree} onBookedCell={onBooked} />);
    fireEvent.click(screen.getByRole('button', { name: /2026-11-01/ }));
    fireEvent.click(screen.getByRole('button', { name: /2026-11-02/ }));
    expect(onFree).toHaveBeenCalledWith('k1', '2026-11-01');
    expect(onBooked).toHaveBeenCalledWith('k1', 'b1');
    expect(screen.getByRole('button', { name: /2026-11-03/ })).toBeDisabled();
  });
});
