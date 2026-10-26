import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BuyerRequestForm } from '../BuyerRequestForm';
const state = vi.hoisted(() => ({ mutateAsync: vi.fn(), language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useUniversalLead', () => ({ useUniversalLead: () => ({ submitLead: { mutateAsync: state.mutateAsync }, isSubmitting: false }) }));
afterEach(() => { cleanup(); vi.resetAllMocks(); state.language = 'en'; });
function submit() { fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Synthetic Buyer' } }); fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+66000000000' } }); fireEvent.click(screen.getByRole('button', { name: 'Send request' })); }
describe('buyer request persistence boundary', () => {
  it('saves structured unit intent through canonical intake and shows persisted receipt', async () => { state.mutateAsync.mockResolvedValue({ id: 'synthetic-receipt' }); render(<BuyerRequestForm projectId="p" unitId="u" intent="reserve_request" />); submit(); await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('synthetic-receipt')); expect(state.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ vertical_id: 'properties', vertical_metadata: expect.objectContaining({ project_id: 'p', unit_id: 'u', intent: 'reserve_request', request_only: true }) })); expect(screen.getByRole('status')).toHaveTextContent('unit is not held'); });
  it.each([{}, undefined])('does not confirm without receipt %s', async result => { state.mutateAsync.mockResolvedValue(result); render(<BuyerRequestForm projectId="p" />); submit(); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Saving was not confirmed')); expect(screen.queryByRole('status')).toBeNull(); });
  it('retains form and shows retry on failed save', async () => { state.mutateAsync.mockRejectedValue(new Error('offline')); render(<BuyerRequestForm projectId="p" />); submit(); await waitFor(() => expect(screen.getByRole('alert')).toBeVisible()); expect(screen.getByLabelText('Name')).toHaveValue('Synthetic Buyer'); });
  it('rejects invalid contacts without invoking persistence', () => { render(<BuyerRequestForm projectId="p" />); fireEvent.click(screen.getByRole('button', { name: 'Send request' })); expect(state.mutateAsync).not.toHaveBeenCalled(); expect(screen.getByRole('alert')).toBeVisible(); });
  it.each(['ru','en','th'])('renders localized request-only copy in %s', language => { state.language = language; render(<BuyerRequestForm projectId="p" />); expect(screen.getByRole('button')).toBeVisible(); expect(screen.getAllByRole('option')).toHaveLength(4); });
});
