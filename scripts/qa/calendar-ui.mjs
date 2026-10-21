// Test-only browser bundle: never boot the SPA or import its database client.
// Run: node scripts/qa/bookings-list-ui.mjs (preview server supplies CSS only).
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';

const root = process.cwd();
const output = '/tmp/browser/calendar-isolated';
await mkdir(output, { recursive: true });
const fixture = `import {format, startOfWeek, addDays} from 'date-fns';
import {ru,enUS} from 'date-fns/locale';
import {bangkokTodayDate} from '${root}/src/lib/hotelDates.ts';
export const properties=[{property_id:'fixture-home-1',title:'Spacious family apartment with panoramic sea view',title_ru:'Просторные семейные апартаменты с панорамным видом на море',project_id:'fixture-project',complex_id:null},{property_id:'fixture-home-2',title:'Second synthetic apartment',title_ru:'Вторые тестовые апартаменты',project_id:null,complex_id:null}];
const today=bangkokTodayDate(); const start=startOfWeek(today,{weekStartsOn:1});
export const booking={id:'fixture-booking',property_id:'fixture-home-1',guest_name:'Alexandra / Александра — synthetic booking',status:'confirmed',check_in:format(start,'yyyy-MM-dd'),check_out:format(addDays(start,7),'yyyy-MM-dd'),total_amount:12345,currency:'THB'};
export const task={id:'fixture-task',property_id:'fixture-home-1',task_type:'cleaning',status:'pending',scheduled_date:format(today,'yyyy-MM-dd')};
window.fixtureCheckoutLabel=format(addDays(start,7),'d MMM yyyy',{locale:new URLSearchParams(location.search).get('lang')==='en'?enUS:ru});`;
const dialog = name => `import React from 'react'; import {civilDateKey,stayOccupiesDate} from '${root}/src/lib/hotelDates.ts'; export function ${name}({open,onOpenChange,booking,task,bookings,date}) {return open ? React.createElement('div',{role:'dialog','aria-label':'${name}','data-occupied':date&&bookings?String(bookings.some(b=>stayOccupiesDate(b,civilDateKey(date)))):undefined},booking?.id||task?.id||bookings?.[0]?.id||'fixture',React.createElement('button',{onClick:()=>onOpenChange(false)},'Close fixture')) : null;}`;
const virtual = {
  'fixture-data': fixture,
  '@/contexts/LanguageContext': `export const useLanguage = () => ({language:new URLSearchParams(location.search).get('lang')==='en'?'en':'ru'});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:{id:'fixture-user'}});`,
  '@/hooks/useMyProperties': `import {properties} from 'fixture-data'; export const useMyProperties=()=>({allProperties:properties,isLoading:false});`,
  '@/hooks/usePropertyComplexes': `export const usePropertyComplexes=()=>({data:[]});`,
  '@/hooks/usePropertyProjects': `export const usePropertyProjects=()=>({data:[{id:'fixture-project',name_ru:'Проект с длинным названием — тестовая группа объектов',name_en:'Project with a long name — synthetic property group'}]});`,
  '@/hooks/usePropertyBookings': `import {booking} from 'fixture-data'; export const usePropertyBookings=()=>({bookings:[booking],getBookingForDate:()=>booking});`,
  '@/hooks/useMultiPropertyBookings': `import {booking} from 'fixture-data'; export const useMultiPropertyBookings=()=>({bookingsByProperty:new Map([['fixture-home-1',[booking]]]),isLoading:false});`,
  '@/hooks/useOperationalTasks': `import {task} from 'fixture-data'; export const useOperationalTasks=()=>({tasks:[task],completeTask:{mutate:()=>{throw Error('Forbidden writer')}},updateTaskStatus:{mutate:()=>{throw Error('Forbidden writer')}}});`,
  '@/hooks/usePropertyAvailabilityManagement': `export const usePropertyAvailabilityManagement=()=>({availability:[]});`,
  '@/hooks/usePropertyAvailability': `export const usePropertyRentalTerms=()=>({data:{price_per_night:1000}});`,
  '@/hooks/usePropertyRateSeasons': `export const usePropertyRateSeasons=()=>({data:[]});`,
  '@tanstack/react-query': `export const useQuery=()=>({data:[]});`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({}, {get(){throw Error('Real database access forbidden')}});`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{};export const isTypingKey=()=>false;`,
  '@/components/owner/CalendarTodayTasks': `export const CalendarTodayTasks=()=>null;`,
  '@/components/owner/CalendarSyncManager': `export const CalendarSyncManager=()=>null;`,
};
for (const name of ['CreateServiceTaskDialog','AddBookingFromCalendarDialog','CalendarDayEventsSheet','BookingDetailSheet','BlockDatesDialog']) {
  virtual['@/components/owner/'+name]=dialog(name);
  virtual['./'+name]=dialog(name);
}
virtual['./LegacyTaskDetailSheet']=dialog('TaskDetailSheet');
await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter} from 'react-router-dom'; import Page from '${root}/src/pages/owner/OwnerCalendar.tsx'; createRoot(document.getElementById('root')).render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Page/></MemoryRouter>);`, loader:'tsx', resolveDir:root },
  bundle:true, outfile:path.join(output,'fixture.js'), jsx:'automatic', format:'esm',
  define:{'process.env.NODE_ENV':'"production"', 'import.meta.env.DEV':'false'},
  plugins:[{name:'isolate-all-data-boundaries',setup(b) {
    b.onResolve({filter:/.*/},args => {
      if (Object.hasOwn(virtual,args.path)) return {path:args.path,namespace:'fixture'};
      if (args.path.startsWith('@/')) {
        const base = path.join(root,'src',args.path.slice(2));
        const resolved = [base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p) && statSync(p).isFile());
        if (!resolved) throw new Error('Unresolved test import: '+args.path);
        return {path:resolved};
      }
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args => ({contents:virtual[args.path],loader:'js',resolveDir:root}));
  }}],
});
// Uses the same preview-generated stylesheet, not a recreated design system.
const css = await fetch('http://localhost:8080/src/index.css?direct');
if (!css.ok) throw new Error('Preview stylesheet unavailable');
await writeFile(path.join(output,'fixture.css'),await css.text());
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const result = spawnSync('python3',[path.join(root,'scripts/qa/calendar-ui.py'),output],{stdio:'inherit'});
process.exitCode = result.status ?? 1;