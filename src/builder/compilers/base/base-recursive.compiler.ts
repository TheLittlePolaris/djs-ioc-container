import { assign, isFunction } from 'lodash';

import {
  ModuleMetadata,
  getPropertyKey,
  EVENT_HANDLER,
  PARAMTYPES_METADATA,
  SELF_DECLARED_DEPS_METADATA,
  COMMAND_HANDLER,
  EVENT_HANDLER_CONFIG,
  INTERCEPTOR_TARGET
} from '../../../constants';
import { isValue, isValueInjector, isClassInjector } from '../../../helpers';
import {
  ConstructorType,
  IProvider,
  ICommandHandlerMetadata,
  IInterceptor,
  DiscordEvent
} from '../../../interfaces';
import { Logger } from '../../../logger';
import {
  ModulesContainer,
  ComponentsContainer,
  ProvidersContainer,
  InterceptorsContainer
} from '../../containers';

import {
  IEventHandlerRegistry,
  ICommandRegistry,
  CommandHandler
} from './base-recursive.compiler.type';

export abstract class BaseRecursiveCompiler<TReturn> {
  protected _eventHandlers: IEventHandlerRegistry<TReturn> = {};

  constructor(
    protected _moduleContainer: ModulesContainer,
    protected _componentContainer: ComponentsContainer,
    protected _providerContainer: ProvidersContainer,
    protected _interceptorContainer: InterceptorsContainer
  ) {}

  protected get context() {
    return this.constructor.name;
  }

  get eventHandlers() {
    return this._eventHandlers;
  }

  get moduleContainer() {
    return this._moduleContainer;
  }

  get componentContainer() {
    return this._componentContainer;
  }
  get providerContainer() {
    return this._providerContainer;
  }
  get interceptorContainer() {
    return this._interceptorContainer;
  }

  private getModuleMetadata(module: ConstructorType, key: ModuleMetadata) {
    return Reflect.getMetadata(getPropertyKey(key), module);
  }

  async compileModule(module: ConstructorType, entryComponent?: ConstructorType<any>) {
    const [providers, modules, interceptors, components] = [
      this.getModuleMetadata(module, ModuleMetadata.PROVIDERS),
      this.getModuleMetadata(module, ModuleMetadata.MODULES),
      this.getModuleMetadata(module, ModuleMetadata.INTERCEPTOR),
      this.getModuleMetadata(module, ModuleMetadata.COMPONENTS)
    ];

    if (providers)
      await Promise.all(providers.map(async (provider) => this.compileProvider(module, provider)));

    if (entryComponent) {
      // first entry needs custom config
      this._moduleContainer.setEntryComponent(entryComponent);
      this.compileComponent(module, entryComponent);
    }

    if (modules) {
      await Promise.all(modules.map(async (m) => this.compileModule(m)));
      this._moduleContainer.importModules(modules);
    }

    if (interceptors)
      await Promise.all(
        interceptors.map((interceptor) => this.compileInterceptor(module, interceptor))
      );

    if (components)
      await Promise.all(components.map((component) => this.compileComponent(module, component)));

    this._moduleContainer.clear();
  }

  protected async compileProvider(module: ConstructorType, provider: IProvider) {
    if (provider?.hasOwnProperty('useValue'))
      this._providerContainer.setValueProvider(module, provider, provider.useValue);
    else if (provider.hasOwnProperty('useFactory')) {
      const { useFactory, injects, imports } = provider;

      if (imports) await Promise.all(imports.map(async (m) => this.compileModule(m)));

      const injections = injects?.length
        ? injects.map((token) => this.componentContainer.getInstance(token))
        : [];

      const providerValue = (isFunction(useFactory) && (await useFactory(...injections))) || null;

      this._providerContainer.setValueProvider(module, provider, providerValue);
    } else if (provider.hasOwnProperty('useClass')) {
      const { useClass } = provider;
      const providerValue = this.compileComponent(module, useClass);
      this._providerContainer.setValueProvider(module, provider, providerValue);
    }
  }

  /**
   * Find the instance for injection, if exists then inject it, if not create it and store it
   */
  compileComponent(module: ConstructorType, target: ConstructorType) {
    if (isValue(target)) return;

    const createdInstance = this._componentContainer.getInstance(target);
    if (createdInstance) return createdInstance;

    const compiledInstance = this.compileInstance(module, target);
    this._componentContainer.addInstance(target, compiledInstance);

    Promise.resolve().then(async () => this.compileHandlerForEvent(target, compiledInstance));

    return compiledInstance;
  }

