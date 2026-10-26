import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {cleanup} from '@testing-library/react';
import {MemoryRouter,Route,Routes,useLocation} from 'react-router-dom';
import ServiceFunctionOrder from './ServiceFunctionOrder';
const fixture=vi.hoisted(()=>({user:null as null|{id:string,email:string},create:vi.fn(),language:'en'}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:fixture.language,t:(s:string)=>s})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:fixture.user})}));
vi.mock('@/hooks/useOrders',()=>({useOrders:()=>({createOrder:fixture.create,isCreating:false})}));
vi.mock('@/hooks/useGeolocation',()=>({useGeolocation:()=>({hasLocation:false,getPosition:()=>{throw Error('Forbidden')},loading:false})}));
afterEach(()=>{cleanup();vi.clearAllMocks();fixture.user=null;fixture.language='en';});
function Location(){const l=useLocation();return <output data-testid="location">{l.pathname+l.search+l.hash}|{JSON.stringify(l.state)}</output>;}
function mount(context?: unknown){return render(<MemoryRouter initialEntries={[{pathname:'/services/order/deep_cleaning',search:'?returnTo=%2Fdiscover%2Fservices%3Fcategory%3Dcleaning',state:context}]}><Routes><Route path="/services/order/:functionId" element={<ServiceFunctionOrder/>}/><Route path="/auth" element={<p>Auth destination</p>}/><Route path="/discover/services" element={<p>Catalogue destination</p>}/></Routes><Location/></MemoryRouter>);}
function fill(){fireEvent.change(screen.getByLabelText(/^Address/),{target:{value:'Synthetic address'}});fireEvent.change(screen.getByLabelText(/^Your name/),{target:{value:'Synthetic person'}});fireEvent.change(screen.getByLabelText(/^Phone\s*\*$/),{target:{value:'+66000000000'}});}
describe('request form accessible semantics',()=>{
 it.each(['en','ru'])('associates all fields and both radio groups in %s',lang=>{fixture.language=lang;mount();for(const label of lang==='en'?[/^Address/,/^Preferred Date/,/^Describe the problem/,/^Your name/,/^Phone\s*\*$/]:[/^Адрес/,/^Предпочтительная дата/,/^Опишите проблему/,/^Ваше имя/,/^Телефон/])expect(screen.getByLabelText(label)).toHaveAttribute('id');expect(screen.getAllByRole('radiogroup')).toHaveLength(2);for(const group of screen.getAllByRole('radiogroup'))expect(group).toHaveAccessibleName();expect(screen.getByLabelText(lang==='en'?/^Preferred Date/:/^Предпочтительная дата/)).not.toBeRequired();});
 it('localizes required feedback without changing native required rules',()=>{fixture.language='ru';mount();const address=screen.getByLabelText(/^Адрес/);fireEvent.invalid(address);expect(address).toHaveAccessibleDescription('Заполните это поле');});
 it('associates native invalid feedback then clears only edited field error',()=>{mount();const address=screen.getByLabelText(/^Address/);fireEvent.invalid(address);expect(address).toHaveAttribute('aria-invalid','true');expect(address).toHaveAccessibleDescription();fireEvent.change(address,{target:{value:'Synthetic address'}});expect(address).not.toHaveAttribute('aria-invalid');expect(fixture.create).not.toHaveBeenCalled();});
 it('returns to catalogue filters, hash and in-memory context without invoking a writer', () => {
   mount({ catalogueState: { from: 'trip' }, catalogueHash: '#requests' });
   fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
   expect(screen.getByText('Catalogue destination')).toBeVisible();
   expect(screen.getByTestId('location')).toHaveTextContent('/discover/services?category=cleaning#requests|{"from":"trip"}');
   expect(fixture.create).not.toHaveBeenCalled();
 });
 it('retains guest auth redirect with original returnTo and never invokes writer',()=>{mount();fill();fireEvent.submit(document.querySelector('form')!);expect(screen.getByText('Auth destination')).toBeInTheDocument();expect(screen.getByTestId('location')).toHaveTextContent('/auth?redirect=%2Fservices%2Forder%2Fdeep_cleaning%3FreturnTo%3D%252Fdiscover%252Fservices%253Fcategory%253Dcleaning');expect(fixture.create).not.toHaveBeenCalled();});
 it('keeps whitespace validation before authenticated writer',()=>{fixture.user={id:'synthetic',email:'synthetic@example.test'};mount();fill();fireEvent.change(screen.getByLabelText(/^Your name/),{target:{value:'   '}});fireEvent.submit(document.querySelector('form')!);expect(screen.getByLabelText(/^Your name/)).toHaveAttribute('aria-invalid','true');expect(fixture.create).not.toHaveBeenCalled();});
 it('keeps actual payload and presents failed acknowledgement without clearing inputs; retry allowed',async()=>{fixture.user={id:'synthetic',email:'synthetic@example.test'};fixture.create.mockResolvedValue({success:false});mount();fill();fireEvent.submit(document.querySelector('form')!);await screen.findByRole('alert');expect(screen.getByRole('alert')).toHaveTextContent('Request saving was not confirmed');expect(screen.getByLabelText(/^Address/)).toHaveValue('Synthetic address');expect(fixture.create).toHaveBeenCalledWith(expect.objectContaining({order_type:'service',total_amount:2500,currency:'THB',payment:{method:'cash',amount:2500},openWhatsAppOnCash:false,metadata:{preferred_time:'morning',contact_method:'whatsapp',function_id:'deep_cleaning'}}));fireEvent.submit(document.querySelector('form')!);await waitFor(()=>expect(fixture.create).toHaveBeenCalledTimes(2));});
});
