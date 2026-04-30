/**
 * Regression — mobile layout must not introduce horizontal overflow.
 *
 * Background: in April 2026 `CompactFooter` shipped a static `grid-cols-6`
 * which pushed the page width past 390px on phones, forcing in-app browsers
 * (YouTube, Instagram) to fall back to a desktop-style render. We fixed it
 * to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`. This test locks two
 * invariants in source so the regression cannot return:
 *
 *   1. Footer grids start at `grid-cols-1` or `grid-cols-2` and only widen
 *      at sm/md/lg breakpoints.
 *   2. Wide elements (tables, scrollers) wider than ~480px MUST sit inside
 *      a parent with `overflow-x-auto` so they scroll, not push the page.
 *
 * The tests are static-source checks (no DOM render) — fast, deterministic,
 * and they catch the class of bug that bit us without needing Playwright.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PROJECT_ROOT = resolve(__dirname, '../../..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('mobile layout regression', () => {
  it('CompactFooter top grid starts at grid-cols-1 or grid-cols-2', () => {
    const src = readFileSync(
      resolve(PROJECT_ROOT, 'src/components/layout/CompactFooter.tsx'),
      'utf-8',
    );
    // Find the main grid line; assert mobile-first column count is sane.
    const gridMatches = src.match(/className="[^"]*\bgrid-cols-\d+[^"]*"/g) ?? [];
    expect(gridMatches.length).toBeGreaterThan(0);

    for (const cls of gridMatches) {
      // Extract base (mobile, no breakpoint prefix) grid-cols-N
      const base = cls.match(/(?<![\w:])grid-cols-(\d+)/);
      if (!base) continue;
      const n = Number(base[1]);
      expect(
        n,
        `CompactFooter mobile grid uses grid-cols-${n} — must be 1 or 2 ` +
          `to fit a 360-390px viewport. Use sm:/md:/lg: prefixes for wider screens.`,
      ).toBeLessThanOrEqual(2);
    }
  });

  it('wide elements (min-w-[Xpx] where X > 480) sit inside an overflow-x-auto wrapper', () => {
    const SRC_ROOTS = ['src/components', 'src/pages'].map((p) =>
      resolve(PROJECT_ROOT, p),
    );
    const offenders: string[] = [];

    for (const root of SRC_ROOTS) {
      for (const file of walk(root)) {
        const src = readFileSync(file, 'utf-8');
        // Match min-w-[Npx] with N > 480
        const matches = src.matchAll(/min-w-\[(\d{3,4})px\]/g);
        for (const m of matches) {
          const px = Number(m[1]);
          if (px <= 480) continue;
          // Look back ~600 chars for an overflow-x-auto / overflow-auto wrapper.
          const start = Math.max(0, m.index! - 600);
          const window_ = src.slice(start, m.index!);
          if (!/overflow-x-auto|overflow-auto|overflow-x-scroll/.test(window_)) {
            offenders.push(`${file.replace(PROJECT_ROOT + '/', '')}: min-w-[${px}px] without overflow wrapper`);
          }
        }
      }
    }

    expect(
      offenders,
      `Found ${offenders.length} wide element(s) that will push mobile pages ` +
        `into desktop layout:\n  - ${offenders.join('\n  - ')}`,
    ).toEqual([]);
  });

  it('inline style={{ minWidth: "Xpx" }} (X > 480) sits inside an overflow-x-auto wrapper', () => {
    const SRC_ROOTS = ['src/components', 'src/pages'].map((p) =>
      resolve(PROJECT_ROOT, p),
    );
    const offenders: string[] = [];

    for (const root of SRC_ROOTS) {
      for (const file of walk(root)) {
        const src = readFileSync(file, 'utf-8');
        // minWidth: '600px' | "600px" | 600
        const matches = src.matchAll(
          /minWidth:\s*['"]?(\d{3,4})(?:px)?['"]?/g,
        );
        for (const m of matches) {
          const px = Number(m[1]);
          if (px <= 480) continue;
          const start = Math.max(0, m.index! - 800);
          const window_ = src.slice(start, m.index!);
          if (!/overflow-x-auto|overflow-auto|overflow-x-scroll|overflow:\s*['"]?(auto|scroll)/.test(window_)) {
            offenders.push(
              `${file.replace(PROJECT_ROOT + '/', '')}: inline minWidth:${px}px without overflow wrapper`,
            );
          }
        }
      }
    }

    expect(
      offenders,
      `Inline minWidth styles wider than the smallest mobile viewport (480px) ` +
        `must sit inside an overflow-x-auto container:\n  - ${offenders.join('\n  - ')}`,
    ).toEqual([]);
  });

  it('map pages do not lock a fixed width that exceeds the mobile viewport', () => {
    // Map containers must use w-full / flex-1 — never w-[Npx] or min-w-[Npx]
    // on the outermost map wrapper, otherwise the page renders in desktop mode
    // inside in-app browsers.
    const SRC_ROOTS = ['src/components', 'src/pages'].map((p) =>
      resolve(PROJECT_ROOT, p),
    );
    const offenders: string[] = [];

    for (const root of SRC_ROOTS) {
      for (const file of walk(root)) {
        // Only inspect files whose name suggests a map surface
        if (!/Map|map/.test(file.split('/').pop() ?? '')) continue;
        const src = readFileSync(file, 'utf-8');
        // Find any width-locking class on a map wrapper > 480px
        const matches = src.matchAll(/\bw-\[(\d{3,4})px\]/g);
        for (const m of matches) {
          const px = Number(m[1]);
          if (px <= 480) continue;
          offenders.push(
            `${file.replace(PROJECT_ROOT + '/', '')}: w-[${px}px] on a map surface — use w-full instead`,
          );
        }
      }
    }

    expect(
      offenders,
      `Map surfaces must be fluid (w-full / flex-1). Fixed widths break ` +
        `mobile rendering:\n  - ${offenders.join('\n  - ')}`,
    ).toEqual([]);
  });

  it('Dialog / Sheet / Modal content uses responsive max-w, never a fixed mobile-breaking width', () => {
    // Modals on mobile should be capped via max-w-[Xvw] or sm:max-w-…
    // A bare w-[600px] on a DialogContent will overflow a 360px viewport.
    const SRC_ROOTS = ['src/components', 'src/pages'].map((p) =>
      resolve(PROJECT_ROOT, p),
    );
    const offenders: string[] = [];

    for (const root of SRC_ROOTS) {
      for (const file of walk(root)) {
        const name = file.split('/').pop() ?? '';
        if (!/Modal|Dialog|Sheet/.test(name)) continue;
        const src = readFileSync(file, 'utf-8');
        // Look for w-[Npx] (>480) NOT prefixed by a breakpoint like sm:/md:/lg:
        const matches = src.matchAll(/(?<![\w:-])w-\[(\d{3,4})px\]/g);
        for (const m of matches) {
          const px = Number(m[1]);
          if (px <= 480) continue;
          offenders.push(
            `${file.replace(PROJECT_ROOT + '/', '')}: unbreakpointed w-[${px}px] on a modal surface — ` +
              `use sm:w-[${px}px] or max-w-[90vw]`,
          );
        }
      }
    }

    expect(
      offenders,
      `Modals must adapt to mobile width. Use breakpoint-prefixed widths or ` +
        `max-w-[Xvw]:\n  - ${offenders.join('\n  - ')}`,
    ).toEqual([]);
  });
});
