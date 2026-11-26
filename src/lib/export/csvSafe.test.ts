import { describe, it, expect } from 'vitest';
import { csvCell, neutralizeCsvCell } from './csvSafe';

describe('csvSafe', () => {
  it('prefixes formula-leading values', () => {
    expect(neutralizeCsvCell('=HYPERLINK("x")')).toBe(`'=HYPERLINK("x")`);
    expect(neutralizeCsvCell('+1')).toBe("'+1");
    expect(neutralizeCsvCell('@SUM')).toBe("'@SUM");
  });
  it('quotes delimiters after neutralizing', () => {
    expect(csvCell('=a,b')).toBe(`"'=a,b"`);
    expect(csvCell('Ivan')).toBe('Ivan');
    expect(csvCell(null)).toBe('');
  });
});
