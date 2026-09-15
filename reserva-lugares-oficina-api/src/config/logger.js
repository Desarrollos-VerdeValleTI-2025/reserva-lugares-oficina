const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Salida a archivo solo fuera de desarrollo (calidad/producción), con rotación diaria
// para no dejar crecer logs/*.log indefinidamente.
const transports = [new winston.transports.Console()];

if (process.env.NODE_ENV !== 'development') {
  transports.push(new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
  }));
  transports.push(new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
  }));
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports,
});

module.exports = logger;
