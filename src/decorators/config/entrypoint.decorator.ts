import { isFunction } from 'lodash';

import { COMPONENT_METADATA, DESIGN_TYPE, INJECTABLE_METADATA } from '../../constants';
import { DiscordEvent } from '../../constants/discord-events';
import {
  GenericClassDecorator,
  Prototype,
  ConstructorType
} from '../../interfaces/di.interfaces';

export function Entrypoint<T = any>(): GenericClassDecorator<ConstructorType<T>> {
  return (target: ConstructorType<T>) => {
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);
  };
}

// https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators
export const On =
  (event: DiscordEvent): MethodDecorator =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (target: Prototype, propertyKey: string, _descriptor: PropertyDescriptor) => {
    const propertyDesignType = Reflect.getMetadata(DESIGN_TYPE, target, propertyKey);
    if (!isFunction(propertyDesignType))
      throw new Error("Client's event property has to be a method!");

    let eventList: { [key: string]: string } =
      Reflect.getMetadata(COMPONENT_METADATA.EVENT_LIST, target.constructor) || [];
    eventList = { ...eventList, [event]: propertyKey };
    Reflect.defineMetadata(COMPONENT_METADATA.EVENT_LIST, eventList, target.constructor);
  };
