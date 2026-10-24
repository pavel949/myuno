import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import postcss from 'postcss';
import { generateThemeBootstrap, transformThemeBootstrap, themeBootstrapPlugin } from '../../../scripts/vite-theme-bootstrap';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
describe('canonical first-paint bootstrap', () => {
  it('copies the actual light, dark and locale tokens with their complete var dependency closure', () => {
    const { css, fontHref } = generateThemeBootstrap(tokens);
    const ast = postcss.parse(css);
    for (const prop of ['--background', '--foreground', '--primary', '--font-body']) {
      expect(css).toContain(`${prop}:`);
    }
    expect(css).toContain('.dark');
    expect(css).toContain("html[lang='ru']");
    ast.walkDecls(decl => {
      for (const match of decl.value.matchAll(/var\(\s*(--[\w-]+)/g)) {
        let found = false; ast.walkDecls(match[1], () => { found = true; });
        expect(found, match[1]).toBe(true);
      }
    });
    expect(fontHref).toContain('https://fonts.googleapis.com/css2?family=Geist');
    expect(css).not.toContain('--cat-emergency');
  });
  it('a single canonical brand/font edit changes bootstrap without another theme object', () => {
    const changed = tokens.replace(/(--brand-hue:\s*)[^;]+/, '$1189')
      .replace(/(--font-family-body:\s*)[^;]+/, "$1'Synthetic Body', system-ui");
    const original = generateThemeBootstrap(tokens).css;
    const generated = generateThemeBootstrap(changed).css;
    expect(generated).not.toEqual(original);
    expect(generated).toContain('189');
    expect(generated).toContain("'Synthetic Body'");
  });
  it('transforms actual HTML while preserving CSP, recovery scripts and loading semantics', () => {
    const output = transformThemeBootstrap(html, tokens);
    const scripts = (source: string) => source.match(/<script\b[^>]*>[\s\S]*?<\/script>/g);
    expect(scripts(output)).toEqual(scripts(html));
    expect(output.match(/<meta http-equiv="Content-Security-Policy"[^>]+>/g)).toEqual(html.match(/<meta http-equiv="Content-Security-Policy"[^>]+>/g));
    expect(output).toContain('data-myuno-bootstrap-splash role="status" aria-label="Loading myUNO"');
    expect(output).toContain('id="myuno-theme-bootstrap"');
    expect(output).not.toContain('__MYUNO_FONT_STYLESHEET_URL__');
    expect(output).toContain('font-family:var(--font-body)');
    expect(output).toContain('stroke:hsl(var(--primary))');
    expect(output).toContain('prefers-reduced-motion');
    expect((output.match(/fonts\.googleapis\.com\/css2\?/g) ?? []).length).toBe(3);
  });
  it('fails closed for missing tokens/dependencies, invalid font metadata and malformed markers', () => {
    expect(() => generateThemeBootstrap(':root{--background:0;--foreground:0;--primary:0}')).toThrow('Missing canonical bootstrap token');
    expect(() => generateThemeBootstrap(tokens.replace(/(--font-body:\s*)[^;]+/, '$1var(--undefined-font)'))).toThrow('Missing canonical bootstrap dependency');
    expect(() => generateThemeBootstrap(tokens.replace('https://fonts.googleapis.com/css2?', 'https://untrusted.invalid/css2?'))).toThrow('Canonical --font-stylesheet-url');
    expect(() => transformThemeBootstrap('<html></html>', tokens)).toThrow('markers');
    expect(themeBootstrapPlugin().name).toBe('myuno-canonical-theme-bootstrap');
  });
});
