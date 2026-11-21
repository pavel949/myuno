import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OFFPLAN_BUYER_ENTRY } from '@/lib/consultationIntake';
import { ConsultationDealAction } from './ConsultationDealAction';

const state = vi.hoisted(() => ({ convertRender: vi.fn(), language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/crm/ConvertLeadToDealButton', () => ({
  ConvertLeadToDealButton: (props: object) => {
    state.convertRender(props);
    return <button type="button">Existing bridge</button>;
  },
}));

afterEach(() => {
  cleanup();
  state.convertRender.mockClear();
  state.language = 'en';
});

describe('off-plan consultation CTA boundary', () => {
  it('keeps the operator in the existing request without instantiating legacy conversion', () => {
    render(<ConsultationDealAction id="request" entryPoint={OFFPLAN_BUYER_ENTRY} />);
    expect(screen.getByText(/Creating a deal from this request is not available/)).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(state.convertRender).not.toHaveBeenCalled();
  });

  it('does not send a previously linked request through conversion or an unverified CRM route', () => {
    render(<ConsultationDealAction id="request" entryPoint={OFFPLAN_BUYER_ENTRY} convertedDealId="existing-deal" />);
    expect(screen.getByText(/This request has a deal link/)).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(state.convertRender).not.toHaveBeenCalled();
  });

  it.each(['resale_buyer', 'property_tour_form', null])('preserves the existing bridge for %s', entryPoint => {
    render(<ConsultationDealAction id="other" entryPoint={entryPoint} convertedDealId="existing" />);
    expect(screen.getByRole('button', { name: 'Existing bridge' })).toBeVisible();
    expect(state.convertRender).toHaveBeenCalledWith({ leadId: 'other', convertedDealId: 'existing' });
  });

  it.each([
    ['ru', /Создание сделки из этой заявки пока недоступно/],
    ['th', /ยังไม่สามารถย้ายคำขอนี้ไปยัง CRM ได้/],
  ])('uses localized next steps in %s', (language, expected) => {
    state.language = language;
    render(<ConsultationDealAction id="request" entryPoint={OFFPLAN_BUYER_ENTRY} />);
    expect(screen.getByText(expected)).toBeVisible();
  });
});
