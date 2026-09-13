/**
 * Utilitaires pour gérer les erreurs et logs
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const style = this.getConsoleStyle(level);
    console.log(`%c[${level.toUpperCase()}]`, style, message, data || "");
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: "color: #888; font-weight: bold;",
      [LogLevel.INFO]: "color: #0066cc; font-weight: bold;",
      [LogLevel.WARN]: "color: #ff9900; font-weight: bold;",
      [LogLevel.ERROR]: "color: #cc0000; font-weight: bold;",
    };
    return styles[level];
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return this.logs;
    return this.logs.filter((log) => log.level === level);
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();

// Error utilities
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    logger.error(error.code, error);
    return error;
  }

  if (error instanceof Error) {
    logger.error("UNKNOWN_ERROR", error);
    return new AppError("UNKNOWN_ERROR", error.message, 500, { originalError: error });
  }

  const message = String(error);
  logger.error("UNKNOWN_ERROR", message);
  return new AppError("UNKNOWN_ERROR", message, 500);
}
