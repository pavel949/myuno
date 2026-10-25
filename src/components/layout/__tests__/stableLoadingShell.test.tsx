import React, { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import * as Router from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { composeProviders } from '@/lib/composeProviders';
import { APP_ROUTES } from '@/lib/config/routes';
import { RoleGuard, AuthGuard } from '@/components/auth/RoleGuard';
import { AgentEntryRedirect } from '@/components/landings/AgentEntryRedirect';
import { LoadingSpinner, LoadingState } from '@/components/uno/LoadingSpinner';
const state=vi.hoisted(()=>({retry:vi.fn(),error:null as Error|null,auth:{user:{id:'actor-a'} as {id:string}|null,isLoading:false},resolved:{context:{role:'admin'} as {role:string}|null,isLoading:false,permissions:['*']}}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>state.auth}));
vi.mock('@/hooks/useResolvedContext',()=>({useResolvedContext:()=>({...state.resolved,error:state.error,refetch:state.retry})}));
vi.mock('@/components/auth/AccessDenied',()=>({AccessDenied:()=> <p role="alert">Access denied</p>}));

// Execute the actual App gate / route declaration source, replacing peripheral
// providers/pages with synthetic boundaries. Real Router and guards remain used.
function sourceModule(source:string,bindings:Record<string,unknown>) {
  const ast=ts.createSourceFile('fixture.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const body=ast.statements.filter(node=>!ts.isImportDeclaration(node)).map(node=>node.getFullText(ast)).join('\n');
  const code=ts.transpileModule(body,{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const exports:Record<string,unknown>={};
  return new Function(...Object.keys(bindings),'exports',`${code};return exports;`)(...Object.values(bindings),exports) as Record<string,React.ComponentType<{children?:React.ReactNode}>>;
}
function actualGate() {
  const source=readFileSync('src/App.tsx','utf8');
  const gate=source.slice(source.indexOf('function DeferredProvidersGate('),source.indexOf('// Coming Soon gate retired'));
  const Context=React.createContext(null);
  const Provider=({children}:{children:React.ReactNode})=><Context.Provider value={null}>{children}</Context.Provider>;
  return sourceModule(`${gate}\nexport {DeferredProvidersGate};`,{React,DeferredProviders:composeProviders([Provider,Provider,Provider,Provider])}).DeferredProvidersGate;
}
let layoutMounts=0,layoutUnmounts=0;
function Layout({children}:{children?:React.ReactNode}){useEffect(()=>{layoutMounts++;return()=>{layoutUnmounts++;};},[]);return <section aria-label="retained shell">{children}</section>;}
const Wrapper=({children}:{children?:React.ReactNode})=><>{children}</>;
const Empty=()=>null;
const pages=new Proxy({} as Record<string,React.ComponentType>,{get(target,key:string){return target[key]??(target[key]=()=> <p>{key}</p>);}});
function actualRoutes() {
  return sourceModule(readFileSync('src/components/layout/AnimatedRoutes.tsx','utf8'),{
    React,...Router,AgentEntryRedirect,Suspense:React.Suspense,AnimatePresence,APP_ROUTES,LoadingState,
    ActiveCompanyProvider:Wrapper,AdminLayout:Layout,VendorLayout:Layout,GuestLayout:Layout,MCLayout:Layout,StaffLayout:Layout,CapitalLayout:Layout,
    AdminGuard:({children}:{children:React.ReactNode})=><RoleGuard allowedRoles={['admin']}>{children}</RoleGuard>,
    VendorGuard:Wrapper,TeamGuard:Wrapper,AuthGuard,StaffGuard:Wrapper,MCGuard:Wrapper,InvestorGuard:Wrapper,MCPortalGuard:Wrapper,
    PageTransition:Wrapper,ScrollToTop:Empty,ManageHubGate:Wrapper,NbCompareProvider:Wrapper,NewbuildProjectToOffplanRedirect:Empty,
    ErrorBoundary:Wrapper,PropertySearchRedirect:Empty,ForBusinessSkeleton:Empty,Auth:()=> <p>Sign in</p>,OAuthConsent:Empty,NotFound:Empty,Unsubscribe:Empty,
    useAuth:()=>state.auth,useNavigationDirection:()=>{},adminRoutes:sourceModule(readFileSync('src/components/layout/routes/adminRoutes.tsx','utf8'),{React,...Router,Pages:pages}).adminRoutes,mcRoutes:()=>null,propertyHubRoutes:()=>null,Pages:pages,
    require:()=>({default:Empty}),
  }).AnimatedRoutes;
}
function Navigation(){const navigate=Router.useNavigate();return <><button onClick={()=>navigate('/admin/properties')}>Properties</button><button onClick={()=>navigate(-1)}>Back</button><button onClick={()=>navigate(1)}>Forward</button></>;}
beforeEach(()=>{state.error=null;state.retry.mockReset();for(const key of Object.keys(pages))delete pages[key];layoutMounts=0;layoutUnmounts=0;state.auth={user:{id:'actor-a'},isLoading:false};state.resolved={context:{role:'admin'},isLoading:false,permissions:['*']};});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
describe('stable source loading boundaries',()=>{
 it('does not remount children or repeat mount work after the first animation frame',async()=>{
  let frame:FrameRequestCallback=()=>{};vi.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{frame=callback;return 1;});
  const Gate=actualGate();let mounts=0,unmounts=0;
  function Probe(){useEffect(()=>{mounts++;return()=>{unmounts++;};},[]);return <p>Ready</p>;}
  render(<Gate><Probe/></Gate>);await act(async()=>{frame(16);});expect(mounts).toBe(1);expect(unmounts).toBe(0);
 });
 it('retains actual route layout through sibling navigation and Back/Forward',async()=>{
  const Routes=actualRoutes();render(<Router.MemoryRouter initialEntries={['/admin']}><Navigation/><Routes/></Router.MemoryRouter>);
  await screen.findByText('AdminDashboard');expect(layoutMounts).toBe(1);
  fireEvent.click(screen.getByText('Properties'));await screen.findByText('AdminProperties');expect(layoutMounts).toBe(1);
  fireEvent.click(screen.getByText('Back'));await screen.findByText('AdminDashboard');expect(layoutMounts).toBe(1);
  fireEvent.click(screen.getByText('Forward'));await screen.findByText('AdminProperties');expect(layoutMounts).toBe(1);expect(layoutUnmounts).toBe(0);
 });
 it('does not mount protected page/shell during pending authority and renders denial after resolution',async()=>{
  state.resolved={context:null,isLoading:true,permissions:[]};const Routes=actualRoutes();
  const view=render(<Router.MemoryRouter initialEntries={['/admin/properties']}><Routes/></Router.MemoryRouter>);
  expect(screen.queryByText('AdminProperties')).toBeNull();expect(layoutMounts).toBe(0);expect(screen.getByRole('status')).toBeTruthy();
  state.resolved={context:{role:'user'},isLoading:false,permissions:[]};view.rerender(<Router.MemoryRouter initialEntries={['/admin/properties']}><Routes/></Router.MemoryRouter>);
  await screen.findByRole('alert');expect(screen.queryByText('AdminProperties')).toBeNull();expect(layoutMounts).toBe(0);
 });
 it('keeps route-level lazy pending inside the retained shell instead of taking the viewport',async()=>{
  let finish:(value:{default:React.ComponentType})=>void=()=>{};
  pages.AdminProperties=React.lazy(()=>new Promise<{default:React.ComponentType}>(resolve=>{finish=resolve;}));
  const Routes=actualRoutes();render(<Router.MemoryRouter initialEntries={['/admin']}><Navigation/><Routes/></Router.MemoryRouter>);
  await screen.findByText('AdminDashboard');fireEvent.click(screen.getByText('Properties'));
  const pending=await screen.findByRole('status');expect(pending.getAttribute('data-loading-scope')).toBe('content');expect(pending.style.minHeight).toBe('12rem');expect(layoutMounts).toBe(1);
  await act(async()=>{finish({default:()=> <p>Loaded property page</p>});});await screen.findByText('Loaded property page');expect(layoutMounts).toBe(1);
 });
 it('distinguishes authority read failure from denial and offers a safe retry',()=>{
  state.error=new Error('Network unavailable');state.resolved={context:null,isLoading:false,permissions:[]};
  render(<Router.MemoryRouter><RoleGuard allowedRoles={['admin']}><p>Private</p></RoleGuard></Router.MemoryRouter>);
  expect(screen.getByRole('alert').textContent).toContain('Could not verify access');expect(screen.queryByText('Access denied')).toBeNull();expect(screen.queryByText('Private')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Retry'}));expect(state.retry).toHaveBeenCalledTimes(1);
 });
 it.each(['auth','context'])('does not let the 12-second deadline admit cached admin while %s remains pending',async(kind)=>{
  vi.useFakeTimers();state.auth.isLoading=kind==='auth';state.resolved.isLoading=kind==='context';
  const view=render(<Router.MemoryRouter><RoleGuard allowedRoles={['admin']}><p>Private</p></RoleGuard></Router.MemoryRouter>);
  expect(screen.queryByText('Private')).toBeNull();
  await act(async()=>{vi.advanceTimersByTime(12001);});
  expect(screen.queryByText('Private')).toBeNull();expect(screen.getByRole('alert').textContent).toContain('Could not verify access');
  state.auth={user:{id:'actor-b'},isLoading:true};
  view.rerender(<Router.MemoryRouter><RoleGuard allowedRoles={['admin']}><p>Private</p></RoleGuard></Router.MemoryRouter>);
  expect(screen.queryByText('Private')).toBeNull();expect(screen.queryByRole('alert')).toBeNull();expect(screen.getByRole('status')).toBeTruthy();
 });
 it('uses intentional spinner dimensions and a shared full-page auth pending status',()=>{
  const view=render(<LoadingSpinner size="lg"/>);expect(view.container.querySelector('svg')?.style.width).toBe('48px');
  expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Loading');
  state.auth.isLoading=true;view.rerender(<Router.MemoryRouter><AuthGuard><p>Private</p></AuthGuard></Router.MemoryRouter>);
  expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Loading myUNO');expect(screen.queryByText('Private')).toBeNull();
 });
});
