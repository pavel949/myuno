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
it.each([320, 360, 390, 430, 768])('keeps one mobile row at %ipx with secondary controls in menus', width => {
 const css = postcss.parse(readFileSync('src/styles/consumer-system.css', 'utf8'));
 const declarations = new Map<string, string>();
 css.walkRules(rule => {
  const parent = rule.parent;
  if (parent?.type === 'atrule' && ('name' in parent && parent.name === 'media')) {
   const media = parent as import('postcss').AtRule;
   const max = media.params.match(/max-width:\s*(\d+)px/);
   if (!max || width > Number(max[1])) return;
  }
  rule.walkDecls(declaration => { declarations.set(`${rule.selector}:${declaration.prop}`, declaration.value); });
 });
 expect(declarations.get('.consumer-header-inner:display')).toBe('flex');
 // Flex's default nowrap is retained when no override exists.
 expect(declarations.get('.consumer-utilities:flex-wrap') ?? 'nowrap').toBe('nowrap');
 expect(declarations.get('.consumer-menu:position')).toBe('static');
 expect(declarations.get('.consumer-secondary-utilities:display')).toBe('none');
 expect(declarations.get('.consumer-account-navigation:display')).toBe('block');
 expect(declarations.get('.consumer-header .consumer-account-trigger:min-width')).toBe('44px');
 expect(declarations.has('.consumer-utilities:grid-row')).toBe(false);
});
