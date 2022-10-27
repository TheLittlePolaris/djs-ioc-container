import { DiscordEvent, DiscordEventConfig } from '../../../interfaces';
import { ExecutionContext } from '../../../execution-context';

export type BaseHandler<TReturn> = (context: ExecutionContext) => TReturn;
export interface BaseCommands<TReturn> {
  [command: string]: BaseHandler<TReturn>;
}

export type BaseEventsHandlers<TReturn> = {
  [key in DiscordEvent]?: {
    handlers: BaseCommands<TReturn>;
    config?: DiscordEventConfig[key];
  };
};
