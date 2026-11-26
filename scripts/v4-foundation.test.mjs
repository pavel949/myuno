import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import loadConfig from 'tailwindcss/loadConfig.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const tokens = postcss.parse(read('src/styles/tokens.css'));
const declarations = (selector) => {
  const values = new Map();
  tokens.walkRules(selector, (rule) => {
    if (rule.parent.type === 'root') rule.walkDecls((decl) => values.set(decl.prop, decl.value));
  });
  return values;
};
const light = declarations(':root');
const dark = new Map([...light, ...declarations('.dark')]);
function resolved(palette, name) {
  const value = palette.get(name);
  assert.ok(value, name);
  return value.replace(/var\((--[\w-]+)\)/g, (_, dep) => resolved(palette, dep))
    .replace(/calc\((\d+)\s*([+-])\s*(\d+)\)/g, (_, a, sign, b) => +a + (sign === '+' ? +b : -b));
}
function luminance(value) {
  const [h, saturation, lightness] = value.trim().split(/\s+/).map(parseFloat);
  assert.ok(Number.isFinite(h + saturation + lightness), value);
  const l = lightness / 100;
  const a = saturation / 100 * Math.min(l, 1 - l);
  const component = (n) => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * component(0) + 0.7152 * component(8) + 0.0722 * component(4);
}
for (const [theme, palette] of [['light', light], ['dark', dark]]) {
  test(theme + ': foreground, buttons, focus and input boundaries keep contrast', () => {
    for (const [fg, bg, minimum] of [
      ['foreground', 'background', 4.5], ['muted-foreground', 'muted', 4.5],
      ['primary-foreground', 'primary', 4.5], ['accent-foreground', 'accent', 4.5],
      ['destructive-foreground', 'destructive', 4.5], ['ring', 'background', 3],
      ['ring', 'card', 3], ['input', 'background', 3], ['input', 'card', 3],
    ]) {
      const luminances = [fg, bg].map((name) => luminance(resolved(palette, '--' + name)));
      const ratio = (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05);
      assert.ok(ratio >= minimum, fg + ' on ' + bg + ': ' + ratio.toFixed(2));
    }
  });
}
test('v4 Tailwind radii compile from canonical tokens without a legacy global clamp', async () => {
  const config = loadConfig(fileURLToPath(new URL('../tailwind.config.ts', import.meta.url)));
  const expected = [
    ['rounded-none', 'border-radius', '0px'], ['rounded-sm', 'border-radius', '4px'],
    ['rounded-md', 'border-radius', '8px'], ['rounded-lg', 'border-radius', '12px'],
    ['rounded-xl', 'border-radius', '12px'], ['rounded-full', 'border-radius', '9999px'],
    ['rounded-s-sm', 'border-start-start-radius', '4px'],
    ['rounded-e-sm', 'border-end-end-radius', '4px'],
  ];
  const html = '<div class="' + expected.map(([name]) => name).join(' ') + '"></div>';
  const { root } = await postcss([tailwindcss({
    ...config, content: [{ raw: html, extension: 'html' }],
  })]).process('@tailwind utilities;', { from: undefined });
  const overrides = postcss.parse(read('src/styles/canon-overrides.css'));
  assert.match(read('src/index.css'), /@import ['"]\.\/styles\/canon-overrides\.css/);
  for (const [utility, property, value] of expected) {
    let declaration;
    root.walkRules('.' + utility, (rule) => rule.walkDecls(property, (decl) => {
      declaration = decl;
    }));
    assert.equal(resolved(new Map([...light, ['--value', declaration?.value]]), '--value'), value);
    overrides.walkRules((rule) => {
      if (rule.selectors.includes('.' + utility)) rule.walkDecls(/^border-.*radius$/, (decl) => {
        assert.ok(!decl.important, rule.selector + ' overrides canonical radius');
      });
    });
  }
});
