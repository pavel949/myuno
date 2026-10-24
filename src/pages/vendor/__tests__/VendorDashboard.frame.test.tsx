import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import VendorDashboard from '../VendorDashboard';
const fixture=vi.hoisted(()=>({loading:false,writes:vi.fn()}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'synthetic-vendor'},isLoading:fixture.loading})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/hooks/useUserContext',()=>({useUserContext:()=>({activeOrg:{id:'synthetic-org',name:'Synthetic provider'},vendorOrgs:[{org:{id:'synthetic-org'}}],isLoading:false})}));
vi.mock('@/hooks/useVendor',()=>({useVendorProfile:()=>({profile:{id:'synthetic-profile'}})}));
vi.mock('@/hooks/useOrders',()=>({useVendorOrders:()=>({orders:[{id:'synthetic-order',order_number:'SYNTHETIC-CANCELLED',status:'cancelled',created_at:'2026-10-24T12:00:00Z',total_amount:2500}],isLoading:false,stats:{totalRevenue:7500,pendingCount:0,confirmedCount:0,completedCount:0},updateStatus:fixture.writes})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>{const q={select:()=>q,eq:()=>q,then:(f:(x:unknown)=>unknown)=>Promise.resolve({count:0,error:null}).then(f)};return q;}}}));
vi.mock('@/components/vendor/VendorRevenueWidget',()=>({VendorRevenueWidget:()=> <p>Synthetic revenue widget boundary</p>}));
vi.mock('@/components/vendor/VendorRevenueChart',()=>({VendorRevenueChart:()=> <p>Synthetic chart boundary</p>}));
vi.mock('@/components/vendor/VendorAlertPanel',()=>({VendorAlertPanel:()=>null}));
vi.mock('@/components/vendor/VendorCategoryGrid',()=>({VendorCategoryGrid:()=>null}));
vi.mock('@/components/vendor/VendorQuickActions',()=>({VendorQuickActions:()=>null}));
vi.mock('@/components/vendor/dashboard/VendorModerationQueue',()=>({VendorModerationQueue:()=>null}));
vi.mock('@/components/vendor/dashboard/VendorOnboardingChecklist',()=>({VendorOnboardingChecklist:()=>null}));
vi.mock('@/components/vendor/wizard',()=>({VendorQuickCreateFAB:()=>null,BulkImportSheet:()=>null}));
vi.mock('@/components/shared/YourDayFeed',()=>({YourDayFeed:()=>null}));
const clients:QueryClient[]=[];
function show(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});clients.push(client);return render(<QueryClientProvider client={client}><MemoryRouter><VendorDashboard/></MemoryRouter></QueryClientProvider>);}
afterEach(()=>{cleanup();clients.forEach(c=>c.clear());fixture.loading=false;});
it('uses the same named workspace frame when loading and ready, preserving cancelled state without writes',async()=>{
 fixture.loading=true;const view=show();expect(document.querySelector('.ds-frame-workspace')).toBeInTheDocument();expect(document.querySelector('.ds-page-with-navigation')).toBeNull();
 fixture.loading=false;view.unmount();show();expect(await screen.findByText('SYNTHETIC-CANCELLED')).toBeVisible();expect(screen.getByText('Cancelled')).toHaveClass('bg-danger/10','text-danger');expect(screen.getByText('Synthetic provider').closest('.ds-frame-workspace')).toBeInTheDocument();expect(screen.getByText('Cancelled')).toHaveClass('whitespace-nowrap');expect(screen.getByText('฿3K')).toHaveClass('whitespace-nowrap');expect(fixture.writes).not.toHaveBeenCalled();
});
