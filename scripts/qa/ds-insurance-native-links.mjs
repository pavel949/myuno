// Actual TravelInsurance; synthetic language/upload boundaries, no partner transport.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
const root=process.cwd(),base='f26a1c948d95edf11e8ac853b56bf0cbe7e7ffde',version=process.argv.includes('--before')?'before':'after';
const out=(process.env.INSURANCE_LINKS_OUTPUT||'/workspace/artifacts/myuno-ds-platform-audit-20261025/insurance-native-links')+'/'+version;
await mkdir(out,{recursive:true});
const component='src/pages/insurance/TravelInsurance.tsx';const source=version==='before'?execFileSync('git',['show',`${base}:${component}`],{encoding:'utf8'}):await readFile(component,'utf8');
const mocks={
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:'en'});`,
 '@/components/insurance/InsurancePolicyUpload':`export const InsurancePolicyUpload=()=>null;`,
 '@/components/uno/BackButton':`export const BackButton=()=>null;`,
};
await build({stdin:{contents:`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import Page from'actual-page';window.fixtureClicks=[];document.addEventListener('click',e=>{const link=e.target.closest('a');if(link)window.fixtureClicks.push({href:link.href,prevented:e.defaultPrevented,ctrlKey:e.ctrlKey})});createRoot(document.getElementById('root')).render(<MemoryRouter><Page/></MemoryRouter>);`,loader:'tsx',resolveDir:root},bundle:true,format:'esm',jsx:'automatic',alias:{'@':root+'/src'},outfile:out+'/fixture.js',plugins:[{name:'isolated-page-source',setup(b){b.onResolve({filter:/^actual-page$/},()=>({path:'page',namespace:'actual'}));b.onLoad({filter:/.*/,namespace:'actual'},()=>({contents:source,loader:'tsx',resolveDir:root+'/src/pages/insurance'}));b.onResolve({filter:/.*/},a=>a.path in mocks?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}));}}]});
const css=await postcss([postcssImport(),tailwindcss(root+'/tailwind.config.ts'),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:root+'/src/index.css'});await writeFile(out+'/fixture.css',css.css);
await writeFile(out+'/fixture.html','<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script></html>');
await writeFile(out+'/provenance.json',JSON.stringify({version,base,component,sourceSha256:createHash('sha256').update(source).digest('hex'),boundary:'Actual page + app CSS; language/upload/back adapters; known partner navigations fulfilled locally when context interception applies; localhost-only denying proxy contains misses; missed partner document means opener/referrer UNVERIFIED; window.open remains native.'},null,2));
const run=spawnSync(process.env.PYTHON||'python',['scripts/qa/ds-insurance-native-links.py',out,version],{stdio:'inherit',env:process.env});process.exitCode=run.status??1;
