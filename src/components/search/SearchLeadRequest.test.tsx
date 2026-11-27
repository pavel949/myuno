import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SearchLeadRequest } from './SearchLeadRequest';
const fixture = vi.hoisted(() => ({ language: 'en', submit: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('@/hooks/useUniversalLead', () => ({ useUniversalLead: () => ({ isSubmitting: false, submitLead: { mutateAsync: fixture.submit } }) }));
beforeEach(() => { fixture.language = 'en'; fixture.submit.mockReset().mockResolvedValue({ id: 'synthetic-receipt' }); });
afterEach(cleanup);
function form() {
  const view = render(<SearchLeadRequest kind="buy" params={new URLSearchParams('mode=buy&maxPrice=10000000&district=rawai')} />);
  const name = view.container.querySelector<HTMLInputElement>('input[autocomplete="name"]')!;
  const phone = view.container.querySelector<HTMLInputElement>('input[type="tel"]')!;
  fireEvent.change(name, { target: { value: 'Synthetic buyer' } });
  fireEvent.change(phone, { target: { value: '+66812345678' } });
  return { ...view, name, phone, form: view.container.querySelector('form')! };
}
it.each(['ru', 'en', 'th'])('shows the acknowledged enquiry ID in %s with purchase context', async language => {
  fixture.language = language; const view = form(); fireEvent.submit(view.form);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('synthetic-receipt'));
  expect(fixture.submit).toHaveBeenCalledOnce();
  expect(fixture.submit.mock.calls[0][0]).toMatchObject({ request_type: 'property_consultation', budget_max: 10000000, districts: ['rawai'], vertical_metadata: { request_only: true } });
  expect(view.container.querySelector('form')).toBeNull();
});
it('rejects a malformed phone before calling the writer', () => {
  const view = form(); fireEvent.change(view.phone, { target: { value: '000----' } }); fireEvent.submit(view.form);
  expect(screen.getByRole('alert')).toBeVisible(); expect(fixture.submit).not.toHaveBeenCalled();
});
it('keeps entered details and never shows success after an uncertain response', async () => {
  fixture.submit.mockRejectedValue(new Error('Synthetic lost response')); const view = form(); fireEvent.submit(view.form);
  await waitFor(() => expect(screen.getByRole('alert')).toBeVisible());
  expect(view.name.value).toBe('Synthetic buyer'); expect(view.phone.value).toBe('+66812345678');
  expect(screen.queryByRole('status')).toBeNull();
});
it('does not submit twice before the mutation pending state renders', async () => {
  let finish!: (value: { id: string }) => void;
  fixture.submit.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const view = form(); fireEvent.submit(view.form); fireEvent.submit(view.form);
  expect(fixture.submit).toHaveBeenCalledOnce(); finish({ id: 'synthetic-receipt' });
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('synthetic-receipt'));
});
it('never acknowledges an empty receipt', async () => {
  fixture.submit.mockResolvedValue({ id: '' }); const view = form(); fireEvent.submit(view.form);
  await waitFor(() => expect(screen.getByRole('alert')).toBeVisible()); expect(screen.queryByRole('status')).toBeNull();
});
