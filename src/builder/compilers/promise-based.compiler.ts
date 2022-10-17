import { ExecutionContext } from '../../event-execution-context/execution-context';
import { ConstructorType } from '../../interfaces/dependencies-injection.interfaces';
import {
  ComponentsContainer,
  InterceptorsContainer,
  ModulesContainer,
  ProvidersContainer
} from '../containers';

import { BaseRecursiveCompiler } from './base/base-recursive.compiler';

/**
 * @description Compile using recursive strategy.
 */
export class PromiseBasedRecursiveCompiler extends BaseRecursiveCompiler<Promise<any>> {
  constructor(
    protected _moduleContainer: ModulesContainer,
    protected _componentContainer: ComponentsContainer,
    protected _providerContainer: ProvidersContainer,
    protected _interceptorContainer: InterceptorsContainer
  ) {
    super(_moduleContainer, _componentContainer, _providerContainer, _interceptorContainer);
  }

  protected compileCommand(
    target: ConstructorType<any>,
    instance: InstanceType<ConstructorType<any>>,
    propertyKey: string
  ) {
    const interceptor = this.getInterceptor(target);
    // bind: passive when go through interceptor, active when call directly
    const fromHandler = async (context: ExecutionContext) => context.call<Promise<any>>();

    const handler = async (context: ExecutionContext): Promise<any> => {
      context.setContextMetadata({ target, propertyKey });
      context.setHandler(instance[propertyKey].bind(instance));
      return !interceptor
        ? fromHandler(context)
        : interceptor.intercept(context, async () => fromHandler(context));
    };

    return handler;
  }
}
