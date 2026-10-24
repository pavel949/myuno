import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {MemoryRouter,Route,Routes,useNavigate} from 'react-router-dom';
import ServiceFunctionOrder from './ServiceFunctionOrder';
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en',t:(s:string)=>s})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:null})}));
vi.mock('@/hooks/useOrders',()=>({useOrders:()=>({createOrder:()=>{throw Error('Forbidden')},isCreating:false})}));
vi.mock('@/hooks/useGeolocation',()=>({useGeolocation:()=>({hasLocation:false,getPosition:()=>{throw Error('Forbidden')},loading:false})}));
let height=121;
const observers:{target?:Element,callback:ResizeObserverCallback,disconnect:ReturnType<typeof vi.fn>}[]=[];
beforeEach(()=>{height=121;observers.length=0;const original=HTMLElement.prototype.getBoundingClientRect;vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){return this.hasAttribute('data-service-request-action-bar')?{x:0,y:900-height,width:390,height,top:900-height,bottom:900,left:0,right:390,toJSON:()=>({})}:original.call(this);});vi.stubGlobal('ResizeObserver',class{target?:Element;callback:ResizeObserverCallback;disconnect=vi.fn();constructor(cb:ResizeObserverCallback){this.callback=cb;observers.push(this);}observe(target:Element){this.target=target;}unobserve(){}});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();document.documentElement.style.removeProperty('--service-request-action-height');});
function Leave(){const n=useNavigate();return <button onClick={()=>n('/discover/services')}>Leave request</button>;}
function mount(){return render(<MemoryRouter initialEntries={['/services/order/deep_cleaning']}><Leave/><Routes><Route path="/services/order/:functionId" element={<ServiceFunctionOrder/>}/><Route path="/discover/services" element={<p>Catalogue</p>}/></Routes></MemoryRouter>);}
describe('request action clearance lifecycle',()=>{
 it('measures actual action height and responds to observed text reflow',()=>{mount();expect(document.documentElement.style.getPropertyValue('--service-request-action-height')).toBe('121px');const observer=observers.find(o=>o.target?.hasAttribute('data-service-request-action-bar'));expect(observer).toBeDefined();height=205;act(()=>observer!.callback([],{}as ResizeObserver));expect(document.documentElement.style.getPropertyValue('--service-request-action-height')).toBe('205px');});
 it('restores an existing inline value and priority on route departure and disconnects observation',()=>{document.documentElement.style.setProperty('--service-request-action-height','17px','important');mount();const observer=observers.find(o=>o.target?.hasAttribute('data-service-request-action-bar'));fireEvent.click(screen.getByRole('button',{name:'Leave request'}));expect(document.documentElement.style.getPropertyValue('--service-request-action-height')).toBe('17px');expect(document.documentElement.style.getPropertyPriority('--service-request-action-height')).toBe('important');expect(observer!.disconnect).toHaveBeenCalledOnce();});
 it('removes its variable when no previous owner existed and no longer reacts to resize',()=>{const {unmount}=mount();unmount();height=240;fireEvent(window,new Event('resize'));expect(document.documentElement.style.getPropertyValue('--service-request-action-height')).toBe('');});
});
