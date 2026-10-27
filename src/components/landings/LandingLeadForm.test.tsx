import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LandingLeadForm } from './LandingLeadForm';
const fixture = vi.hoisted(() => ({ submit: vi.fn(), language: 'en' }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('@/hooks/useCapitalIntroRequest', () => ({ useCapitalIntroRequest: () => ({ isPending: false, mutateAsync: vi.fn() }) }));
vi.mock('@/hooks/useUniversalLead', () => ({ useUniversalLead: () => ({ submitLead: { isPending: false, mutateAsync: fixture.submit } }) }));
beforeEach(() => { fixture.submit.mockReset(); fixture.language = 'en'; });
afterEach(cleanup);
function show() { render(<LandingLeadForm variant="universal" verticalId="properties" entryPoint="synthetic-owner" />); fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Synthetic owner' } }); fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '+66000000000' } }); }
it.each([null, { id: '' }, { id: '  ' }])('keeps the form and shows unconfirmed error for missing receipt %s, permits explicit retry', async receipt => {
 fixture.submit.mockResolvedValueOnce(receipt).mockResolvedValueOnce({ id: 'synthetic-request' }); show();
 fireEvent.click(screen.getByRole('button', { name: 'Submit request' })); expect(await screen.findByRole('alert')).toHaveTextContent('not confirmed'); expect(screen.queryByText('Request saved')).toBeNull();
 fireEvent.click(screen.getByRole('button', { name: 'Submit request' })); expect(await screen.findByText('Request saved')).toBeVisible(); expect(screen.getByText(/A team reply is pending/)).toBeVisible(); expect(fixture.submit).toHaveBeenCalledTimes(2);
});
it('preserves inputs after server error and synchronously prevents concurrent submit events', async () => {
 let reject!: (error: Error) => void; fixture.submit.mockImplementationOnce(() => new Promise((_resolve, no) => { reject = no; })); show();
 const form = screen.getByRole('button', { name: 'Submit request' }).closest('form')!;
 fireEvent.submit(form); fireEvent.submit(form); expect(fixture.submit).toHaveBeenCalledOnce(); expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
 reject(new Error('Synthetic rejection')); expect(await screen.findByRole('alert')).toBeVisible(); expect(screen.getByLabelText(/Name/)).toHaveValue('Synthetic owner'); await waitFor(() => expect(screen.getByRole('button', { name: 'Submit request' })).toBeEnabled());
});
it('renders Thai shared labels and optional Thai caller copy', () => {
 fixture.language = 'th'; render(<LandingLeadForm variant="universal" entryPoint="synthetic-owner" submitLabel={{ ru: 'Отправить', en: 'Send', th: 'ส่งถึงทีม' }} />);
 expect(screen.getByLabelText(/ชื่อ/)).toBeVisible(); expect(screen.getByLabelText(/โทรศัพท์/)).toBeVisible(); expect(screen.getByLabelText('อีเมล')).toBeVisible(); expect(screen.getByRole('button', { name: 'ส่งถึงทีม' })).toBeDisabled();
});
it('keeps Russian consent accurate for an owner-specific submit label', () => {
 fixture.language = 'ru';
 render(<LandingLeadForm variant="universal" entryPoint="synthetic-owner" submitLabel={{ ru: 'Обсудить управление', en: 'Ask about management', th: 'สอบถามการจัดการ' }} />);
 expect(screen.getByRole('button', { name: 'Обсудить управление' })).toBeVisible();
 expect(screen.getByText('Отправляя заявку, вы соглашаетесь с обработкой персональных данных.')).toBeVisible();
 expect(screen.queryByText(/Нажимая «Отправить»/)).toBeNull();
});

it('preserves canonical project context and purchase intent in an isolated inquiry', async () => {
 fixture.submit.mockResolvedValue({ id: 'synthetic-receipt' });
 render(<LandingLeadForm variant="universal" verticalId="properties" universalRequestType="property_purchase" entryPoint="offplan_project_synthetic" contextMetadata={{ project_id: 'synthetic-project' }} />);
 fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Synthetic buyer' } });
 fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '+66000000000' } });
 fireEvent.click(screen.getByRole('button', { name: 'Submit request' }));
 expect(await screen.findByText('Request saved')).toBeVisible();
 expect(fixture.submit).toHaveBeenCalledWith(expect.objectContaining({ vertical_id: 'properties', request_type: 'property_purchase', vertical_metadata: { project_id: 'synthetic-project' } }));
});
