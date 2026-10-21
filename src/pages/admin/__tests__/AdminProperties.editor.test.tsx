import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AdminProperties from '../AdminProperties';
import { CanonicalPropertyForm } from '@/components/property/canonical-form/CanonicalPropertyForm';
import { CloudStoragePicker } from '@/components/upload/CloudStoragePicker';

vi.mock('@/components/admin/PublishedPropertyRevisionQueue', () => ({ PublishedPropertyRevisionQueue: () => null }));
vi.mock('@tanstack/react-query', async importOriginal => ({ ...await importOriginal<typeof import('@tanstack/react-query')>(), useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

const mocks = vi.hoisted(() => ({
  language: 'en',
  isMobile: false,
  properties: [] as Record<string, unknown>[],
  companies: [],
  update: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  network: vi.fn(() => { throw new Error('Unexpected data access in synthetic UI test'); }),
}));
vi.mock('@/lib/errorHandler', () => ({ createErrorHandler: () => ({ error: vi.fn() }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' }, isLoading: false }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: true, isLoading: false }) }));
vi.mock('@/hooks/useAdminContent', () => ({ useAdminProperties: () => ({ properties: mocks.properties, isLoading: false, updateProperty: mocks.update, createProperty: mocks.create, deleteProperty: mocks.remove }) }));
vi.mock('@/hooks/useManagementCompanies', () => ({ useManagementCompanies: () => ({ data: mocks.companies }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: 'THB' }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mocks.isMobile }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: () => {}, isTypingKey: () => false }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: () => {} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.network, functions: { invoke: mocks.network }, storage: { from: mocks.network } } }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: React.PropsWithChildren) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('@/components/admin/ProviderSelector', () => ({ ProviderSelector: () => <div><svg role="img" aria-label="Fixture provider icon"><path d="M0 0h10v10z" /></svg>Fixture provider</div> }));
vi.mock('@/components/admin/RealEstateDomainHealthPanel', () => ({ RealEstateDomainHealthPanel: () => null }));
vi.mock('@/components/admin/PropertyProjectBulkLinkPanel', () => ({ PropertyProjectBulkLinkPanel: () => null }));
vi.mock('@/components/admin/PropertyStayRulesPanel', () => ({ PropertyStayRulesPanel: () => null }));
vi.mock('@/components/property/PropertyCard', () => ({ PropertyCard: ({ onEdit }: { onEdit: () => void }) => <button onClick={onEdit}>Edit fixture property</button> }));
vi.mock('@/components/upload/ImageQualityTips', () => ({ ImageQualityTips: () => null }));
vi.mock('@/components/owner/property-wizard/steps', async () => {
  const { PhotosStep } = await import('@/components/owner/property-wizard/steps/PhotosStep');
  return {
    PhotosStep,
    BasicInfoStep: ({ formData, updateFormData }: { formData: { title: string }; updateFormData: (data: { title: string }) => void }) => <label htmlFor="fixture-title">Fixture title<input id="fixture-title" value={formData.title} onChange={event => updateFormData({ title: event.target.value })} /></label>,
    LocationStep: () => null,
    PricingStep: () => null,
    UtilitiesStep: () => null,
    ServicesStep: () => null,
    AdminSettingsStep: () => null,
    HouseRulesSection: () => null,
    CancellationPolicySection: () => null,
  };
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}
function editorElement() {
  return (<MemoryRouter initialEntries={['/admin/properties?provider=synthetic-provider&status=pending&edit=synthetic-property']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AdminProperties /><LocationProbe /></MemoryRouter>);
}
function renderEditor() { return render(editorElement()); }
async function openPhotos() {
  fireEvent.mouseDown(await screen.findByRole('tab', { name: mocks.language === 'ru' ? 'Фото' : 'Photos' }), { button: 0, ctrlKey: false });
  return screen.findByRole('button', { name: mocks.language === 'ru' ? 'Облачная ссылка' : 'Cloud link' });
}
async function expectDismissed() {
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByTestId('location')).toHaveTextContent('/admin/properties?provider=synthetic-provider&status=pending');
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.remove).not.toHaveBeenCalled();
}

describe('contained admin property editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.language = 'en';
    mocks.isMobile = false;
    mocks.properties = [{ id: 'synthetic-property', updated_at: '2026-10-19T00:00:00Z', approval_status: 'pending', title_en: 'Synthetic property', provider_id: 'synthetic-provider', images: Array.from({ length: 15 }, (_, i) => `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>#${i}`) }];
  });
  afterEach(() => { cleanup(); expect(mocks.network).not.toHaveBeenCalled(); });

  it('owns one scrolling body with a protected footer and accessible tab labels', async () => {
    renderEditor();
    const editor = await screen.findByRole('dialog', { name: 'Edit Property' });
    expect(editor).toHaveClass('overflow-hidden', 'h-dvh');
    const body = editor.querySelector('[data-property-form-scroll]')!;
    const actions = editor.querySelector('[data-property-form-actions]')!;
    expect(body).toHaveClass('min-h-0', 'overflow-y-auto');
    expect(actions).toHaveClass('shrink-0', 'bg-background');
    expect(body).not.toContainElement(actions as HTMLElement);
    expect(editor.querySelectorAll('.overflow-y-auto')).toHaveLength(1);
    await openPhotos();
    // Reproduce Chromium's mixed image-role tree (SVG icons plus photo assets).
    expect(within(editor).getAllByRole('img').length).toBeGreaterThan(15);
    expect(within(editor).getAllByRole('img', { name: /^Photo \d+$/ })).toHaveLength(15);
    expect(within(editor).getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(within(editor).getByRole('tab', { name: 'Photos' })).toHaveAttribute('aria-selected', 'true');
  });

  it.each(['cancel', 'close', 'escape'] as const)('clears edit and preserves filters after %s dismissal', async method => {
    renderEditor();
    const editor = await screen.findByRole('dialog', { name: 'Edit Property' });
    fireEvent.change(within(editor).getByLabelText('Fixture title'), { target: { value: 'Unsaved edit' } });
    if (method === 'cancel') fireEvent.click(within(editor).getByRole('button', { name: 'Cancel' }));
    if (method === 'close') fireEvent.click(within(editor).getByRole('button', { name: 'Close editor' }));
    if (method === 'escape') fireEvent.keyDown(editor, { key: 'Escape' });
    await expectDismissed();
    fireEvent.click(screen.getByRole('button', { name: 'Edit fixture property' }));
    expect(await screen.findByRole('dialog', { name: 'Edit Property' })).toBeInTheDocument();
    expect(screen.getByLabelText('Fixture title')).toHaveValue('Synthetic property');
  });

  it('waits for the route commit separately from urgent sheet dismissal', async () => {
    let released = false;
    let release!: () => void;
    const pendingNavigation = new Promise<void>(resolve => { release = resolve; });
    function DeferredRouteProbe() {
      const location = useLocation();
      if (!location.search.includes('edit=') && !released) throw pendingNavigation;
      return <output data-testid="location">{location.pathname}{location.search}</output>;
    }
    render(
      <MemoryRouter initialEntries={['/admin/properties?provider=synthetic-provider&status=pending&edit=synthetic-property']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <React.Suspense fallback={<span>Waiting for navigation</span>}>
          <AdminProperties />
          <DeferredRouteProbe />
        </React.Suspense>
      </MemoryRouter>
    );
    const editor = await screen.findByRole('dialog', { name: 'Edit Property' });
    fireEvent.click(within(editor).getByRole('button', { name: 'Close editor' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // A closed sheet does not mean the lower-priority route has committed yet.
    expect(screen.getByTestId('location')).toHaveTextContent('edit=synthetic-property');
    await act(async () => { released = true; release(); await pendingNavigation; });
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/admin\/properties\?provider=synthetic-provider&status=pending$/));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each(['en', 'ru'])('shows honest cloud help above the sheet and opens the URL importer in %s', async language => {
    mocks.language = language;
    mocks.isMobile = true; // nested mobile importer must not drop into the lower-z drawer
    renderEditor();
    fireEvent.click(await openPhotos());
    const help = await screen.findByRole('dialog', { name: language === 'ru' ? 'Фото по облачной ссылке' : 'Photos from a cloud link' });
    expect(help).toHaveClass('z-[140]');
    expect(help.nextElementSibling).toHaveClass('z-[130]');
    expect(within(help).getByText(language === 'ru' ? /Подключать облачный аккаунт не требуется/ : /No cloud account connection is required/)).toBeInTheDocument();
    fireEvent.click(within(help).getByRole('button', { name: language === 'ru' ? 'Вставить ссылку' : 'Paste link' }));
    const importer = await screen.findByRole('dialog', { name: 'Загрузить фото с сайта' });
    expect(importer).toHaveClass('z-[140]');
    expect(importer.nextElementSibling).toHaveClass('z-[130]');
    fireEvent.keyDown(importer, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Загрузить фото с сайта' })).not.toBeInTheDocument());
    expect(screen.getByRole('dialog', { name: language === 'ru' ? 'Редактировать объект' : 'Edit Property' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('edit=synthetic-property');
  });

  it('opens the photo editor above the sheet and cancels without changing the form', async () => {
    renderEditor();
    await openPhotos();
    fireEvent.click(screen.getByRole('button', { name: 'Edit photo 1' }));
    const imageEditor = await screen.findByRole('dialog', { name: /Редактирование фото/ });
    expect(imageEditor).toHaveClass('z-[140]', 'flex-col', 'overflow-hidden');
    expect(imageEditor.nextElementSibling).toHaveClass('z-[130]');
    fireEvent.click(within(imageEditor).getByRole('button', { name: 'Отмена' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Редактирование фото/ })).not.toBeInTheDocument());
    expect(within(screen.getByRole('dialog', { name: 'Edit Property' })).getAllByRole('img', { name: /^Photo \d+$/ })).toHaveLength(15);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('keeps normal page forms in document flow and standalone dialogs on their default layer', () => {
    const page = render(<CanonicalPropertyForm mode="owner" onSubmit={vi.fn()} />);
    expect(page.container.querySelector('[data-property-form-scroll]')).not.toHaveClass('overflow-y-auto');
    page.unmount();
    render(<CloudStoragePicker open onOpenChange={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveClass('z-50');
    expect(screen.getByRole('dialog')).not.toHaveClass('z-[140]');
  });

  it('keeps the originally reviewed revision after a background list refresh', async () => {
    mocks.properties = [{ id: 'synthetic-property', updated_at: '2026-10-19T00:00:00Z', approval_status: 'pending', title_en: 'Synthetic property', provider_id: 'synthetic-provider', images: [] }];
    mocks.update.mockResolvedValue({ error: null });
    const view = renderEditor();
    await screen.findByRole('dialog', { name: 'Edit Property' });
    mocks.properties = [{ ...mocks.properties[0], updated_at: '2026-10-19T01:00:00Z', title_en: 'Changed elsewhere' }];
    view.rerender(editorElement());
    expect(screen.getByLabelText('Fixture title')).toHaveValue('Synthetic property');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith('synthetic-property', expect.any(Object), '2026-10-19T00:00:00Z'));
  });


  it('keeps unsaved edits visible and explains an unconfirmed save without closing', async () => {
    mocks.update.mockResolvedValue({ error: new Error('Stale revision') });
    renderEditor();
    await screen.findByRole('dialog', { name: 'Edit Property' });
    fireEvent.change(screen.getByLabelText('Fixture title'), { target: { value: 'Unsaved new title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Save was not confirmed');
    expect(screen.getByRole('dialog', { name: 'Edit Property' })).toBeInTheDocument();
    expect(screen.getByLabelText('Fixture title')).toHaveValue('Unsaved new title');
    expect(screen.getByTestId('location')).toHaveTextContent('edit=synthetic-property');
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });


  it('provides a Thai editor title and explicit dismissal label', async () => {
    mocks.language = 'th';
    renderEditor();
    const editor = await screen.findByRole('dialog', { name: 'แก้ไขที่พัก' });
    fireEvent.click(within(editor).getByRole('button', { name: 'ปิดหน้าต่างแก้ไข' }));
    await expectDismissed();
  });

});
