/**
 * Regression test: Semantic Core validator must report 0 errors AND 0 warnings.
 *
 * Backs M9 commitment (canonical 10 §15) — once we reach a clean baseline,
 * any new forbidden synonym, oversized title, or pillar coverage gap fails
 * CI immediately instead of silently degrading.
 *
 * Runs the same script CI uses (`scripts/validate-semantic.mjs --strict`),
 * which exits with code 1 if there is at least one error OR one warning.
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

describe("validate-semantic", () => {
  it("passes in --strict mode (0 errors, 0 warnings)", () => {
    const scriptPath = resolve(__dirname, "../../../scripts/validate-semantic.mjs");
    const result = spawnSync(process.execPath, [scriptPath, "--strict"], {
      encoding: "utf-8",
      cwd: resolve(__dirname, "../../.."),
    });

    if (result.status !== 0) {
      // Surface the validator output so CI logs explain what regressed.
      console.error(result.stdout);
      console.error(result.stderr);
    }

    expect(result.status).toBe(0);
  }, 60_000);
});
