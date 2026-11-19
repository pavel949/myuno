import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PropertyConsultation from '../PropertyConsultation';
const fixture=vi.hoisted(()=>({personas:[] as string[],submit:vi.fn(),developer:vi.fn()}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:null})}));
vi.mock('@/contexts/CurrencyContext',()=>({useCurrency:()=>({currencyInfo:{code:'THB',symbol:'฿'}})}));
vi.mock('@/contexts/LocationContext',()=>({useLocation:()=>({currentCity:{default_currency:'THB'}})}));
vi.mock('@/hooks/useUserPersonas',()=>({useUserPersonas:()=>({personas:fixture.personas})}));
vi.mock('@/hooks/useConsultationRequests',()=>({useConsultationRequests:()=>({requestPropertyConsultation:{mutateAsync:fixture.submit},requestPropertyTour:{mutateAsync:fixture.submit},requestInvestmentAdvice:{mutateAsync:fixture.submit},requestVacationRental:{mutateAsync:fixture.submit},requestDeveloperPartnership:{mutateAsync:fixture.developer}})}));
vi.mock('@/components/uno/PageHeader',()=>({PageHeader:({title}:{title:string})=><h1>{title}</h1>}));
afterEach(cleanup);
beforeEach(()=>{vi.clearAllMocks();fixture.personas=[];fixture.submit.mockResolvedValue({id:'synthetic-buyer-reference'});});
function mount(path='/property/consultation?market=newbuilds'){render(<MemoryRouter initialEntries={[path]}><PropertyConsultation/></MemoryRouter>);}
function contact(){fireEvent.click(screen.getByRole('button',{name:'Continue'}));fireEvent.click(screen.getByRole('button',{name:'Continue'}));fireEvent.change(screen.getByPlaceholderText('How should we call you?'),{target:{value:'Synthetic buyer'}});fireEvent.change(screen.getByPlaceholderText('+66...'),{target:{value:'+66000000000'}});}
it.each([{personas:[] as string[]},{personas:['real_estate_developer']}])('opens the explicit newbuild entry as purchase rather than inherited persona $personas',async ({personas})=>{fixture.personas=personas;mount();expect(screen.getByRole('radio',{name:/Buy Property/})).toBeChecked();contact();fireEvent.click(screen.getByRole('button',{name:'Submit Request'}));expect(await screen.findByText('synthetic-buyer-reference')).toBeVisible();expect(fixture.submit).toHaveBeenCalledWith(expect.objectContaining({vertical_id:'properties',vertical_metadata:{marketplace:'newbuilds',buyer_intent:'property_consultation'},entry_point:'/property/offplan'}));expect(fixture.developer).not.toHaveBeenCalled();expect(screen.getByText(/A response time has not been confirmed/)).toBeVisible();});
it('keeps an unconfirmed receipt out of success and preserves buyer details',async()=>{fixture.submit.mockResolvedValue(null);mount();contact();fireEvent.click(screen.getByRole('button',{name:'Submit Request'}));expect(await screen.findByRole('alert')).toHaveTextContent('not confirmed');expect(screen.getByPlaceholderText('How should we call you?')).toHaveValue('Synthetic buyer');expect(screen.queryByText('Thank you!')).toBeNull();});
it('preserves existing default rental entry when no newbuild context is specified',()=>{mount('/property/consultation');expect(screen.getByRole('radio',{name:/Vacation Rental/})).toBeChecked();});
it('preserves existing developer partnership entry without explicit buyer context',()=>{fixture.personas=['real_estate_developer'];mount('/property/consultation');expect(screen.queryByRole('radio',{name:/Buy Property/})).toBeNull();expect(screen.getByText('Newbuilds on myUNO')).toBeVisible();});
