// Preload before tests/build: allow Unix sockets and loopback, never a hosted backend.
const net = require('node:net');
const { syncBuiltinESMExports } = require('node:module');
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  let options = args[0];
  if (Array.isArray(options)) options = options[0];
  if (typeof options === 'string' && !/^\d+$/.test(options)) return connect.apply(this, args);
  if (options && typeof options === 'object' && options.path) return connect.apply(this, args);
  const host = typeof options === 'object' ? options.host : typeof args[1] === 'string' ? args[1] : 'localhost';
  if (host && !['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
    throw new Error(`Isolated verification denied outbound connection to ${host}`);
  }
  return connect.apply(this, args);
};
syncBuiltinESMExports();
