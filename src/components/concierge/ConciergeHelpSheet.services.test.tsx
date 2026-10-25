import {fireEvent,render,screen,waitFor,cleanup} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {ConciergeHelpSheet} from './ConciergeHelpSheet';
const fixture=vi.hoisted(()=>({invoke:vi.fn()}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:null})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{functions:{invoke:fixture.invoke}}}));
vi.mock('@/lib/analytics/track',()=>({trackEvent:vi.fn()}));
vi.mock('@/components/ui/voice-input-button',()=>({VoiceInputButton:()=>null,appendTranscript:(a:string,b:string)=>a+b}));
afterEach(()=>{cleanup();vi.resetAllMocks();});
function mount(){render(<ConciergeHelpSheet open onOpenChange={()=>{}} topic="general" subjectPlaceholder="For example: help with plumbing" messagePlaceholder="Describe your service task" sourceData={{source:'services_catalogue'}}/>);}
describe('services inquiry presentation keeps one-contact JS contract',()=>{
 it('uses contextual examples but retains other callers defaults',()=>{mount();expect(screen.getByPlaceholderText('For example: help with plumbing')).toBeInTheDocument();expect(screen.getByPlaceholderText('Describe your service task')).toBeInTheDocument();cleanup();render(<ConciergeHelpSheet open onOpenChange={()=>{}} topic="general"/>);expect(screen.getByPlaceholderText('For example: education visa for one year')).toBeInTheDocument();});
 it('announces one-of contact guidance without false individual required markers',()=>{mount();for(const label of ['Email','Phone']){const input=screen.getByLabelText(label,{exact:true});expect(input).not.toBeRequired();expect(input).toHaveAccessibleDescription('Email or phone is required — one contact is enough.');}});
 it('rejects missing contacts with associated errors and no transport',()=>{mount();fireEvent.change(screen.getByLabelText(/Tell us what you need/),{target:{value:'Synthetic service task'}});fireEvent.click(screen.getByRole('button',{name:'Send to a concierge'}));expect(screen.getByLabelText('Email',{exact:true})).toHaveAttribute('aria-invalid','true');expect(screen.getByLabelText('Phone',{exact:true})).toHaveAccessibleDescription(/Email or phone is required/);expect(fixture.invoke).not.toHaveBeenCalled();});
 it.each(['Email','Phone'])('accepts %s alone with unchanged general topic/context and exposes failed receipt',async label=>{fixture.invoke.mockResolvedValue({data:null,error:new Error('Synthetic unavailable')});mount();fireEvent.change(screen.getByLabelText(/Tell us what you need/),{target:{value:'Synthetic service task'}});fireEvent.change(screen.getByLabelText(label,{exact:true}),{target:{value:label==='Email'?'synthetic@example.test':'+66000000000'}});fireEvent.click(screen.getByRole('button',{name:'Send to a concierge'}));await waitFor(()=>expect(fixture.invoke).toHaveBeenCalledOnce());expect(fixture.invoke).toHaveBeenCalledWith('submit-help-request',{body:expect.objectContaining({topic:'general',source_data:{source:'services_catalogue'},message:'Synthetic service task'})});await screen.findByRole('alert');expect(screen.queryByText('Your request is saved')).toBeNull();});
});
