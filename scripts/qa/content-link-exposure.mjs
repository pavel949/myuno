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
// Resolve each authored href to its containing landing object by AST position,
// rather than joining every equal href in the same multi-entry source file.
const locations = new Map();
for (const file of new Set(inventory.map(item => item.file))) {
  const ast = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const visit = (node, landingSlug = null, field = null) => {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      const slug = node.initializer.properties.find(prop => ts.isPropertyAssignment(prop) && prop.name.getText(ast) === 'slug' && ts.isStringLiteral(prop.initializer));
      if (slug) landingSlug = slug.initializer.text;
    }
    if (ts.isPropertyAssignment(node)) {
      const name = node.name.getText(ast);
      if (['services', 'primaryCta', 'secondaryCta', 'seo'].includes(name)) field = name;
      if (name === 'href' && ts.isStringLiteral(node.initializer)) {
        const line = ast.getLineAndCharacterOfPosition(node.initializer.getStart(ast)).line + 1;
        locations.set(`${file}:${line}:${node.initializer.text}`, { landingSlug, field });
      }
    }
    ts.forEachChild(node, child => visit(child, landingSlug, field));
  };
  visit(ast);
}
const result = inventory.map(item => {
  const location = locations.get(`${item.file}:${item.line}:${item.href}`);
  const exposure = (exposures.get(item.href) ?? []).filter(source => source.file === item.file && source.route.split('/').at(-1) === location?.landingSlug);
  return { ...item, landingSlug: location?.landingSlug ?? null, configuredField: location?.field ?? null, renderedBySource: ['services', 'primaryCta', 'secondaryCta'].includes(location?.field), exposure };
});
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2)+'\n');
const unmatched = result.filter(item => item.status === 'unmatched');
console.log(JSON.stringify({ unmatchedOccurrences: unmatched.length, actionableUnmatchedOccurrences: unmatched.filter(item => !item.availability && item.renderedBySource && item.exposure.some(source => source.live)).length, disabledConfiguredOccurrences: result.filter(item => item.availability && item.renderedBySource && item.exposure.some(source => source.live)).length, liveConfiguredUnmatchedOccurrences: unmatched.filter(item => item.exposure.some(source => source.live)).length, sourceRenderedUnmatchedOccurrences: unmatched.filter(item => item.renderedBySource && item.exposure.some(source => source.live)).length, liveClusterConfigs: CLUSTER_LANDINGS.filter(isLiveClusterLanding).length, clusterConfigs: CLUSTER_LANDINGS.length, livePersonaConfigs: PERSONA_LANDINGS.filter(isLivePersonaLanding).length, personaConfigs: PERSONA_LANDINGS.length, uniqueLiveUnmatchedHrefs: new Set(unmatched.filter(item => item.exposure.some(source => source.live)).map(item => item.href)).size }, null, 2));
