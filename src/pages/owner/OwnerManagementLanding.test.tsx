import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import OwnerManagementLanding from './OwnerManagementLanding';
const fixture = vi.hoisted(() => ({ language: 'en', submit: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useUniversalLead', () => ({ useUniversalLead: () => ({ submitLead: { isPending: false, mutateAsync: fixture.submit } }) }));
vi.mock('@/hooks/useCapitalIntroRequest', () => ({ useCapitalIntroRequest: () => ({ isPending: false }) }));
vi.mock('@/components/landings/LandingShell', () => ({ LandingShell: ({ formSlot, children }: { formSlot: React.ReactNode; children: React.ReactNode }) => <>{formSlot}{children}</> }));
function History() { const navigate = useNavigate(); return <><button onClick={() => navigate(-1)}>Back</button><button onClick={() => navigate('/owner/management-landing?intent=management&source=fixture')}>External management query</button></>; }
beforeEach(() => { fixture.language = 'en'; fixture.submit.mockReset(); fixture.submit.mockResolvedValue({ id: 'synthetic-only' }); });
afterEach(cleanup);
it('preserves contacts across intent changes and history; saves canonical context with a confirmed receipt', async () => {
 render(<MemoryRouter initialEntries={['/owner/management-landing?intent=rent']}><OwnerManagementLanding /><History /></MemoryRouter>);
 fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Synthetic owner' } });
 fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '+66000000000' } });
 fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Already rented, discuss next steps' } });
 fireEvent.click(screen.getByRole('radio', { name: 'Discuss management' }));
 expect(screen.getByLabelText(/Name/)).toHaveValue('Synthetic owner');
 fireEvent.click(screen.getByRole('button', { name: 'Back' }));
 await waitFor(() => expect(screen.getByRole('radio', { name: 'I want to rent it out' })).toBeChecked());
 expect(screen.getByLabelText('Message')).toHaveValue('Already rented, discuss next steps');
 fireEvent.click(screen.getByRole('button', { name: 'I want to rent it out' }));
 expect(await screen.findByText('Request saved')).toBeVisible();
 expect(fixture.submit).toHaveBeenCalledWith(expect.objectContaining({ request_type: 'full_management', vertical_id: 'properties', vertical_metadata: { owner_intent: 'rent' }, entry_point: '/owner/management-landing?intent=rent', notes: 'I want to rent it out\nAlready rented, discuss next steps' }));
});
it.each(['ru', 'en', 'th'])('renders translated owner intent controls in %s', language => {
 fixture.language = language;
 render(<MemoryRouter initialEntries={['/owner/management-landing?intent=unknown']}><OwnerManagementLanding /></MemoryRouter>);
 expect(screen.getAllByRole('radio')).toHaveLength(2);
 expect(screen.getAllByRole('radio')[1]).toBeChecked();
 expect(screen.getAllByRole('radio').every(r => !!r.closest('label')?.textContent)).toBe(true);
 for (const control of screen.getAllByRole('radio')) { expect(control).toHaveClass('min-h-0'); expect(control.closest('label')).toHaveClass('min-h-11'); }
});
it('locks the submitted intent while pending and after receipt; failure re-enables the original draft', async () => {
 let reject!: (error: Error) => void;
 fixture.submit.mockImplementationOnce(() => new Promise((_yes, no) => { reject = no; }));
 render(<MemoryRouter initialEntries={['/owner/management-landing?intent=rent']}><OwnerManagementLanding /></MemoryRouter>);
 fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Synthetic owner' } });
 fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '+66000000000' } });
 fireEvent.click(screen.getByRole('button', { name: 'I want to rent it out' }));
 expect(screen.getByRole('radio', { name: 'Discuss management' })).toBeDisabled();
 reject(new Error('Synthetic failure'));
 expect(await screen.findByRole('alert')).toBeVisible();
 expect(screen.getByRole('radio', { name: 'Discuss management' })).toBeEnabled();
 fireEvent.click(screen.getByRole('button', { name: 'I want to rent it out' }));
 expect(await screen.findByText('Request saved')).toBeVisible();
 expect(screen.getByRole('radio', { name: 'I want to rent it out' })).toBeChecked();
 expect(screen.getByRole('radio', { name: 'Discuss management' })).toBeDisabled();
});

