import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MCSettingsPage from '@/pages/mc/MCSettingsPage';
import CrmMeetingsPage from '@/pages/owner/CrmMeetingsPage';
import OwnerAccountSettings from '@/pages/owner/OwnerAccountSettings';
import PipelineSettingsPage from '@/pages/owner/PipelineSettingsPage';
import { CompanyProfileSettings } from '@/components/mc/settings/CompanyProfileSettings';
import { FinanceCategorySettings } from '@/components/mc/settings/FinanceCategorySettings';
import { DataBackupSettings } from '@/components/mc/settings/DataBackupSettings';
import { DashboardGreeting } from '@/components/owner/dashboard/DashboardGreeting';
import { DashboardDestinations } from '@/components/owner/dashboard/DashboardDestinations';
import { BusinessRoleSwitcher } from '@/components/owner/dashboard/BusinessRoleSwitcher';
import { BUSINESS_ROLES } from '@/lib/businessRoles';
import type { CrmMeeting } from '@/hooks/useCrmMeetings';

const state = vi.hoisted(() => ({
  language: 'en', companyId: 'synthetic-company' as string | undefined, role: 'director',
  meetingError: false, meetingLoading: false, pending: false, meetings: [] as CrmMeeting[], queryLoading: false,
  write: vi.fn(), remove: vi.fn(), retry: vi.fn(), database: vi.fn(), toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
  company: { name_en: 'Synthetic Company – ชื่อเดิม', name_ru: 'Синтетическая компания', documents: [], brand_color: 'blue' },
  categorySettings: [] as Array<{ category_code: string; custom_name_en?: string }>,
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language, t: (key: string) => key }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user', email: 'synthetic@example.test' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: state.companyId ? { company_id: state.companyId } : null }) }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ profile: { full_name: 'สมชาย Operator' } }) }));
vi.mock('@/hooks/useFeedbackSettings', () => ({ getFeedbackSettings: () => ({}) }));
vi.mock('@/hooks/useCrmMeetings', () => ({
  useCrmMeetings: () => ({ data: state.meetings, isLoading: state.meetingLoading, isError: state.meetingError, refetch: state.retry }),
  useCreateMeeting: () => ({ mutateAsync: state.write, isPending: state.pending }),
  useDeleteMeeting: () => ({ mutate: state.remove }),
}));
vi.mock('@tanstack/react-query', async importOriginal => ({
  ...await importOriginal<typeof import('@tanstack/react-query')>(),
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data: queryKey[0] === 'mc-profile' ? state.company : queryKey[0] === 'mc-backup-settings' ? { auto_enabled: true, frequency: 'monthly' } : undefined,
    isLoading: state.queryLoading,
  }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.database, functions: { invoke: state.database } } }));
vi.mock('@/hooks/useCompanyCategorySettings', () => ({
  useCompanyCategorySettings: () => ({ enabledCodes: null, hasSettings: true, isLoading: state.queryLoading, settings: state.categorySettings }),
  useToggleCategorySetting: () => ({ mutate: state.write }), useInitCategorySettings: () => ({ mutate: state.write }),
  useUpdateCategoryOverrides: () => ({ mutate: state.write }), useBulkToggleCategorySettings: () => ({ mutate: state.write }),
}));
vi.mock('@/hooks/useFinancialCategories', () => ({
  useFinancialCategories: () => ({ categories: [] }), useCreateFinancialCategory: () => ({ mutateAsync: state.write }),
}));
vi.mock('@/hooks/useAgentDeals', async importOriginal => ({
  ...await importOriginal<typeof import('@/hooks/useAgentDeals')>(),
  useMyCompanyId: () => ({ data: state.companyId ? { company_id: state.companyId, role: state.role } : null }),
}));
vi.mock('@/hooks/useDealPipelineStages', async importOriginal => ({
  ...await importOriginal<typeof import('@/hooks/useDealPipelineStages')>(),
  useAllPipelineStages: () => ({ data: [], isLoading: state.queryLoading }),
  useCreatePipelineStage: () => ({ mutateAsync: state.write }), useDeletePipelineStage: () => ({ mutateAsync: state.remove }),
}));
vi.mock('@/hooks/useCrmSettings', () => ({
  useCrmOptions: () => ({ data: [{ id: 'synthetic-option', label_en: 'Original Company Label', label_ru: 'Исходное название', value: 'custom_key', is_active: true, is_system: true }], isLoading: state.queryLoading }),
  useCreateCrmOption: () => ({ mutateAsync: state.write }), useUpdateCrmOption: () => ({ mutateAsync: state.write }), useDeleteCrmOption: () => ({ mutateAsync: state.remove }),
}));
// Media/upload and the separate import dialog are boundaries, never production IO.
vi.mock('@/components/upload/UnifiedMediaUploader', () => ({ UnifiedMediaUploader: ({ placeholder }: { placeholder: string }) => <button>{placeholder}</button> }));
vi.mock('@/components/owner/crm/OdooCrmSettingsImportModal', () => ({ OdooCrmSettingsImportModal: () => null }));
vi.mock('sonner', () => ({ toast: state.toast }));

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="url">{location.pathname + location.search}</output><button onClick={() => navigate(-1)}>Synthetic Back</button><button onClick={() => navigate(1)}>Synthetic Forward</button><button onClick={() => navigate('/mc/meetings?action=create&keep=yes')}>Synthetic Create</button></>;
}
function mount(ui: React.ReactNode, url = '/mc') {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter initialEntries={[url]}>{ui}<LocationProbe /></MemoryRouter></QueryClientProvider>);
}
afterEach(() => { cleanup(); vi.useRealTimers(); });
beforeEach(() => {
  state.language = 'en'; state.companyId = 'synthetic-company'; state.role = 'director'; state.pending = false;
  state.meetings = []; state.meetingError = false; state.meetingLoading = false; state.queryLoading = false; state.categorySettings = [];
  vi.clearAllMocks(); state.database.mockImplementation(() => { throw new Error('Production IO is forbidden in localization tests'); });
});

