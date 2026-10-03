// Tests may use loopback HTTP only. No DNS, provider or chat connections.
const net = require('node:net');
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const options = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = typeof options === 'object' ? options.host : args[1];
  if (!['127.0.0.1', '::1', 'localhost'].includes(host)) throw new Error('External network disabled in tests');
  return connect.apply(this, args);
};
