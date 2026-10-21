import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');
const consumerCss = readFileSync(resolve(__dirname, '../../styles/consumer-system.css'), 'utf8');

// Source contract only: actual sticky geometry needs browser scroll verification.
function rule(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...css.matchAll(new RegExp(`^${escaped} \\{([^}]+)\\}`, 'gm'))];
  expect(matches).toHaveLength(1);
  return matches[0][1];
}

describe('document scrolling and consumer sticky header', () => {
  it.each(['body', '#root'])('%s clips horizontal overflow without becoming a scroll container', (selector) => {
    const declarations = rule(selector).replace(/\/\*[\s\S]*?\*\//g, '');
    expect(declarations).toMatch(/overflow-x:\s*clip;/);
    expect(declarations).not.toMatch(/overflow(?:-y)?:/);
    expect(declarations).toMatch(/max-width:\s*100vw;/);
  });

  it('retains viewport horizontal containment and root layout', () => {
    expect(rule('html')).toMatch(/overflow-x:\s*hidden;/);
    expect(rule('html')).toMatch(/overscroll-behavior-x:\s*none;/);
    expect(rule('#root')).toMatch(/min-height:\s*100vh;/);
    expect(rule('#root')).toMatch(/display:\s*flex;/);
    expect(rule('#root')).toMatch(/flex-direction:\s*column;/);
  });

  it('keeps standard header sticky and home overlay relative', () => {
    expect(consumerCss).toMatch(/\.consumer-header\{[^}]*position:sticky;top:0;/);
    expect(consumerCss).toMatch(/\.consumer-header-overlay\{position:relative;/);
  });
});
