import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CopyPublicSearchLink } from './CopyPublicSearchLink';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('complete public search URL sharing', () => {
  it('copies all criteria including query and hash, without a saved-search mutation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<MemoryRouter initialEntries={['/property/offplan?district=Rawai&budget=lt5&q=Ocean#results']}><CopyPublicSearchLink /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Search link' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Link copied'));
    expect(writeText).toHaveBeenCalledWith(window.location.origin + '/property/offplan?district=Rawai&budget=lt5&q=Ocean#results');
  });
  it('offers the exact URL for manual copying if the clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    render(<MemoryRouter initialEntries={['/property/offplan?budget=gt20']}><CopyPublicSearchLink /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Search link' }));
    expect(await screen.findByRole('textbox', { name: 'Copy this search URL' })).toHaveValue(window.location.origin + '/property/offplan?budget=gt20');
    expect(screen.queryByText('Link copied')).toBeNull();
  });
});
