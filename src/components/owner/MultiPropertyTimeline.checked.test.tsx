import {beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import type {UnifiedProperty} from '@/hooks/useMyProperties';
const fixture=vi.hoisted(()=>({bookingsLoading:false,tasksLoading:false,error:null as Error|null,language:'en',retry:vi.fn()}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:fixture.language})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'synthetic-actor'}})}));
vi.mock('@/hooks/useMultiPropertyBookings',()=>({useMultiPropertyBookings:()=>({bookingsByProperty:new Map(),isLoading:fixture.bookingsLoading,error:fixture.error,refetch:fixture.retry})}));
vi.mock('@/hooks/useOperationalTasks',()=>({useOperationalTasks:()=>({tasks:[],isLoading:fixture.tasksLoading,error:null,refetch:fixture.retry})}));
vi.mock('@/hooks/usePropertyProjects',()=>({usePropertyProjects:()=>({data:[]})}));
vi.mock('@tanstack/react-query',()=>({useQuery:()=>({data:[]})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>{throw new Error('External data forbidden');}}}));
import {MultiPropertyTimeline} from './MultiPropertyTimeline';
const property={property_id:'synthetic-villa',title:'Existing villa',title_ru:'Существующая вилла',complex_id:null,project_id:null} as UnifiedProperty;
beforeEach(()=>{cleanup();fixture.bookingsLoading=false;fixture.tasksLoading=false;fixture.error=null;fixture.language='en';fixture.retry.mockClear();});
describe.each(['en','ru'])('verified calendar grid (%s)',language=>{
 it.each(['bookings','tasks'])('masks existing properties while %s are unknown',source=>{
  fixture.language=language;if(source==='bookings')fixture.bookingsLoading=true;else fixture.tasksLoading=true;
  render(<MemoryRouter><MultiPropertyTimeline properties={[property]}/></MemoryRouter>);
  expect(screen.getByRole('status')).toHaveTextContent(language==='ru'?'Занятость пока неизвестна':'Availability is not verified');
  expect(screen.queryByText(property.title)).not.toBeInTheDocument();expect(screen.queryByText(property.title_ru)).not.toBeInTheDocument();
 });
 it('shows denied reads as unknown and retries both sources',()=>{
  fixture.language=language;fixture.error=new Error('denied');
  render(<MemoryRouter><MultiPropertyTimeline properties={[property]}/></MemoryRouter>);
  expect(screen.getByRole('alert')).toHaveTextContent(language==='ru'?'Занятость неизвестна':'Availability is unknown');
  fireEvent.click(screen.getByRole('button',{name:language==='ru'?'Повторить':'Retry'}));
  expect(fixture.retry).toHaveBeenCalledTimes(2);
 });
});
