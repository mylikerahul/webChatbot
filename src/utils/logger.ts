import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDevelopment = process.env.NODE_ENV !== 'production';

// Multiple transports - console + file
const transports = isDevelopment
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
        singleLine: false,
        messageFormat: '{levelLabel} - {msg}',
      },
    }
  : {
      targets: [
        {
          target: 'pino-pretty',
          level: 'info',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
        {
          target: 'pino/file',
          level: 'error',
          options: {
            destination: path.join(__dirname, '../../logs/error.log'),
            mkdir: true,
          },
        },
      ],
    };

export const logger = pino(
  {
    level: isDevelopment ? 'debug' : 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
      bindings: (bindings) => ({
        node_version: process.version,
      }),
    },
    serializers: {
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  },
  pino.transport(transports)
);

// Enhanced logging with context
export const log = {
  // Basic logs
  info: (msg: string, meta?: object) => logger.info(meta || {}, msg),
  error: (msg: string, error?: Error | unknown, meta?: object) => {
    if (error instanceof Error) {
      logger.error({ ...meta, error: error.message, stack: error.stack }, `❌ ${msg}`);
    } else {
      logger.error(meta || {}, `❌ ${msg}`);
    }
  },
  warn: (msg: string, meta?: object) => logger.warn(meta || {}, `⚠️  ${msg}`),
  debug: (msg: string, meta?: object) => logger.debug(meta || {}, `🔍 ${msg}`),

  // Success messages
  success: (msg: string, meta?: object) => logger.info(meta || {}, `✅ ${msg}`),

  // Domain specific logs
  server: (msg: string, meta?: object) => logger.info(meta || {}, `🚀 ${msg}`),
  db: (msg: string, meta?: object) => logger.info(meta || {}, `🗄️  ${msg}`),
  ai: (msg: string, meta?: object) => logger.info(meta || {}, `🤖 ${msg}`),
  user: (msg: string, meta?: object) => logger.info(meta || {}, `👤 ${msg}`),
  cache: (msg: string, meta?: object) => logger.info(meta || {}, `💾 ${msg}`),
  vector: (msg: string, meta?: object) => logger.info(meta || {}, `🔢 ${msg}`),

  // Performance logs
  perf: (msg: string, duration: number, meta?: object) =>
    logger.info({ ...meta, duration_ms: duration }, `⚡ ${msg}`),

  // HTTP request log
  request: (method: string, url: string, statusCode?: number) =>
    logger.info({ method, url, statusCode }, `📡 ${method} ${url}`),
};

export default logger;