import { createRequire } from 'node:module';

// Radix roots must share layer/focus registries even with nested package copies.
// Resolve the versions required by Popover rather than forcing its newer API
// onto an older top-level transitive package. No dependency installation needed.
const require = createRequire(import.meta.url);
const popoverRequire = createRequire(require.resolve('@radix-ui/react-popover'));
export const radixOverlayAliases = Object.fromEntries(
  ['@radix-ui/react-dismissable-layer', '@radix-ui/react-focus-scope'].map(
    (name) => [name, popoverRequire.resolve(name)],
  ),
);