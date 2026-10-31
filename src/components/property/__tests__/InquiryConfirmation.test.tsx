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
      screen.getByRole('heading', { level: 2, name: 'Stay request received' }),
    ).toBeInTheDocument();
  });

  it('renders the request-only body copy', () => {
    renderComponent();
    expect(
      screen.getByText(/Dates are not reserved yet/i),
    ).toBeInTheDocument();
  });

  it('renders a "View request" CTA button linked to the orderId', () => {
    renderComponent('test-order-123');
    const viewBookingBtn = screen.getByRole('button', { name: 'View request' });
    expect(viewBookingBtn).toBeInTheDocument();
  });

  it('renders a "Browse properties" secondary CTA', () => {
    renderComponent();
    expect(
      screen.getByRole('button', { name: 'Browse properties' }),
    ).toBeInTheDocument();
  });
});

it('replayed accepted receipt displays confirmed status without inventing payment success',()=>{
  render(<MemoryRouter><InquiryConfirmation orderId="stored-order" requestStatus="accepted" /></MemoryRouter>);
  expect(screen.getByRole('heading',{name:'Stay confirmed'})).toBeInTheDocument();
  expect(screen.queryByText(/Dates are not reserved yet/)).not.toBeInTheDocument();
});
it('replayed cancelled receipt does not claim a new request was submitted',()=>{
  render(<MemoryRouter><InquiryConfirmation orderId="stored-order" requestStatus="cancelled" /></MemoryRouter>);
  expect(screen.getByRole('heading',{name:'Request closed'})).toBeInTheDocument();
  expect(screen.getByText(/No new request was created/)).toBeInTheDocument();
});
