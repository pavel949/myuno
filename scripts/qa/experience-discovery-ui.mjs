// Actual editorial detail, OptimizedImage and DS Button; synthetic shell and record.
import { build } from 'esbuild';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const output = path.resolve('artifacts/experience-discovery');
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
  '@/components/miniapp/MiniAppLayout': `import React from 'react';export const MiniAppLayout=({title,children})=><main className="mx-auto max-w-4xl px-4 pb-8"><p>ISOLATED QA SHELL</p><h1 className="font-display text-h1">{title}</h1>{children}</main>;`,
};
await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{ExperienceDiscoveryDetail}from'./src/components/experiences/ExperienceDiscoveryDetail';createRoot(document.getElementById('root')).render(<ExperienceDiscoveryDetail experience={{id:'synthetic',title_en:'A day in Phuket',title_ru:'Прогулка и отдых на Пхукете',description_en:'Discover a real operator and confirm the programme before your visit.',description_ru:'Познакомьтесь с программой и уточните условия посещения у оператора.',location_name:'Synthetic Phuket',cover_image:'/photo.webp',source_page_url:'https://operator.example/programme',discovery_only:true}} onBack={()=>{}}/>);`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, format: 'esm', outfile: path.join(output, 'fixture.js'), jsx: 'automatic', alias: { '@': path.resolve('src') }, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' }, plugins: [{ name: 'synthetic-shell', setup(b) { b.onResolve({ filter: /^@\// }, args => virtual[args.path] ? { path: args.path, namespace: 'synthetic' } : null); b.onLoad({ filter: /.*/, namespace: 'synthetic' }, args => ({ contents: virtual[args.path], loader: 'tsx', resolveDir: process.cwd() })); } }] });
const css = (await readdir('dist/assets')).find(file => /^index-.*\.css$/.test(file));
if (!css) throw Error('Production CSS is required');
await writeFile(path.join(output, 'fixture.css'), await readFile(path.join('dist/assets', css)));
await writeFile(path.join(output, 'fixture.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
await writeFile(path.join(output, 'photo.webp'), await readFile('public/catalog/experiences/hanuman-world.webp'));
const result = spawnSync(process.env.PYTHON || 'python3', ['scripts/qa/experience-discovery-ui.py', output], { stdio: 'inherit', timeout: 180000 });
if (result.status !== 0) process.exit(result.status || 1);