  protected async compileHandlerForEvent(
    target: ConstructorType,
    compiledInstance: InstanceType<ConstructorType>
  ) {
    const eventHandler = Reflect.getMetadata(EVENT_HANDLER, target);
    if (eventHandler) this.defineHandler(eventHandler, target, compiledInstance);
  }

  protected compileInstance(module: ConstructorType<any>, target: ConstructorType<any>) {
    const injections = this.loadInjectionsForTarget(module, target);
    const compiledInstance = Reflect.construct(target, injections);
    if (isFunction(compiledInstance.onComponentInit)) compiledInstance.onComponentInit();

    Logger.debug(`${target.name} created!`, this.context);
    return compiledInstance;
  }

  protected loadInjectionsForTarget(module: ConstructorType, target: ConstructorType) {
    const tokens: ConstructorType[] = Reflect.getMetadata(PARAMTYPES_METADATA, target) || [];
    const customTokens: { [paramIndex: string]: /* param name */ string } =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || [];
    return tokens.map((token: ConstructorType, parameterIndex: number) => {
      if (customTokens && customTokens[parameterIndex]) {
        // module-based value provider
        const customProvide = this._providerContainer.getProvider(
          module,
          customTokens[parameterIndex]
        );
        /* TODO: class provider */
        if (isValueInjector(customProvide)) return customProvide.useValue;
        else if (isClassInjector(customProvide))
          return this.compileComponent(module, customProvide.useClass);
      }
      const created = this._componentContainer.getInstance(token);
      if (created) return created;

      return this.compileComponent(module, token);
    });
  }
  protected createEventHandler(event: DiscordEvent) {
    if (this.eventHandlers[event]) return;

    this.eventHandlers[event] = {
      commands: {} as ICommandRegistry<TReturn>
    };
  }

  protected defineHandler(
    onEvent: DiscordEvent,
    target: ConstructorType<any>,
    handleInstance: InstanceType<ConstructorType<any>>
  ) {
    this.createEventHandler(onEvent);

    const handlerMetadata: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target) || [];

    const handleConfig: ICommandHandlerMetadata = Reflect.getMetadata(EVENT_HANDLER_CONFIG, target);

    const commandHandlers = this.compileHandlers(target, handleInstance, handlerMetadata);

    this.assignConfig(onEvent, handleConfig);

    this.assignHandleFunctions(onEvent, commandHandlers);
  }

  protected compileHandlers(
    target: ConstructorType<any>,
    instance: InstanceType<ConstructorType<any>>,
    handlerMetadata: ICommandHandlerMetadata[]
  ): ICommandRegistry<TReturn> {
    return handlerMetadata.reduce(
      (accumulator: ICommandRegistry<TReturn>, { command, propertyKey, commandAliases }) => {
        const commandFunction = this.compileCommand(target, instance, propertyKey);
        const mainCommand = { [command]: commandFunction };
        const aliases = [...(commandAliases || [])].reduce(
          (accumulatorAliases, currentAlias) => ({
            ...accumulatorAliases,
            [currentAlias]: mainCommand[command]
          }),
          {}
        );
        return Object.assign(accumulator, mainCommand, aliases);
      },
      {} as ICommandRegistry<TReturn>
    );
  }

  protected assignConfig(event: DiscordEvent, config: ICommandHandlerMetadata): void {
    if (this.eventHandlers[event].config) return;

    this.eventHandlers[event].config = config;
  }

  protected assignHandleFunctions(
    event: DiscordEvent,
    commandHandlers: ICommandRegistry<TReturn>
  ): void {
    assign(this.eventHandlers[event].commands, commandHandlers);
  }

  protected compileInterceptor(
    module: ConstructorType<any>,
    interceptorTarget: ConstructorType<any>
  ) {
    if (isValue(interceptorTarget)) return;

    const interceptor = this._interceptorContainer.getInterceptorInstance(interceptorTarget.name);
    if (interceptor) return interceptor;

    const compiledInterceptor = this.compileInstance(module, interceptorTarget);
    this._interceptorContainer.addInterceptor(interceptorTarget, compiledInterceptor);

    return compiledInterceptor;
  }

  protected getInterceptor(target: ConstructorType<any>): IInterceptor<TReturn> {
    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target);
    return useInterceptor
      ? this._interceptorContainer.getInterceptorInstance(useInterceptor)
      : null;
  }

  protected abstract compileCommand(
    target: ConstructorType<any>,
    instance: InstanceType<ConstructorType<any>>,
    propertyKey: string
  ): CommandHandler<TReturn>;
}
