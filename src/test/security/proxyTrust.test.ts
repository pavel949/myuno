import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

// Exercise the Express consumer reached through the existing MCP SDK, without
// opening a server or sending requests to any backend.
const require = createRequire(import.meta.url);
const sdkRequire = createRequire(require.resolve('@modelcontextprotocol/sdk/server/streamableHttp.js'));
const express = sdkRequire('express');

function requestIp(trust: string, remoteAddress: string) {
  const app = express();
  app.set('trust proxy', trust);
  const request = Object.create(app.request);
  request.app = app;
  request.socket = { remoteAddress };
  request.headers = { 'x-forwarded-for': '198.51.100.1' };
  return request.ip;
}

describe('MCP Express proxy trust', () => {
  it.each(['::ffff:10.0.0.0/8', '::/1'])(
    'does not trust an arbitrary IPv4 sender through the IPv6 subnet %s',
    (trust) => {
      // GHSA-jqcg-44mw-7w3h: proxy-addr 2.0.7 returned the forged forwarded IP.
      expect(requestIp(trust, '203.0.113.9')).toBe('203.0.113.9');
    },
  );

  it.each(['10.0.0.0/8', '::ffff:10.0.0.0/104'])(
    'preserves forwarded client resolution for an actual trusted proxy in %s',
    (trust) => {
      expect(requestIp(trust, '10.0.0.2')).toBe('198.51.100.1');
      expect(requestIp(trust, '203.0.113.9')).toBe('203.0.113.9');
    },
  );
});
