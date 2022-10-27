import { isFunction } from 'lodash';

import { ExecutionContext } from '../../execution-context';
import { ParamDecoratorResolver as ParameterDecoratorResolver } from '../../interfaces';

const registry: {
  [key: string]: ParameterDecoratorResolver<any>;
} = {};

export function setParamDecoratorResolver(
  key: string,
  valueResolver: ParameterDecoratorResolver<any>
) {
  registry[key] = valueResolver;
}

export function getParamDecoratorResolver(key: string): ParameterDecoratorResolver<any> {
  return registry[key];
}

export async function getParamDecoratorResolverValue(key: string, context: ExecutionContext) {
  const resolver = getParamDecoratorResolver(key);
  return isFunction(resolver) ? resolver(context) : null;
}
