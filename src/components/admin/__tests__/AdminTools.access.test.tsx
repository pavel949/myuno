import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import AdminSystemSettings from '@/pages/admin/AdminSystemSettings';
import AdminControlCenter from '@/pages/admin/AdminControlCenter';
import { ControlLogsTab } from '../control/ControlLogsTab';
import { ControlAuditTab } from '../control/ControlAuditTab';
import { ControlRolesTab } from '../control/ControlRolesTab';
import { GoogleMapsStatusCard } from '../GoogleMapsStatusCard';
import { SIDEBAR_NAV, TEAM_NAV } from '@/lib/nav/navigationModel';

const fixture = vi.hoisted(() => ({
  language: 'en', audit: { data: undefined as unknown, isError: true, isLoading: false, isFetching: false },
  auditRetry: vi.fn(), rolesReply: { data: [] as Array<{role:string}>, error: {message:'Synthetic denied read'} as {message:string}|null },
  from: vi.fn(), invoke: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({useLanguage: () => ({language:fixture.language, t:(s:string)=>s})}));
vi.mock('@/hooks/useAuditLogs', () => ({useAuditLogs:()=>({...fixture.audit,refetch:fixture.auditRetry}),formatAuditAction:(s:string)=>({label:s,color:''}),formatEntityType:(s:string)=>s}));
vi.mock('@/integrations/supabase/client', () => ({supabase:{from:fixture.from,functions:{invoke:fixture.invoke}}}));
vi.mock('@/contexts/GoogleMapsContext', () => ({useGoogleMaps:()=>({hasKey:false,isLoaded:false,loadError:null,apiAvailable:false})}));
vi.mock('@/hooks/useGoogleGeocode', () => ({useGoogleGeocode:()=>({reverseGeocodeWithStatus:vi.fn()})}));
vi.mock('@/lib/googleMaps', () => ({getGoogleMapsKey:()=>null}));
vi.mock('@/components/admin/settings/NotificationSettings', () => ({NotificationSettings:()=> <p>Synthetic notification settings boundary</p>}));
vi.mock('@/components/admin/settings/FeatureFlagManager', () => ({FeatureFlagManager:()=> <p>Synthetic feature flags boundary</p>}));
vi.mock('@/components/admin/settings/OrgProfileEditor', () => ({OrgProfileEditor:()=> <p>Synthetic organization boundary</p>}));
vi.mock('@/components/maintenance/LaunchSwitch', () => ({LaunchSwitch:()=>{throw Error('Retired launch control must not mount');}}));
const withRouter=(ui:React.ReactNode)=>render(<MemoryRouter>{ui}</MemoryRouter>);
beforeEach(()=>{
  vi.resetAllMocks();fixture.language='en';fixture.audit={data:undefined,isError:true,isLoading:false,isFetching:false};
  fixture.rolesReply={data:[],error:{message:'Synthetic denied read'}};
  fixture.from.mockImplementation((table:string)=>{if(table!=='user_roles')throw Error('Unexpected data access');return {select:async()=>fixture.rolesReply};});
});
describe('admin tools truthful states and accessible entry points',()=>{
  it.each([['activity',ControlLogsTab],['audit',ControlAuditTab]] as const)('%s reports query failure as unknown and offers retry instead of an empty journal',(_name,Component)=>{
    withRouter(<Component/>);expect(screen.getByRole('alert')).toHaveTextContent('unknown');
    expect(screen.queryByText(/No audit entries/)).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Retry'}));expect(fixture.auditRetry).toHaveBeenCalledTimes(1);
  });
  it('does not show cached journal entries or a misleading count after failed revalidation',()=>{
    fixture.audit.data={logs:[{id:'log-a',action:'old cached action',created_at:'2030-01-01',admin_name:'Previous state'}],total:1};
    withRouter(<ControlLogsTab/>);expect(screen.queryByText('Previous state')).not.toBeInTheDocument();expect(screen.getByRole('alert')).toBeInTheDocument();
  });
  it('shows an empty journal only after a successful empty response',()=>{
    fixture.audit={data:{logs:[],total:0},isError:false,isLoading:false,isFetching:false};withRouter(<ControlLogsTab/>);
    expect(screen.getByText('No audit entries yet')).toBeInTheDocument();expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('roles failure never becomes zero assignments; Retry can recover a successful empty result',async()=>{
    const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
    render(<QueryClientProvider client={client}><ControlRolesTab/></QueryClientProvider>);
    await screen.findByRole('alert');expect(screen.queryByText('0 users')).not.toBeInTheDocument();
    fixture.rolesReply={data:[],error:null};fireEvent.click(screen.getByRole('button',{name:'Retry'}));
    await waitFor(()=>expect(screen.queryByRole('alert')).not.toBeInTheDocument());expect(screen.getAllByText('0 users')).toHaveLength(6);client.clear();
  });
  it('audit entries are keyboard-operable buttons and the All filter has a valid Radix value',async()=>{
    fixture.audit={data:{logs:[{id:'log-a',action:'Synthetic audit action',created_at:'2030-01-01',entity_type:'property'}],total:1},isError:false,isLoading:false,isFetching:false};
    withRouter(<ControlAuditTab/>);const entry=screen.getByRole('button',{name:'Open audit entry: Synthetic audit action'});entry.focus();expect(entry).toHaveFocus();
    expect(screen.getByRole('combobox',{name:'Entity type'})).toHaveTextContent('All');
    fireEvent.click(entry);expect(await screen.findByRole('dialog')).toHaveTextContent('Entry Details');
  });
  it('settings use native links and named tabs without mounting the retired site switch',()=>{
    withRouter(<AdminSystemSettings/>);expect(screen.getByRole('link',{name:'Cities & Regions'})).toHaveAttribute('href','/admin/cities');
    expect(screen.getByRole('link',{name:'Knowledge Base'})).toHaveAttribute('href','/admin/location-knowledge');
    expect(screen.getByRole('tablist',{name:'System settings sections'})).toBeInTheDocument();
    for(const name of ['System','Audit','Logs','Flags','Organization'])expect(screen.getByRole('tab',{name})).toBeInTheDocument();
    expect(screen.queryByText('Site availability controls')).not.toBeInTheDocument();expect(fixture.invoke).not.toHaveBeenCalled();
  });
  it('keeps the Control Center URL as links to every canonical function group',()=>{
    withRouter(<AdminControlCenter/>);
    expect(screen.getByRole('link',{name:/Users & access/})).toHaveAttribute('href','/admin/users');
    expect(screen.getByRole('link',{name:/Finance & analytics/})).toHaveAttribute('href','/admin/finance');
    expect(screen.getByRole('link',{name:/System settings/})).toHaveAttribute('href','/admin/settings');
    expect(screen.getByText(/Configuration, audit, activity log/)).toBeInTheDocument();
  });
  it('uses scoped team destinations and retains the specialized water editor without duplicate Activities rail entry',()=>{
    const routes=readFileSync('src/components/layout/AnimatedRoutes.tsx','utf8');
    expect(routes).toContain('path="/team/moderation"');expect(routes).toContain('path="/team/leads"');
    expect(TEAM_NAV.find(i=>i.labelEn==='Moderation')?.path).toBe('/team/moderation');expect(TEAM_NAV.find(i=>i.labelEn==='Leads')?.path).toBe('/team/leads');
    const paths=SIDEBAR_NAV.admin.flatMap(g=>g.items).map(i=>i.path);expect(paths).toContain('/admin/water-activities');expect(paths).not.toContain('/admin/activities');expect(new Set(paths).size).toBe(paths.length);
  });
  it('keeps both Maps actions available in their wrapping action group without invoking credentials',()=>{
    withRouter(<GoogleMapsStatusCard/>);expect(screen.getByRole('button',{name:'Sync key from backend'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'Test geocoding'})).toBeInTheDocument();expect(fixture.invoke).not.toHaveBeenCalled();
  });
});
