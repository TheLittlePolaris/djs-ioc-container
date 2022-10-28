/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientEvents } from 'discord.js';
import {
  catchError,
  EMPTY,
  finalize,
  fromEvent,
  map,
  mergeMap,
  noop,
  Observable,
  of,
  take
} from 'rxjs';

import { RxjsRecursiveCompiler } from '../compilers/rxjs.compiler';
import { DEFAULT_ACTION_KEY } from '../../constants';
import {
  ComponentsContainer,
  InterceptorsContainer,
  ModulesContainer,
  ProvidersContainer
} from '../containers';
import { DiscordClient } from '../../entrypoint';
import { ExecutionContext } from '../../execution-context/execution-context';
import { ConstructorType, DiscordEvent } from '../../interfaces';
import { Logger } from '../../logger';
import { toArray } from '../../helpers/converters';

import { BaseContainerFactory } from './base/base.container-factory';

export class RxjsContainerFactory extends BaseContainerFactory<Observable<any>> {
  constructor() {
    const moduleContainer = new ModulesContainer();
    const componentContainer = new ComponentsContainer();
    const interceptorContainer = new InterceptorsContainer();
    const providerContainer = new ProvidersContainer();
    super(
      new RxjsRecursiveCompiler(
        moduleContainer,
        componentContainer,
        providerContainer,
        interceptorContainer
      )
    );
  }

  async initialize(rootModule: ConstructorType, entryComponent = DiscordClient) {
    await this.compiler.compileModule(rootModule, entryComponent);

    this.loadGlobalInterceptors(rootModule);
    // can start using command parser from here

    this.assignContext();

    const client = this.getClient();

    this.subscribeEvents(client);

    return client;
  }

  private assignContext() {
    ExecutionContext.client = this.getClient();
    ExecutionContext.config = this.globalConfig;
  }

  private subscribeEvents(client: DiscordClient) {
    Object.keys(this.eventHandlers).forEach((event: DiscordEvent) => {
      fromEvent(client, event)
        .pipe(
          // filter incoming events
          map((arguments_: ClientEvents[DiscordEvent]) => toArray(arguments_)),
          // filter incoming events
          mergeMap((arguments_: ClientEvents[DiscordEvent]) => this.filterEvent(event, arguments_)),
          // prepare the context

          mergeMap((arguments_: ClientEvents[DiscordEvent]) =>
            this.createObservableContext(event, arguments_)
          ),
          // execute the context
          mergeMap(({ observable, context }) => {
            if (!observable) return EMPTY;

            return observable.pipe(
              finalize(() => {
                Logger.log(
                  `${context.contextName}.${context.propertyKey} execution time: ${
                    Date.now() - context.executionStartTimestamp
                  }ms`
                );
              }),
              catchError((error: Error) => {
                Logger.error(
                  `Uncaught handler error: ${error?.stack}`,
                  `${context.contextName}.${context.propertyKey}`
                );
                return EMPTY;
              })
            );
          }),
          catchError((error: Error) => {
            Logger.error(`Uncaught event pipeline error: Stack: ${error?.stack}`, 'AppContainer');
            return EMPTY;
          })
        )
        .subscribe();
    });
  }

  public get<T>(type: ConstructorType<T>): InstanceType<ConstructorType<T>> {
    return this.compiler.componentContainer.getInstance(type);
  }

  protected getHandler(event: keyof ClientEvents, command: string | false) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (command === false) return (..._arguments: any) => of(noop);

    const { [command]: compiledCommand = null, [DEFAULT_ACTION_KEY]: defaultAction } =
      this.eventHandlers[event].commands;

    return compiledCommand || defaultAction;
  }

  private createObservableContext(event: DiscordEvent, arguments_: ClientEvents[DiscordEvent]) {
    const context = this.createExecutionContext(arguments_);
    const observable = this.getHandler(event, this.getCommand(event, arguments_))(context);

    return of({ observable, context }).pipe(take(1));
  }

  protected filterEvent(
    event: DiscordEvent,
    eventArgs: ClientEvents[DiscordEvent]
  ): Observable<ClientEvents[DiscordEvent] | never> {
    const eventInterceptor = this.globalInterceptors[event];
    if (!eventInterceptor) return of(eventArgs);

    const eventConfig = this.eventHandlers[event]?.config || {};

    const isEventAccepted = eventInterceptor.every((interceptor) =>
      interceptor(eventArgs, eventConfig)
    );
    return isEventAccepted ? of(eventArgs) : EMPTY;
  }
}
