import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { auditContentRoutes } from './content-route-inventory.mjs';
// Evaluate only local, data-only landing modules; no app, browser or database client.
const root = process.cwd();
const cache = new Map();
function readData(file) {
  const absolute = path.resolve(root, file);
  if (cache.has(absolute)) return cache.get(absolute);
  const exports = {};
  cache.set(absolute, exports);
  const require = specifier => {
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) throw new Error(`Unexpected dependency ${specifier}`);
    const target = specifier.startsWith('@/') ? path.join(root, 'src', specifier.slice(2)) : path.resolve(path.dirname(absolute), specifier);
    return readData(`${target}.ts`);
  };
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(js, { exports, require }, { filename: absolute });
  return exports;
}
const { isLiveClusterLanding, isLivePersonaLanding } = readData('src/lib/landings/types.ts');
const { CLUSTER_LANDINGS } = readData('src/content/landings/clusterLandings.ts');
const { PERSONA_LANDINGS } = readData('src/content/landings/personaLandings.ts');
const exposures = new Map();
function collect(node, entry) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.href === 'string') {
    const values = exposures.get(node.href) ?? [];
    values.push(entry); exposures.set(node.href, values);
  }
  for (const value of Object.values(node)) if (typeof value === 'object') collect(value, entry);
}
for (const landing of CLUSTER_LANDINGS) collect(landing, { file: 'src/content/landings/clusterLandings.ts', route: `/cluster/${landing.slug}`, live: isLiveClusterLanding(landing) });
for (const landing of PERSONA_LANDINGS) {
  const source = [...cache.entries()].find(([file, exports]) => file.includes(`${path.sep}personas${path.sep}`) && Object.values(exports).includes(landing));
  collect(landing, { file: source ? path.relative(root, source[0]).split(path.sep).join('/') : 'unknown', route: `/for/${landing.slug}`, live: isLivePersonaLanding(landing) });
}
const inventory = auditContentRoutes();
const result = inventory.map(item => ({ ...item, exposure: (exposures.get(item.href) ?? []).filter(source => source.file === item.file) }));
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2)+'\n');
const unmatched = result.filter(item => item.status === 'unmatched');
console.log(JSON.stringify({ unmatchedOccurrences: unmatched.length, liveUnmatchedOccurrences: unmatched.filter(item => item.exposure.some(source => source.live)).length, uniqueLiveUnmatchedHrefs: new Set(unmatched.filter(item => item.exposure.some(source => source.live)).map(item => item.href)).size }, null, 2));
