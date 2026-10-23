import { beforeAll, describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

let eslint: ESLint;
const filePath = 'src/components/hooks-policy-fixture.tsx';

describe('installed Hooks plugin enforces the existing project policy', () => {
  beforeAll(async () => {
    eslint = new ESLint({ cwd: process.cwd() });
    await eslint.calculateConfigForFile(filePath);
  });

  it('rejects conditional Hooks as errors', async () => {
    const [result] = await eslint.lintText(`
      import { useState } from 'react';
      export function Conditional({ enabled }: { enabled: boolean }) {
        if (enabled) useState(0);
        return null;
      }
    `, { filePath });
    expect(result.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: 'react-hooks/rules-of-hooks', severity: 2 }),
    ]));
    expect(result.errorCount).toBeGreaterThan(0);
  });

  it('reports missing effect dependencies as warnings', async () => {
    const [result] = await eslint.lintText(`
      import { useEffect } from 'react';
      export function Effect({ title }: { title: string }) {
        useEffect(() => { document.title = title; }, []);
        return null;
      }
    `, { filePath });
    expect(result.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: 'react-hooks/exhaustive-deps', severity: 1 }),
    ]));
    expect(result.errorCount).toBe(0);
  });
});
