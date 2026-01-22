import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const formatContext = (context: unknown): string => {
  if (typeof context === 'string') return context;
  if (!context) return 'Application';
  return 'Application';
};

const formatTrace = (trace: unknown): string => {
  if (!trace) return '';
  if (typeof trace === 'string') return trace;
  return JSON.stringify(trace);
};

const customFormat = winston.format.printf(
  ({ level, message, context, trace, timestamp }) => {
    const ctx = formatContext(context);
    const tr = formatTrace(trace);
    return `${String(timestamp)} [${ctx}] ${String(level)}: ${String(message)}${tr ? '\n' + tr : ''}`;
  },
);

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize({ all: true }),
        customFormat,
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
