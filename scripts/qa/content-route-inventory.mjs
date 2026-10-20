import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const routeConfig = ts.transpileModule(fs.readFileSync(path.join(root, 'src/lib/config/routes.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(routeConfig, context);
const routes = context.exports.APP_ROUTES;

/** Authored route declarations, including imported nested route fragments. No app execution. */
export function mountedRoutes() {
  const files = ['src/components/layout/AnimatedRoutes.tsx', ...fs.readdirSync(path.join(root, 'src/components/layout/routes')).filter(name => name.endsWith('.tsx')).map(name => `src/components/layout/routes/${name}`)];
  const parsed = files.map(file => ({ file, ast: ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX) }));
  const fragments = new Map();
  for (const source of parsed.slice(1)) source.ast.forEachChild(statement => {
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (declaration.initializer) fragments.set(declaration.name.getText(source.ast), { ...source, node: declaration.initializer });
  });
  const result = [];
  const value = node => {
    if (ts.isStringLiteral(node)) return node.text;
    if (ts.isPropertyAccessExpression(node) && node.expression.getText() === 'APP_ROUTES') return routes[node.name.text];
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.expression.getText() === 'APP_ROUTES') return routes[node.expression.name.text](...node.arguments.map(argument => ts.isStringLiteral(argument) ? argument.text : ':id'));
    return undefined;
  };
  const walk = (node, parent, source, ancestors = []) => {
    if (ts.isJsxExpression(node) && node.expression && ts.isIdentifier(node.expression) && fragments.has(node.expression.text)) {
      const fragment = fragments.get(node.expression.text); walk(fragment.node, parent, fragment, ancestors); return;
    }
    if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && (ts.isJsxElement(node) ? node.openingElement : node).tagName.getText() === 'Route') {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const attributes = opening.attributes.properties.filter(ts.isJsxAttribute);
      const pathAttribute = attributes.find(attribute => attribute.name.getText() === 'path');
      const initializer = pathAttribute?.initializer;
      const routePath = initializer ? value(ts.isJsxExpression(initializer) ? initializer.expression : initializer) : undefined;
      const fullPath = routePath ? (routePath.startsWith('/') ? routePath : `${parent}/${routePath}`.replace(/\/+/g, '/')) : parent;
      const element = attributes.find(attribute => attribute.name.getText() === 'element')?.initializer?.getText(source.ast) ?? '';
      result.push({ path: fullPath || '/', index: attributes.some(attribute => attribute.name.getText() === 'index'), file: source.file, line: source.ast.getLineAndCharacterOfPosition(node.getStart(source.ast)).line + 1, element, ancestors });
      if (ts.isJsxElement(node)) node.children.forEach(child => walk(child, fullPath, source, [...ancestors, element]));
      return;
    }
    ts.forEachChild(node, child => walk(child, parent, source, ancestors));
  };
  walk(parsed[0].ast, '', parsed[0]);
  return result;
}

export function contentLinks() {
  const files = [];
  const visit = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== '__tests__') visit(file);
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(file);
  });
  visit(path.join(root, 'src/content/landings'));
  return files.flatMap(file => {
    const source = fs.readFileSync(file, 'utf8');
    return [...source.matchAll(/\bhref:\s*(['"])(\/[^'"]*)\1/g)].map(match => ({ href: match[2], file: path.relative(root, file).replaceAll('\\', '/'), line: source.slice(0, match.index).split('\n').length }));
  });
}

export function auditContentRoutes() {
  const declared = mountedRoutes().filter(route => !route.index && !route.path.includes('*'));
  return contentLinks().map(link => {
    const pathname = link.href.split(/[?#]/)[0];
    const matches = declared.filter(route => new RegExp(`^${route.path.split('/').map(segment => segment.startsWith(':') ? '[^/]+' : segment === '*' ? '.*' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/')}/?$`).test(pathname));
    const exact = matches.find(route => route.path === pathname);
    return { ...link, status: exact ? 'static' : matches.length ? 'entity-verification-required' : 'unmatched', route: exact?.path ?? matches[0]?.path ?? null };
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const inventory = auditContentRoutes();
  const output = process.argv[2];
  if (output) fs.writeFileSync(output, JSON.stringify(inventory, null, 2) + '\n');
  console.log(JSON.stringify({ occurrences: inventory.length, unmatched: inventory.filter(item => item.status === 'unmatched').length, unmatchedHrefs: [...new Set(inventory.filter(item => item.status === 'unmatched').map(item => item.href))], entityVerification: inventory.filter(item => item.status === 'entity-verification-required').length }, null, 2));
}
