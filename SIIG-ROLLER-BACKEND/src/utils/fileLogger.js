const fs = require('fs');
const path = require('path');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logsDir = path.join(__dirname, '..', '..', 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, {recursive: true});
}

const lineFormat = winston.format.printf(
  ({level, message, timestamp, stack, ...meta}) => {
    const rest = {...meta};
    let suffix = '';
    const keys = Object.keys(rest).filter((k) => rest[k] !== undefined);
    if (keys.length) {
      try {
        suffix = ` | ${JSON.stringify(rest)}`;
      } catch {
        suffix = ' | [meta no serializable]';
      }
    }
    const base = `${timestamp} [${level.toUpperCase()}] ${message}`;
    return stack ? `${base}\n${stack}${suffix}` : `${base}${suffix}`;
  },
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
    winston.format.errors({stack: true}),
    lineFormat,
  ),
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(winston.format.colorize(), lineFormat),
    }),
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '3d',
      level: 'info',
    }),
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '3d',
      level: 'error',
    }),
  ],
});

/** Stream para morgan: escribe en combined como INFO con prefijo [HTTP] */
const accessLogStream = {
  write: (str) => {
    logger.info(`[HTTP] ${str.trim()}`);
  },
};

module.exports = logger;
module.exports.accessLogStream = accessLogStream;
module.exports.logsDir = logsDir;
