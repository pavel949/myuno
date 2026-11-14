import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DevelopmentUnitsSection } from './DevelopmentUnitsSection';

const state = vi.hoisted(() => ({ units: [] as Array<Record<string, unknown>> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useProjectUnits', () => ({ useProjectUnits: () => ({ data: state.units, isLoading: false }) }));

afterEach(cleanup);

describe('public canonical project units', () => {
  it('renders a selected project unit and carries its physical property id to the callback', () => {
    state.units = [{ id: 'unit-1', property_id: 'property-1', name: 'A-101', name_ru: null, unit_type: 'condo', area_sqm: 42, bedrooms: 1, bathrooms: 1, price: 3000000, price_per_sqm: null, currency: 'THB', floor_from: 1, floor_to: 1, floor_plan_url: null, views: null, features: null, total_units: 1, available_units: 1, status: 'available' }];
    const onSelectUnit = vi.fn();
    render(<DevelopmentUnitsSection developmentId="project-1" onSelectUnit={onSelectUnit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask about this unit' }));
    expect(onSelectUnit).toHaveBeenCalledWith(expect.objectContaining({ id: 'unit-1', property_id: 'property-1' }));
  });
});
