import React from 'react';
import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { MemoryRouter,useNavigate } from 'react-router-dom';
import { SideRail } from '@/components/nav/SideRail';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { getOwnerSidebarForRole } from '@/lib/nav/navigationModel';
const state=vi.hoisted(()=>({language:'en',role:'property_manager' as 'property_manager'|'general'|'sales_agent'|'service_provider',propertyCount:3}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:state.language})}));
vi.mock('@/hooks/useBusinessRole',()=>({useBusinessRole:()=>({role:state.role})}));
vi.mock('@/hooks/useMyProperties',()=>({useMyProperties:()=>({allProperties:Array.from({length:state.propertyCount},()=>({}))})}));
vi.mock('@/hooks/use-mobile',()=>({useIsMobile:()=>false}));
function Probe(){const navigate=useNavigate();return <button onClick={()=>navigate('/mc/inventory')}>Go to inventory</button>}
function mount(open=true){return render(<MemoryRouter initialEntries={['/mc']}><SidebarProvider defaultOpen={open}><SideRail role="owner"/><SidebarTrigger/><Probe/></SidebarProvider></MemoryRouter>)}
afterEach(cleanup);beforeEach(()=>{state.language='en';state.role='property_manager';state.propertyCount=3;document.cookie='sidebar:state=; path=/; max-age=0'});
it('closed groups expose focusable native buttons and respond to keyboard-style activation',()=>{mount();const trigger=screen.getByRole('button',{name:'Properties & rates'});expect(trigger.tagName).toBe('BUTTON');expect(trigger.tabIndex).toBe(0);expect(trigger).toHaveAttribute('aria-expanded','false');trigger.focus();expect(trigger).toHaveFocus();expect(screen.queryByRole('button',{name:'Properties'})).not.toBeInTheDocument();fireEvent.click(trigger,{detail:0});expect(trigger).toHaveAttribute('aria-expanded','true');expect(screen.getByRole('button',{name:'Properties'})).toBeVisible();fireEvent.click(trigger,{detail:0});expect(trigger).toHaveAttribute('aria-expanded','false')});
it.each(['property_manager','general','sales_agent','service_provider'] as const)('collapsed %s rail preserves every persona-visible destination',role=>{state.role=role;mount(false);for(const item of getOwnerSidebarForRole(role,{propertyCount:3}).flatMap(g=>g.items)){expect(screen.getByRole('button',{name:item.labelEn})).toBeVisible()}expect(screen.getByRole('button',{name:'All tools'})).toBeVisible();expect(screen.queryByRole('button',{name:'Properties & rates'})).not.toBeInTheDocument()});
it('switching expanded to collapsed reveals every permitted destination',()=>{mount();expect(screen.queryByRole('button',{name:'Properties'})).not.toBeInTheDocument();fireEvent.click(screen.getAllByRole('button',{name:'Toggle Sidebar'})[0]);expect(screen.getByRole('button',{name:'Properties'})).toBeVisible();expect(screen.getByRole('button',{name:'Finance Hub'})).toBeVisible();expect(screen.getByRole('button',{name:'Settings'})).toBeVisible()});
it('later navigation opens the group containing the active route',()=>{mount();expect(screen.queryByRole('button',{name:'Stock & inspections'})).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Go to inventory'}));expect(screen.getByRole('button',{name:'Properties & rates'})).toHaveAttribute('aria-expanded','true');expect(screen.getByRole('button',{name:'Stock & inspections'})).toHaveAttribute('data-active','true')});
it('long labels override inherited truncation, including Thai labels',()=>{state.language='th';mount(false);const item=screen.getByRole('button',{name:'เงื่อนไขการบริหาร'});expect(item.querySelector('span')).toHaveStyle({whiteSpace:'normal',overflow:'visible',textOverflow:'clip'})});
