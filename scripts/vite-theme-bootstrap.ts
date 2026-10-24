import { readFileSync } from 'node:fs';
import path from 'node:path';
import postcss, { type ChildNode } from 'postcss';
import type { Plugin } from 'vite';

const marker = '<!-- MYUNO_BOOTSTRAP_TOKENS -->';
const fontMarker = '__MYUNO_FONT_STYLESHEET_URL__';
const required = ['--background', '--foreground', '--primary', '--font-body'];

/** Copy canonical declarations and their var() dependencies, never theme values. */
export function generateThemeBootstrap(source: string) {
  const root = postcss.parse(source);
  const needed = new Set(required);
  for (const prop of required) {
    let found = false;
    root.walkDecls(prop, () => { found = true; });
    if (!found) throw new Error(`Missing canonical bootstrap token: ${prop}`);
  }
  let changed = true;
  while (changed) {
    changed = false;
    root.walkDecls(decl => {
      if (!needed.has(decl.prop)) return;
      for (const match of decl.value.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!needed.has(match[1])) { needed.add(match[1]); changed = true; }
      }
    });
  }
  for (const prop of needed) {
    let found = false;
    root.walkDecls(prop, () => { found = true; });
    if (!found) throw new Error(`Missing canonical bootstrap dependency: ${prop}`);
  }
  const copy = (node: ChildNode): ChildNode | null => {
    if (node.type === 'decl') return needed.has(node.prop) || node.prop === 'color-scheme' ? node.clone() : null;
    if (node.type !== 'rule' && node.type !== 'atrule') return null;
    if (!node.nodes) return null;
    const children = node.nodes.map(copy).filter((child): child is ChildNode => child !== null);
    return children.length ? (node.clone({ nodes: children }) as ChildNode) : null;
  };
  const generated = postcss.root({ nodes: root.nodes.map(copy).filter((node): node is ChildNode => node !== null) });
  let fontValue = '';
  root.walkRules(':root', rule => { rule.walkDecls('--font-stylesheet-url', decl => { fontValue = decl.value; }); });
  const match = /^(["'])(https:\/\/fonts\.googleapis\.com\/css2\?[^"'<>\s]+)\1$/.exec(fontValue);
  if (!match) throw new Error('Canonical --font-stylesheet-url must contain the existing HTTPS Google Fonts CSS URL');
  const css = generated.toString();
  if (/<\/style/i.test(css)) throw new Error('Unsafe canonical bootstrap CSS');
  return { css, fontHref: match[2] };
}

export function transformThemeBootstrap(html: string, source: string) {
  if (html.split(marker).length !== 2 || html.split(fontMarker).length !== 4) throw new Error('Missing or duplicate theme bootstrap markers');
  const { css, fontHref } = generateThemeBootstrap(source);
  return html.replace(marker, `<style id="myuno-theme-bootstrap">${css}</style>`)
    .split(fontMarker).join(fontHref.replace(/&/g, '&amp;'));
}

export function themeBootstrapPlugin(): Plugin {
  let file = path.resolve('src/styles/tokens.css');
  return {
    name: 'myuno-canonical-theme-bootstrap',
    configResolved(config) { file = path.resolve(config.root, 'src/styles/tokens.css'); },
    buildStart() { this.addWatchFile(file); },
    transformIndexHtml: { order: 'pre', handler: html => transformThemeBootstrap(html, readFileSync(file, 'utf8')) },
    handleHotUpdate(context) {
      if (context.file === file) context.server.ws.send({ type: 'full-reload' });
    },
  };
}
