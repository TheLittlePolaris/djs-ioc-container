import { ClientEvents } from 'discord.js';

import { BaseHandler } from '../../compilers';
import { BaseRecursiveCompiler } from '../../compilers/base/base-recursive.compiler';
import { DEFAULT_ACTION_KEY, DiscordEvent, InjectToken } from '../../../constants';
import { DiscordClient } from '../../../entrypoint';
import { ExecutionContext } from '../../../event-execution-context/execution-context';
import {
  CommandParserType,
  ConstructorType,
  GlobalInterceptorType,
  IAppConfig
} from '../../../interfaces';
import { isFunction } from '../../../helpers/locgical-helpers';

export abstract class BaseContainerFactory<TReturn> {
  protected _client: DiscordClient;
  protected _config: IAppConfig;

  protected commandParser: CommandParserType = {};
  protected globalInterceptors: GlobalInterceptorType = {};
  protected globalConfig = {};

  constructor(private readonly _compiler: BaseRecursiveCompiler<TReturn>) {}

  protected get compiler() {
    return this._compiler;
  }

  protected get eventHandlers() {
    return this._compiler.eventHandlers;
  }

  public get<T>(type: ConstructorType<T>): InstanceType<ConstructorType<T>> {
    return this._compiler.componentContainer.getInstance(type);
  }

  protected getClient() {
    return (
      this._client || (this._client = this.compiler.componentContainer.getInstance(DiscordClient))
    );
  }

  protected createExecutionContext(arguments_: ClientEvents[DiscordEvent]) {
    return new ExecutionContext(arguments_);
  }

  protected handleEvent(
    event: DiscordEvent,
    context: ExecutionContext
  ): ReturnType<BaseHandler<TReturn>> {
    const command = this.getCommand(event, context.getArguments());

    const commandHandler = this.getHandler(event, command);

    return commandHandler(context);
  }

  protected loadGlobalInterceptors(rootModule: ConstructorType) {
    this.commandParser = this.compiler.providerContainer
      .getProvider(rootModule, InjectToken.CommandParser)
      .getValue();

    this.globalInterceptors = this.compiler.providerContainer
      .getProvider(rootModule, InjectToken.GlobalInterceptors)
      .getValue();

    this.globalConfig = this.compiler.providerContainer
      .getProvider(rootModule, InjectToken.AppConfig)
      .getValue();
  }

  protected getCommand(
    event: DiscordEvent,
    arguments_: ClientEvents[DiscordEvent]
  ): string | false {
    const parser = this.commandParser[event];
    return (isFunction(parser) && parser(arguments_)) || DEFAULT_ACTION_KEY;
  }

  protected abstract filterEvent(
    event: DiscordEvent,
    arguments_: ClientEvents[DiscordEvent]
  ): TReturn;
  protected abstract initialize(
    rootModule: ConstructorType<unknown>,
    entryComponent: ConstructorType<DiscordClient>
  ): Promise<DiscordClient>;

  protected abstract getHandler(
    event: keyof ClientEvents,
    command: string | false
  ): BaseHandler<TReturn>;
}