it('keeps attempted intent and contacts across a pending query change, failure and explicit retry', async () => {
 let reject!: (error: Error) => void;
 fixture.submit.mockImplementationOnce(() => new Promise((_yes, no) => { reject = no; })).mockResolvedValueOnce({id:'synthetic-retry-receipt'});
 render(<MemoryRouter initialEntries={['/owner/management-landing?intent=rent&source=fixture']}><OwnerManagementLanding/><History/></MemoryRouter>);
 fireEvent.change(screen.getByLabelText(/Name/),{target:{value:'Synthetic owner'}});
 fireEvent.change(screen.getByLabelText(/Phone/),{target:{value:'+66000000000'}});
 fireEvent.change(screen.getByLabelText('Email'),{target:{value:'synthetic@example.invalid'}});
 fireEvent.change(screen.getByLabelText('Message'),{target:{value:'Existing tenancy; individual assessment'}});
 fireEvent.click(screen.getByRole('button',{name:'I want to rent it out'}));
 expect(screen.getByLabelText(/Name/)).toBeDisabled();expect(screen.getByLabelText(/Phone/)).toBeDisabled();expect(screen.getByLabelText('Email')).toBeDisabled();expect(screen.getByLabelText('Message')).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'External management query'}));
 expect(screen.getByRole('radio',{name:'I want to rent it out'})).toBeChecked();expect(fixture.submit).toHaveBeenCalledOnce();
 reject(new Error('Synthetic response unavailable'));
 await screen.findByRole('alert');
 expect(screen.getByRole('radio',{name:'I want to rent it out'})).toBeChecked();expect(screen.getByLabelText(/Name/)).toBeEnabled();
 expect(screen.getByLabelText('Email')).toHaveValue('synthetic@example.invalid');expect(screen.getByLabelText('Message')).toHaveValue('Existing tenancy; individual assessment');
 fireEvent.click(screen.getByRole('button',{name:'I want to rent it out'}));await screen.findByText('Request saved');
 expect(fixture.submit).toHaveBeenCalledTimes(2);expect(fixture.submit.mock.calls[1][0]).toEqual(fixture.submit.mock.calls[0][0]);
 expect(screen.getByRole('radio',{name:'I want to rent it out'})).toBeChecked();
});
it('allows a deliberate new goal after failure without erasing contacts or pretending it is a replay', async () => {
 fixture.submit.mockRejectedValueOnce(new Error('Synthetic failure')).mockResolvedValueOnce({id:'synthetic-new-receipt'});
 render(<MemoryRouter initialEntries={['/owner/management-landing?intent=rent']}><OwnerManagementLanding/></MemoryRouter>);
 fireEvent.change(screen.getByLabelText(/Name/),{target:{value:'Synthetic owner'}});fireEvent.change(screen.getByLabelText(/Phone/),{target:{value:'+66000000000'}});
 fireEvent.click(screen.getByRole('button',{name:'I want to rent it out'}));await screen.findByRole('alert');
 fireEvent.click(screen.getByRole('radio',{name:'Discuss management'}));
 expect(screen.getByRole('radio',{name:'Discuss management'})).toBeChecked();expect(screen.getByLabelText(/Name/)).toHaveValue('Synthetic owner');
 fireEvent.click(screen.getByRole('button',{name:'Discuss management'}));await screen.findByText('Request saved');
 expect(fixture.submit.mock.calls[0][0]).toMatchObject({vertical_metadata:{owner_intent:'rent'},entry_point:'/owner/management-landing?intent=rent'});
 expect(fixture.submit.mock.calls[1][0]).toMatchObject({vertical_metadata:{owner_intent:'management'},entry_point:'/owner/management-landing?intent=management',notes:'Discuss management'});
});
