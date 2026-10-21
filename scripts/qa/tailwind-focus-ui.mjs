// Real shared controls and compiled application CSS; no data or network adapters.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { compileApplicationCss } from './compile-application-css.mjs';

const root = process.cwd();
const output = '/tmp/browser/tailwind-focus-isolated';
await mkdir(output, { recursive: true });
const result = await build({
  stdin: {
    contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {Button} from '${root}/src/components/ui/button.tsx';import {Input} from '${root}/src/components/ui/input.tsx';createRoot(document.getElementById('root')).render(<main className="mx-auto max-w-lg space-y-6 p-6"><h1 className="text-2xl font-semibold">Shared control accessibility</h1><Button>Find a home</Button><label className="block space-y-2"><span>Your search</span><Input aria-label="Your search" enableTypeSound={false}/></label></main>);`,
    loader: 'tsx', resolveDir: root,
  },
  bundle: true, outfile: path.join(output, 'fixture.js'), jsx: 'automatic', format: 'esm', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false' },
  plugins: [{ name: 'source-alias', setup(b) {
    b.onResolve({ filter: /^@\// }, args => {
      const base = path.join(root, 'src', args.path.slice(2));
      const resolved = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts')]
        .find(file => existsSync(file) && statSync(file).isFile());
      if (!resolved) throw Error('Unresolved source import: ' + args.path);
      return { path: resolved };
    });
  } }],
});
if (Object.keys(result.metafile.inputs).some(file => /integrations\/supabase|@supabase\//.test(file))) {
  throw Error('Production data module included');
}
await writeFile(path.join(output, 'fixture.css'), (await compileApplicationCss(root)).css);
const criticalCss = (await readFile(path.join(root, 'index.html'), 'utf8'))
  .match(/<style id="myuno-critical-styles">([\s\S]*?)<\/style>/)?.[1];
if (!criticalCss) throw Error('Actual bootstrap critical CSS was not found');
await writeFile(path.join(output, 'fixture.html'), `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><style>${criticalCss}</style><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`);
if (!process.argv.includes('--build-only')) {
  const run = spawnSync('python3', [path.join(root, 'scripts/qa/tailwind-focus-ui.py'), output], { stdio: 'inherit' });
  process.exitCode = run.status ?? 1;
}
