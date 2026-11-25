import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ClearViewLanding from './ClearViewLanding';
import { CLEARVIEW_CATEGORIES } from '@/lib/clearview/methodology';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

describe('ClearViewLanding method section', () => {
  it('lists every weighted area from the methodology source of truth', () => {
    render(<MemoryRouter><ClearViewLanding /></MemoryRouter>);
    const method = screen.getByRole('region', { name: 'Methodology and criteria' });
    const items = within(method).getAllByRole('listitem');
    expect(items).toHaveLength(CLEARVIEW_CATEGORIES.length);
    expect(within(method).getByText('Legal & Regulatory Compliance')).toBeInTheDocument();
    const total = CLEARVIEW_CATEGORIES.reduce((sum, c) => sum + Math.round(c.weight * 100), 0);
    expect(total).toBe(100);
  });

  it('shows the three-step flow', () => {
    render(<MemoryRouter><ClearViewLanding /></MemoryRouter>);
    const steps = screen.getByRole('region', { name: 'How it works' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(3);
  });
});
