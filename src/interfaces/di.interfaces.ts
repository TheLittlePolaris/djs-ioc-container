/* eslint-disable @typescript-eslint/no-explicit-any */

import { Client, ClientEvents, Events } from 'discord.js';

import { DiscordEvent } from '../constants';

/* ================================== INTERFACES ===================================== */
export type GenericClassDecorator<T> = (target: T) => void;

export type GenericMethodDecorator = (
  target: Prototype,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => void;

export type ConstructorType<T = any> = new (...arguments_: any[]) => T;

export type FunctionType = (...arguments_: any[]) => any;

export interface Prototype {
  constructor: (...arguments_: any[]) => any;
}

export interface IProvider<T = any> {
  provide: string;

  useClass?: ConstructorType<T>;
  useValue?: T;

  imports?: ConstructorType<any>[];
  injects?: ConstructorType<any>[];
  useFactory?: (...injections: any[]) => T;
}

export interface IProviderValue extends IProvider {
  getValue: () => any;
  readonly _value: any;
}

export interface ICustomValueProvider<T = any> {
  provide: string;
  useValue: T;
}

export interface ICustomClassProvider<T = any> {
  provide: string;
  useClass: ConstructorType<T>;
}

export type CommandParserType = {
  [key in DiscordEvent]?: (eventArgs: ClientEvents[DiscordEvent]) => string;
};

export type GlobalInterceptorType = {
  [key in Events]?: ((eventArgs, customConfig?: any) => boolean)[];
};

export interface IAppConfig {
  token: string;
  prefix: string;
}

export interface ICustomProviderToken {
  [key: string]: number | string;
}

export interface IModuleOption {
  providers?: IProvider[];
  modules?: ConstructorType[];
  components?: ConstructorType[];
  interceptors?: ConstructorType[];
}

export interface IEntryComponent {
  start: (token: string) => void | Promise<void>;
  client: Client;
}

export interface IOnComponentInit {
  onComponentInit: () => any;
}

export interface IEvent {
  eventName: DiscordEvent;
  propertyKey: string;
  value: (...arguments_: any[]) => any;
}

export interface EventParameterMetadata {
  event?: string;
  index: number;
  propertyKey: string | symbol;
  additionalParam?: string;
}

export interface ICommandHandlerMetadata {
  propertyKey: string;
  command: string;
  commandAliases?: string[];
}

/** ************************************************************************************/
