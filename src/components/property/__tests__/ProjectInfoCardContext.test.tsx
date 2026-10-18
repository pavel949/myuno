import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ProjectInfoCard } from '../ProjectInfoCard';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(cleanup);
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
describe('unit to informational complex context', () => {
  it.each(['buy', 'rent'] as const)('keeps resolved %s intent and guest dates when exploring the complex', mode => {
    render(<MemoryRouter initialEntries={['/property/unit?mode=invalid&checkIn=2026-12-01&checkOut=2026-12-05&guests=3&unrelated=value']}><ProjectInfoCard project={{ id: 'complex', name_en: 'Complex', name_ru: '' }} mode={mode} /><Location /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Explore Complex' }));
    expect(screen.getByTestId('location')).toHaveTextContent(`/property/complex/complex?mode=${mode}&checkIn=2026-12-01&checkOut=2026-12-05&guests=3`);
    expect(screen.getByTestId('location')).not.toHaveTextContent('unrelated');
  });
});
