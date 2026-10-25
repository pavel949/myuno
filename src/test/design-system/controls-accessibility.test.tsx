import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useState } from 'react';
import { AddVendorDialog } from '@/components/owner/vendors/AddVendorDialog';
import { DashboardPropertyFilter } from '@/components/owner/dashboard/DashboardPropertyFilter';
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select';
import PropertyMySection from '@/pages/property/PropertyMySection';
import TravelInsurance from '@/pages/insurance/TravelInsurance';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user' } }) }));
vi.mock('@/hooks/useOwnerVendors', () => ({ VENDOR_CATEGORIES: [{ value: 'other', en: 'Other', ru: 'Другое' }] }));
vi.mock('@/components/upload/UnifiedMediaUploader', () => ({ UnifiedMediaUploader: () => <div>Photo fixture</div> }));
vi.mock('@/components/insurance/InsurancePolicyUpload', () => ({ InsurancePolicyUpload: () => null }));
vi.mock('@/components/uno/BackButton', () => ({ BackButton: () => null }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ activeProperties: [{ property_id: 'one', title: 'Villa One' }, { property_id: 'two', title: 'Villa Two' }], allProperties: [], isLoading: false }) }));
vi.mock('@/hooks/usePropertyDelegates', () => ({ useMyDelegations: () => ({ data: [{ id: 'delegation', status: 'active', property: { id: 'property-one', title: 'Delegated Villa', address: 'Synthetic address' } }] }) }));
vi.mock('@/contexts/DashboardFilterContext', () => ({ useDashboardFilter: () => { const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null); return { selectedPropertyId, setSelectedPropertyId }; } }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); sessionStorage.clear(); });
it('associates vendor labels and preserves save gating and payload', () => {
 const save = vi.fn(); render(<AddVendorDialog open onOpenChange={() => {}} onSave={save} isSaving={false} />);
 for (const label of ['Name (EN)', 'Name (RU)', 'Contact Person', 'Phone', 'WhatsApp', 'Email', 'LINE ID', 'Address', 'Notes', 'Category', 'Source']) expect(screen.getByLabelText(label)).toBeVisible();
 expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Name (EN)'), { target: { value: 'Synthetic Vendor' } });
 fireEvent.click(screen.getByRole('button', { name: 'Save' }));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Synthetic Vendor', category: 'other', source: 'own' }));
});
it('exposes selected property and preserves toggle and clear callbacks', () => {
 render(<DashboardPropertyFilter />);
 expect(screen.getByRole('button', { name: /All/ })).toHaveAttribute('aria-pressed', 'true');
 fireEvent.click(screen.getByRole('button', { name: 'Villa One' }));
 expect(screen.getByRole('button', { name: 'Villa One' })).toHaveAttribute('aria-pressed', 'true');
 fireEvent.click(screen.getByRole('button', { name: 'Villa One' }));
 expect(screen.getByRole('button', { name: /All/ })).toHaveAttribute('aria-pressed', 'true');
 fireEvent.click(screen.getByRole('button', { name: 'Villa Two' }));
 fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
 expect(screen.getByRole('button', { name: /All/ })).toHaveAttribute('aria-pressed', 'true');
});
it('forwards select invalid, described-by and disabled attributes with invalid focus styling', () => {
 render(<Select><SelectTrigger aria-label="Synthetic choice" aria-invalid aria-describedby="choice-error" disabled><SelectValue /></SelectTrigger></Select>);
 const trigger = screen.getByRole('combobox'); expect(trigger).toHaveAttribute('aria-invalid', 'true'); expect(trigger).toHaveAttribute('aria-describedby', 'choice-error'); expect(trigger).toBeDisabled(); expect(trigger.className).toContain('aria-[invalid=true]:focus:ring-destructive');
});
it('renders the delegated report destination as a native focusable link', () => {
 render(<MemoryRouter><PropertyMySection /></MemoryRouter>);
 const link = screen.getByRole('link', { name: /Delegated Villa/ }); expect(link).toHaveAttribute('href', '/owner/transparency/property-one'); link.focus(); expect(link).toHaveFocus();
});
it.each([false, true])('preserves native insurance activation and redirect markers (control modifier: %s)', ctrlKey => {
 render(<MemoryRouter><TravelInsurance /></MemoryRouter>);
 for (const [name, url] of [['Cherehapa', 'https://cherehapa.ru/country/thailand?partnerid=MYUNO'], ['SafetyWing', 'https://safetywing.com/nomad-insurance?referenceID=myuno']]) {
  const link = screen.getByRole('link', { name: new RegExp(name) });
  expect(link).toHaveAttribute('href', url); expect(link).toHaveAttribute('target', '_blank'); expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  link.focus(); expect(link).toHaveFocus();
  const activation = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey });
  fireEvent(link, activation);
  expect(activation.defaultPrevented).toBe(false);
  expect(sessionStorage.getItem('insurance_redirect')).toBe('true');
 }
});
