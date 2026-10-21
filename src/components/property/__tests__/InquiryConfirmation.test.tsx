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
      screen.getByRole('heading', { level: 2, name: 'Viewing request received' }),
    ).toBeInTheDocument();
  });

  it('renders the WhatsApp confirmation body copy', () => {
    renderComponent();
    expect(
      screen.getByText(/WhatsApp within 24 hours/i),
    ).toBeInTheDocument();
  });

  it('renders a "View booking" CTA button linked to the orderId', () => {
    renderComponent('test-order-123');
    const viewBookingBtn = screen.getByRole('button', { name: 'View booking' });
    expect(viewBookingBtn).toBeInTheDocument();
  });

  it('renders a "Browse properties" secondary CTA', () => {
    renderComponent();
    expect(
      screen.getByRole('button', { name: 'Browse properties' }),
    ).toBeInTheDocument();
  });
});
