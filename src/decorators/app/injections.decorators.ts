import 'reflect-metadata';
import { isFunction, isUndefined } from 'lodash';

import {
  DESIGN_TYPE,
  INJECTABLE_METADATA,
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA
} from '../../constants';
import { GenericClassDecorator, ConstructorType } from '../../interfaces';

// NestJS Inject function, edited
export const Inject =
  (token: string | symbol) => (target: object, key: string | symbol, index?: number) => {
    token = token || Reflect.getMetadata(DESIGN_TYPE, target, key);
    const type = token && isFunction(token) ? token.name : token;

    if (!isUndefined(index)) {
      let dependencies = Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || [];
      dependencies = { ...dependencies, [index]: type };
      Reflect.defineMetadata(SELF_DECLARED_DEPS_METADATA, dependencies, target);
      return;
    }

    let properties = Reflect.getMetadata(PROPERTY_DEPS_METADATA, target) || [];
    properties = { ...properties, [key]: type };
    Reflect.defineMetadata(PROPERTY_DEPS_METADATA, properties, target);
  };

export function Injectable<T = any>(): GenericClassDecorator<ConstructorType<T>> {
  return (target: ConstructorType<any>) => {
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);
  };
}
