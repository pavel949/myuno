#!/usr/bin/env node
/** Source guardrails, not a visual or authorization audit.
 * node scripts/design-system-audit.mjs [--baseline FILE] [--json]
 * Default baseline, if present: docs/design-system/audit-baseline.json.
 * Capture ONCE after foundation freeze: --capture-baseline FILE --reason 'review rationale'.
 * Thereafter --ratchet-baseline FILE removes resolved entries; it NEVER admits new ones.
 * --write-register docs/design-system/route-surface-register.json is source-only inventory.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import ts from 'typescript';
const hash = value => createHash('sha256').update(value).digest('hex');
const primitiveSource = 'src/styles/tokens.css';
const externalTokens = new Map([
  ['--tw-gradient-from-position','Tailwind corePlugins gradientColorStops defaults'],
  ['--tw-gradient-via-position','Tailwind corePlugins gradientColorStops defaults'],
  ['--tw-gradient-to-position','Tailwind corePlugins gradientColorStops defaults'],
  ['--radix-popover-content-available-height','@radix-ui/react-popover/dist/index.mjs:255; PopoverContent maps --radix-popper-available-height'],
  ['--radix-popover-trigger-width','@radix-ui/react-popover/dist/index.mjs:256; PopoverContent maps --radix-popper-anchor-width'],
  ['--radix-dropdown-menu-content-available-height','@radix-ui/react-dropdown-menu/dist/index.mjs:130,245; content/subcontent maps --radix-popper-available-height'],
  ['--radix-select-trigger-width','@radix-ui/react-select/dist/index.mjs:717; popper content maps --radix-popper-anchor-width'],
  ['--radix-select-trigger-height','@radix-ui/react-select/dist/index.mjs:718; popper content maps --radix-popper-anchor-height'],
  ['--radix-accordion-content-height','@radix-ui/react-accordion/dist/index.mjs:290; AccordionContent maps --radix-collapsible-content-height'],
]);
// A deliberately malformed token in the boot validator's rejection assertion.
// Exact file + token + string context only: this is NOT a producer or global token.
const negativeDependencyFixtures = [{file:'src/lib/__tests__/themeBootstrap.test.ts',token:'--undefined-font',context:'$1var(--undefined-font)',reason:'Asserts .toThrow(\'Missing canonical bootstrap dependency\') after injecting an undefined font dependency'}];
const isNegativeDependencyFixture=use=>negativeDependencyFixtures.some(f=>use.file===f.file&&use.ref.name===f.token&&use.context===f.context);
const hardCodes = new Set(['css-parse-error', 'token-undefined', 'token-cycle']);
const colorPattern = /#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\(\s*(?!var\()[^)]*\)/gi;
const palettePattern = /\b(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|decoration|outline|divide|placeholder|accent|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})\b|\b(?:bg|text|border|ring|fill|stroke)-(?:white|black)\b/g;
const arbitraryTypePattern = /\btext-\[([^\]]+)\]/g;
const arbitrarySpacingPattern = /\b(?:p|px|pl|pr|gap)-\[([^\]]+)\]/g;
const literalLength = /(?:^|[^\w-])(?:\d*\.)?\d+(?:px|rem|em|ex|ch|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cm|mm|q|in|pt|pc)\b/i;
const geometryPattern = /\bmax-w-(?!full\b|none\b|screen\b|\[var\()[\w[\].:%()-]+|\bfont-\[(?!var\()[^\]]+\]/g;
function walk(dir) { return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : []; }
export function sourceFiles(root) {
  // No source directory exclusions: tests, subbrands and specialized verticals remain visible.
  return [...walk(path.join(root, 'src')).filter(p => /\.(css|tsx?|jsx?)$/.test(p)), ...['index.html', 'tailwind.config.ts', 'tailwind.config.js'].map(p => path.join(root, p)).filter(p => fs.existsSync(p))].sort();
}
function refs(value) {
  const out=[]; const re=/var\(\s*(--[\w-]+)\s*([,)])/g; let m;
  while ((m=re.exec(value))) out.push({name:m[1],fallback:m[2]===','});
  return out;
}
/** Extract the family tail, without treating weight/size/leading as font names.
 * Untyped multi-var preludes can be ambiguous; they are not assumed canonical.
 */
