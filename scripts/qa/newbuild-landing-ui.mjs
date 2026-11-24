// Actual newbuild discovery and project search, synthetic read boundary; no production backend.
import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import postcss from "postcss";
import postcssImport from "postcss-import";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
const root = process.cwd(),
  output = process.env.NEWBUILD_QA_OUTPUT || "/tmp/browser/newbuild-landing";
await mkdir(output, { recursive: true });
const virtual = {
  "@/contexts/LanguageContext": `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
  "@/components/seo": `export const SEOHead=()=>null;`,
  "@/hooks/useOffplanProjects": `import {useState} from'react';export function useOffplanProjects(){const[retried,set]=useState(false);const state=new URLSearchParams(location.search).get('state');return{data:state==='empty'?[]:[{id:'synthetic-project',nameEn:'Synthetic project',nameRu:'Тестовый проект',district:'Bang Tao',developerName:'Synthetic developer',coverImage:location.origin+'/synthetic-project.svg',priceFrom:4500000,projectStatus:'completed',unitsAvailable:99,muunoScore:99,roiProjected:42,completionDate:'2028-01-01',isClearviewRated:true}],isLoading:state==='loading',isError:state==='error'&&!retried,refetch:()=>{set(true);return Promise.resolve()}}}`,
  "@/hooks/useDevelopers": `import {useState} from'react';export function useDevelopers(){const[retried,set]=useState(false);const state=new URLSearchParams(location.search).get('state');return{data:state==='developer-empty'?[]:[{id:'synthetic-developer',nameEn:'Synthetic developer',nameRu:'Тестовый застройщик',isVerified:true,muunoScore:99}],isLoading:false,isError:state==='developer-error'&&!retried,refetch:()=>{set(true);return Promise.resolve()}}}`,
  "@/integrations/supabase/client": `export const supabase=new Proxy({},{get(){throw Error('Live backend forbidden in newbuild UI fixture')}});`,
};
const result = await build({
  stdin: {
    contents: `import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route,useLocation}from'react-router-dom';import Page from'${root}/src/pages/property/NewbuildLanding.tsx';function Probe(){let l=useLocation();return <output hidden data-testid="location">{l.pathname+l.search+l.hash}</output>}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/property/offplan']}><main><Routes><Route path="/property/offplan" element={<Page/>}/><Route path="*" element={<h1>Canonical destination boundary</h1>}/></Routes><Probe/></main></MemoryRouter>);`,
    loader: "tsx",
    resolveDir: root,
  },
  outfile: path.join(output, "fixture.js"),
  bundle: true,
  format: "esm",
  jsx: "automatic",
  metafile: true,
  loader: { ".svg": "file", ".png": "file", ".webp": "file" },
  plugins: [
    {
      name: "newbuild-synthetic-boundaries",
      setup(b) {
        b.onResolve({ filter: /.*/ }, (args) => {
          if (Object.hasOwn(virtual, args.path))
            return { path: args.path, namespace: "synthetic" };
          if (args.path.startsWith("@/")) {
            const base = path.join(root, "src", args.path.slice(2));
            const file = [
              base,
              base + ".ts",
              base + ".tsx",
              path.join(base, "index.ts"),
              path.join(base, "index.tsx"),
            ].find((p) => existsSync(p) && statSync(p).isFile());
            if (!file) throw Error("Unresolved " + args.path);
            return { path: file };
          }
        });
        b.onLoad({ filter: /.*/, namespace: "synthetic" }, (args) => ({
          contents: virtual[args.path],
          loader: "tsx",
          resolveDir: root,
        }));
      },
    },
  ],
});
for (const file of [
  "src/pages/property/NewbuildLanding.tsx",
  "src/content/property/newbuildLanding.ts",
  "src/components/newbuilds/ProjectStartingPrice.tsx",
  "src/styles/newbuild-landing.css",
])
  if (
    !Object.keys(result.metafile.inputs).some((input) => input.endsWith(file))
  )
    throw Error("Actual source missing: " + file);
if (
  Object.keys(result.metafile.inputs).some(
    (input) =>
      !input.startsWith("synthetic:") &&
      input.endsWith("integrations/supabase/client.ts"),
  )
)
  throw Error("Live backend module included");
const routeCss = await readFile(path.join(output, "fixture.css"), "utf8");
const css = await postcss([
  postcssImport(),
  tailwindcss(path.join(root, "tailwind.config.ts")),
  autoprefixer(),
]).process(await readFile("src/index.css", "utf8"), {
  from: path.join(root, "src/index.css"),
});
await writeFile(path.join(output, "fixture.css"), css.css + "\n" + routeCss);
await writeFile(
  path.join(output, "fixture.html"),
  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
);
await writeFile(
  path.join(output, "synthetic-project.svg"),
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="gray"/><text x="20" y="50">SYNTHETIC QA</text></svg>',
);
const files = [
  "src/pages/property/NewbuildLanding.tsx",
  "src/styles/newbuild-landing.css",
  "src/lib/real-estate/publicNewbuildPresentation.ts",
  "src/content/property/newbuildLanding.ts",
];
await writeFile(
  path.join(output, "provenance.json"),
  JSON.stringify(
    {
      actualSourceHashes: Object.fromEntries(
        await Promise.all(
          files.map(async (file) => [
            file,
            createHash("sha256")
              .update(await readFile(file))
              .digest("hex"),
          ]),
        ),
      ),
      syntheticBoundaries: Object.keys(virtual),
      limits:
        "Actual newbuild page, copy, presentation restriction and project search. Synthetic public project/developer reads; no backend, full AppLayout, current offers or production acceptance. Fallback fonts.",
    },
    null,
    2,
  ),
);
if (!process.argv.includes("--build-only")) {
  const run = spawnSync(
    "python3",
    ["scripts/qa/newbuild-landing-ui.py", output],
    { stdio: "inherit", timeout: 180000 },
  );
  process.exitCode = run.status ?? 1;
}
