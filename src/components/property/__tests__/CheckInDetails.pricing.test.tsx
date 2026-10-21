import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckInDetails } from '../CheckInDetails';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(cleanup);

describe('public deposit pricing action', () => {
  it('uses the supplied booking action rather than a dead hash link', () => {
    const onViewPricing = vi.fn();
    render(<CheckInDetails showPricingDeposit onViewPricing={onViewPricing} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to Pricing' }));
    expect(onViewPricing).toHaveBeenCalledOnce();
    expect(screen.queryByRole('link', { name: 'Go to Pricing' })).toBeNull();
  });
  it('does not advertise a pricing jump when this listing has no short-stay booking action', () => {
    render(<CheckInDetails showPricingDeposit />);
    expect(screen.getByText('Ask the manager about the deposit amount and refund terms.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Go to Pricing' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Go to Pricing' })).toBeNull();
  });
});
