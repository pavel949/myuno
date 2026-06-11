/**
 * Guard test: registry SSOT files must not contain emoji icons.
 *
 * Per design bible §730 (docs/canonical/05-visual-design-system.md):
 * "Lucide React — единственная разрешённая библиотека иконок. Никаких
 * emoji-иконок в UI." All icon fields in registries are stored as
 * Lucide kebab-case names (e.g. 'home', 'plane-landing') and rendered
 * via <AppIcon /> or <DynamicIcon />.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Extended pictographic ranges covering common emoji + variation selectors.
const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}]/u;

const FILES = [
  'src/lib/appRegistry.ts',
  'src/lib/verticals.ts',
  'src/lib/verticalGroups.ts',
  'src/lib/icons/appIconRegistry.ts',
];

describe('no emoji in icon registries', () => {
  for (const rel of FILES) {
    it(`${rel} contains no emoji characters`, () => {
      const src = readFileSync(resolve(process.cwd(), rel), 'utf8');
      const offending: string[] = [];
      src.split('\n').forEach((line, i) => {
        if (EMOJI_RE.test(line)) offending.push(`${i + 1}: ${line.trim()}`);
      });
      expect(
        offending,
        `Found emoji in ${rel}:\n${offending.join('\n')}`,
      ).toEqual([]);
    });
  }
});
