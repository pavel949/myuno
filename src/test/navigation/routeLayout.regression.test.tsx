import {cleanup,render,screen,waitFor,fireEvent} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {MemoryRouter,Routes,Route,Outlet,useLocation,useParams,useNavigate} from 'react-router-dom';
import {mcRoutes} from '@/components/layout/routes/mcRoutes';
import {propertyHubRoutes} from '@/components/layout/routes/propertyHubRoutes';
import {TeamLayout} from '@/components/team/TeamLayout';
const state=vi.hoisted(()=>({pending:false,promise:new Promise(()=>{})}));
vi.mock('@/components/layout/pageRegistry',async()=>{const {readFileSync}=await import('node:fs');const source=['mcRoutes','propertyHubRoutes'].map(f=>readFileSync(`src/components/layout/routes/${f}.tsx`,'utf8')).join('');return Object.fromEntries([...new Set([...source.matchAll(/Pages\.(\w+)/g)].map(m=>m[1]))].map(name=>[name,()=>{if(state.pending)throw state.promise;return <p>{name}</p>;} ]));});
vi.mock('@/components/layout/PageTransition',()=>({PageTransition:({children}:{children:React.ReactNode})=><>{children}</>}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/components/layout/AppLayout',()=>({AppLayout:({children}:{children:React.ReactNode})=><main data-testid='shell-main'>{children}</main>}));
vi.mock('@/components/team/TeamSidebar',()=>({TeamSidebar:()=> <aside>Existing team menu</aside>}));
afterEach(cleanup);beforeEach(()=>{state.pending=false;});
function Probe(){const l=useLocation(),p=useParams(),navigate=useNavigate();return <><button onClick={()=>navigate(-1)}>History back</button><output data-testid='route'>{l.pathname+l.search+l.hash}|{p.id}|{JSON.stringify(l.state)}</output></>;}
function Shell(){return <main data-testid='existing-shell'><Probe/><Outlet/></main>;}
function show(path:string){return render(<MemoryRouter initialEntries={['/origin',{pathname:path.split('?')[0],search:path.includes('?')?'?'+path.split('?')[1].split('#')[0]:'',hash:path.includes('#')?'#'+path.split('#')[1]:'',state:{from:'synthetic-owner-context'}}]}><Routes><Route path='/mc' element={<Shell/>}>{mcRoutes}</Route><Route path='/property' element={<Shell/>}>{propertyHubRoutes}</Route><Route path='*' element={<Probe/>}/></Routes></MemoryRouter>);}
it('keeps concrete property ID, query and hash when managing opens the canonical MC editor',async()=>{show('/mc/properties/synthetic-home/manage?company=synthetic-company&tab=photos#media');await waitFor(()=>expect(screen.getByTestId('route')).toHaveTextContent('/mc/properties/synthetic-home/editor?company=synthetic-company&tab=photos#media'));expect(screen.getByText('PropertyEditor')).toBeVisible();expect(screen.getByTestId('route')).toHaveTextContent('synthetic-owner-context');fireEvent.click(screen.getByRole('button',{name:'History back'}));await waitFor(()=>expect(screen.getByTestId('route')).toHaveTextContent('/origin'));});
it.each(['/mc','/property'])('lazy content at %s uses bounded content scope inside its existing shell',path=>{state.pending=true;show(path);expect(screen.getByRole('status',{name:'Loading myUNO'})).toHaveAttribute('data-loading-scope','content');expect(screen.getByRole('status',{name:'Loading myUNO'})).toHaveStyle({minHeight:'12rem'});expect(screen.getAllByRole('main')).toHaveLength(1);});
it('TeamLayout leaves the main landmark with its parent and preserves the existing menu',()=>{render(<TeamLayout><input aria-label='Draft'/></TeamLayout>);expect(screen.getAllByRole('main')).toHaveLength(1);expect(screen.getByText('Existing team menu')).toBeVisible();expect(screen.getByLabelText('Draft')).toBeVisible();});
