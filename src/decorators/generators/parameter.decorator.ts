import { setParamDecoratorResolver as setParameterDecoratorResolver } from '../../builder';
import { METHOD_PARAMS_METADATA_INTERNAL } from '../../constants';
import { Prototype, ParamDecoratorResolver as ParameterDecoratorResolver } from '../../interfaces';

import { paramKeyPrefix as parameterKeyPrefix } from './constants';

export function constructParamKey(target: Prototype, propertyKey: string, parameterIndex: number) {
  return `${parameterKeyPrefix}::${target.constructor.name}::${propertyKey}::${parameterIndex}`;
}

export function wrappedParamDecorator(method: ParameterDecoratorResolver) {
  return (target: Prototype, propertyKey: string, parameterIndex: number) => {
    // TODO: remove after done migrating
    const internallyDefinedParameters =
      Reflect.getMetadata(METHOD_PARAMS_METADATA_INTERNAL, target.constructor, propertyKey) || [];

    const parameterKey = constructParamKey(target, propertyKey, parameterIndex);
    setParameterDecoratorResolver(parameterKey, method);

    Reflect.defineMetadata(
      METHOD_PARAMS_METADATA_INTERNAL,
      {
        [parameterKey]: parameterIndex,
        ...internallyDefinedParameters
      },
      target.constructor,
      propertyKey
    );
  };
}

export function createParamDecorator(method: ParameterDecoratorResolver) {
  return () => wrappedParamDecorator(method);
}