const locales = [
  { lang: 'en', settings: 'Settings', profile: 'Company Profile', operations: 'Operations', account: 'Account Settings', tax: 'Taxes', company: 'Company information', back: 'Back', links: ['Properties', 'Calendar', 'Tasks'], switcher: 'More dashboard sections', role: 'Property Management (MC)', greeting: 'Good morning', director: 'Director', unknown: 'Role: audit_observer', newMeeting: 'New Meeting', title: 'Title', date: 'Date & Time', duration: 'Duration (min)', location: 'Location', create: 'Create', close: 'Close', cancel: 'Cancel', required: 'Title and date/time are required.', status: 'Scheduled', delete: 'Delete', deleteTitle: 'Delete meeting?', retry: 'Retry', error: 'Failed to load meetings', empty: 'No meetings', loading: 'Loading...', created: 'Meeting created', month: 'Oct', branding: 'Company Branding', color: 'Blue', saveProfile: 'Save Profile', legal: 'Legal Details', taxId: 'Tax ID', expense: 'Expense Categories', cleaning: 'Cleaning', cost: 'Variable', addCustom: 'Add custom', newCategory: 'New expense category', nameEn: 'Name (EN)', export: 'Data Export', auto: 'Enable auto backup', frequency: 'Frequency', monthly: 'Monthly', crm: 'CRM Settings', addStage: 'Add Stage', save: 'Save', validation: 'Fill all fields', contacts: 'Contact Types', system: '(system)' },
  { lang: 'ru', settings: 'Настройки', profile: 'Профиль компании', operations: 'Операции', account: 'Настройки аккаунта', tax: 'Налоги', company: 'Сведения о компании', back: 'Назад', links: ['Объекты', 'Календарь', 'Задачи'], switcher: 'Дополнительные блоки', role: 'Управление объектами (УК)', greeting: 'Доброе утро', director: 'Директор', unknown: 'Роль: audit_observer', newMeeting: 'Новая встреча', title: 'Тема', date: 'Дата и время', duration: 'Длительность (мин)', location: 'Место', create: 'Создать', close: 'Закрыть', cancel: 'Отмена', required: 'Укажите тему, дату и время.', status: 'Запланирована', delete: 'Удалить', deleteTitle: 'Удалить встречу?', retry: 'Повторить', error: 'Ошибка загрузки встреч', empty: 'Нет встреч', loading: 'Загрузка...', created: 'Встреча создана', month: 'окт.', branding: 'Бренд компании', color: 'Синий', saveProfile: 'Сохранить профиль', legal: 'Юридические данные', taxId: 'ИНН / Tax ID', expense: 'Статьи расходов', cleaning: 'Уборка', cost: 'Переменные', addCustom: 'Добавить свою', newCategory: 'Новая статья расхода', nameEn: 'Название (EN)', export: 'Экспорт данных', auto: 'Включить автобэкап', frequency: 'Частота', monthly: 'Ежемесячно', crm: 'Настройки CRM', addStage: 'Добавить этап', save: 'Сохранить', validation: 'Заполните все поля', contacts: 'Типы контактов', system: '(системный)' },
  { lang: 'th', settings: 'การตั้งค่า', profile: 'ข้อมูลบริษัท', operations: 'การดำเนินงาน', account: 'การตั้งค่าบัญชี', tax: 'ภาษี', company: 'ข้อมูลบริษัท', back: 'ย้อนกลับ', links: ['ที่พัก', 'ปฏิทิน', 'งาน'], switcher: 'ส่วนเพิ่มเติมในแดชบอร์ด', role: 'การบริหารที่พัก (บริษัทจัดการ)', greeting: 'สวัสดีตอนเช้า', director: 'ผู้อำนวยการ', unknown: 'บทบาท: audit_observer', newMeeting: 'นัดหมายใหม่', title: 'หัวข้อ', date: 'วันที่และเวลา', duration: 'ระยะเวลา (นาที)', location: 'สถานที่', create: 'สร้าง', close: 'ปิด', cancel: 'ยกเลิก', required: 'โปรดระบุหัวข้อ วันที่ และเวลา', status: 'กำหนดไว้แล้ว', delete: 'ลบ', deleteTitle: 'ลบการนัดหมายนี้หรือไม่?', retry: 'ลองอีกครั้ง', error: 'โหลดการนัดหมายไม่สำเร็จ', empty: 'ยังไม่มีการนัดหมาย', loading: 'กำลังโหลด...', created: 'สร้างการนัดหมายแล้ว', month: 'ต.ค.', branding: 'แบรนด์บริษัท', color: 'สีน้ำเงิน', saveProfile: 'บันทึกข้อมูลบริษัท', legal: 'ข้อมูลทางกฎหมาย', taxId: 'เลขประจำตัวผู้เสียภาษี', expense: 'หมวดหมู่รายจ่าย', cleaning: 'การทำความสะอาด', cost: 'ผันแปร', addCustom: 'เพิ่มหมวดหมู่เอง', newCategory: 'หมวดหมู่รายจ่ายใหม่', nameEn: 'ชื่อ (ภาษาอังกฤษ)', export: 'ส่งออกข้อมูล', auto: 'เปิดการสำรองข้อมูลอัตโนมัติ', frequency: 'ความถี่', monthly: 'ทุกเดือน', crm: 'การตั้งค่า CRM', addStage: 'เพิ่มขั้นตอน', save: 'บันทึก', validation: 'กรุณากรอกข้อมูลให้ครบ', contacts: 'ประเภทผู้ติดต่อ', system: '(ระบบ)' },
];

