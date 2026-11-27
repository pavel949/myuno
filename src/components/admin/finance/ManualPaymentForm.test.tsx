import {describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter,useLocation} from 'react-router-dom';
const database=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:database}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
import {ManualPaymentForm} from './ManualPaymentForm';
function Destination(){const location=useLocation();return <output>{location.pathname+location.search}</output>;}
describe('finance manual-payment handoff',()=>{
 it('opens verification of existing requests without fabricating a paid order',()=>{
  render(<MemoryRouter><ManualPaymentForm/><Destination/></MemoryRouter>);
  fireEvent.click(screen.getByRole('link',{name:'Review manual payments'}));
  expect(screen.getByText('/admin/operations?tab=manual-payments')).toBeInTheDocument();
  expect(database.from).not.toHaveBeenCalled();expect(database.rpc).not.toHaveBeenCalled();
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
 });
});
