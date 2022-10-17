import chalk from 'chalk';
import { createLogger, format, Logger as WinstonLogger, transports } from 'winston';

import { isObject } from '../helpers';

import { ILoggerService } from './logger.interface';

// Nestjs logger

export class Logger implements ILoggerService {
  private static readonly chalk = new chalk.Instance({ level: 2 });
  private readonly context: string;
  private static readonly instance?: typeof Logger | ILoggerService = Logger;
  private static readonly winstonLogger: WinstonLogger = createLogger({
    format: format.json(),

    transports: [
      new transports.File({
        filename: Logger.buildPath('error'),
        level: 'error'
      }),
      new transports.File({
        filename: Logger.buildPath('warn'),
        level: 'warn'
      }),
      new transports.Console({
        level: 'debug',
        format: format.combine(
          format.colorize(),
          format.combine(
            format.colorize({
              all: true
            }),
            format.label({
              label: `[Yui] ${Logger.chalk.hex('#FFA500')(`[${process.pid}]`)}`
            }),
            format.timestamp({
              format: 'YY-MM-DD HH:MM:SS'
            }),
            format.printf(
              (info) => ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`
            )
          )
        )
      })
    ]
  });

  private static buildPath(type: string) {
    const [m, d, y] = new Date().toLocaleDateString().split('/');
    return `logs/${y}-${m}-${d}/container/${type}.log`;
  }

  constructor(context?: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.callFunction('log', message, context);
  }

  info(message: string, context?: string) {
    return this.callFunction('info', message, context);
  }

  warn(message: string, context?: string) {
    return this.callFunction('warn', message, context);
  }

  error(error: Error | string, context?: string) {
    return this.callFunction('error', error, context);
  }

  debug(message: string, context?: string) {
    return this.callFunction('debug', message, context);
  }

  private callFunction(
    name: 'log' | 'warn' | 'debug' | 'info' | 'error',
    message: any,
    context?: string
  ) {
    const instance = this.getInstance();
    const instanceMethod = instance && (instance as typeof Logger)[name];
    if (instanceMethod) instanceMethod.call(instance, message, context || this.context);
  }

  static log(message: string, context?: string) {
    return this.winstonLogger.info(
      this.printMessage(message, this.chalk.keyword('orange'), context)
    );
  }

  static info(message: string, context?: string) {
    return this.winstonLogger.info(this.printMessage(message, this.chalk.green, context));
  }

  static warn(message: string, context?: string) {
    return this.winstonLogger.warn(this.printMessage(message, this.chalk.yellow, context));
  }

  static error(error: Error | string, context?: string) {
    return this.winstonLogger.error(this.printMessage(error, this.chalk.red, context));
  }

  static debug(message: string, context?: string) {
    return this.winstonLogger.debug(this.printMessage(message, this.chalk.cyan, context));
  }

  private getInstance(): typeof Logger | ILoggerService {
    const { instance } = Logger;
    return instance === this ? Logger : instance;
  }

  private static printMessage(message: string | Error, color: chalk.Chalk, context?: string) {
    const output = isObject(message) ? `${JSON.stringify(message, null, 2)}\n` : color(message);
    const messageContext = context ? this.chalk.hex('#00ffff')(`[${context}]`) : '';
    return `${messageContext} ${output}\n`;
  }
}
