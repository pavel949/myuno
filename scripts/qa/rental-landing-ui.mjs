// Actual rental landing and shared search, synthetic read boundary; no production backend.
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
  output = process.env.RENTAL_QA_OUTPUT || "/tmp/browser/rental-landing";
await mkdir(output, { recursive: true });
const virtual = {
  "@/contexts/LanguageContext": `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
  "@/components/seo": `export const SEOHead=()=>null;`,
  "@/hooks/useProperties": `import {useState} from 'react';export function useProperties(filters,limit){const[retried,set]=useState(false);const state=new URLSearchParams(location.search).get('state');window.fixtureRentRead={filters,limit};return{data:state==='empty'?[]:[{id:'synthetic-home',project_id:'synthetic-community'}],isLoading:state==='loading',isError:state==='error'&&!retried,refetch:()=>{set(true);return Promise.resolve()}}}`,
  "@/hooks/usePropertyProjects": `export const usePublicPropertyProjects=(limit,district,ids)=>{window.fixtureProjectRead={limit,district,ids};return{data:ids.length?[{id:'synthetic-community',name_en:'Synthetic rental community',name_ru:'Тестовый жилой комплекс',district:'rawai'}]:[],isLoading:false,isError:false,refetch:()=>Promise.resolve()}};`,
  "@/hooks/usePropertyQuickFilters": `export const usePropertyQuickFilters=()=>({districts:[{id:'rawai',valueKey:'rawai',labelRu:'Равай',labelEn:'Rawai'}],isLoading:false});`,
  "@/hooks/usePropertyFilterOptions": `export const usePropertyFilterOptions=()=>({propertyTypes:[{id:'villa',labelRu:'Вилла',labelEn:'Villa'},{id:'condo',labelRu:'Кондо',labelEn:'Condo'}],isLoading:false});`,
  "@/integrations/supabase/client": `export const supabase=new Proxy({},{get(){throw Error('Live backend capability is forbidden in rental UI fixture')}});`,
};
const result = await build({
  stdin: {
    contents: `import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route,useLocation}from'react-router-dom';import Page from'${root}/src/pages/property/PropertyLanding.tsx';function Probe(){let l=useLocation();return <output hidden data-testid="location">{l.pathname+l.search+l.hash}</output>}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/property/rent']}><main className="ds-frame ds-frame-catalogue"><Routes><Route path="/property/rent" element={<Page/>}/><Route path="*" element={<h1>Canonical destination boundary</h1>}/></Routes><Probe/></main></MemoryRouter>);`,
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
      name: "rental-synthetic-boundaries",
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
  "src/pages/property/PropertyLanding.tsx",
  "src/components/home/HomeDiscoverySearch.tsx",
  "src/components/home/HomeSearchDateRange.tsx",
  "src/styles/rental-landing.css",
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
const fixtureHtml = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>';
await writeFile(path.join(output, "fixture.html"), fixtureHtml);
// First paint must already use the requested palette; toggling .dark after
// mount mixes transitions from the old field surface with new placeholder ink.
await writeFile(
  path.join(output, "fixture-dark.html"),
  fixtureHtml.replace("<html>", '<html class="dark">'),
);
const files = [
  "src/pages/property/PropertyLanding.tsx",
  "src/styles/rental-landing.css",
  "src/content/property/rentalLanding.ts",
  "src/components/home/HomeDiscoverySearch.tsx",
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
        "Actual page, editorial copy, stored-media fallback and shared search. Synthetic public homes/project reads and taxonomy; no live backend, full AppLayout or production acceptance. Fallback fonts.",
    },
    null,
    2,
  ),
);
if (!process.argv.includes("--build-only")) {
  const run = spawnSync(
    "python3",
    ["scripts/qa/rental-landing-ui.py", output],
    { stdio: "inherit", timeout: 180000 },
  );
  process.exitCode = run.status ?? 1;
}
