/**
 * Smoke test for InquiryConfirmation.
 * Covers: heading render, body copy, and CTA button presence.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InquiryConfirmation } from '../InquiryConfirmation';

// Mock LanguageContext — return English so assertions are language-stable.
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

const renderComponent = (orderId = 'test-order-123') =>
  render(
    <MemoryRouter>
      <InquiryConfirmation orderId={orderId} />
    </MemoryRouter>,
  );

describe('InquiryConfirmation', () => {
  it('renders the EN heading', () => {
    renderComponent();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Request submitted' }),
    ).toBeInTheDocument();
  });

  it('distinguishes request submission from booking confirmation', () => {
    renderComponent();
    expect(
      screen.getByText(/does not mean the reservation is confirmed/i),
    ).toBeInTheDocument();
  });

  it('renders a status CTA without assuming legacy order ids are canonical bookings', () => {
    renderComponent('test-order-123');
    const viewBookingBtn = screen.getByRole('button', { name: 'Check status' });
    expect(viewBookingBtn).toBeInTheDocument();
  });

  it('renders a "Browse properties" secondary CTA', () => {
    renderComponent();
    expect(
      screen.getByRole('button', { name: 'Browse properties' }),
    ).toBeInTheDocument();
  });
});
