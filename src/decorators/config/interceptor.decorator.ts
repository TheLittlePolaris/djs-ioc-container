import { CUSTOM_INTERCEPTOR, DiscordEvent, INTERCEPTOR_TARGET } from '../../constants';
import { GenericClassDecorator, ConstructorType } from '../../interfaces';

export function Interceptor(forEvent: DiscordEvent): GenericClassDecorator<ConstructorType<any>> {
  return (target: ConstructorType<any>) => {
    Reflect.defineMetadata(CUSTOM_INTERCEPTOR, forEvent, target);
  };
}

export function UseInterceptor(interceptorFunction?: ConstructorType<any>): GenericClassDecorator<ConstructorType<any>> {
  return (target: ConstructorType<any>) => {
    if (interceptorFunction?.name) {
      const isCorrect = Reflect.getMetadata(CUSTOM_INTERCEPTOR, interceptorFunction);
      if (!isCorrect) throw new Error('No such interceptor');
    }
    Reflect.defineMetadata(INTERCEPTOR_TARGET, interceptorFunction.name, target);
  };
}
