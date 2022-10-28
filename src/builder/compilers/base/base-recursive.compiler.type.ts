import { DiscordEvent, DiscordEventConfig } from '../../../interfaces';
import { ExecutionContext } from '../../../execution-context';

export type CommandHandler<TReturn> = (context: ExecutionContext) => TReturn;
export interface ICommandRegistry<TReturn> {
  [command: string]: CommandHandler<TReturn>;
}

export type IEventHandlerRegistry<TReturn> = {
  [EventName in DiscordEvent]?: {
    commands: ICommandRegistry<TReturn>;
    config?: DiscordEventConfig[EventName];
  };
};