for (const l of locales) {
  describe(`MC actual component localization (${l.lang})`, () => {
    beforeEach(() => { state.language = l.lang; });
    it('keeps settings section URLs and Back/Forward context while opening real editors', async () => {
      mount(<MCSettingsPage />, '/mc/settings?tab=profile&property=synthetic');
      expect(screen.getByRole('heading', { name: l.settings })).toBeVisible();
      expect(screen.getByRole('button', { name: l.branding })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${l.operations}`) }));
      expect(screen.getByTestId('url')).toHaveTextContent('tab=operations');
      expect(screen.getByTestId('url')).toHaveTextContent('property=synthetic');
      fireEvent.click(screen.getByText('Synthetic Back'));
      await waitFor(() => expect(screen.getByTestId('url')).not.toHaveTextContent('tab=operations'));
      fireEvent.click(screen.getByText('Synthetic Forward'));
      await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('tab=operations'));
      expect(state.database).not.toHaveBeenCalled();
    });
    it('keeps account destinations, translated labels and back navigation', () => {
      mount(<OwnerAccountSettings />, '/mc/account-settings');
      expect(screen.getByRole('heading', { name: l.account })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: l.tax }));
      expect(screen.getByTestId('url')).toHaveTextContent('/mc/finance/tax-center');
      fireEvent.click(screen.getByRole('button', { name: l.company }));
      expect(screen.getByTestId('url')).toHaveTextContent('/mc/settings?tab=profile');
      fireEvent.click(screen.getByRole('button', { name: l.back }));
      expect(screen.getByTestId('url')).toHaveTextContent('/mc');
    });
    it('translates shortcuts and view options without changing routes or role IDs', () => {
      const onRoleChange = vi.fn();
      mount(<><DashboardDestinations businessRole="general" propertyCount={3} /><BusinessRoleSwitcher activeRole="general" onRoleChange={onRoleChange} /></>);
      const paths = ['/mc/properties', '/mc/calendar', '/mc/tasks'];
      l.links.forEach((name, index) => { fireEvent.click(screen.getByRole('link', { name })); expect(screen.getByTestId('url')).toHaveTextContent(paths[index]); });
      expect(screen.getByRole('option', { name: l.role })).toHaveValue('property_manager');
      fireEvent.change(screen.getByRole('combobox', { name: l.switcher }), { target: { value: 'property_manager' } });
      expect(onRoleChange).toHaveBeenCalledWith('property_manager');
      expect(screen.getByRole('link', { name: l.links[0] })).toHaveClass('whitespace-normal', 'min-w-0');
    });
    it('preserves names, translates known roles and keeps unknown membership explicit', () => {
      vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 19, 9));
      const { rerender } = render(<DashboardGreeting roleConfig={BUSINESS_ROLES.general} mcRole="director" />);
      expect(screen.getByRole('heading')).toHaveTextContent(`${l.greeting}, สมชาย`);
      expect(screen.getByText(l.director)).toBeVisible();
      rerender(<DashboardGreeting roleConfig={BUSINESS_ROLES.general} mcRole="audit_observer" mcRoleLabel={{ en: 'Director', ru: 'Директор', icon: '' }} />);
      expect(screen.getByText(l.unknown)).toBeVisible();
      expect(screen.queryByText(l.director)).not.toBeInTheDocument();
    });
    it('opens the draft once, localizes validation and closes without writes', async () => {
      mount(<CrmMeetingsPage />, '/mc/meetings?action=create&keep=yes');
      const dialog = await screen.findByRole('dialog', { name: l.newMeeting });
      expect(within(dialog).getByText(l.required)).toBeVisible();
      expect(within(dialog).getByRole('button', { name: l.create })).toBeDisabled();
      expect(within(dialog).getByLabelText(l.title)).toBeRequired();
      expect(within(dialog).getByLabelText(l.date)).toBeRequired();
      expect(screen.getByTestId('url')).toHaveTextContent('/mc/meetings?keep=yes');
      fireEvent.click(within(dialog).getByRole('button', { name: l.close }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('Synthetic Create'));
      expect(await screen.findByRole('dialog')).toBeVisible();
      expect(state.write).not.toHaveBeenCalled();
      expect(state.database).not.toHaveBeenCalled();
    });
    it('retains exact meeting payload and localized success when explicitly submitted to a stub', async () => {
      mount(<CrmMeetingsPage />, '/mc/meetings?action=create');
      await screen.findByRole('dialog');
      fireEvent.change(screen.getByLabelText(l.title), { target: { value: 'Original meeting ชื่อเดิม' } });
      fireEvent.change(screen.getByLabelText(l.date), { target: { value: '2026-10-20T09:30' } });
      fireEvent.change(screen.getByLabelText(l.location), { target: { value: 'Original location สถานที่เดิม' } });
      fireEvent.change(screen.getByLabelText(l.duration), { target: { value: '45' } });
      fireEvent.click(screen.getByRole('button', { name: l.create }));
      await waitFor(() => expect(state.toast).toHaveBeenCalledWith(l.created));
      expect(state.write).toHaveBeenCalledExactlyOnceWith({ company_id: 'synthetic-company', host_user_id: 'synthetic-user', title: 'Original meeting ชื่อเดิม', meeting_type: 'general', scheduled_at: new Date('2026-10-20T09:30').toISOString(), duration_minutes: 45, location: 'Original location สถานที่เดิม', status: 'scheduled', notes: null, contact_id: null, deal_id: null });
    });
    it('localizes known meeting states/dates and delete cancellation, leaving source names intact', () => {
      state.meetings = [{ id: 'synthetic', title: 'Long original title '.repeat(20), status: 'scheduled', scheduled_at: '2026-10-19T09:30:00', duration_minutes: 30, location: 'Original location'.repeat(15) } as CrmMeeting];
      mount(<CrmMeetingsPage />);
      expect(screen.getByText(l.status)).toBeVisible();
      expect(screen.getByText(new RegExp(l.month))).toBeVisible();
      expect(screen.getByText(state.meetings[0].title.trim())).toHaveClass('break-words', 'min-w-0');
      fireEvent.click(screen.getByRole('button', { name: l.delete }));
      const confirm = screen.getByRole('alertdialog', { name: l.deleteTitle });
      fireEvent.click(within(confirm).getByRole('button', { name: l.cancel }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(state.remove).not.toHaveBeenCalled();
    });
    it('localizes loading/empty/error and preserves create intent until a failed reader recovers', async () => {
      state.meetingLoading = true;
      const ui = mount(<CrmMeetingsPage />, '/mc/meetings?keep=yes');
      expect(screen.getByText(l.loading)).toBeVisible();
      state.meetingLoading = false; ui.rerender(<QueryClientProvider client={new QueryClient()}><MemoryRouter><CrmMeetingsPage /></MemoryRouter></QueryClientProvider>);
      expect(screen.getByText(l.empty)).toBeVisible(); cleanup();
      state.meetingError = true;
      mount(<CrmMeetingsPage />, '/mc/meetings?action=create&keep=yes');
      expect(screen.getByText(l.error)).toBeVisible();
      expect(screen.getByTestId('url')).toHaveTextContent('action=create');
      fireEvent.click(screen.getByRole('button', { name: l.retry }));
      expect(state.retry).toHaveBeenCalledTimes(1);
      expect(state.write).not.toHaveBeenCalled();
    });
    it('translates the actual company form and preserves existing bilingual company data', async () => {
      mount(<CompanyProfileSettings />);
      fireEvent.click(screen.getByRole('button', { name: l.branding }));
      expect(await screen.findByDisplayValue(state.company.name_en)).toBeVisible();
      expect(screen.getByDisplayValue(state.company.name_ru)).toBeVisible();
      expect(screen.getByRole('button', { name: l.color })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: l.legal }));
      expect(screen.getByText(l.taxId)).toBeVisible();
      expect(screen.getByRole('button', { name: l.saveProfile })).toBeVisible();
      expect(state.database).not.toHaveBeenCalled();
    });
    it('translates actual finance category rows and opens/cancels a localized editor', () => {
      mount(<FinanceCategorySettings />);
      expect(screen.getByRole('heading', { name: l.expense })).toBeVisible();
      expect(screen.getByText(l.cleaning)).toBeVisible();
      expect(screen.getByText(l.cleaning).parentElement).toHaveClass('col-start-2', 'row-start-1', 'min-w-0');
      expect(screen.getByText(l.cleaning).parentElement?.parentElement).toHaveClass('grid', 'grid-cols-[auto_minmax(0,1fr)_auto]');
      expect(screen.getAllByText(l.cost).length).toBeGreaterThan(0);
      fireEvent.click(screen.getAllByRole('button', { name: l.addCustom })[0]);
      const dialog = screen.getByRole('dialog', { name: l.newCategory });
      expect(within(dialog).getByLabelText(l.nameEn)).toBeVisible();
      fireEvent.click(within(dialog).getByRole('button', { name: l.cancel }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(state.write).not.toHaveBeenCalled();
    });
    it('translates the actual backup configuration without triggering exports or changes', () => {
      mount(<DataBackupSettings />);
      expect(screen.getByText(l.export)).toBeVisible();
      expect(screen.getByRole('switch', { name: l.auto })).toBeChecked();
      expect(screen.getByRole('combobox', { name: l.frequency })).toHaveTextContent(l.monthly);
      expect(state.database).not.toHaveBeenCalled();
    });
    it('translates actual CRM stage/option editors and validation, preserving original option labels', async () => {
      mount(<PipelineSettingsPage />);
      expect(screen.getByRole('heading', { name: l.crm })).toBeVisible();
      const sale = screen.getByRole('button', { name: l.lang === 'ru' ? 'Продажа' : l.lang === 'th' ? 'การขาย' : 'Sale' });
      expect(sale.parentElement).toHaveClass('flex-wrap');
      expect(sale).toHaveClass('max-w-full', 'whitespace-normal');
      fireEvent.click(screen.getByRole('button', { name: l.addStage }));
      fireEvent.click(screen.getByRole('button', { name: l.save }));
      expect(state.toast.error).toHaveBeenCalledWith(l.validation);
      expect(state.write).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: l.cancel }));
      fireEvent.mouseDown(screen.getByRole('tab', { name: l.contacts }), { button: 0, ctrlKey: false });
      expect(await screen.findByText(l.lang === 'ru' ? 'Исходное название' : 'Original Company Label')).toBeVisible();
      expect(screen.getByText(l.system)).toBeVisible();
    });
  });
}

it('does not turn unknown meeting status into a known translated state', () => {
  state.language = 'th'; state.meetings = [{ id: 'synthetic', title: 'Original', status: 'awaiting_provider', scheduled_at: '2026-10-19T09:30:00', duration_minutes: 30 } as CrmMeeting];
  mount(<CrmMeetingsPage />);
  expect(screen.getByText('awaiting_provider')).toBeVisible();
  expect(screen.queryByText('กำหนดไว้แล้ว')).not.toBeInTheDocument();
});
it('does not replace a user-customized finance category with the stock Thai translation', () => {
  state.language = 'th'; state.categorySettings = [{ category_code: 'cleaning', custom_name_en: 'Original Contract Cleaning' }];
  mount(<FinanceCategorySettings />);
  expect(screen.getByText('Original Contract Cleaning')).toBeVisible();
  expect(screen.queryByText('การทำความสะอาด')).not.toBeInTheDocument();
});
it('keeps the existing CRM role gate, with a localized denial for an unknown role', () => {
  state.language = 'th'; state.role = 'audit_observer';
  mount(<PipelineSettingsPage />);
  expect(screen.getByText('คุณไม่มีสิทธิ์เข้าถึงการตั้งค่า CRM')).toBeVisible();
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(state.write).not.toHaveBeenCalled();
});
it('keeps consumed meeting intent closed after Back and Forward in Thai', async () => {
  state.language = 'th';
  render(<MemoryRouter initialEntries={['/mc', '/mc/meetings?action=create&keep=yes']} initialIndex={1}><Routes><Route path="/mc" element={<p>Synthetic previous page</p>} /><Route path="/mc/meetings" element={<CrmMeetingsPage />} /></Routes><LocationProbe /></MemoryRouter>);
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'ปิด' }));
  fireEvent.click(screen.getByText('Synthetic Back'));
  expect(await screen.findByText('Synthetic previous page')).toBeVisible();
  fireEvent.click(screen.getByText('Synthetic Forward'));
  await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/mc/meetings?keep=yes'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(state.write).not.toHaveBeenCalled();
});
it.each([
  ['scheduled', 'กำหนดไว้แล้ว'], ['in_progress', 'กำลังดำเนินการ'], ['completed', 'เสร็จสิ้น'], ['cancelled', 'ยกเลิกแล้ว'], ['missed', 'ไม่ได้เข้าร่วม'],
])('renders the Thai caption for meeting status %s', (status, label) => {
  state.language = 'th'; state.meetings = [{ id: 'synthetic', title: 'Original', status, scheduled_at: '2026-10-19T09:30:00', duration_minutes: 30 } as CrmMeeting];
  mount(<CrmMeetingsPage />);
  expect(screen.getByText(label)).toBeVisible();
});
it.each([
  ['director', 'ผู้อำนวยการ'], ['admin', 'ผู้ดูแลระบบ'], ['manager', 'ผู้จัดการ'], ['accountant', 'นักบัญชี'], ['staff', 'พนักงาน'], ['member', 'สมาชิก'],
])('renders the Thai caption for verified company role %s', (role, label) => {
  state.language = 'th';
  render(<DashboardGreeting roleConfig={BUSINESS_ROLES.general} mcRole={role} />);
  expect(screen.getByText(label)).toBeVisible();
});
it('keeps a localized pending meeting button disabled', async () => {
  state.language = 'th'; state.pending = true;
  mount(<CrmMeetingsPage />, '/mc/meetings?action=create');
  await screen.findByRole('dialog');
  expect(screen.getByRole('button', { name: 'กำลังสร้าง...' })).toBeDisabled();
  expect(state.write).not.toHaveBeenCalled();
});
it('keeps a failed meeting draft open with a localized error and original input', async () => {
  state.language = 'th'; state.write.mockRejectedValueOnce(new Error('Synthetic failure'));
  mount(<CrmMeetingsPage />, '/mc/meetings?action=create');
  await screen.findByRole('dialog');
  fireEvent.change(screen.getByLabelText('หัวข้อ'), { target: { value: 'Original meeting' } });
  fireEvent.change(screen.getByLabelText('วันที่และเวลา'), { target: { value: '2026-10-20T09:30' } });
  fireEvent.click(screen.getByRole('button', { name: 'สร้าง' }));
  await waitFor(() => expect(state.toast.error).toHaveBeenCalledWith('เกิดข้อผิดพลาด'));
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(screen.getByLabelText('หัวข้อ')).toHaveValue('Original meeting');
});
