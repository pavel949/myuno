import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ProjectInfoCard } from '../ProjectInfoCard';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(cleanup);
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
describe('unit to informational complex context', () => {
  it('shows only canonical facilities, excluding project metadata and duplicate aliases', () => {
    render(<MemoryRouter><ProjectInfoCard project={{ id: 'complex', name_en: 'Complex', name_ru: '', amenities: ['pool', 'swimming_pool', 'gym', 'set_listed', 'early_delivery', '637_units', 'bang_tao'] }} /></MemoryRouter>);
    expect(screen.getByText('Project Amenities')).toBeInTheDocument();
    expect(screen.getAllByText('Pool')).toHaveLength(1);
    expect(screen.getByText('Gym')).toBeInTheDocument();
    for (const metadata of ['set_listed', 'early_delivery', '637_units', 'bang_tao']) expect(screen.queryByText(metadata)).not.toBeInTheDocument();
    expect(screen.queryByText('+1')).not.toBeInTheDocument();
  });
  it.each(['buy', 'rent'] as const)('keeps resolved %s intent and guest dates when exploring the complex', mode => {
    render(<MemoryRouter initialEntries={['/property/unit?mode=invalid&checkIn=2026-12-01&checkOut=2026-12-05&guests=3&unrelated=value']}><ProjectInfoCard project={{ id: 'complex', name_en: 'Complex', name_ru: '' }} mode={mode} /><Location /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Explore Complex' }));
    expect(screen.getByTestId('location')).toHaveTextContent(`/property/complex/complex?mode=${mode}&checkIn=2026-12-01&checkOut=2026-12-05&guests=3`);
    expect(screen.getByTestId('location')).not.toHaveTextContent('unrelated');
  });
});
