import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
import tailwindPostcss from '@tailwindcss/postcss';

/** Compile the real CSS offline using the same v4 plugin as the application. */
export async function compileApplicationCss(root, extraFiles = []) {
  const source = path.join(root, 'src/index.css');
  const files = [source, ...extraFiles.map(file => path.join(root, file))];
  const input = (await Promise.all(files.map(file => readFile(file, 'utf8')))).join('\n');
  const result = await postcss([tailwindPostcss({ base: root })]).process(input, { from: source });
  if (/^\s*@import\s/m.test(result.css)) throw Error('Application CSS contains unresolved imports');
  return result;
}

// The compact smoke keeps its original killable 30-second compiler boundary.
const outputFlag = process.argv.indexOf('--write-application-css');
if (outputFlag !== -1) {
  const output = process.argv[outputFlag + 1];
  if (!output) throw Error('Missing application CSS output path');
  await writeFile(output, (await compileApplicationCss(process.cwd())).css);
}