export function fontShorthandFamily(value) {
  const nodes=valueParser(value).nodes.filter(n=>n.type!=='space'&&n.type!=='comment');
  if(nodes.length===1&&nodes[0].type==='function'&&nodes[0].value==='var')return value.trim();
  const sizeWord=/^(?:0|(?:\d*\.)?\d+(?:px|rem|em|ex|ch|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cm|mm|q|in|pt|pc|%)|xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|smaller|larger)$/i;
  let size=nodes.findIndex(n=>n.type==='word'&&sizeWord.test(n.value));
  if(size<0)size=nodes.findIndex(n=>n.type==='function'&&['var','calc','min','max','clamp'].includes(n.value));
  if(size<0)return null;
  let family=size+1;
  if(nodes[family]?.type==='div'&&nodes[family].value==='/')family+=2;
  if(!nodes[family])return null;
  return valueParser.stringify(nodes.slice(family)).trim();
}
export function auditSources(sources) {
  const findings=[]; const definitions=new Map(); const uses=[]; const seenDeclarations=new Map(); const origins=new Map();
  const expanded=sources.flatMap(source=>{if(!source.file.endsWith('.html'))return [source];return [...source.text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m,i)=>{const file=source.file+'#inline-'+i+'.css';origins.set(file,{file:source.file,offset:source.text.slice(0,m.index).split('\n').length-1});return {file,text:m[1]};});});
  const add=(file,line,code,detail,context='') => findings.push({file,line,code,detail,context});
  for(const {file,text} of expanded) {
    if(file.endsWith('.css')) {
      let ast; try { ast=postcss.parse(text,{from:file}); } catch(e) {add(file,e.line||1,'css-parse-error',e.reason);continue;}
      ast.walkDecls(d=>{
        const selector=d.parent.type==='rule'?d.parent.selector:'@'+d.parent.name;
        const context=selector+' | '+d.prop+': '+d.value+(d.important?' !important':'');
        if(d.prop.startsWith('--')) {
          const rows=definitions.get(d.prop)||[]; rows.push({file,line:d.source.start.line,value:d.value,selector,context});definitions.set(d.prop,rows);
        }
        for(const ref of refs(d.value))uses.push({file,line:d.source.start.line,property:d.prop,ref,context});
        const primitive=file===primitiveSource && d.prop.startsWith('--');
        if(!primitive) {
          for(const m of d.value.matchAll(colorPattern)) if(!m[0].includes('var(')) add(file,d.source.start.line,'literal-color',m[0],context);
          if(d.prop.startsWith('--') && /^\s*\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%\s*$/.test(d.value)) add(file,d.source.start.line,'literal-color',d.value,context);
          const fontFamily=d.prop==='font' ? (fontShorthandFamily(d.value)??d.value) : d.value;
          if((d.prop==='font-family'||d.prop==='font'||d.prop.startsWith('--font')) && !/^var\(\s*--[\w-]+\s*\)$/.test(fontFamily.trim()) && !/^(inherit|initial|unset|revert)$/.test(d.value)) add(file,d.source.start.line,'literal-font',d.value,context);
          if(d.prop==='font-size'&&literalLength.test(d.value)&&!d.value.includes('var('))add(file,d.source.start.line,'literal-type-size',d.value,context);
          if(/^(max-width|padding-inline(?:-start|-end)?|padding-left|padding-right)$/.test(d.prop) && /\d(?:px|rem|em|vw)\b/.test(d.value) && !d.value.includes('var(')) add(file,d.source.start.line,'local-geometry',d.value,context);
        }
        if(d.prop==='@apply') for(const m of d.value.matchAll(palettePattern)) add(file,d.source.start.line,'named-palette',m[0],context);
      });
      ast.walkAtRules('apply',r=>{for(const m of r.params.matchAll(palettePattern))add(file,r.source.start.line,'named-palette',m[0],r.parent.selector+' | @apply '+r.params);});
      const seen=seenDeclarations;
      ast.walkRules(rule=>{
        // Scope includes layer/media/supports. Different conditional themes are not conflicts.
        const scope=[]; for(let p=rule.parent;p&&p.type!=='root';p=p.parent)scope.unshift('@'+p.name+' '+p.params);
        const key=scope.join(' / ')+' | '+rule.selector;
        rule.walkDecls(d=>{
          if(d.parent!==rule)return;
          const k=key+' | '+d.prop+' | '+Boolean(d.important), previous=seen.get(k);
          if(previous && previous.value!==d.value)add(file,d.source.start.line,'conflicting-declaration',previous.value+' → '+d.value,k+' | previous source: '+previous.file);
          seen.set(k,{value:d.value,file});
        });
      });
    } else if(/\.[jt]sx?$/.test(file)) {
      const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
      function visit(n) {
        if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='setProperty'&&n.arguments.length>=2&&ts.isStringLiteralLike(n.arguments[0])&&/^--[\w-]+$/.test(n.arguments[0].text)){
          const name=n.arguments[0].text;const rows=definitions.get(name)||[];
          rows.push({file,line:ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1,value:ts.isStringLiteralLike(n.arguments[1])?n.arguments[1].text:'',selector:':runtime-setProperty',context:n.getText(ast)});definitions.set(name,rows);
        }
        if(ts.isPropertyAssignment(n)){const name=n.name.getText(ast).replace(/['\"]/g,'');if(name.startsWith('--')){const rows=definitions.get(name)||[];rows.push({file,line:ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1,value:'',selector:':runtime-inline-style',context:n.getText(ast)});definitions.set(name,rows);}}
        if(ts.isStringLiteralLike(n)||ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n)) {
          const value=n.text; const line=ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1;
          const context=value.replace(/\s+/g,' ').trim();
          for(const ref of refs(value))uses.push({file,line,property:'source-string',ref,context});
          for(const m of value.matchAll(colorPattern))if(!m[0].includes('var('))add(file,line,'literal-color',m[0],context);
          for(const m of value.matchAll(palettePattern))add(file,line,'named-palette',m[0],context);
          for(const m of value.matchAll(arbitraryTypePattern))if(literalLength.test(m[1])&&!m[1].includes('var('))add(file,line,'literal-type-size',m[0],context);
          for(const m of value.matchAll(arbitrarySpacingPattern))if(literalLength.test(m[1])&&!m[1].includes('var('))add(file,line,'local-geometry',m[0],context);
          for(const m of value.matchAll(geometryPattern))add(file,line,m[0].startsWith('font-')?'literal-font':'local-geometry',m[0],context);
          if(/\b(?:mx-auto|max-w-|container)\b/.test(value))for(const m of value.matchAll(/\bpx-(?:\d+(?:\.\d+)?|\[(?!var\()[^\]]+\])/g))add(file,line,'local-geometry',m[0],context);
          if(ts.isPropertyAssignment(n.parent) && /^(fontFamily|maxWidth|paddingInline|paddingLeft|paddingRight)$/.test(n.parent.name.getText(ast).replace(/['"]/g,'')) && (n.parent.name.getText(ast).includes('font') ? !/^var\(\s*--[\w-]+\s*\)$/.test(value.trim())&&!/^(inherit|initial|unset|revert)$/.test(value) : !value.includes('var(')))add(file,line,n.parent.name.getText(ast).includes('font')?'literal-font':'local-geometry',value,n.parent.getText(ast));
        }
        if(ts.isNumericLiteral(n)&&ts.isPropertyAssignment(n.parent)&&/^(maxWidth|paddingInline|paddingLeft|paddingRight)$/.test(n.parent.name.getText(ast).replace(/['\"]/g,'')))add(file,ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1,'local-geometry',n.text,n.parent.getText(ast));
        ts.forEachChild(n,visit);
      } visit(ast);
    }
  }
  // Token dependencies, including fallback-free references; CSS fallback references may be undefined.
  for(const use of uses)if(!use.ref.fallback&&!definitions.has(use.ref.name)&&!externalTokens.has(use.ref.name)&&!isNegativeDependencyFixture(use))add(use.file,use.line,'token-undefined',use.property+' → '+use.ref.name,use.context);
  const reported=new Set();
  const base=new Map();
  const isRoot=selector=>selector.split(',').some(s=>[':root','html'].includes(s.trim()));
  for(const [name,rows] of definitions)for(const row of rows)if(isRoot(row.selector))base.set(name,row);
  // Evaluate aliases in each selector environment, rather than merging light/dark
  // alternatives into a fictitious graph (A->B in light + B->A in dark is not a cycle).
  const selectors=[...new Set([':root',...Array.from(definitions.values()).flat().map(r=>r.selector)])];
  for(const selector of selectors){
    const graph=new Map(base);
    for(const [name,rows] of definitions)for(const row of rows)if(row.selector===selector)graph.set(name,row);
    const done=new Set();
    function explore(name,chain){
      if(chain.includes(name)){
        const cycle=[...chain.slice(chain.indexOf(name)),name];const key=selector+'|'+[...new Set(cycle)].sort().join('|');
        if(!reported.has(key)){reported.add(key);const row=graph.get(name);add(row.file,row.line,'token-cycle',cycle.join(' → '),selector);}return;
      }
      if(done.has(name))return;
      const row=graph.get(name);if(row)for(const ref of refs(row.value))if(graph.has(ref.name))explore(ref.name,[...chain,name]);
      done.add(name);
    }
    for(const name of graph.keys())explore(name,[]);
  }
  const occurrences=new Map();
  return findings.map(raw=>{const origin=origins.get(raw.file);const f=origin?{...raw,file:origin.file,line:raw.line+origin.offset}:raw;const key=JSON.stringify([f.file,f.code,f.detail,f.context]);const occurrence=(occurrences.get(key)||0)+1;occurrences.set(key,occurrence);return {...f,id:hash(key+'|'+occurrence)};}).sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line||a.code.localeCompare(b.code));
}
export function compareBaseline(findings, baseline={version:1,entries:[]}) {
  const accepted=new Set(baseline.entries.map(e=>e.id)); const present=new Set(findings.map(f=>f.id));
  return {newFindings:findings.filter(f=>hardCodes.has(f.code)||!accepted.has(f.id)),resolved:baseline.entries.filter(f=>!present.has(f.id)),remaining:baseline.entries.filter(f=>present.has(f.id))};
}
export function captureBaseline(findings, reason) {
  if(!reason?.trim())throw Error('A reviewed exception/baseline reason is required');
  if(findings.some(f=>hardCodes.has(f.code)))throw Error('Structural token/parse errors cannot be baselined');
  return {version:1,policy:'Exact source findings only; no directory exclusions. Ratchet removals before merging. Exceptions are legacy debt, not design approval.',entries:findings.map(f=>({...f,reason}))};
}
/** Keep the reviewed fingerprint list readable without copying source contexts/reasons thousands of times. */
export function serializeBaseline(baseline) {
  const reason=baseline.reason||baseline.entries[0]?.reason||'Retained exact legacy findings; not design acceptance';
  const metadata={version:baseline.version,policy:baseline.policy,reason};
  const entries=baseline.entries.map(({id,file,line,code,detail})=>({id,file,line,code,detail}));
  return '{\n'+Object.entries(metadata).map(([key,value])=>'  '+JSON.stringify(key)+': '+JSON.stringify(value)).join(',\n')+',\n  "entries": [\n'+entries.map(entry=>'    '+JSON.stringify(entry)).join(',\n')+'\n  ]\n}\n';
}
const routeFiles=['src/components/layout/AnimatedRoutes.tsx','src/components/layout/routes/adminRoutes.tsx','src/components/layout/routes/mcRoutes.tsx','src/components/layout/routes/propertyHubRoutes.tsx'];
function parse(file,text){return ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);}
function evaluate(n,env={}) {
  if(!n)return null;
  if(ts.isJsxExpression(n)||ts.isParenthesizedExpression(n)||ts.isAsExpression(n)||ts.isTypeAssertionExpression(n))return evaluate(n.expression,env);
  if(ts.isStringLiteralLike(n))return n.text;
  if(ts.isIdentifier(n))return env[n.text]??':'+n.text;
  if(ts.isPropertyAccessExpression(n))return env[n.expression.getText()]?.[n.name.text]??null;
  if(ts.isTemplateExpression(n)){let out=n.head.text;for(const s of n.templateSpans)out+=(evaluate(s.expression,env)??':dynamic')+s.literal.text;return out;}
  if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.PlusToken)return (evaluate(n.left,env)??'')+(evaluate(n.right,env)??'');
  if(ts.isArrowFunction(n))return (...args)=>evaluate(n.body,{...env,...Object.fromEntries(n.parameters.map((p,i)=>[p.name.getText(),args[i]??':'+p.name.getText()]))});
  if(ts.isCallExpression(n)){const fn=evaluate(n.expression,env);return typeof fn==='function'?fn(...n.arguments.map(a=>evaluate(a,env))):null;}
  return null;
}
export function buildRouteRegister(root) {
  const config=fs.readFileSync(path.join(root,'src/lib/config/routes.ts'),'utf8'); const configAst=parse('routes.ts',config);const constants={};
  function constantsVisit(n){if(ts.isVariableDeclaration(n)&&n.name.getText()==='APP_ROUTES'){let obj=n.initializer;while(ts.isAsExpression(obj))obj=obj.expression;for(const p of obj.properties)if(ts.isPropertyAssignment(p))constants[p.name.getText().replace(/['"]/g,'')]=evaluate(p.initializer,{APP_ROUTES:constants});}ts.forEachChild(n,constantsVisit);} constantsVisit(configAst);
  const registry=fs.readFileSync(path.join(root,'src/components/layout/pageRegistry.ts'),'utf8');
  const modules=Object.fromEntries([...registry.matchAll(/export const (\w+) = lazy\(\(\) => import\('([^']+)'\)/g)].map(m=>[m[1],m[2].replace(/^@\//,'src/')+'.tsx']));
  const qa=walk(path.join(root,'scripts/qa')).filter(p=>/\.(mjs|py|cjs)$/.test(p)).map(p=>({file:path.relative(root,p),text:fs.readFileSync(p,'utf8')}));
  const navFiles=['src/lib/navConfig.ts','src/lib/nav/goalEntries.ts','src/lib/nav/clusterCatalog.ts','src/lib/nav/navigationModel.ts'];
  const nav=navFiles.map(file=>({file,text:fs.readFileSync(path.join(root,file),'utf8')}));
  function targets(node,ast){const out=[];function scan(n){if((ts.isJsxSelfClosingElement(n)||ts.isJsxOpeningElement(n))&&n.tagName.getText(ast)==='Navigate'){const to=n.attributes.properties.find(a=>a.name?.getText(ast)==='to');out.push({expression:to?.initializer?.getText(ast)||null,resolvedTarget:evaluate(to?.initializer,{APP_ROUTES:constants}),observation:'NOTTESTED'});}ts.forEachChild(n,scan);}scan(node);return out;}
  const declarations=[];
  for(const file of routeFiles){const text=fs.readFileSync(path.join(root,file),'utf8');const ast=parse(file,text);const directImports={};
    for(const s of ast.statements)if(ts.isImportDeclaration(s)&&s.importClause?.name)directImports[s.importClause.name.text]=s.moduleSpecifier.text.replace(/^@\//,'src/');
    for(const match of text.matchAll(/const (\w+)\s*=\s*(?:React\.)?lazy\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]/g))directImports[match[1]]=match[2].replace(/^@\//,'src/')+'.tsx';
    for(const statement of ast.statements)if(ts.isImportDeclaration(statement)&&statement.importClause?.namedBindings&&ts.isNamedImports(statement.importClause.namedBindings))for(const item of statement.importClause.namedBindings.elements)directImports[item.name.text]=statement.moduleSpecifier.text.replace(/^@\//,'src/');
    const helperBodies=new Map();
    function helpers(n){if(ts.isVariableDeclaration(n)&&n.initializer&&(ts.isArrowFunction(n.initializer)||ts.isFunctionExpression(n.initializer)))helperBodies.set(n.name.getText(),n.initializer.getText(ast));ts.forEachChild(n,helpers);}helpers(ast);
    function visit(n,parentPath='',ancestorElements=[]) {
      let nextPath=parentPath,nextElements=ancestorElements;
      if((ts.isJsxSelfClosingElement(n)||ts.isJsxElement(n))&&(ts.isJsxElement(n)?n.openingElement:n).tagName.getText(ast)==='Route') {
        const tag=ts.isJsxElement(n)?n.openingElement:n;const attrs=tag.attributes.properties;const attr=name=>attrs.find(a=>a.name?.getText(ast)===name);
        const p=attr('path');const index=Boolean(attr('index'));const element=attr('element')?.initializer?.getText(ast)||'';const expr=p?.initializer;
        let resolved=evaluate(expr,{APP_ROUTES:constants,g:':goal'});if(typeof resolved!=='string')resolved=null;
        const filePrefix=file.endsWith('/mcRoutes.tsx')?'/mc':file.endsWith('/propertyHubRoutes.tsx')?'/property':'';
        nextPath=resolved?.startsWith('/')?resolved:resolved!=null?[parentPath||filePrefix,resolved].join('/').replace(/\/+/g,'/'):index?(parentPath||filePrefix):parentPath;
        nextElements=[...ancestorElements,element];
        const templateSymbols=[...element.matchAll(/<((?:Pages\.)?\w+)/g)].map(m=>m[1]).filter(s=>!['LazyPage','PageTransition','Suspense','AuthGuard','AdminGuard','InvestorGuard','MCGuard','MCPortalGuard','TeamGuard','ActiveCompanyProvider','ErrorBoundary','Navigate'].includes(s));
        const templates=templateSymbols.map(s=>({symbol:s,module:s.startsWith('Pages.')?modules[s.slice(6)]||null:directImports[s]||null}));
        const customRedirect=templateSymbols.some(s=>/Redirect$|Alias$/.test(s));const conditional=templateSymbols.some(s=>['HomeRouter','PropertyHubIndex','ManageHubGate','TransportIdRedirect'].includes(s));
        const kind=element.includes('<Navigate')?'redirect':conditional?'conditional-entry':customRedirect?'redirect-adapter':!p&&!index?'layout':templates.length?'rendered-template':'unresolved';
        const helpersUsed=templateSymbols.filter(s=>helperBodies.has(s)).map(s=>({symbol:s,source:helperBodies.get(s)}));
        const redirectTargets=targets(attr('element')||tag,ast);
        for(const helper of helpersUsed){const helperAst=parse('helper.tsx','const helper = '+helper.source);redirectTargets.push(...targets(helperAst,helperAst));}
        let mappedPathVariants=[];
        for(let parent=n.parent;parent;parent=parent.parent)if(ts.isCallExpression(parent)&&ts.isPropertyAccessExpression(parent.expression)&&parent.expression.name.text==='map'&&ts.isArrayLiteralExpression(parent.expression.expression))mappedPathVariants=parent.expression.expression.elements.map(e=>evaluate(e)).filter(v=>typeof v==='string').map(value=>(nextPath||'').replace(':goal',value));
        const conditionalTemplates=helpersUsed.flatMap(h=>[...h.source.matchAll(/<((?:Pages\.)?\w+)/g)].map(m=>m[1])).filter(s=>!['Navigate','LoadingState','Suspense','PageTransition','LazyPage'].includes(s)).map(symbol=>({symbol,module:symbol.startsWith('Pages.')?modules[symbol.slice(6)]||null:directImports[symbol]||null}));
        const route=nextPath||null;
        const actor=route?.startsWith('/admin')?'admin':route?.startsWith('/mc')?'MC/operator':route?.startsWith('/my-property')?'read-only-owner':route?.startsWith('/vendor')?'vendor':route?.startsWith('/team')?'team':route?.startsWith('/capital')?'investor/capital':route?.startsWith('/developer-portal')?'developer':/^\/(me|profile|wallet|bookings|messages|support|guest|my-stay)(\/|$)/.test(route||'')?'account/guest':'public-or-page-gated';
        const fixtureReferences=qa.filter(q=>templates.some(t=>t.module&&q.text.includes(t.module.replace(/^src\//,'')))).map(q=>({file:q.file,claim:'source reference only; inspect adapters and actual shell before reuse',observation:'NOTTESTED'}));
        const navReferences=nav.flatMap(v=>{const out=[];for(const [i,line]of v.text.split('\n').entries())if((p&&line.includes(expr.getText(ast)))||(route&&line.includes("'"+route+"'")))out.push({file:v.file,line:i+1});return out;});
        declarations.push({id:hash(file+'|'+n.getStart(ast)).slice(0,16),source:{file,line:ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1},pathExpression:expr?.getText(ast)||null,resolvedPathPattern:route,index,kind,actor,templates,element,ancestorElements,helperEvidence:helpersUsed,redirectTargets,mappedPathVariants,conditionalTemplates,navReferences,fixtureReferences,coverage:{observation:'NOTTESTED',states:['default','loading','empty','error','overlay','access-denied'].map(state=>({state,observation:'NOTTESTED',applicability:state==='default'?'source element only':'NOTASSESSED'})),note:'Static source inventory, not mounted-route, authorization, visual or live proof'}});
      }
      ts.forEachChild(n,child=>visit(child,nextPath,nextElements));
    } visit(ast);
  }
  return {schemaVersion:1,status:'SOURCE_ONLY_NOTTESTED',countMeaning:'Route JSX declarations; NOT screen count. Redirects, pathless parents, reused templates, mapped and conditional branches remain distinct source records.',sourceFiles:[...routeFiles,'src/components/layout/pageRegistry.ts','src/lib/config/routes.ts',...navFiles].map(file=>({file,sha256:hash(fs.readFileSync(path.join(root,file)))})),summary:{declarations:declarations.length,directRedirects:declarations.filter(r=>r.kind==='redirect').length,kindCounts:Object.fromEntries([...new Set(declarations.map(r=>r.kind))].map(k=>[k,declarations.filter(r=>r.kind===k).length]))},coverageKey:['actor','resolvedPathPattern','templates','coverage.states'],limitations:['No runtime routes or guards executed','No screenshot or typography evidence','PageRegistry imports can be reused; not unique screen count','Dynamic paths use explicit symbolic placeholders; inspect map expansion and conditional helperEvidence','Fixture references are reuse candidates only, not proof of page or shell coverage'],declarations};
}
export function normalizeRegister(register) {
  const catalogs={templates:{},elements:{},layouts:{},helpers:{},navigation:{},fixtures:{}};
  const intern=(catalog,value)=>{const id=hash(JSON.stringify(value)).slice(0,16);catalogs[catalog][id]=value;return id;};
  const routes=register.declarations.map(r=>({id:r.id,source:r.source,pathExpression:r.pathExpression,path:r.resolvedPathPattern,index:r.index,actor:r.actor,kind:r.kind,
    templateRefs:r.templates.map(v=>intern('templates',v)),conditionalTemplateRefs:r.conditionalTemplates.map(v=>intern('templates',v)),
    elementRef:intern('elements',r.element),layoutRefs:r.ancestorElements.map(v=>intern('layouts',v)),helperRefs:r.helperEvidence.map(v=>intern('helpers',v)),
    redirectTargets:r.redirectTargets,mappedPathVariants:r.mappedPathVariants,navigationRefs:r.navReferences.map(v=>intern('navigation',v)),fixtureRefs:r.fixtureReferences.map(v=>intern('fixtures',v))}));
  const {declarations,...metadata}=register;
  return {...metadata,normalization:'Shared catalogs; all routes inherit coverageDefaults. References are source evidence, never executed coverage.',coverageKey:['actor','path','templateRefs','coverageDefaults.states'],coverageDefaults:register.declarations[0]?.coverage||{observation:'NOTTESTED'},catalogs,routes};
}
export function serializeRegister(register) {
  const {catalogs,routes,...metadata}=register;
  const fields=Object.entries(metadata).map(([k,v])=>'  '+JSON.stringify(k)+': '+JSON.stringify(v));
  const collections=Object.entries(catalogs).map(([name,values])=>'    '+JSON.stringify(name)+': {\n'+Object.entries(values).map(([id,value])=>'      '+JSON.stringify(id)+': '+JSON.stringify(value)).join(',\n')+'\n    }');
  return '{\n'+fields.join(',\n')+',\n  "catalogs": {\n'+collections.join(',\n')+'\n  },\n  "routes": [\n'+routes.map(r=>'    '+JSON.stringify(r)).join(',\n')+'\n  ]\n}\n';
}
export async function main(argv=process.argv.slice(2),root=process.cwd()) {
  const value=name=>{const i=argv.indexOf(name);return i<0?null:argv[i+1];};
  if(value('--write-register')||value('--verbose-register')){const register=buildRouteRegister(root);for(const [flag,contents]of [['--write-register',serializeRegister(normalizeRegister(register))],['--verbose-register',JSON.stringify(register,null,2)+'\n']])if(value(flag)){const target=path.resolve(root,value(flag));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,contents);}return 0;}
  const findings=auditSources(sourceFiles(root).map(p=>({file:path.relative(root,p).replaceAll('\\','/'),text:fs.readFileSync(p,'utf8')})));
  const capture=value('--capture-baseline');
  if(capture){const target=path.resolve(root,capture);if(fs.existsSync(target))throw Error('Refusing to replace a baseline. Use --ratchet-baseline for removals only.');const baseline=captureBaseline(findings,value('--reason'));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,serializeBaseline(baseline));return 0;}
  const defaultBaseline='docs/design-system/audit-baseline.json';
  const baselineFile=value('--baseline')||value('--ratchet-baseline')||(fs.existsSync(path.join(root,defaultBaseline))?defaultBaseline:null);const baseline=baselineFile?JSON.parse(fs.readFileSync(path.resolve(root,baselineFile),'utf8')):{version:1,entries:[]};
  const result=compareBaseline(findings,baseline);
  if(value('--ratchet-baseline')){if(result.newFindings.length)throw Error('Cannot ratchet: new or structural violations remain');fs.writeFileSync(path.resolve(root,baselineFile),serializeBaseline({...baseline,entries:result.remaining}));}
  if(argv.includes('--json'))console.log(JSON.stringify({findings:findings.length,newFindings:result.newFindings,resolved:result.resolved.length},null,2));
  else {console.log(`Design audit: ${findings.length} findings; ${result.newFindings.length} new/structural; ${result.resolved.length} resolved baseline entries.`);for(const f of result.newFindings)console.log(`${f.file}:${f.line} [${f.code}] ${f.detail} (${f.context})`);}
  return result.newFindings.length?1:0;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().then(code=>{process.exitCode=code;}).catch(e=>{console.error(e.message);process.exitCode=1;});
