// Local-only acceptance UI: actual inquiry, receipt and PMS hook; synthetic
// auth/provider boundaries; allowlisted RPC gateway backed by owned PostgreSQL.
import { build } from 'esbuild';
import { existsSync, statSync, writeFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd(), output = process.argv[2];
if (!output) throw new Error('Explicit output directory required');
mkdirSync(output, { recursive: true });
const receiptSource = path.join(root, 'src/lib/propertyReservationReceipt.ts');
const virtual = {
  '@/contexts/AuthContext': `const user={id:new URLSearchParams(location.search).get('actor')};export const useAuth=()=>({user,isLoading:false});`,
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:'en'});`,
  '@/contexts/CurrencyContext': `export const useCurrency=()=>({formatPrice:n=>String(n)});`,
  '@/contexts/LocationContext': `export const useLocation=()=>({currentCity:{default_currency:'THB'}});`,
  '@/contexts/AuthSheetContext': `export const useAuthSheet=()=>({openAuthSheet(){throw Error('Synthetic actor already authenticated')}});`,
  '@/contexts/StorefrontContext': `export const useStorefront=()=>({storefront:null});`,
  '@/hooks/useProfile': `const profile={full_name:'Synthetic Guest',email:'',phone:'+66000000000'};export const useProfile=()=>({profile});`,
  '@/hooks/useProperties': `const rentalTerms={instant_booking:false,min_stay_nights:1,max_guests:4};export const usePropertyWithRentalTerms=id=>({data:{id,title_en:'Synthetic acceptance property',price:1250,price_per_night:1250,currency:'THB',rentalTerms,tenancy_modes:['short']}});`,
  '@/hooks/usePropertyAvailability': `const data=[];export const usePropertyBlockedDates=()=>({data});`,
  '@/hooks/usePropertyRateSeasons': `const data=[];export const usePropertyRateSeasons=()=>({data});`,
  '@/hooks/useRareFindBadge': `export const useRareFindBadge=()=>({data:false});`,
  '@/hooks/useMyProperties': `const allProperties=[{property_id:'00000000-0000-4000-8000-000000000001'}];export const useMyProperties=()=>({allProperties,isLoading:false,error:null,refetch:async()=>{}});`,
  '@/hooks/useActiveCompany': `export const useActiveCompany=()=>({activeCompany:null});`,
  '@/lib/getAccessiblePropertyIds': `export const getAccessiblePropertyIds=async()=>({allIds:['00000000-0000-4000-8000-000000000001'],ownedIds:[],delegatedIds:[],companyIds:[]});`,
  '@/components/layout/AppLayout': `export const AppLayout=({children})=><main>{children}</main>;`,
  '@/components/property/DepositPaymentOptions': `export const DepositPaymentOptions=()=>null;`,
  '@/components/property/PayWhenSelector': `export const PayWhenSelector=()=>null;`,
  '@/lib/propertyReservationReceipt': `export {readPropertyReservationReceipt,propertyReservationReceipt} from ${JSON.stringify(receiptSource)};import{supabase}from'@/integrations/supabase/client';export const bindPropertyReservationReader=async(_actor,assertCurrent)=>{assertCurrent();return supabase;};`,
  '@/integrations/supabase/client': `export const supabase={async rpc(name,args){if(name==='get_property_date_prices')return{data:[],error:null};const response=await fetch('/rpc',{method:'POST',headers:{'Content-Type':'application/json','X-Fixture-Actor':new URLSearchParams(location.search).get('actor')},body:JSON.stringify({name,args})});const result=await response.json();if(name==='create_property_reservation_checked'&&result.data?.order?.id)localStorage.setItem('mc-isolated-created-order',JSON.stringify(result.data.order.id));return result;},from(table){if(table==='properties')return{select(){return this},in:async()=>({data:[{id:'00000000-0000-4000-8000-000000000001',title_en:'Synthetic property'}],error:null})};if(table!=='orders')throw Error('Raw write forbidden');const q={select(){return q},eq(){return q},is(){return q},order(){return q},in(){return q},then(resolve,reject){return supabase.rpc('fixture_legacy_orders_read',{}).then(resolve,reject)}};return q;}};`,
};
const source = `
import React from 'react';import {createRoot} from 'react-dom/client';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {Toaster} from 'sonner';
import PropertyInquiry from '@/pages/property/PropertyInquiry';
import {PropertyReservationReceipt} from '@/components/property/PropertyReservationReceipt';
import {usePropertyBookings} from '@/hooks/usePropertyBookings';
import {useMultiPropertyBookings} from '@/hooks/useMultiPropertyBookings';
import {propertyOrderHoldsInventory} from '@/lib/propertyInventory';
const property='00000000-0000-4000-8000-000000000001';
const params=new URLSearchParams(location.search),id=params.get('order');
function PmsFixture(){
 const {bookings,error,refetch,updateBooking}=usePropertyBookings(property);
 const calendar=useMultiPropertyBookings(new Date(2026,10,9),7);
 const calendarBooking=calendar.allBookings.find(row=>row.id===id);
 const [busy,setBusy]=React.useState(false),[failure,setFailure]=React.useState('');
 const booking=bookings?.find(row=>row.id===id);
 async function change(status){setBusy(true);setFailure('');try{await updateBooking({id,status,updated_at:booking.updated_at});await refetch()}catch(error){setFailure(error.message||String(error))}finally{setBusy(false)}}
 return <main><h1>Isolated PMS hook</h1><button disabled={busy} onClick={()=>refetch()}>Read manager reservation</button>
 <button disabled={busy||!booking} onClick={()=>change('confirmed')}>Confirm in PMS</button>
 <button disabled={busy||!booking} onClick={()=>change('cancelled')}>Cancel in PMS</button>
 {calendarBooking&&<output data-testid="calendar-state">{calendarBooking.status}:{propertyOrderHoldsInventory(calendarBooking.status)?'reserved':'released'}</output>}
 {(error||failure||calendar.error)&&<p role="alert">{failure||String(error)}</p>}
 {booking&&<output data-testid="command-result">{JSON.stringify(booking)}</output>}</main>;
}
const route=params.get('surface')==='receipt'?'/bookings/'+id:'/property/'+property+'/inquiry?checkIn=2026-11-10&checkOut=2026-11-13&guests=2';
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>
<MemoryRouter initialEntries={[route]}>{params.get('surface')==='pms'?<PmsFixture/>:<Routes>
<Route path="/property/:id/inquiry" element={<PropertyInquiry/>}/><Route path="/bookings/:id" element={<PropertyReservationReceipt/>}/>
</Routes>}</MemoryRouter><Toaster/></QueryClientProvider>);`;
const result = await build({
  stdin: { contents: source, loader: 'tsx', resolveDir: root }, bundle: true,
  outfile: path.join(output, 'fixture.js'), jsx: 'automatic', format: 'esm', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
  plugins: [{ name: 'isolated-property', setup(builder) {
    builder.onResolve({ filter: /.*/ }, args => {
      if (Object.hasOwn(virtual, args.path)) return { path: args.path, namespace: 'fixture' };
      if (args.path.startsWith('@/')) {
        const base = path.join(root, 'src', args.path.slice(2));
        return { path: [base, base + '.ts', base + '.tsx', path.join(base, 'index.tsx')].find(candidate => existsSync(candidate) && statSync(candidate).isFile()) };
      }
    });
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: virtual[args.path], loader: 'tsx', resolveDir: root }));
  } }],
});
if (Object.keys(result.metafile.inputs).some(input => !input.startsWith('fixture:') && input.includes('integrations/supabase/client'))) throw new Error('Production backend client must not be bundled');
writeFileSync(path.join(output, 'bundle-inputs.json'), JSON.stringify(result.metafile.inputs, null, 2));
const assetDirectory = path.join(root, 'dist/assets');
const css = existsSync(assetDirectory) ? readdirSync(assetDirectory).find(name => /^index-.*\.css$/.test(name)) : null;
if (css) writeFileSync(path.join(output, 'fixture.css'), readFileSync(path.join(assetDirectory, css)));
writeFileSync(path.join(output, 'fixture.html'), '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><style>body{margin:0;font-family:system-ui}main{max-width:900px;margin:auto}output{display:block;overflow-wrap:anywhere}button{padding:10px;margin:4px}input{min-height:32px}</style><div id="root"></div><script type="module" src="/fixture.js"></script></html>');
