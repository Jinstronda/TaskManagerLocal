import fs from 'fs';
import path from 'path';

export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  private logLevel: number;
  private logDir: string;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'development' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
    this.logDir = path.join(process.cwd(), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  private writeToFile(level: string, message: string, meta?: any): void {
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    const formattedMessage = this.formatMessage(level, message, meta);
    
    try {
      fs.appendFileSync(logFile, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(level: keyof LogLevel, message: string, meta?: any): void {
    const numericLevel = LOG_LEVELS[level];
    
    if (numericLevel <= this.logLevel) {
      const formattedMessage = this.formatMessage(level, message, meta);
      
      // Console output with colors
      switch (level) {
        case 'ERROR':
          console.error('\x1b[31m%s\x1b[0m', formattedMessage);
          break;
        case 'WARN':
          console.warn('\x1b[33m%s\x1b[0m', formattedMessage);
          break;
        case 'INFO':
          console.info('\x1b[36m%s\x1b[0m', formattedMessage);
          break;
        case 'DEBUG':
          console.debug('\x1b[37m%s\x1b[0m', formattedMessage);
          break;
      }
      
      // Write to file for ERROR and WARN levels
      if (numericLevel <= LOG_LEVELS.WARN) {
        this.writeToFile(level, message, meta);
      }
    }
  }

  public error(message: string, meta?: any): void {
    this.log('ERROR', message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.log('WARN', message, meta);
  }

  public info(message: string, meta?: any): void {
    this.log('INFO', message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.log('DEBUG', message, meta);
  }
}

export const logger = new Logger();