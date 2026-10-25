import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { auditSources, compareBaseline, captureBaseline, serializeBaseline, buildRouteRegister, normalizeRegister, serializeRegister, main } from './design-system-audit.mjs';
const css=(text,file='src/theme.css')=>({file,text});
const tsx=text=>({file:'src/pages/Example.tsx',text});

test('compact baseline preserves exact fingerprints, source evidence and strict additions',()=>{
  const findings=auditSources([tsx('const c="bg-gray-100";')]);
  const baseline=JSON.parse(serializeBaseline(captureBaseline(findings,'Tracked legacy migration debt')));
  assert.equal(baseline.reason,'Tracked legacy migration debt');
  assert.deepEqual(baseline.entries.map(e=>e.id),findings.map(e=>e.id));
  assert.equal(baseline.entries[0].file,'src/pages/Example.tsx');
  assert.equal(compareBaseline(findings,baseline).newFindings.length,0);
  assert.equal(compareBaseline(auditSources([tsx('const c="bg-gray-100 text-red-500";')]),baseline).newFindings.length,2);
});

test('a new source color bypass fails against an exact reviewed baseline',()=>{
  const legacy=auditSources([tsx('const old = "bg-gray-100";')]);
  const baseline=captureBaseline(legacy,'Reviewed existing category presentation; migrate separately');
  assert.equal(compareBaseline(legacy,baseline).newFindings.length,0);
  const changed=auditSources([tsx('const old = "bg-gray-100"; const added = "text-red-500";')]);
  assert.equal(compareBaseline(changed,baseline).newFindings.length,1);
});
test('removing legacy debt passes and ratchet removes its permission permanently',()=>{
  const legacy=auditSources([tsx('const old = "bg-gray-100";')]);const baseline=captureBaseline(legacy,'Reviewed pre-existing status colors');
  const removed=compareBaseline([],baseline);assert.equal(removed.newFindings.length,0);assert.equal(removed.resolved.length,1);
  assert.equal(compareBaseline(legacy,{...baseline,entries:removed.remaining}).newFindings.length,1);
});
test('baseline cannot hide a duplicate copied bypass or a new file',()=>{
  const old=auditSources([css('.x { color: #123456; }')]);const baseline=captureBaseline(old,'Legacy subbrand color');
  assert.equal(compareBaseline(auditSources([css('.x { color: #123456; color: #123456; }')]),baseline).newFindings.length,1);
  assert.ok(compareBaseline(auditSources([css('.x { color: #123456; }','src/new/theme.css')]),baseline).newFindings.length);
});
test('undefined required token dependencies fail and cannot be baselined',()=>{
  const findings=auditSources([css(':root { --background: var(--missing); }')]);
  assert.equal(findings.filter(f=>f.code==='token-undefined').length,1);
  assert.throws(()=>captureBaseline(findings,'legacy'),/cannot be baselined/);
  assert.ok(compareBaseline(findings,{entries:findings}).newFindings.length);
});
test('undefined variables with actual CSS fallbacks are valid',()=>{
  assert.equal(auditSources([css(':root { --safe: var(--runtime, 12px); }')]).filter(f=>f.code.startsWith('token-')).length,0);
});
test('direct and indirect token cycles fail',()=>{
  for(const text of [':root{--a:var(--a)}',':root{--a:var(--b);--b:var(--c);--c:var(--a)}'])assert.ok(auditSources([css(text)]).some(f=>f.code==='token-cycle'));
});
test('same selector conflicting declarations are visible; media scopes stay distinct',()=>{
  const findings=auditSources([css('.x{color:var(--a)} .x{color:var(--b)} @media(min-width: 1px){.x{color:var(--c)}}')]);
  assert.equal(findings.filter(f=>f.code==='conflicting-declaration').length,1);
});
test('canonical primitive exemption applies only to custom-property declarations',()=>{
  const findings=auditSources([css(':root{--brand:#123456;--font-body:"Geist"}.local{color:#123456;font-family:"Wrong"}', 'src/styles/tokens.css')]);
  assert.equal(findings.filter(f=>f.code==='literal-color').length,1);assert.equal(findings.filter(f=>f.code==='literal-font').length,1);
  assert.ok(auditSources([css(':root{--brand:#123456}','src/subbrand/tokens.css')]).some(f=>f.code==='literal-color'));
});
test('source scanner sees conditional classes, inline font, raw colors and local frame geometry',()=>{
  const findings=auditSources([tsx('const view = <div className={open ? "bg-slate-900 max-w-6xl mx-auto px-4" : "text-foreground"} style={{fontFamily:"Arial",color:"rgb(1, 2, 3)"}}/>;')]);
  for(const code of ['named-palette','local-geometry','literal-font','literal-color'])assert.ok(findings.some(f=>f.code===code),code);
});
test('semantic tokens and comments do not introduce false literal color findings',()=>{
  assert.equal(auditSources([css(':root{--primary:0 0% 0%;--font-body:Geist;--layout-width-content:40rem}', 'src/styles/tokens.css'),css('/* #ff0000 */ .x{color:hsl(var(--primary));font-family:var(--font-body);max-width:var(--layout-width-content)}'),tsx('// #ff0000\n const c="bg-primary text-foreground";')]).length,0);
});
test('CLI fails new bypass, passes removal and forbids baseline overwrite',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'design-audit-test-'));
  try{fs.mkdirSync(path.join(root,'src'));fs.writeFileSync(path.join(root,'src','a.tsx'),'const c="bg-gray-100";');
    assert.equal(await main(['--capture-baseline','baseline.json','--reason','Reviewed legacy test presentation'],root),0);
    await assert.rejects(()=>main(['--capture-baseline','baseline.json','--reason','replace'],root),/Refusing/);
    fs.writeFileSync(path.join(root,'src','a.tsx'),'const c="bg-gray-100 text-red-500";');assert.equal(await main(['--baseline','baseline.json'],root),1);
    fs.writeFileSync(path.join(root,'src','a.tsx'),'const c="bg-primary";');assert.equal(await main(['--ratchet-baseline','baseline.json'],root),0);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'baseline.json'))).entries.length,0);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('route inventory distinguishes aliases/layouts and marks every state NOTTESTED',()=>{
  const register=buildRouteRegister(process.cwd());assert.equal(register.summary.declarations,register.declarations.length);
  assert.ok(register.summary.directRedirects>0);
  const home=register.declarations.find(r=>r.resolvedPathPattern==='/'&&r.kind==='conditional-entry');
  assert.deepEqual(home.conditionalTemplates.map(t=>t.module).sort(),['src/pages/Index.tsx','src/pages/Landing.tsx']);
  assert.ok(register.declarations.some(r=>r.resolvedPathPattern==='/mc/properties'&&r.templates.some(t=>t.symbol==='Pages.OwnerProperties')));
  assert.ok(register.declarations.some(r=>r.resolvedPathPattern==='/property/browse'&&r.kind==='redirect-adapter'));
  assert.ok(register.declarations.some(r=>r.resolvedPathPattern==='/home'&&r.kind==='redirect'));
  assert.ok(register.declarations.every(r=>r.coverage.observation==='NOTTESTED'&&r.coverage.states.every(s=>s.observation==='NOTTESTED')));
});
test('separate light/dark aliases do not create a fictitious cross-theme cycle',()=>{
  const findings=auditSources([css(':root{--a:var(--b);--b:1}.dark{--a:2;--b:var(--a)}')]);
  assert.equal(findings.filter(f=>f.code==='token-cycle').length,0);
});
test('real dark-theme override cycles still fail',()=>{
  assert.ok(auditSources([css(':root{--a:1;--b:2}.dark{--a:var(--b);--b:var(--a)}')]).some(f=>f.code==='token-cycle'));
});
test('same selector conflicts across source CSS files remain visible',()=>{
  const findings=auditSources([css('.x{color:var(--a)}','src/a.css'),css('.x{color:var(--b)}','src/b.css')]);
  assert.equal(findings.filter(f=>f.code==='conflicting-declaration').length,1);
});
test('numeric inline frame overrides are not hidden from the source guard',()=>{
  assert.ok(auditSources([tsx('const v=<div style={{maxWidth:740}}/>;')]).some(f=>f.code==='local-geometry'));
});
test('undefined token use in an ordinary CSS rule fails, not only token definitions',()=>{
  assert.ok(auditSources([css('.x{color:hsl(var(--undefined))}')]).some(f=>f.code==='token-undefined'));
});
test('runtime inline custom-property producers and HTML styles join the same dependency graph',()=>{
  const findings=auditSources([tsx('const v=<div style={{"--runtime-size":20}}/>;'),css('.x{max-width:var(--runtime-size)}'),{file:'index.html',text:'<style>.x{color:hsl(var(--primary))}</style>'},css(':root{--primary:0 0% 0%}','src/styles/tokens.css')]);
  assert.equal(findings.filter(f=>f.code==='token-undefined').length,0);
});
test('adding a literal font next to a variable is still a font bypass',()=>{
  const findings=auditSources([css(':root{--font-body:Geist}','src/styles/tokens.css'),css('.x{font-family:Arial,var(--font-body)}')]);
  assert.ok(findings.some(f=>f.code==='literal-font'));
});
test('normalized register retains all route, alias and dependency evidence with shared NOTTESTED defaults',()=>{
  const verbose=buildRouteRegister(process.cwd());const compact=JSON.parse(serializeRegister(normalizeRegister(verbose)));
  assert.equal(compact.routes.length,verbose.declarations.length);assert.equal(compact.coverageDefaults.observation,'NOTTESTED');
  for(const [i,r]of compact.routes.entries()){
    const original=verbose.declarations[i];assert.equal(r.path,original.resolvedPathPattern);assert.equal(r.kind,original.kind);assert.deepEqual(r.redirectTargets,original.redirectTargets);
    assert.deepEqual(r.templateRefs.map(id=>compact.catalogs.templates[id]),original.templates);
    assert.deepEqual(r.layoutRefs.map(id=>compact.catalogs.layouts[id]),original.ancestorElements);
    assert.deepEqual(r.fixtureRefs.map(id=>compact.catalogs.fixtures[id]),original.fixtureReferences);
    assert.deepEqual(r.helperRefs.map(id=>compact.catalogs.helpers[id]),original.helperEvidence);
  }
});
test('font shorthand accepts a canonical variable family after size and optional leading',()=>{
  const tokens=css(':root{--font-display:Geist;--size:22px;--leading:1.3}','src/styles/tokens.css');
  for(const shorthand of ['500 22px/1.3 var(--font-display)','italic 500 1.375rem / 1.3 var(--font-display)','500 var(--size)/var(--leading) var(--font-display)','500 clamp(1rem, 2vw, 2rem)/1.3 var(--font-display)']){
    assert.equal(auditSources([tokens,css('.x{font:'+shorthand+'}')]).filter(f=>f.code==='literal-font').length,0,shorthand);
  }
});
test('a variable font size does not make a literal Georgia family canonical',()=>{
  const findings=auditSources([css(':root{--size:22px}','src/styles/tokens.css'),css('.x{font:500 var(--size)/1.3 Georgia}')]);
  assert.ok(findings.some(f=>f.code==='literal-font'));
});
test('canonical shorthand family with a literal Georgia fallback still fails',()=>{
  const findings=auditSources([css(':root{--font-display:Geist}','src/styles/tokens.css'),css('.x{font:500 22px/1.3 var(--font-display), Georgia}')]);
  assert.ok(findings.some(f=>f.code==='literal-font'));
});
test('Tailwind arbitrary variable references fail when the token has no producer',()=>{
  const findings=auditSources([tsx('const v=<section className="p-[var(--card-padding)]"/>;')]);
  assert.ok(findings.some(f=>f.code==='token-undefined'&&f.detail.endsWith('--card-padding')));
});
test('an exact literal setProperty producer satisfies a source variable reference',()=>{
  const findings=auditSources([tsx('element.style.setProperty("--measured-height", `${height}px`); const v=<div className="h-[var(--measured-height)]"/>;')]);
  assert.equal(findings.filter(f=>f.code==='token-undefined').length,0);
});
test('a dynamic setProperty name does not declare arbitrary missing tokens',()=>{
  assert.ok(auditSources([tsx('element.style.setProperty(dynamicName, "20px"); const v=<div className="p-[var(--missing)]"/>;')]).some(f=>f.code==='token-undefined'));
});
test('only the six verified Radix variable names are external contracts',()=>{
  const names=['--radix-popover-content-available-height','--radix-popover-trigger-width','--radix-dropdown-menu-content-available-height','--radix-select-trigger-width','--radix-select-trigger-height','--radix-accordion-content-height'];
  const source='const styles='+JSON.stringify(names.map(n=>'var('+n+')'))+';';
  assert.equal(auditSources([tsx(source)]).filter(f=>f.code==='token-undefined').length,0);
  assert.ok(auditSources([tsx('const style="var(--radix-unverified-token)";')]).some(f=>f.code==='token-undefined'));
});
test('negative dependency fixture exemption is exact file, token and context only',()=>{
  const file='src/lib/__tests__/themeBootstrap.test.ts';
  assert.equal(auditSources([{file,text:'const replacement="$1var(--undefined-font)";'}]).filter(f=>f.code==='token-undefined').length,0);
  for(const source of [
    {file:'src/pages/App.tsx',text:'const replacement="$1var(--undefined-font)";'},
    {file,text:'const style="var(--undefined-font)";'},
    {file,text:'const replacement="$1var(--another-undefined-font)";'},
    {file:'src/lib/__tests__/another.test.ts',text:'const replacement="$1var(--undefined-font)";'},
  ])assert.ok(auditSources([source]).some(f=>f.code==='token-undefined'),JSON.stringify(source));
});
test('installed Radix packages still declare every sanctioned external producer key',()=>{
  const require=createRequire(import.meta.url);
  const contracts={
    '@radix-ui/react-popover':['--radix-popover-content-available-height','--radix-popover-trigger-width'],
    '@radix-ui/react-dropdown-menu':['--radix-dropdown-menu-content-available-height'],
    '@radix-ui/react-select':['--radix-select-trigger-width','--radix-select-trigger-height'],
    '@radix-ui/react-accordion':['--radix-accordion-content-height'],
  };
  for(const [dependency,keys]of Object.entries(contracts)){
    const compiled=fs.readFileSync(require.resolve(dependency),'utf8');
    for(const key of keys)assert.match(compiled,new RegExp('["\\\']'+key+'["\\\']\\s*:'),`${dependency} no longer declares ${key}; review the external contract instead of ignoring it`);
  }
});
test('installed Tailwind 3 gradient plugin still declares all sanctioned position defaults',()=>{
  const require=createRequire(import.meta.url);
  const packageFile=require.resolve('tailwindcss/package.json');const metadata=JSON.parse(fs.readFileSync(packageFile,'utf8'));
  assert.match(metadata.version,/^3\./,'A Tailwind major upgrade requires review of the external producer contracts');
  const compiled=fs.readFileSync(path.join(path.dirname(packageFile),'lib/corePlugins.js'),'utf8');
  for(const key of ['--tw-gradient-from-position','--tw-gradient-via-position','--tw-gradient-to-position'])assert.match(compiled,new RegExp('["\\\']'+key+'["\\\']\\s*:'),`Tailwind no longer declares ${key}`);
});
test('new CSS literal type sizes are ratchetable findings while canonical variables pass',()=>{
  const findings=auditSources([css(':root{--text-body:1rem}','src/styles/tokens.css'),css('.a{font-size:14px}.b{font-size:clamp(1rem,2vw,2rem)}.c{font-size:var(--text-body)}')]);
  assert.equal(findings.filter(f=>f.code==='literal-type-size').length,2);
  assert.equal(compareBaseline(findings).newFindings.filter(f=>f.code==='literal-type-size').length,2);
  assert.doesNotThrow(()=>captureBaseline(findings,'Reviewed existing typography debt'));
});
test('arbitrary literal type and spacing lengths fail without flagging standard or variable utilities',()=>{
  const literal=auditSources([tsx('const c="text-[14px] text-[1.2rem] text-[clamp(1rem,2vw,2rem)] p-[17px] px-[1.2rem] pl-[10px] pr-[12px] gap-[1rem]";')]);
  assert.equal(literal.filter(f=>f.code==='literal-type-size').length,3);
  assert.equal(literal.filter(f=>f.code==='local-geometry').length,5);
  const semantic=auditSources([css(':root{--text-body:1rem;--layout-gutter:1rem}','src/styles/tokens.css'),tsx('const c="text-[var(--text-body)] p-[var(--layout-gutter)] px-[var(--layout-gutter)] gap-[var(--layout-gutter)] p-4 px-4 pl-4 pr-4 gap-4 text-sm";')]);
  assert.equal(semantic.length,0);
});
test('calendar position values and business numbers are outside type/spacing checks',()=>{
  const findings=auditSources([tsx('const c="left-[14px] top-[12px] w-[120px] h-[24px]"; const price=14000; const v=<div style={{left:42,top:28,height:70}}/>;')]);
  assert.equal(findings.length,0);
});
