import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({
  actor: 'actor-a', company: 'company-a', language: 'en', mobile: false, companyLoading: false, companyError: false, companyRefetch: vi.fn(),
  terms: [] as Record<string, unknown>[], error: null as Error | null,
  properties: [] as { property_id: string; title: string; title_ru: string }[], propertyError: null as Error | null,
  filters: {} as Record<string, string>, navigate: vi.fn(), refetch: vi.fn(), propertyRefetch: vi.fn(), mutate: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: fixture.actor } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: fixture.company }, isLoading: fixture.companyLoading, isError: fixture.companyError, refetch: fixture.companyRefetch }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => fixture.navigate }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => fixture.mobile }));
vi.mock('@/hooks/useUrlFilters', () => ({ useUrlFilters: () => ({ getValue: (key: string, fallback: string) => fixture.filters[key] ?? fallback, setValue: vi.fn() }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: fixture.properties, error: fixture.propertyError, isLoading: false, refetch: fixture.propertyRefetch }) }));
vi.mock('@/hooks/usePropertyManagementTerms', () => ({ useAllManagementTerms: () => ({ data: fixture.terms, isLoading: false, error: fixture.error, refetch: fixture.refetch }), useUpdateManagementTerms: () => ({ mutateAsync: fixture.mutate }) }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: { children: ReactNode; open: boolean }) => open ? <div role="dialog">{children}</div> : null,
  SheetContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));
vi.mock('@/components/owner/management/ManagementTermsForm', () => ({ ManagementTermsForm: ({ propertyId, existing }: { propertyId: string; existing?: { id: string } }) => <div data-testid="canonical-terms-form">{propertyId}:{existing?.id ?? 'new'}</div> }));
vi.mock('@/components/owner/management/TermsActivityLog', () => ({ TermsActivityLog: () => null }));
vi.mock('@/components/owner/management/InlineStatusSelect', () => ({ InlineStatusSelect: () => <span>Draft status</span> }));
import ManagementPortfolio from '../ManagementPortfolio';
const property = { property_id: 'actual-property-a', title: 'Synthetic authorized property', title_ru: 'Тестовый объект' };
const terms = (id: string, rate: number | null) => ({
  id, property_id: id, status: 'draft', commission_type: 'percent', commission_rate: rate,
  commission_base: 'gross', expense_responsibility: {}, property: { title_en: id },
});
beforeEach(() => {
  fixture.actor = 'actor-a'; fixture.company = 'company-a'; fixture.language = 'en'; fixture.mobile = false; fixture.companyLoading = false; fixture.companyError = false; fixture.companyRefetch.mockReset();
  fixture.terms = []; fixture.error = null; fixture.properties = []; fixture.propertyError = null; fixture.filters = {};
  fixture.navigate.mockReset(); fixture.refetch.mockReset(); fixture.propertyRefetch.mockReset(); fixture.mutate.mockReset();
  vi.stubGlobal('fetch', () => { throw Error('Production network forbidden'); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('management terms configuration entry', () => {
  it('waits for company resolution before rendering configuration', () => {
    fixture.companyLoading = true; render(<ManagementPortfolio />);
    expect(screen.getByRole('status', { name: 'Loading company' })).toBeTruthy();
    expect(screen.queryByText('No terms configured yet')).toBeNull();
  });
  it('shows company failure with retry instead of an empty configuration', () => {
    fixture.companyError = true; render(<ManagementPortfolio />);
    expect(screen.getByText('Could not load company')).toBeTruthy();
    expect(screen.queryByText('No terms configured yet')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry company' }));
    expect(fixture.companyRefetch).toHaveBeenCalledTimes(1);
  });
  it('keeps an empty platform usable with a property-entry route and no writes', () => {
    render(<ManagementPortfolio />);
    expect(screen.getByText('No terms configured yet')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Go to properties' }));
    expect(fixture.navigate).toHaveBeenCalledWith('/mc/properties'); expect(fixture.mutate).not.toHaveBeenCalled();
  });
  it('opens the canonical blank form only after selecting an actual authorized property', () => {
    fixture.properties = [property]; render(<ManagementPortfolio />);
    const create = screen.getByRole('button', { name: 'Create terms' }) as HTMLButtonElement;
    expect(create.disabled).toBe(true); expect(screen.queryByTestId('canonical-terms-form')).toBeNull();
    fireEvent.change(screen.getByLabelText('Property for new terms'), { target: { value: property.property_id } });
    fireEvent.click(create); expect(screen.getByTestId('canonical-terms-form').textContent).toBe('actual-property-a:new');
    expect(fixture.mutate).not.toHaveBeenCalled();
  });
  it('does not offer another terms record for an already configured property', () => {
    fixture.properties = [property]; fixture.terms = [terms(property.property_id, null)]; render(<ManagementPortfolio />);
    expect(screen.queryByLabelText('Property for new terms')).toBeNull();
    expect(screen.getByText('No properties without terms. Add a property or edit existing terms.')).toBeTruthy();
  });
  it('shows load failure instead of zero metrics, empty state or create actions', () => {
    fixture.error = Error('Synthetic denied'); render(<ManagementPortfolio />);
    expect(screen.getByRole('alert')).toBeTruthy(); expect(screen.queryByText('Total Properties')).toBeNull();
    expect(screen.queryByText('No terms configured yet')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fixture.refetch).toHaveBeenCalledTimes(1);
  });
  it('separates property-picker errors from valid empty property lists', () => {
    fixture.propertyError = Error('Synthetic denied'); render(<ManagementPortfolio />);
    expect(screen.getByText('Could not load available properties')).toBeTruthy();
    expect(screen.queryByLabelText('Property for new terms')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry properties' })); expect(fixture.propertyRefetch).toHaveBeenCalledTimes(1);
  });
  it('distinguishes filtered absence from no configured terms', () => {
    fixture.terms = [terms('Configured property', 20)]; fixture.filters.q = 'missing'; render(<ManagementPortfolio />);
    expect(screen.getByText('No matching terms')).toBeTruthy(); expect(screen.queryByText('No terms configured yet')).toBeNull();
  });
  it.each([false, true])('preserves zero in averages and never labels unspecified expenses owner (mobile=%s)', mobile => {
    fixture.mobile = mobile; fixture.terms = [terms('Zero rate', 0), terms('Twenty rate', 20)]; render(<ManagementPortfolio />);
    expect(screen.getByText('10%')).toBeTruthy(); expect(screen.queryByText('Owner')).toBeNull();
    expect(screen.getAllByText('Not configured').length).toBe(4);
  });
  it('shows an unknown average when no percentage rates have been configured', () => {
    fixture.terms = [terms('Unknown rate', null)]; render(<ManagementPortfolio />);
    expect(screen.queryByText('0%')).toBeNull(); expect(screen.getAllByText('Not configured').length).toBe(3);
  });
  it('closes the selected property on actor/company change', () => {
    fixture.properties = [property]; fixture.terms = [terms('Existing property', 0)];
    const view = render(<ManagementPortfolio />);
    fireEvent.change(screen.getByLabelText('Property for new terms'), { target: { value: property.property_id } });
    fireEvent.click(screen.getByRole('button', { name: 'Create terms' })); expect(screen.getByRole('dialog')).toBeTruthy();
    fixture.actor = 'actor-b'; view.rerender(<ManagementPortfolio />);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.change(screen.getByLabelText('Property for new terms'), { target: { value: property.property_id } });
    fireEvent.click(screen.getByRole('button', { name: 'Create terms' }));
    fixture.company = 'company-b'; view.rerender(<ManagementPortfolio />); expect(screen.queryByRole('dialog')).toBeNull();
  });
});
