import { ClientEvents } from 'discord.js';

import { PromiseBasedRecursiveCompiler } from '../compilers/promise-based.compiler';
import { COMPONENT_METADATA, DEFAULT_ACTION_KEY, DiscordEvent } from '../../constants';
import {
  ComponentsContainer,
  InterceptorsContainer,
  ModulesContainer,
  ProvidersContainer
} from '../containers';
import { DiscordClient } from '../../entrypoint';
import { ConstructorType } from '../../interfaces';

import { BaseContainerFactory } from './base.container-factory';

export class RecursiveContainerFactory extends BaseContainerFactory<Promise<any>> {
  static entryDetected = false;

  constructor() {
    const moduleContainer = new ModulesContainer();
    const componentContainer = new ComponentsContainer();
    const interceptorContainer = new InterceptorsContainer();
    const providerContainer = new ProvidersContainer();
    super(
      new PromiseBasedRecursiveCompiler(
        moduleContainer,
        componentContainer,
        providerContainer,
        interceptorContainer
      )
    );
  }
  /**
   *
   * @param moduleMetadata - the `AppModule`
   * @param entryComponent ```ts
   * export class MyEntryComponent extends EntrypointComponent {
   *    constructor(token: string) {
   *       super(token)
   *    }
   * }
   * ```
   * @returns instance of MyEntryComponent
   */
  async createInstanceModule(moduleMetadata: ConstructorType<any>, entryComponent?: ConstructorType<any>) {
    await this.compiler.compileModule(moduleMetadata, entryComponent);
    /**
     * IMPORTANT:
     *  - Required the entry component to extend EntryComponent class
     */
    const entryInstance = this.get(entryComponent);

    const boundEvents =
      Reflect.getMetadata(COMPONENT_METADATA.EVENT_LIST, entryInstance.constructor) || {};

    const { length: hasEvents, ...events } = Object.keys(boundEvents);
    if (hasEvents)
      events.forEach((eventKey: DiscordEvent) =>
        entryInstance.client.addListener(eventKey, (...arguments_) =>
          entryInstance[boundEvents[eventKey]](...arguments_)
        )
      );

    Object.keys(this.eventHandlers).map((handler: DiscordEvent) =>
      entryInstance.client.addListener(
        handler,
        async (...arguments_: ClientEvents[typeof handler]) =>
          this.handleEvent(handler, this.createExecutionContext(arguments_))
      )
    );

    return entryInstance;
  }

  async initialize(rootModule: ConstructorType<any>, entryComponent = DiscordClient) {
    await this.compiler.compileModule(rootModule, entryComponent);

    this._config = this.compiler.config;

    const client = this.compiler.componentContainer.getInstance(entryComponent);
    const compiledEvents = Object.keys(this.eventHandlers);
    compiledEvents.map((handler: DiscordEvent) =>
      client.addListener(handler, async (...arguments_: ClientEvents[typeof handler]) =>
        this.handleEvent(handler, this.createExecutionContext(arguments_))
      )
    );

    return client;
  }

  protected getHandler(event: keyof ClientEvents, command: string | false) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (command === false) return async (..._: any[]) => {};

    const { [command]: compiledCommand = null, [DEFAULT_ACTION_KEY]: defaultAction } =
      this.eventHandlers[event].handlers;

    return compiledCommand || defaultAction;
  }

  // TODO: assign logic here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async filterEvent(event: DiscordEvent, arguments_: ClientEvents[DiscordEvent]) {
    return true;
  }
}
