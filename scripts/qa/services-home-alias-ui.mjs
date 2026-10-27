// Separate mandatory alias matrix; preserve the existing 180-second fixture cap.
const output = process.env.SERVICES_DISCOVERY_OUTPUT || '/tmp/browser/services-home-alias-isolated';
process.env.SERVICES_DISCOVERY_OUTPUT = output;
process.env.SERVICES_DISCOVERY_SCOPE = 'home-aliases';
await import('./services-discovery-ui.mjs');
