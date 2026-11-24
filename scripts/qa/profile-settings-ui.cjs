const fs=require('node:fs'), path=require('node:path'), {createRequire}=require('node:module'), http=require('node:http'), assert=require('node:assert/strict');
const output=process.env.PROFILE_SETTINGS_QA_OUTPUT ?? '/tmp/myuno-profile-settings-evidence';
const root=process.cwd(), req=createRequire(path.join(root,'package.json'));
const {build}=req('esbuild'), {chromium}=req('playwright');
const virtual={
'@/contexts/AuthContext':`const deny=()=>{window.unexpectedWrites++;throw Error('Forbidden auth mutation')};export const useAuth=()=>({user:{id:'synthetic-profile',email:'synthetic@example.invalid',identities:[]},isLoading:false,signOut:deny});`,
'@/hooks/useProfile':`export const useProfile=()=>({profile:{id:'synthetic-profile',full_name:'Synthetic Profile',email:'synthetic@example.invalid'},isLoading:false});`,
'@/hooks/useProfileDetails':`const details={id:'synthetic-profile',first_name:'Synthetic',last_name:'Profile',city:'Phuket',country:'TH',address_line1:'Synthetic lane'};export const useProfileDetails=()=>({details,isLoading:false,isUpdating:false,updateDetailsAsync:async v=>{window.fixtureSaves.push(JSON.parse(JSON.stringify(v)));return true}});`,
'@/hooks/usePinManagement':`const noop=()=>{};export const usePinManagement=()=>({hasPin:false,isLoading:false,checkHasPin:noop});`,
'@/integrations/supabase/client':`export const supabase=new Proxy({},{get(){window.unexpectedWrites++;throw Error('Real backend forbidden')}});`,
'@/integrations/lovable/index':`export const lovable=new Proxy({},{get(){window.unexpectedWrites++;throw Error('Real OAuth forbidden')}});`,
'@/components/layout/AppLayout':`export const AppLayout=({children})=><main>{children}</main>;`,
'@/contexts/LanguageContext':`import{useState}from'react';import{useSyncExternalStore}from'react';let value='en';const ls=new Set();export const useLanguage=()=>({language:useSyncExternalStore(cb=>{ls.add(cb);return()=>ls.delete(cb)},()=>value),t:(k)=>k, setLanguage:v=>{value=v;document.documentElement.lang=v;for(const cb of ls)cb()}});`,
'@/contexts/ThemeContext':`import{useState}from'react';export function useTheme(){const [theme,set]=useState('light');return{theme,setTheme(v){set(v);document.documentElement.classList.toggle('dark',v==='dark');window.fixtureTheme=v;}}}`,
'@/contexts/LocationContext':`import{useState}from'react';const activeCities=[{slug:'phuket',name_en:'Phuket',name_ru:'Пхукет',name_th:'ภูเก็ต'}];export function useLocation(){const[currentCitySlug,setCity]=useState('phuket');return{currentCitySlug,setCity,activeCities,isLoading:false,getCityName:(lang)=>activeCities[0]['name_'+lang]}}`,
'@/contexts/CurrencyContext':`import{useState}from'react';export const currencies={THB:{code:'THB',symbol:'฿',name:'Thai baht',nameEn:'Thai baht',nameRu:'Бат'},USD:{code:'USD',symbol:'$',name:'US dollar',nameEn:'US dollar',nameRu:'Доллар'}};export function useCurrency(){const [currency,set]=useState('THB');return{currency,currencyInfo:currencies[currency],setCurrency(v){set(v);window.fixtureCurrency=v}}}`,
};
const paths=['src/pages/profile/ProfileSettings.tsx','src/components/profile/ProfileCountrySelect.tsx','src/components/uno/ThemeSwitcher.tsx','src/components/uno/LanguageSwitcher.tsx','src/components/uno/CurrencySwitcher.tsx','src/components/profile/SecuritySettingsSection.tsx','src/components/profile/ConnectedAccountsSection.tsx'];
(async()=>{
 const result=await build({stdin:{contents:`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import Settings from '@/pages/profile/ProfileSettings';window.fixtureSaves=[];window.unexpectedWrites=0;createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/profile/settings']}><Settings/></MemoryRouter>);`,loader:'tsx',resolveDir:root},outfile:'/tmp/myuno-profile-synth-app.js',bundle:true,write:false,format:'esm',jsx:'automatic',loader:{'.css':'empty'},metafile:true,define:{'import.meta.env':'{}','process.env.NODE_ENV':'"production"'},plugins:[{name:'synthetic-only',setup(b){
 b.onResolve({filter:/.*/},a=>{if(virtual[a.path])return{path:a.path,namespace:'fixture'};if(a.path.startsWith('@/')){const p=path.join(root,'src',a.path.slice(2));const f=[p,p+'.ts',p+'.tsx',p+'/index.ts',p+'/index.tsx'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());if(!f)throw Error('Unresolved '+a.path);return{path:f}}});b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:virtual[a.path],loader:'tsx',resolveDir:root}));
 }}]});
 const input=Object.keys(result.metafile.inputs);for(const p of paths)assert(input.includes(p),p);
 assert(!input.some(x=>!x.startsWith('fixture:')&&/integrations\/(?:supabase\/client|lovable\/index)|contexts\/AuthContext/.test(x)));
 let css=[];for(const f of ['src/index.css','src/styles/premium-account.css'])css.push((await req('postcss')([req('postcss-import')(),req('tailwindcss')(root+'/tailwind.config.ts'),req('autoprefixer')()]).process(fs.readFileSync(f,'utf8'),{from:path.join(root,f)})).css);
 if(process.env.BUNDLE_ONLY==='1'){console.log('actual-page/switcher/security sources and CSS verified');return}
 const server=http.createServer((r,w)=>{const p=new URL(r.url,'http://127.0.0.1').pathname;const o=p==='/app.js'?['application/javascript',result.outputFiles[0].text]:p==='/app.css'?['text/css',css.join('\n')]:['text/html','<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>'];w.setHeader('Content-Type',o[0]);w.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'");w.end(o[1])});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const origin='http://127.0.0.1:'+server.address().port;let browser;

 try{fs.mkdirSync(output,{recursive:true});browser=await chromium.launch();for(const width of [320,390,1440]){
 const context=await browser.newContext({viewport:{width,height:width<500?844:960},serviceWorkers:'block',reducedMotion:'reduce'});let blocked=[];await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();blocked.push(new URL(route.request().url()).hostname);return route.abort()});
 const page=await context.newPage();page.setDefaultTimeout(5000);const errors=[]; page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.getByRole('heading',{name:/profile settings/i}).waitFor();const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.equal(await overflow(),0,'page overflow at '+width);
 {for(const name of [/^Preferences$/i,/^Personal details$/i,/^Sign-in and security$/i,/^Account actions$/i]){const link=page.getByRole('link',{name});assert.equal(await link.count(),1);const bounds=await link.evaluate(el=>{const b=el.getBoundingClientRect();const text=el.querySelector('span');return {left:b.left,right:b.right,height:b.height,viewport:innerWidth,textFits:text.scrollWidth<=text.clientWidth+1};});assert(bounds.left>=0&&bounds.right<=bounds.viewport+1&&bounds.height>=43&&bounds.textFits,'section link bounds: '+name);const href=await link.getAttribute('href');assert.match(href,/^#[a-z-]+$/);const id=href.slice(1);assert.equal(await page.locator('[id='+JSON.stringify(id)+']').count(),1);}}
 await page.screenshot({path:path.join(output,'profile-settings-'+width+'.png'),animations:'disabled'});
 if(width===390){
  await page.getByRole('link',{name:/^personal details$/i}).click();assert.equal(new URL(page.url()).hash,'#personal-details');
  const save=page.getByRole('button',{name:/save changes/i});assert.equal(await save.count(),1);
  assert(await save.isDisabled(),'clean form must not save');
  await page.locator('#settings-country').click();await page.getByRole('combobox',{name:'Search countries'}).fill('Germany');await page.getByRole('option',{name:'Germany'}).click();
  assert.equal(await page.evaluate(()=>window.fixtureSaves.length),0);
  await save.click();await page.getByRole('status').filter({hasText:'Changes saved'}).waitFor();assert.deepEqual(await page.evaluate(()=>window.fixtureSaves),[{country:'DE'}]);assert(await save.isDisabled());
  await page.getByRole('button',{name:/^Theme: Light$/i}).click();await page.getByRole('menuitem',{name:/^Dark$/i}).click();assert(await page.evaluate(()=>document.documentElement.classList.contains('dark')));assert.equal(await overflow(),0);
  await page.getByRole('button',{name:'฿',exact:true}).click();await page.getByRole('menuitem',{name:/USD/}).click();assert.equal(await page.evaluate(()=>window.fixtureCurrency),'USD');
  {const danger=page.getByRole('region',{name:/account actions/i}).getByRole('link',{name:/contact support/i});assert.equal(await danger.count(),1);assert.equal(await danger.getAttribute('href'),'/support');assert.equal(await page.getByRole('alertdialog').count(),0);}
  await page.getByTestId('language-switch').click();await page.getByRole('menuitem',{name:/ไทย/}).click();assert.equal(await page.getAttribute('html','lang'),'th');await page.getByRole('heading',{name:'การตั้งค่าโปรไฟล์'}).waitFor();assert.equal(await overflow(),0);
 }
 assert.equal(await page.evaluate(()=>window.unexpectedWrites),0);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({width,overflow:await overflow(),blockedExternal:blocked.length,behavior:width===390}));await context.close();
 }}finally{await browser?.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
