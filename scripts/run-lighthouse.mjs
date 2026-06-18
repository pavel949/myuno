#!/usr/bin/env node
/**
 * Local/CI Lighthouse runner for https://www.myuno.app
 *
 * Usage:
 *   node scripts/run-lighthouse.mjs              # mobile + desktop
 *   node scripts/run-lighthouse.mjs --mobile     # mobile only
 *   node scripts/run-lighthouse.mjs --desktop    # desktop only
 *
 * Outputs HTML + JSON reports into ./lighthouse-reports/
 * In CI those are uploaded as artifacts (see .github/workflows/lighthouse.yml).
 */
import { spawn } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const runMobile = args.size === 0 || args.has("--mobile");
const runDesktop = args.size === 0 || args.has("--desktop");

const outDir = resolve(process.cwd(), "lighthouse-reports");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

function runLhci(configFile, label) {
  return new Promise((resolvePromise, rejectPromise) => {
    console.log(`\n▶ Lighthouse CI (${label}) — config: ${configFile}`);
    const child = spawn(
      "npx",
      ["--yes", "@lhci/cli@0.14.x", "autorun", `--config=${configFile}`],
      {
        stdio: "inherit",
        shell: process.platform === "win32",
        env: {
          ...process.env,
          LHCI_BUILD_CONTEXT__CURRENT_BRANCH:
            process.env.GITHUB_REF_NAME || "local",
        },
      },
    );
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

(async () => {
  const failures = [];
  if (runMobile) {
    try {
      await runLhci("lighthouserc.mobile.json", "mobile");
    } catch (e) {
      failures.push(e.message);
    }
  }
  if (runDesktop) {
    try {
      await runLhci("lighthouserc.json", "desktop");
    } catch (e) {
      failures.push(e.message);
    }
  }
  if (failures.length) {
    console.error("\n❌ Lighthouse failures:\n - " + failures.join("\n - "));
    process.exit(1);
  }
  console.log("\n✅ Lighthouse runs complete. Reports in ./.lighthouseci/");
})();
