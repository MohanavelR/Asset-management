'use strict';

const isDev = process.env.NODE_ENV !== 'production';

const pad = (n, size = 2) => String(n).padStart(size, '0');

function timestamp() {
  const d = new Date();
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function log(level, ...args) {
  const method = level === 'debug' ? 'log' : level;
  console[method](`${timestamp()} - ${level.toUpperCase()} -`, ...args);
}
module.exports = {
  // debug logs only appear in development
  debug: (...args) => {
    if (isDev) log('debug', ...args);
  },
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
};