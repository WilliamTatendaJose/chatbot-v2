import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'techrehub-chatbot' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Export individual logging functions
export const info = (...args) => {
  console.log(new Date().toISOString(), '[INFO]', ...args);
};

export const error = (...args) => {
  console.error(new Date().toISOString(), '[ERROR]', ...args);
};

export const debug = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(new Date().toISOString(), '[DEBUG]', ...args);
  }
};