import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const css = readFileSync(`${process.cwd()}/src/styles/cinematic-home.css`, 'utf8');
describe('shared guest field width', () => {
  it('uses available input width rather than a clipped fixed value slot', () => {
    expect(css).toContain('.home-search-guests input{width:100%;min-width:0}');
    expect(css).not.toContain('.home-search-guests input{width:50px}');
    expect(css).toContain('.home-search .home-search-guests>svg{flex-shrink:0}');
  });
  it('reserves a readable guest track in both desktop search variants', () => {
    expect(css.match(/minmax\(120px,\.7fr\) auto/g)).toHaveLength(3);
  });
});
