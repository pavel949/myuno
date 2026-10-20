import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import postcss from 'postcss';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';

const locale = vi.hoisted(() => ({ language: 'en', setLanguage: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
afterEach(cleanup);

it.each(['ru', 'en', 'th'])('keeps the %s language abbreviation unbroken at every switcher size', language => {
 locale.language = language;
 for (const size of ['sm', 'md', 'lg'] as const) {
  const view = render(<LanguageSwitcher size={size} />);
  const trigger = screen.getByTestId('language-switch');
  expect(trigger).toHaveAccessibleName(language.toUpperCase());
  expect(trigger).toHaveClass('shrink-0', 'min-w-[44px]', 'whitespace-nowrap');
  expect(trigger.querySelector('span')).toHaveClass('shrink-0', 'whitespace-nowrap');
  expect(trigger.querySelector('svg')).toHaveClass('shrink-0');
  view.unmount();
 }
});

// Source contracts only: JSDOM does not measure rendered widths. Production
// pixel acceptance remains a separate browser check with the actual fonts.
it.each([320, 360, 390])('applies utility wrapping at a %ipx viewport without hiding controls', width => {
 const css = postcss.parse(readFileSync('src/styles/consumer-system.css', 'utf8'));
 const declarations = new Map<string, string>();
 css.walkAtRules('media', media => {
  if (media.params !== '(max-width:639px)' || width > 639) return;
  media.walkRules(rule => {
   rule.walkDecls(declaration => {
    declarations.set(`${rule.selector}:${declaration.prop}`, declaration.value);
   });
  });
 });
 expect(declarations.get('.consumer-header-inner:flex-wrap')).toBe('wrap');
 expect(declarations.get('.consumer-utilities:flex-shrink')).toBe('0');
 expect(declarations.get('.consumer-utilities:flex-wrap')).toBe('wrap');
 expect(declarations.get('.consumer-utilities:max-width')).toBe('100%');
 expect([...declarations.keys()].some(key => /:(display|visibility|font-size)$/.test(key))).toBe(false);
});
