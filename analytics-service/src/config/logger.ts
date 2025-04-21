import winston from 'winston';
import { env } from './env';

const { combine, timestamp, printf, colorize, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...rest }) => {
  if (stack) {
    return `${timestamp} [${level}] ${message}\n${stack}`;
  }
  if(Object.keys(rest).length > 0) {
    return `${timestamp} [${level}] ${message} ${JSON.stringify(rest)}`;
  }
  return `${timestamp} [${level}] ${message}`;
});

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: json(),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: 'logs.log',
      format: json()
    })
  ]
});

export default logger; 