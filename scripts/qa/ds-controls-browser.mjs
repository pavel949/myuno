// Use the same pinned Python Playwright driver/browser as the isolated CI suites.
import { spawnSync } from 'node:child_process';
const result=spawnSync('python',['scripts/qa/ds-controls-browser.py'],{stdio:'inherit',env:process.env});
process.exitCode=result.status??1;
