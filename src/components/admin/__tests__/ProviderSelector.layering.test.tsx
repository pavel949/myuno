import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { ProviderSelector } from '../ProviderSelector';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('@/hooks/useAdmin', () => ({
  useAdminProviders: () => ({ providers: [{ id: 'synthetic-provider', name: 'Synthetic Provider', is_verified: true }], isLoading: false, refetch: vi.fn() }),
}));
vi.mock('@/hooks/useManagementCompanies', () => ({ useManagementCompanies: () => ({ data: [], isLoading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('../BusinessCardScanButton', () => ({ BusinessCardScanButton: () => null }));

afterEach(cleanup);

const layer = (element: Element | null) => Number(/(?:^|\s)z-\[(\d+)\]/.exec(element?.className ?? '')?.[1] ?? 0);

describe('provider picker inside the property editor sheet', () => {
  it('opens above the editor window and registers the chosen provider', () => {
    const onChange = vi.fn();
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Editor</SheetTitle>
          <SheetDescription>Editor body</SheetDescription>
          <ProviderSelector value="" onChange={onChange} />
        </SheetContent>
      </Sheet>,
    );

    const editor = screen.getByRole('dialog', { name: 'Editor' });
    fireEvent.click(screen.getByRole('combobox'));
    const list = screen.getByPlaceholderText('admin.providerSelector.searchPlaceholder').closest('[data-side]');

    // A list on a lower layer than the editor is hidden behind it, so a click never reaches an option.
    expect(layer(editor)).toBeGreaterThan(0);
    expect(layer(list)).toBeGreaterThan(layer(editor));

    fireEvent.click(screen.getByRole('button', { name: /Synthetic Provider/ }));
    expect(onChange).toHaveBeenCalledWith('synthetic-provider');
  });
});
