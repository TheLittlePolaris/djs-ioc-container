/* eslint-disable @typescript-eslint/no-explicit-any */

import { Client } from 'discord.js';

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

export type Provider<T = any> = CustomValueProvider<T> &
  CustomClassProvider<T> &
  CustomFactoryProvider<T>;

export interface CustomValueProvider<T> {
  provide: string;
  useValue: T;
}

export interface CustomClassProvider<T> {
  provide: string;
  useClass: ConstructorType<T>;
}

export interface CustomFactoryProvider<T> {
  provide: string;
  imports?: ConstructorType<any>[];
  injects?: ConstructorType<any>[];
  useFactory: (..._injections: InstanceType<ConstructorType<any>>[]) => T;
}

export interface CustomProviderToken {
  [key: string]: number | string;
}

export interface ModuleOption {
  providers?: CustomValueProvider<any>[];
  modules?: ConstructorType<any>[];
  components?: ConstructorType<any>[];
  interceptors?: ConstructorType<any>[];
  entryComponent?: ConstructorType<any>;
}

export interface EntryComponent {
  start: (token: string) => void | Promise<void>;
  client: Client;
}

export interface OnComponentInit {
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
