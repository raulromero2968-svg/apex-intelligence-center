// apps/web/src/server/logger.ts

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const makeLoggerFn =
  (level: LogLevel, prefix: string) =>
  (...args: unknown[]) => {
    const tag = `[${prefix}:${level.toUpperCase()}]`;
    // eslint-disable-next-line no-console
    const fn =
      level === 'debug'
        ? console.log
        : level === 'info'
          ? console.info
          : level === 'warn'
            ? console.warn
            : console.error;

    fn(tag, ...args);
  };

/**
 * Create a logger instance with a namespace prefix
 */
export function createLogger(namespace: string, component?: string): Logger {
  const prefix = component ? `${namespace}:${component}` : namespace;
  return {
    debug: makeLoggerFn('debug', prefix),
    info: makeLoggerFn('info', prefix),
    warn: makeLoggerFn('warn', prefix),
    error: makeLoggerFn('error', prefix),
  };
}

export const logger: Logger = createLogger('Apex');
