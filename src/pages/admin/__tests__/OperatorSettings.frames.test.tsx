import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import AdminSettings from '../AdminSystemSettings';
import MCSettings from '@/pages/mc/MCSettingsPage';
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/components/ds',()=>({SectionHeader:({title}:{title:string})=><h1>{title}</h1>}));
vi.mock('@/components/admin/control/ControlSystemTab',()=>({ControlSystemTab:()=> <p>System child boundary</p>}));
vi.mock('@/components/admin/control/ControlAuditTab',()=>({ControlAuditTab:()=> <p>Audit child boundary</p>}));
vi.mock('@/components/admin/control/ControlLogsTab',()=>({ControlLogsTab:()=> <p>Logs child boundary</p>}));
vi.mock('@/components/admin/settings/FeatureFlagManager',()=>({FeatureFlagManager:()=> <p>Flags child boundary</p>}));
vi.mock('@/components/admin/settings/OrgProfileEditor',()=>({OrgProfileEditor:()=> <p>Organization child boundary</p>}));
vi.mock('@/components/mc/settings/CompanyProfileSettings',()=>({CompanyProfileSettings:()=> <p>Company child boundary</p>}));
vi.mock('@/components/mc/settings/FinanceCategorySettings',()=>({FinanceCategorySettings:()=> <p>Finance child boundary</p>}));
vi.mock('@/components/mc/settings/DataBackupSettings',()=>({DataBackupSettings:()=> <p>Backup child boundary</p>}));
vi.mock('@/pages/owner/PipelineSettingsPage',()=>({default:()=> <p>Pipeline child boundary</p>}));
function History(){const navigate=useNavigate();return <><output data-testid="route">{useLocation().search}</output><button onClick={()=>navigate(-1)}>Fixture Back</button></>;}
afterEach(cleanup);
it('uses named admin workspace frame without duplicate nav clearance and preserves keyboard tabs',async()=>{
 render(<MemoryRouter><AdminSettings/></MemoryRouter>);const frame=screen.getByRole('heading',{name:'System Settings'}).closest('.ds-frame');expect(frame).toHaveClass('ds-frame-workspace','ds-page');expect(frame).not.toHaveClass('ds-page-with-navigation');
 const first=screen.getByRole('tab',{name:'System',exact:true});first.focus();fireEvent.keyDown(first,{key:'End'});await waitFor(()=>expect(screen.getByRole('tab',{name:'Organization',exact:true})).toHaveFocus());expect(screen.getByText('Organization child boundary')).toBeVisible();
});
it('preserves MC accordion URL history and existing profile selection while adopting the shared frame',async()=>{
 render(<MemoryRouter initialEntries={['/mc/settings?tab=profile']}><MCSettings/><History/></MemoryRouter>);const frame=screen.getByRole('heading',{name:'Settings'}).closest('.ds-frame');expect(frame).toHaveClass('ds-frame-workspace');expect(frame).not.toHaveClass('ds-page-with-navigation');
 expect(screen.getByText('Company child boundary')).toBeVisible();fireEvent.click(screen.getByRole('button',{name:/Finance/}));expect(screen.getByTestId('route')).toHaveTextContent('tab=finance');expect(screen.getByText('Finance child boundary')).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Fixture Back'}));await waitFor(()=>expect(screen.getByTestId('route').textContent).toBe('?tab=profile'));expect(screen.queryByText('Finance child boundary')).toBeNull();expect(screen.getByText('Company child boundary')).toBeVisible();
});
