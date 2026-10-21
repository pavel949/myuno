/**
 * Regression-guard: AllAppsDrawer — это тонкая обёртка над AppDrawer.
 *
 * Wave-1 IA cleanup (2026-06): два drawer-а слиты в один. Этот тест
 * не даёт случайно вернуть в `AllAppsDrawer.tsx` собственный JSX —
 * единственное допустимое содержимое — re-export через `AppDrawer`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DRAWER_FILE = join(process.cwd(), 'src/components/layout/AllAppsDrawer.tsx');

describe('IA Wave-1 — Single app drawer', () => {
  const source = readFileSync(DRAWER_FILE, 'utf8');

  it('AllAppsDrawer must forward to canonical AppDrawer', () => {
    expect(source).toMatch(/from\s+['"]@\/components\/nav\/AppDrawer['"]/);
    expect(source).toMatch(/<AppDrawer\b/);
  });

  it('AllAppsDrawer must NOT render its own <Sheet> tree', () => {
    expect(source).not.toMatch(/<SheetContent\b/);
  });

  it('AllAppsDrawer must be marked @deprecated', () => {
    expect(source).toMatch(/@deprecated/);
  });
});
