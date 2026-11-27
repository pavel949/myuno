import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import VipConcierge from '../VipConcierge';
import ContactPage from '../info/ContactPage';
import {WhatsAppConciergeBlock} from '@/components/life-flow/WhatsAppConciergeBlock';
const state=vi.hoisted(()=>({language:'en',t:(s:string)=>s}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>state}));
vi.mock('@/components/layout/AppLayout',()=>({AppLayout:({children}:React.PropsWithChildren)=><main>{children}</main>}));
vi.mock('@/components/uno/PageHeader',()=>({PageHeader:()=>null}));
vi.mock('@/components/layout/AnimatedList',()=>({FadeInUp:({children}:React.PropsWithChildren)=><div>{children}</div>,AnimatedList:({children}:React.PropsWithChildren)=><div>{children}</div>,AnimatedItem:({children}:React.PropsWithChildren)=><div>{children}</div>}));
vi.mock('@/components/concierge/ConciergeHelpSheet',()=>({ConciergeHelpSheet:({initialSubject,sourceData}: {initialSubject:string;sourceData:unknown})=><div role="dialog">{initialSubject}<output>{JSON.stringify(sourceData)}</output></div>}));
afterEach(()=>{cleanup();state.language='en';});
describe('concierge entry routing and contacts',()=>{
 it('routes a selected VIP service to a persisted request with its context',()=>{render(<VipConcierge/>);fireEvent.click(screen.getByRole('button',{name:/Helicopter Transfers/}));expect(screen.getByRole('dialog')).toHaveTextContent('Helicopter Transfers');expect(screen.getByRole('dialog')).toHaveTextContent('helicopters');});
 it('opens the shared request for life-flow concierge instead of skipping persistence',()=>{render(<WhatsAppConciergeBlock context="trip"/>);fireEvent.click(screen.getByRole('button',{name:'Send a request'}));expect(screen.getByRole('dialog')).toHaveTextContent('life_flow_concierge');expect(screen.getByRole('dialog')).toHaveTextContent('trip');});
 it.each(['ru','en','th'])('publishes both approved WhatsApp contacts in %s',language=>{state.language=language;render(<ContactPage/>);expect(document.querySelector('a[href="https://wa.me/66630827085"]')).not.toBeNull();expect(document.querySelector('a[href="https://wa.me/66954243332"]')).not.toBeNull();expect(screen.getByText('WhatsApp · Pavel')).toBeInTheDocument();});
});
