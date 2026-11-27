import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminTaxonomyManager from '../AdminTaxonomyManager';
const state = vi.hoisted(() => ({ create: vi.fn(), error: false }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useTaxonomyDefinitions', () => ({
  VERTICAL_CONFIG: { general: { labelEn: 'General', labelRu: 'Общие' } },
  useTaxonomyDefinitions: () => ({ definitions: [], groupedByVertical: {}, isLoading: false, isError: state.error,
    refetch: vi.fn(), create: state.create, isCreating: false }),
}));
vi.mock('@/components/admin/taxonomy/TaxonomyValueEditor', () => ({ default: () => <p>Existing value editor</p> }));
vi.mock('@/components/admin/taxonomy/TaxonomyBulkActions', () => ({ default: () => null }));
vi.mock('@/components/admin/taxonomy/TaxonomySchemaEditor', () => ({ default: () => null }));
beforeEach(() => { state.create.mockReset().mockResolvedValue({}); state.error = false; });
afterEach(cleanup);
function mount() { render(<MemoryRouter><AdminTaxonomyManager /></MemoryRouter>); }
function fill() {
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'qa_type' } });
  fireEvent.change(screen.getByLabelText('English name'), { target: { value: 'QA type' } });
  fireEvent.change(screen.getByLabelText('Russian name'), { target: { value: 'Тип QA' } });
}
describe('taxonomy creation through the existing writer', () => {
  it('creates only after submission and opens the existing values editor', async () => {
    mount(); fill(); expect(state.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Create reference list' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledWith(expect.objectContaining({ type_key: 'qa_type', vertical: 'general', is_system: false })));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Existing value editor')).toBeInTheDocument();
  });
  it('preserves entered values after a rejected save', async () => {
    state.create.mockRejectedValue(new Error('Synthetic failure')); mount(); fill();
    fireEvent.click(screen.getByRole('button', { name: 'Create reference list' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('not saved');
    expect(screen.getByLabelText('Code')).toHaveValue('qa_type');
    expect(screen.getByRole('dialog')).toBeVisible();
  });
  it('does not create while the source list is unavailable', () => {
    state.error = true; mount(); expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    expect(state.create).not.toHaveBeenCalled();
  });
});
